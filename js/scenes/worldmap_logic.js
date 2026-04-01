/**
 * worldmap_logic.js — 大地图纯逻辑层
 *
 * 从 WorldMapScene 提取的不依赖 canvas/renderer 的方法。
 * 通过构造函数注入回调，与场景层解耦：
 *   - onTurnReport(text, type)           → 写入回合报告面板
 *   - onMarchNote(text, timer)           → 写入行军通知横幅
 *   - onBattleFlash(cityId, timer, text) → 写入城市战斗闪光
 *   - startNextBattle()                  → 启动场景战斗队列中的下一场战斗
 */

import EconomySystem from '../systems/economy.js';
import { MAX_GARRISON } from '../utils/constants.js';

export class WorldMapLogic {
    constructor(gs, callbacks = {}) {
        this.gs = gs;
        this._onTurnReport    = callbacks.onTurnReport    || (() => {});
        this._onMarchNote     = callbacks.onMarchNote     || (() => {});
        this._onBattleFlash   = callbacks.onBattleFlash   || (() => {});
        this._startNextBattle = callbacks.startNextBattle || (() => {});
    }

    // ─────────────────────────────────────────────────────
    // AI 回合决策
    // ─────────────────────────────────────────────────────
    _processAI() {
        const gs = this.gs;
        const playerFactionId = gs.playerFaction;

        for (const faction of gs.getAliveFactions()) {
            if (faction.isPlayer) continue;

            const aggressionBias = 0.25 + Math.random() * 0.35;
            const cities = gs.getCitiesOf(faction.id);
            let marchedThisTurn = 0;
            const MAX_MARCHES_PER_TURN = 1;

            // ── 内政阶段 ──
            for (const city of cities) {
                const roll = Math.random();
                if (roll < 0.25 && faction.gold >= 1000) {
                    EconomySystem.develop(gs, city.id, Math.random() < 0.5 ? 'agriculture' : 'commerce');
                } else if (roll < 0.55 && faction.gold >= 2000) {
                    EconomySystem.recruit(gs, city.id);
                } else if (roll < 0.65) {
                    EconomySystem.fortify(gs, city.id);
                } else if (roll < 0.72) {
                    EconomySystem.search(gs, city.id);
                }
            }

            // ── 进攻阶段：对每座城评估出兵 ──
            const citiesSorted = [...cities].sort((a, b) => {
                const pa = gs.getGeneralsInCity(a.id).reduce((s, g) => s + g.war + g.lead, 0) * (0.7 + Math.random() * 0.6);
                const pb = gs.getGeneralsInCity(b.id).reduce((s, g) => s + g.war + g.lead, 0) * (0.7 + Math.random() * 0.6);
                return pb - pa;
            });

            for (const city of citiesSorted) {
                if (marchedThisTurn >= MAX_MARCHES_PER_TURN) break;

                const neighbors = city.neighbors || [];
                const enemyNeighbors = neighbors.filter(nid => {
                    const nc = gs.getCity(nid);
                    return nc && nc.owner && nc.owner !== faction.id &&
                        !faction.allies.includes(nc.owner);
                });
                if (enemyNeighbors.length === 0) continue;

                const generals = gs.getGeneralsInCity(city.id).filter(g => g.soldiers > 100);
                if (generals.length === 0) continue;

                let bestTarget = null;
                let bestRatio = 0;
                let targetIsPlayer = false;
                let targetIsEnemy = false;

                for (const targetId of enemyNeighbors) {
                    const defCity = gs.getCity(targetId);
                    const defGens = gs.getGeneralsInCity(targetId);
                    const atkPower = generals.reduce((s, g) => s + g.war + g.lead + g.soldiers * 0.01, 0);
                    const defPower = defGens.reduce((s, g) => s + g.war + g.lead + g.soldiers * 0.01, 0) + defCity.defense * 0.5;
                    let ratio = (atkPower / Math.max(1, defPower)) * (0.8 + Math.random() * 0.4);
                    if (defCity.owner === playerFactionId) ratio *= 1.4;
                    if (faction.enemies.includes(defCity.owner)) ratio *= 1.3; // 宣战势力优先攻打
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestTarget = targetId;
                        targetIsPlayer = defCity.owner === playerFactionId;
                        targetIsEnemy = faction.enemies.includes(defCity.owner);
                    }
                }

                if (!bestTarget) continue;

                let attackProb;
                if (bestRatio > 2.5)      attackProb = 0.14;
                else if (bestRatio > 2.0) attackProb = 0.10;
                else if (bestRatio > 1.5) attackProb = 0.07;
                else if (bestRatio > 1.2) attackProb = 0.04;
                else if (bestRatio > 0.8) attackProb = 0.015;
                else                      attackProb = 0.005;

                if (targetIsPlayer)      attackProb = Math.min(0.20, attackProb + 0.03);
                if (targetIsEnemy)       attackProb = Math.min(0.25, attackProb + 0.05);
                if (marchedThisTurn === 0) attackProb = Math.min(0.20, attackProb + 0.02);
                attackProb = Math.min(0.25, attackProb * aggressionBias);

                if (Math.random() < attackProb) {
                    const maxSend = Math.min(5, generals.length - 1);
                    if (maxSend <= 0) continue;
                    const attackers = [...generals]
                        .sort((a, b) => (b.war + b.lead) - (a.war + a.lead))
                        .slice(0, maxSend);
                    const defCity = gs.getCity(bestTarget);
                    const attackerIds = attackers.map(g => g.id);
                    for (const gen of attackers) {
                        city.generals = city.generals.filter(gid => gid !== gen.id);
                        gen.city = null;
                        gen.status = 'marching';
                    }
                    // departTurn+1：AI 本回合决策，下回合才出发，
                    // 保证玩家在地图上能看到行军图标移动，再触发迎战面板
                    const march = gs.createMarch('attack', faction.id, attackerIds, city.id, bestTarget, gs.turn + 1);
                    marchedThisTurn++;
                    this._onTurnReport(
                        `${faction.name}从${city.name}出兵，向${defCity.name}进军！（${march.turnsTotal}回合后到达）`,
                        'warning'
                    );
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────
    // 行军拦截
    // ─────────────────────────────────────────────────────
    _resolveInterception(marchA, marchB) {
        const gs = this.gs;
        const playerFaction = gs.playerFaction;
        const aIsPlayer = marchA.faction === playerFaction;
        const bIsPlayer = marchB.faction === playerFaction;
        const playerInvolved = aIsPlayer || bIsPlayer;

        const generalsA = marchA.generalIds.map(id => gs.getGeneral(id)).filter(Boolean);
        const generalsB = marchB.generalIds.map(id => gs.getGeneral(id)).filter(Boolean);

        const factionAName = (gs.getFaction(marchA.faction) || {}).name || '未知';
        const factionBName = (gs.getFaction(marchB.faction) || {}).name || '未知';
        const cityAName = (gs.getCity(marchA.targetCity) || {}).name || '???';
        const msgText = `${factionAName}与${factionBName}的军队在前往${cityAName}途中相遇，爆发野战！`;
        this._onTurnReport(msgText, 'warning');
        this._onMarchNote(msgText, 4.0);

        if (playerInvolved) {
            const attackerMarch = aIsPlayer ? marchA : marchB;
            const defenderMarch = aIsPlayer ? marchB : marchA;

            for (const gen of [...generalsA, ...generalsB]) {
                gen.status = 'marching';
            }

            gs.battleQueue.push({
                isInterception: true,
                attackerIds: attackerMarch.generalIds,
                defenderIds: defenderMarch.generalIds,
                attackerFactionId: attackerMarch.faction,
                defenderFactionId: defenderMarch.faction,
                playerSide: 'attacker',
                attackerSourceCity: attackerMarch.sourceCity,
                defenderSourceCity: defenderMarch.sourceCity,
                attackerTargetCity: attackerMarch.targetCity,
                defenderTargetCity: defenderMarch.targetCity,
            });
        } else {
            this._autoResolveInterception(marchA, generalsA, marchB, generalsB);
        }
    }

    _autoResolveInterception(marchA, generalsA, marchB, generalsB) {
        const gs = this.gs;
        let powerA = generalsA.reduce((s, g) => s + g.war + g.lead + g.soldiers * 0.01, 0);
        let powerB = generalsB.reduce((s, g) => s + g.war + g.lead + g.soldiers * 0.01, 0);
        powerA *= (0.8 + Math.random() * 0.4);
        powerB *= (0.8 + Math.random() * 0.4);

        const winnersWin = powerA >= powerB;
        const winners = winnersWin ? generalsA : generalsB;
        const losers  = winnersWin ? generalsB : generalsA;
        const winnerMarch = winnersWin ? marchA : marchB;
        const loserMarch  = winnersWin ? marchB : marchA;

        for (const gen of winners) {
            gen.soldiers = Math.floor(gen.soldiers * 0.8);
            gen.status = 'marching';
        }
        if (winners.length > 0) {
            const winnerIds = winners.map(g => g.id);
            gs.createMarch('attack', winnerMarch.faction, winnerIds, winnerMarch.sourceCity, winnerMarch.targetCity);
        }

        const loserRetreatingIds = [];
        for (const gen of losers) {
            gen.soldiers = Math.floor(gen.soldiers * 0.4);
            const srcCity = gs.getCity(loserMarch.sourceCity);
            if (srcCity) {
                const oldCity = gs.getCity(gen.city);
                if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                gen.city = null;
                gen.status = 'marching';
                loserRetreatingIds.push(gen.id);
            } else {
                gen.status = 'idle';
            }
        }
        if (loserRetreatingIds.length > 0 && loserMarch.sourceCity) {
            const interceptStart = loserMarch.targetCity || loserMarch.sourceCity;
            gs.createMarch('transfer', loserMarch.faction, loserRetreatingIds, interceptStart, loserMarch.sourceCity);
        }

        const factionAName = (gs.getFaction(marchA.faction) || {}).name || '未知';
        const factionBName = (gs.getFaction(marchB.faction) || {}).name || '未知';
        const winnerName = winnersWin ? factionAName : factionBName;
        const flashText = `${winnerName}在野战中获胜，继续进军！`;
        this._onBattleFlash(winnerMarch.targetCity, 3.0, flashText);
        this._onTurnReport(flashText, 'warning');
    }

    // ─────────────────────────────────────────────────────
    // 自动结算攻城战
    // ─────────────────────────────────────────────────────
    _autoResolveBattle(attackerGenerals, defenderCityId, attackerFaction, attackerSourceCityId) {
        const gs = this.gs;
        const defCity = gs.getCity(defenderCityId);
        const defGenerals = gs.getGeneralsInCity(defenderCityId);

        let atkPower = attackerGenerals.reduce((s, g) => s + g.war + g.lead + g.soldiers * 0.01, 0);
        let defPower = defGenerals.reduce((s, g) => s + g.war + g.lead + g.soldiers * 0.01, 0) + defCity.defense * 0.5;
        atkPower *= (0.8 + Math.random() * 0.4);
        defPower *= (0.8 + Math.random() * 0.4);

        if (atkPower > defPower) {
            const oldOwner = defCity.owner;
            defCity.owner = attackerFaction.id;
            defCity.soldiers = 0;

            for (const gen of attackerGenerals) {
                gen.soldiers = Math.floor(gen.soldiers * 0.7);
                this._enterCity(gen, defenderCityId);
            }

            const defRetreatingIds = [];
            for (const gen of defGenerals) {
                gen.soldiers = Math.floor(gen.soldiers * 0.3);
                const retreatCities = gs.getCitiesOf(oldOwner).filter(c => c.id !== defenderCityId);
                defCity.generals = defCity.generals.filter(gid => gid !== gen.id);
                if (retreatCities.length > 0) {
                    gen.city = null;
                    gen.status = 'marching';
                    defRetreatingIds.push(gen.id);
                } else {
                    gen.originalFaction = gen.faction;
                    gen.faction = 'none';
                    gen.city = defenderCityId;
                    gen.status = 'idle';
                    defCity.generals.push(gen.id);
                }
            }
            if (defRetreatingIds.length > 0) {
                const retreatTarget = gs.getCitiesOf(oldOwner).filter(c => c.id !== defenderCityId)[0];
                if (retreatTarget) {
                    gs.createMarch('transfer', oldOwner, defRetreatingIds, defenderCityId, retreatTarget.id);
                }
            }

            const oldFaction = gs.getFaction(oldOwner);
            if (oldFaction && gs.getCitiesOf(oldOwner).length === 0) {
                oldFaction.alive = false;
                if (oldOwner === gs.playerFaction) {
                    this._onTurnReport(`你的势力已被${attackerFaction.name}消灭！`, 'defeat');
                }
            }

            if (defCity.owner !== gs.playerFaction && oldOwner !== gs.playerFaction) return;
            this._onTurnReport(`${attackerFaction.name}攻占了${defCity.name}！`, 'warning');
        } else {
            const sourceCity = attackerSourceCityId ? gs.getCity(attackerSourceCityId) : null;
            const fallbackCities = gs.getCitiesOf(attackerFaction.id);
            const retreatCity = sourceCity || (fallbackCities.length > 0 ? fallbackCities[0] : null);
            const atkRetreatingIds = [];
            for (const gen of attackerGenerals) {
                gen.soldiers = Math.floor(gen.soldiers * 0.5);
                if (retreatCity) {
                    gen.city = null;
                    gen.status = 'marching';
                    atkRetreatingIds.push(gen.id);
                } else {
                    gen.originalFaction = gen.faction;
                    gen.faction = 'none';
                    gen.city = defenderCityId;
                    gen.status = 'idle';
                    if (!defCity.generals.includes(gen.id)) defCity.generals.push(gen.id);
                }
            }
            if (atkRetreatingIds.length > 0 && retreatCity) {
                gs.createMarch('transfer', attackerFaction.id, atkRetreatingIds, defenderCityId, retreatCity.id);
            }
        }
    }

    // ─────────────────────────────────────────────────────
    // 将领进城（含驻守上限处理）
    // ─────────────────────────────────────────────────────
    _enterCity(gen, cityId) {
        const gs = this.gs;
        const city = gs.getCity(cityId);
        if (!city) return;

        const oldCity = gs.getCity(gen.city);
        if (oldCity && oldCity.id !== cityId) {
            oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
        }

        gen.city = cityId;
        if (!city.generals.includes(gen.id)) city.generals.push(gen.id);

        const idleCount = gs.getGarrisonCount(cityId);
        if (idleCount < MAX_GARRISON) {
            gen.status = 'idle';
        } else {
            const friendly = gs.getCitiesOf(gen.faction)
                .filter(c => c.id !== cityId && gs.getGarrisonCount(c.id) < MAX_GARRISON);
            if (friendly.length > 0) {
                const best = friendly.reduce((a, b) => {
                    const da = Math.hypot((a.x || 0) - (city.x || 0), (a.y || 0) - (city.y || 0));
                    const db = Math.hypot((b.x || 0) - (city.x || 0), (b.y || 0) - (city.y || 0));
                    return da <= db ? a : b;
                });
                city.generals = city.generals.filter(gid => gid !== gen.id);
                gen.city = null;
                gen.status = 'marching';
                gs.createMarch('transfer', gen.faction, [gen.id], cityId, best.id);
            } else {
                gen.status = 'encamped';
            }
        }
    }

    // ─────────────────────────────────────────────────────
    // 行军到达处理
    // ─────────────────────────────────────────────────────
    _resolveArrival(march) {
        const gs = this.gs;
        gs.marches = gs.marches.filter(m => m.id !== march.id);
        const targetCity = gs.getCity(march.targetCity);
        const generals = march.generalIds.map(id => gs.getGeneral(id)).filter(Boolean);

        if (march.type === 'transfer') {
            // 如果目标城已被敌方占领（行军途中城主易手），重定向到最近的友军城
            if (targetCity.owner !== march.faction) {
                const friendlyCities = gs.getCitiesOf(march.faction);
                if (friendlyCities.length > 0) {
                    const nearest = friendlyCities.reduce((a, b) => {
                        const da = Math.hypot((a.x||0)-(targetCity.x||0), (a.y||0)-(targetCity.y||0));
                        const db = Math.hypot((b.x||0)-(targetCity.x||0), (b.y||0)-(targetCity.y||0));
                        return da <= db ? a : b;
                    });
                    for (const gen of generals) {
                        gen.status = 'marching';
                    }
                    gs.createMarch('transfer', march.faction, march.generalIds, march.targetCity, nearest.id);
                    if (march.faction === gs.playerFaction) {
                        this._onTurnReport(`${targetCity.name}已失守，部队转向${nearest.name}！`, 'warning');
                    }
                } else {
                    // 己方已无城池，将领解散
                    for (const gen of generals) {
                        gen.faction = 'none';
                        gen.city = null;
                        gen.status = 'idle';
                    }
                }
                return false;
            }
            for (const gen of generals) {
                this._enterCity(gen, march.targetCity);
            }
            if (march.faction === gs.playerFaction) {
                this._onTurnReport(`武将已到达${targetCity.name}`, 'info');
            }
            return false;
        }

        if (march.type === 'attack') {
            if (targetCity.owner === march.faction) {
                for (const gen of generals) {
                    this._enterCity(gen, march.targetCity);
                }
                if (march.faction === gs.playerFaction) {
                    this._onTurnReport(`出征军队到达${targetCity.name}（已为己方城池）`, 'info');
                }
                return false;
            }

            const playerInvolved = march.faction === gs.playerFaction || targetCity.owner === gs.playerFaction;

            if (playerInvolved) {
                const defenderGenerals = gs.getGeneralsInCity(march.targetCity);
                if (targetCity.owner === gs.playerFaction && defenderGenerals.length === 0) {
                    for (const gen of generals) { gen.status = 'idle'; }
                    const attackerFaction = gs.getFaction(march.faction);
                    this._autoResolveBattle(generals, march.targetCity, attackerFaction, march.sourceCity);
                    for (const gen of generals) {
                        if (gen.city === null && gen.status !== 'dead') {
                            const friendlyCities = gs.getCitiesOf(march.faction);
                            if (friendlyCities.length > 0) {
                                gen.city = friendlyCities[0].id;
                                if (!friendlyCities[0].generals.includes(gen.id)) friendlyCities[0].generals.push(gen.id);
                            } else {
                                gen.faction = 'none';
                                gen.status = 'idle';
                            }
                        }
                    }
                    this._onTurnReport(`${attackerFaction.name}攻占了我方空城${targetCity.name}！`, 'warning');
                    return false;
                } else {
                    // For breakthrough marches, don't park generals in the source city
                    // (which is an enemy city). Keep them in transit (city=null).
                    if (!march.isRetreatBreakthrough) {
                        const sourceCity = gs.getCity(march.sourceCity);
                        for (const gen of generals) {
                            gen.city = march.sourceCity;
                            gen.status = 'idle';
                            if (sourceCity && !sourceCity.generals.includes(gen.id)) sourceCity.generals.push(gen.id);
                        }
                    } else {
                        for (const gen of generals) {
                            gen.status = 'idle';
                            // gen.city remains null (in transit)
                        }
                    }
                    gs.battleQueue.push({
                        attackerIds: march.generalIds,
                        defenderCityId: march.targetCity,
                        attackerFaction: gs.getFaction(march.faction),
                        playerIsAttacker: march.faction === gs.playerFaction,
                        attackerSourceCity: march.sourceCity,
                        isRetreatBreakthrough: march.isRetreatBreakthrough || false,
                        retreatFinalDestination: march.retreatFinalDestination || null,
                    });
                    if (targetCity.owner === gs.playerFaction) {
                        const atkFactionName = (gs.getFaction(march.faction) || {}).name || '敌军';
                        this._onTurnReport(`${atkFactionName}的军队到达${targetCity.name}！准备防守！`, 'warning');
                    } else {
                        this._onTurnReport(`我军已到达${targetCity.name}，即将开战！`, 'warning');
                    }
                    return true; // 暂停后续时间轴事件
                }
            } else {
                for (const gen of generals) { gen.status = 'idle'; }
                const attackerFaction = gs.getFaction(march.faction);
                const defFactionName = gs.getFaction(targetCity.owner)?.name || '???';
                this._autoResolveBattle(generals, march.targetCity, attackerFaction, march.sourceCity);
                for (const gen of generals) {
                    if (gen.city === null && gen.status !== 'dead') {
                        const friendlyCities = gs.getCitiesOf(march.faction);
                        if (friendlyCities.length > 0) {
                            gen.city = friendlyCities[0].id;
                            if (!friendlyCities[0].generals.includes(gen.id)) friendlyCities[0].generals.push(gen.id);
                        } else {
                            gen.faction = 'none';
                            gen.status = 'idle';
                        }
                    }
                }
                const won = targetCity.owner === march.faction;
                const flashText = won
                    ? `${attackerFaction.name}攻占了${defFactionName}的${targetCity.name}！`
                    : `${defFactionName}成功守住了${targetCity.name}！`;
                this._onBattleFlash(march.targetCity, 3.0, flashText);
                this._onMarchNote(flashText, 3.5);
                this._onTurnReport(flashText, 'warning');
                return false;
            }
        }

        return false;
    }

    // ─────────────────────────────────────────────────────
    // 时间轴系统
    // ─────────────────────────────────────────────────────

    /**
     * 收集 [currentTurn, currentTurn+1) 内所有事件（meet / arrive）并排序
     */
    _buildTimeline(currentTurn) {
        const gs = this.gs;
        const events = [];
        const marches = gs.marches;
        const windowEnd = currentTurn + 1;

        for (const march of marches) {
            if (march.arrivalTurn >= currentTurn && march.arrivalTurn < windowEnd) {
                events.push({ type: 'arrive', eventTurn: march.arrivalTurn, march });
            }
        }

        const seenPairs = new Set();
        for (let i = 0; i < marches.length; i++) {
            const a = marches[i];
            if (a.type !== 'attack') continue;
            for (let j = i + 1; j < marches.length; j++) {
                const b = marches[j];
                if (b.type !== 'attack') continue;
                if (a.faction === b.faction) continue;
                const isOpposite = (a.sourceCity === b.targetCity && a.targetCity === b.sourceCity);
                if (!isOpposite) continue;
                const pairKey = [a.id, b.id].sort().join('-');
                if (seenPairs.has(pairKey)) continue;
                seenPairs.add(pairKey);

                const meetTurn = (a.travelTime * b.travelTime
                    + a.departTurn * b.travelTime
                    + b.departTurn * a.travelTime)
                    / (a.travelTime + b.travelTime);

                if (meetTurn >= currentTurn && meetTurn < windowEnd) {
                    events.push({ type: 'meet', eventTurn: meetTurn, marchA: a, marchB: b });
                }
            }
        }

        events.sort((x, y) => {
            if (Math.abs(x.eventTurn - y.eventTurn) > 1e-9) return x.eventTurn - y.eventTurn;
            if (x.type === 'meet' && y.type === 'arrive') return -1;
            if (x.type === 'arrive' && y.type === 'meet') return 1;
            return 0;
        });
        return events;
    }

    /**
     * 构建任意时间窗口 (fromVT, toVT] 内的事件（_buildTimeline 的泛化版本）
     */
    _buildTimelineWindow(fromVT, toVT) {
        const gs = this.gs;
        const events = [];
        const marches = gs.marches;

        for (const march of marches) {
            if (march.arrivalTurn > fromVT && march.arrivalTurn <= toVT) {
                events.push({ type: 'arrive', eventTurn: march.arrivalTurn, march });
            }
        }

        const seenPairs = new Set();
        for (let i = 0; i < marches.length; i++) {
            const a = marches[i];
            if (a.type !== 'attack') continue;
            for (let j = i + 1; j < marches.length; j++) {
                const b = marches[j];
                if (b.type !== 'attack') continue;
                if (a.faction === b.faction) continue;
                const isOpposite = (a.sourceCity === b.targetCity && a.targetCity === b.sourceCity);
                if (!isOpposite) continue;
                const pairKey = [a.id, b.id].sort().join('-');
                if (seenPairs.has(pairKey)) continue;
                seenPairs.add(pairKey);

                const meetTurn = (a.travelTime * b.travelTime
                    + a.departTurn * b.travelTime
                    + b.departTurn * a.travelTime)
                    / (a.travelTime + b.travelTime);

                if (meetTurn > fromVT && meetTurn <= toVT) {
                    events.push({ type: 'meet', eventTurn: meetTurn, marchA: a, marchB: b });
                }
            }
        }

        events.sort((x, y) => {
            if (Math.abs(x.eventTurn - y.eventTurn) > 1e-9) return x.eventTurn - y.eventTurn;
            if (x.type === 'meet' && y.type === 'arrive') return -1;
            if (x.type === 'arrive' && y.type === 'meet') return 1;
            return 0;
        });
        return events;
    }

    /**
     * 更新行军 progress，然后按时间轴顺序处理本回合所有事件
     */
    _runTimeline() {
        const gs = this.gs;
        const currentTurn = gs.turn;

        for (const march of gs.marches) {
            march.progress = Math.min(1, Math.max(0,
                (currentTurn - march.departTurn) / march.travelTime
            ));
        }

        const events = this._buildTimeline(currentTurn);

        // Process ALL events in this turn window — do not stop early.
        // Multiple player-involved battles (e.g. player attacking city A while enemy attacks
        // city B simultaneously) must all be queued before we hand off to the battle flow.
        for (const evt of events) {
            if (evt.type === 'meet') {
                const aStillActive = gs.marches.includes(evt.marchA);
                const bStillActive = gs.marches.includes(evt.marchB);
                if (!aStillActive || !bStillActive) continue;

                gs.marches = gs.marches.filter(m => m.id !== evt.marchA.id && m.id !== evt.marchB.id);
                this._resolveInterception(evt.marchA, evt.marchB);

            } else if (evt.type === 'arrive') {
                if (!gs.marches.includes(evt.march)) continue;
                this._resolveArrival(evt.march);
            }
        }
    }

    /**
     * 实时事件检测（update() 每帧调用）
     */
    _checkRealtimeEvents(prevVT, nowVT) {
        if (prevVT >= nowVT) return false;
        const gs = this.gs;
        const events = this._buildTimelineWindow(prevVT, nowVT);
        // Process ALL events in the window so that simultaneous battles are all queued.
        // Only call _startNextBattle once at the end.
        const queueBefore = gs.battleQueue.length;
        for (const evt of events) {
            if (evt.type === 'meet') {
                if (!gs.marches.includes(evt.marchA) || !gs.marches.includes(evt.marchB)) continue;
                gs.marches = gs.marches.filter(m => m.id !== evt.marchA.id && m.id !== evt.marchB.id);
                this._resolveInterception(evt.marchA, evt.marchB);
            } else if (evt.type === 'arrive') {
                if (!gs.marches.includes(evt.march)) continue;
                this._resolveArrival(evt.march);
            }
        }
        if (gs.battleQueue.length > queueBefore) {
            this._startNextBattle();
            return true;
        }
        return false;
    }

    /**
     * 行军结算入口（_runTimeline 的别名，供 _finishEndTurn 调用）
     */
    _processMarches() {
        this._runTimeline();
    }
}
