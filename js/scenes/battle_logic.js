/**
 * battle_logic.js — 战斗纯逻辑层
 *
 * 从 BattleScene 提取的不依赖 canvas/renderer 的方法。
 * 通过 scene 引用访问战斗状态。
 */

/**
 * 检查从 sourceCityId 撤退到 targetCityId 的路径上是否有敌方城池阻截。
 * 先尝试只走己方/中立城市的友好路径；若不存在，返回最短路径上的第一个敌方城市ID。
 * @returns {string|null} 阻截城市ID，若可以安全撤退则返回 null
 */
function findRetreatBlocker(gs, sourceCityId, targetCityId, playerFactionId) {
    if (!sourceCityId || !targetCityId || sourceCityId === targetCityId) return null;

    const isPassable = (cityId) => {
        if (cityId === sourceCityId || cityId === targetCityId) return true;
        const c = gs.getCity(cityId);
        return c && (c.owner === playerFactionId || !c.owner || c.owner === 'none');
    };

    // 先找只经过友方/中立城的路径
    const fq = [[sourceCityId]], fv = new Set([sourceCityId]);
    while (fq.length > 0) {
        const path = fq.shift();
        const cur = path[path.length - 1];
        const city = gs.getCity(cur);
        if (!city || !city.neighbors) continue;
        for (const nid of city.neighbors) {
            if (fv.has(nid) || !isPassable(nid)) continue;
            fv.add(nid);
            if (nid === targetCityId) return null; // 有安全路径，无需突围
            fq.push([...path, nid]);
        }
    }

    // 无安全路径 — 找最短全城路径，返回第一跳（必定是敌方城市）
    const aq = [[sourceCityId]], av = new Set([sourceCityId]);
    while (aq.length > 0) {
        const path = aq.shift();
        const cur = path[path.length - 1];
        const city = gs.getCity(cur);
        if (!city || !city.neighbors) continue;
        for (const nid of city.neighbors) {
            if (av.has(nid)) continue;
            av.add(nid);
            const newPath = [...path, nid];
            if (nid === targetCityId) {
                return newPath.length > 2 ? newPath[1] : null;
            }
            aq.push(newPath);
        }
    }
    return null;
}

export class BattleLogic {
    constructor(scene) {
        this._s = scene;
    }

    _prepareAIPick() {
        const aiGenerals = this._s.playerSide === 'attacker'
            ? this._s.battle.defender.generals
            : this._s.battle.attacker.generals;
        this._s._aiPickedUnit = this._s.combat.aiPickNextGeneral(aiGenerals);
    }

    _getFormationPositions(formationId, generals, side) {
        const baseX = side === 'left' ? 100 : 1100;
        const baseY = 200;
        const dir = side === 'left' ? 1 : -1;
        const count = generals.length;
        const positions = [];

        const isDuel = count === 1;

        for (let i = 0; i < count; i++) {
            const yOff = (i - (count - 1) / 2) * 60;
            let gx, gy;
            const soldierOffsets = [];

            switch (formationId) {
                case 'arrow': // 锋矢阵 - 主将冲锋在前，士兵V形跟随
                    gx = baseX + dir * (isDuel ? 90 : 80);
                    gy = baseY + yOff;
                    for (let s = 0; s < 6; s++) {
                        const row = Math.floor(s / 2);
                        const col = s % 2 === 0 ? -1 : 1;
                        soldierOffsets.push({ dx: -dir * (40 + row * 30), dy: col * (15 + row * 20) });
                    }
                    break;
                case 'fish': // 鱼鳞阵 - 士兵密集前排，主将在后
                    gx = baseX - dir * (isDuel ? 50 : 40);
                    gy = baseY + yOff;
                    for (let s = 0; s < 6; s++) {
                        const row = Math.floor(s / 3);
                        const col = (s % 3 - 1) * 20;
                        soldierOffsets.push({ dx: dir * (70 + row * 35), dy: col });
                    }
                    break;
                case 'goose': // 雁行阵 - 斜线排列
                    gx = baseX + dir * (i * 30);
                    gy = baseY + (isDuel ? 0 : (-80 + i * 40));
                    for (let s = 0; s < 5; s++) {
                        soldierOffsets.push({ dx: -dir * (25 + s * 15), dy: -30 + s * 15 });
                    }
                    break;
                case 'circle': // 方圆阵 - 士兵围绕防御
                    gx = baseX;
                    gy = baseY + yOff * 0.5;
                    for (let s = 0; s < 8; s++) {
                        const angle = (s / 8) * Math.PI * 2;
                        soldierOffsets.push({ dx: Math.cos(angle) * 55, dy: Math.sin(angle) * 45 });
                    }
                    break;
                case 'charge': // 冲锋阵 - 全军并排冲锋
                    gx = baseX + dir * 20;
                    gy = baseY + (isDuel ? 0 : (-80 + i * (160 / Math.max(1, count - 1))));
                    for (let s = 0; s < 5; s++) {
                        soldierOffsets.push({ dx: (Math.random() - 0.5) * 15, dy: -40 + s * 20 });
                    }
                    break;
                default: // crane_wing 鹤翼阵 - 均衡，主将居中
                    gx = baseX;
                    gy = baseY + yOff;
                    for (let s = 0; s < 6; s++) {
                        const wing = s < 3 ? -1 : 1;
                        const idx = s % 3;
                        soldierOffsets.push({ dx: dir * (20 + idx * 15), dy: wing * (30 + idx * 20) });
                    }
                    break;
            }
            positions.push({ generalIndex: i, x: gx, y: gy, soldierOffsets });
        }
        return positions;
    }

    _spawnDuelSoldiers(leftUnit, rightUnit) {
        const battle = this._s.battle;
        // Clear old soldiers
        battle.soldiers.left = [];
        battle.soldiers.right = [];

        const leftPos = this._s._duelLeftPos;
        const rightPos = this._s._duelRightPos;

        // Spawn soldiers for left unit using formation offsets
        const leftCount = Math.min(20, Math.floor(leftUnit.soldiers / 100));
        for (let i = 0; i < leftCount; i++) {
            const offset = leftPos && leftPos.soldierOffsets
                ? leftPos.soldierOffsets[i % leftPos.soldierOffsets.length]
                : { dx: -30 + Math.random() * 60 - 60, dy: Math.random() * 80 - 40 };
            battle.soldiers.left.push({
                x: leftUnit.x + offset.dx + (Math.random() - 0.5) * 10,
                y: leftUnit.y + offset.dy + (Math.random() - 0.5) * 10,
                hp: 3, state: 'advance', frame: Math.random() * 100,
                type: leftUnit.general.unitType, speed: 60, attackTimer: Math.random()
            });
        }

        // Spawn soldiers for right unit using formation offsets
        const rightCount = Math.min(20, Math.floor(rightUnit.soldiers / 100));
        for (let i = 0; i < rightCount; i++) {
            const offset = rightPos && rightPos.soldierOffsets
                ? rightPos.soldierOffsets[i % rightPos.soldierOffsets.length]
                : { dx: 30 + Math.random() * 60 + 60, dy: Math.random() * 80 - 40 };
            battle.soldiers.right.push({
                x: rightUnit.x + offset.dx + (Math.random() - 0.5) * 10,
                y: rightUnit.y + offset.dy + (Math.random() - 0.5) * 10,
                hp: 3, state: 'advance', frame: Math.random() * 100,
                type: rightUnit.general.unitType, speed: 60, attackTimer: Math.random()
            });
        }
    }

    _handleInterceptionAfterBattle() {
        if (!this._s.battle.isInterception) return;
        const returnData = this._s.game._battleReturnData;
        if (!returnData || !returnData.isInterception) return;

        const gs = this._s.gs;
        const battle = this._s.battle;
        const attackerWon = battle.result === 'attacker_wins';

        const winnerSide = attackerWon ? battle.attacker : battle.defender;
        const winnerTargetCity = attackerWon ? returnData.attackerTargetCity : returnData.defenderTargetCity;
        const winnerSourceCity = attackerWon ? returnData.attackerSourceCity : returnData.defenderSourceCity;

        // Winners continue marching toward their original target
        const winnerIds = [];
        for (const unit of winnerSide.generals) {
            if (unit.state !== 'dead') {
                const gen = unit.general;
                // Remove from current city before marching
                const oldCity = gs.getCity(gen.city);
                if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                gen.city = null;
                gen.status = 'marching';
                winnerIds.push(gen.id);
            }
        }
        if (winnerIds.length > 0 && winnerTargetCity) {
            gs.createMarch('attack', winnerSide.faction.id, winnerIds, winnerSourceCity, winnerTargetCity, gs.turn + 1);
        }
        // Losers are already handled by settleBattle (retreated to their source city)
    }

    // Returns { canRetreat, label } for the current player side
    _getRetreatInfo() {
        const gs = this._s.gs;
        const isInterception = !!this._s.battle.isInterception;
        const isAttacker = this._s.playerSide === 'attacker';

        // Breakthrough battle: player is breaking through an enemy city while retreating
        if (this._s._isRetreatBreakthrough) {
            return { canRetreat: true, label: '突围撤退 (损兵50%)' };
        }

        if (isInterception) {
            // Both sides can flee in interception, 25% soldier loss
            return { canRetreat: true, label: '撤退 (损兵25%)' };
        }

        if (isAttacker) {
            // Attacker can always retreat, 30% soldier loss
            return { canRetreat: true, label: '撤退 (损兵30%)' };
        } else {
            // Defender can flee only if they have another city to fall back to
            const defenderCity = this._s.battle.defender.city;
            const otherCities = gs.getCitiesOf(this._s.gs.playerFaction)
                .filter(c => !defenderCity || c.id !== defenderCity.id);
            if (otherCities.length > 0) {
                return { canRetreat: true, label: '弃城撤退 (损兵40%)' };
            }
            return { canRetreat: false, label: '' };
        }
    }

    _doRetreat() {
        const gs = this._s.gs;
        const rd = this._s.game._battleReturnData;
        const isInterception = !!this._s.battle.isInterception;
        const isAttacker = this._s.playerSide === 'attacker';

        const playerSideData = isAttacker ? this._s.battle.attacker : this._s.battle.defender;
        const enemySideData = isAttacker ? this._s.battle.defender : this._s.battle.attacker;

        // ── 突围撤退：玩家在突围战斗中再次选择撤退，直接跑回最终目的地 ──
        if (this._s._isRetreatBreakthrough) {
            const finalDest = this._s._retreatFinalDestination;
            const battleCity = this._s.battle.defender.city;
            const sourceId = battleCity ? battleCity.id : null;
            const genIds = [];
            for (const unit of playerSideData.generals) {
                const gen = unit.general;
                gen.soldiers = Math.max(0, Math.floor(gen.soldiers * 0.50));
                const oldCity = gs.getCity(gen.city);
                if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                gen.city = null;
                gen.status = 'marching';
                genIds.push(gen.id);
            }
            if (genIds.length > 0 && sourceId && finalDest) {
                gs.createMarch('transfer', gs.playerFaction, genIds, sourceId, finalDest, gs.turn + 1);
            }
            this._s.game.audio.stopBGM();
            this._s.game.switchScene('worldmap');
            return;
        }

        // Determine soldier loss ratio and player retreat destination
        let soldierLoss, playerRetreatCityId;

        if (isInterception) {
            soldierLoss = 0.25;
            playerRetreatCityId = isAttacker
                ? (rd?.attackerSourceCity || null)
                : (rd?.defenderSourceCity || null);
        } else if (isAttacker) {
            soldierLoss = 0.30;
            playerRetreatCityId = rd?.attackerSourceCity || null;
        } else {
            // Defender flees: pick nearest other city
            soldierLoss = 0.40;
            const defenderCity = this._s.battle.defender.city;
            const otherCities = gs.getCitiesOf(gs.playerFaction)
                .filter(c => !defenderCity || c.id !== defenderCity.id);
            playerRetreatCityId = otherCities.length > 0 ? otherCities[0].id : null;
        }

        // Move player generals back to retreat city via a march (so they visibly travel on the map)
        const retreatGeneralIds = [];
        let retreatSourceCityId = null;

        for (const unit of playerSideData.generals) {
            const gen = unit.general;
            gen.soldiers = Math.max(0, Math.floor(gen.soldiers * (1 - soldierLoss)));

            if (isInterception) {
                // Interception: retreat from wherever the fight happened (attacker target / defender source)
                retreatSourceCityId = retreatSourceCityId ||
                    (isAttacker ? (rd?.defenderSourceCity || null) : (rd?.attackerSourceCity || null));
            } else if (isAttacker) {
                // Attacker retreats from the defender's city back to their source city
                retreatSourceCityId = retreatSourceCityId ||
                    (this._s.battle.defender.city ? this._s.battle.defender.city.id : gen.city);
            } else {
                // Defender flees: source is the battle city itself
                retreatSourceCityId = retreatSourceCityId ||
                    (this._s.battle.defender.city ? this._s.battle.defender.city.id : gen.city);
            }

            const oldCity = gs.getCity(gen.city);
            if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
            gen.city = null;
            gen.status = 'marching';
            retreatGeneralIds.push(gen.id);
        }

        // Launch the retreat march
        // departTurn+1：回到大地图时turn会+1，用+1确保animProgress从0开始，玩家能看到撤退动画
        if (retreatGeneralIds.length > 0 && retreatSourceCityId && playerRetreatCityId) {
            // 检测撤退路径上是否有敌方城市需要突围
            const blocker = findRetreatBlocker(gs, retreatSourceCityId, playerRetreatCityId, gs.playerFaction);
            if (blocker) {
                // 有敌方城市阻截 — 生成一个"突围进攻"行军，到达时触发战斗
                const attackMarch = gs.createMarch('attack', gs.playerFaction, retreatGeneralIds, retreatSourceCityId, blocker, gs.turn + 1);
                if (attackMarch) {
                    attackMarch.isRetreatBreakthrough = true;
                    attackMarch.retreatFinalDestination = playerRetreatCityId;
                }
            } else {
                gs.createMarch('transfer', gs.playerFaction, retreatGeneralIds, retreatSourceCityId, playerRetreatCityId, gs.turn + 1);
            }
        } else if (retreatGeneralIds.length > 0 && !playerRetreatCityId) {
            // No retreat destination (e.g. last city) — put them back idle in the current position
            for (const id of retreatGeneralIds) {
                const gen = gs.getGeneral(id);
                if (!gen) continue;
                const fallback = retreatSourceCityId || gs.getCitiesOf(gs.playerFaction)[0]?.id;
                if (fallback) {
                    gen.city = fallback;
                    gen.status = 'idle';
                    const fc = gs.getCity(fallback);
                    if (fc && !fc.generals.includes(gen.id)) fc.generals.push(gen.id);
                }
            }
        }

        if (isInterception) {
            // Enemy side continues their original march
            const enemySourceCity = isAttacker
                ? (rd?.defenderSourceCity || null)
                : (rd?.attackerSourceCity || null);
            const enemyTargetCity = isAttacker
                ? (rd?.defenderTargetCity || null)
                : (rd?.attackerTargetCity || null);
            const enemyIds = [];
            for (const unit of enemySideData.generals) {
                if (unit.state !== 'dead') {
                    const gen = unit.general;
                    const oldCity = gs.getCity(gen.city);
                    if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                    gen.city = null;
                    gen.status = 'marching';
                    enemyIds.push(gen.id);
                }
            }
            if (enemyIds.length > 0 && enemyTargetCity) {
                gs.createMarch('attack', enemySideData.faction.id, enemyIds, enemySourceCity, enemyTargetCity, gs.turn + 1);
            }
        } else if (!isAttacker) {
            // Defender fled: attacker takes the city uncontested (no soldier loss)
            const defenderCity = this._s.battle.defender.city;
            if (defenderCity) {
                const oldOwner = defenderCity.owner;
                defenderCity.owner = enemySideData.faction.id;
                defenderCity.soldiers = 0;
                // Move attacker generals into the captured city
                for (const unit of enemySideData.generals) {
                    if (unit.state !== 'dead') {
                        const gen = unit.general;
                        const oldCity = gs.getCity(gen.city);
                        if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                        gen.city = defenderCity.id;
                        gen.status = 'idle';
                        if (!defenderCity.generals.includes(gen.id)) defenderCity.generals.push(gen.id);
                    }
                }
                // Check faction elimination
                const oldFaction = gs.getFaction(oldOwner);
                if (oldFaction && gs.getCitiesOf(oldOwner).length === 0) {
                    oldFaction.alive = false;
                }
            }
        }
        // (attacker flees: city stays with defender, enemy generals already idle in their city)

        this._s.game.audio.stopBGM();
        this._s.game.switchScene('worldmap');
    }

    _updateSoldiers(dt) {
        const duel = this._s.battle.currentDuel;
        if (!duel) return;

        const updateSide = (soldiers, enemies, friendlyGeneral, enemyGeneral, direction, formation, order) => {
            const speedMult = formation === 'charge' ? 1.2 : 1.0;
            for (let i = soldiers.length - 1; i >= 0; i--) {
                const s = soldiers[i];
                s.frame++;

                if (s.hp <= 0) {
                    soldiers.splice(i, 1);
                    continue;
                }

                // If no soldier order, soldiers hold formation position (idle oscillate)
                if (!order) {
                    s.state = 'idle';
                    s.x += Math.sin(s.frame * 0.05 + i * 0.7) * 0.3;
                    s.y += Math.cos(s.frame * 0.04 + i * 0.5) * 0.3;
                    continue;
                }

                // Per-type base speed
                const baseSpeed = s.type === 'cavalry' ? 90
                    : s.type === 'spear' ? 50
                    : s.type === 'archer' ? 45
                    : 60; // infantry

                // Find nearest enemy soldier
                let nearestDist = Infinity;
                let nearestEnemy = null;
                for (const e of enemies) {
                    const dist = Math.abs(s.x - e.x) + Math.abs(s.y - e.y);
                    if (dist < nearestDist) { nearestDist = dist; nearestEnemy = e; }
                }

                const isArcher = s.type === 'archer';
                // Archers advance toward enemy; others close in for melee
                const attackRange = isArcher ? 200 : (s.type === 'spear' ? 40 : 30);
                // Attack interval: cavalry fast, archer slow
                const atkInterval = s.type === 'cavalry' ? 0.9 : (isArcher ? 2.2 : 1.2);

                if (nearestEnemy && nearestDist < attackRange) {
                    // In attack range — fight (works for both melee and archer)
                    s.state = 'fight';
                    s.attackTimer += dt;
                    if (s.attackTimer >= atkInterval) {
                        s.attackTimer = 0;
                        // Ranged damage reduction by target type
                        if (isArcher) {
                            const defType = nearestEnemy.type || 'infantry';
                            const hitRoll = Math.random();
                            const dodgeChance = defType === 'infantry' ? 0.4 : (defType === 'spear' ? 0.2 : 0.0);
                            if (hitRoll > dodgeChance) nearestEnemy.hp--;
                        } else {
                            nearestEnemy.hp--;
                            if (s.type === 'cavalry') nearestEnemy.hp--; // cavalry hits harder
                        }

                        if (isArcher) {
                            // Arrow projectile toward enemy soldier
                            const dx = nearestEnemy.x - s.x;
                            const dy = nearestEnemy.y - s.y;
                            const travelTime = 0.35;
                            this._s.battle.projectiles.push({
                                x: s.x, y: s.y - 5,
                                vx: dx / travelTime,
                                vy: dy / travelTime - 60,
                                gravity: 120,
                                color: '#c8a030',
                                timer: 0, maxTimer: travelTime,
                                isArrow: true
                            });
                        }
                    }
                } else if (nearestEnemy) {
                    // Advance toward nearest enemy soldier
                    s.state = 'advance';
                    const dx = nearestEnemy.x - s.x;
                    const dy = nearestEnemy.y - s.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    s.x += (dx / len) * baseSpeed * speedMult * dt;
                    s.y += (dy / len) * baseSpeed * speedMult * dt;
                } else {
                    // No enemy soldiers left — charge enemy general, or hold near friendly if enemy dead
                    const isChargingGeneral = enemyGeneral && enemyGeneral.state !== 'dead';
                    const target = isChargingGeneral ? enemyGeneral : friendlyGeneral;
                    const dx = target.x - s.x;
                    const dy = target.y - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (dist > 30) {
                        s.state = 'advance';
                        s.x += (dx / dist) * baseSpeed * speedMult * dt;
                        s.y += (dy / dist) * baseSpeed * speedMult * dt;
                    } else if (isChargingGeneral) {
                        // Attack the enemy general — damage reduced by general's war stat
                        s.state = 'fight';
                        s.x += Math.sin(s.frame * 0.08 + i) * 0.4;
                        s.y += Math.cos(s.frame * 0.06 + i) * 0.4;
                        s.attackTimer += dt;
                        if (s.attackTimer >= atkInterval) {
                            s.attackTimer = 0;
                            // war value: high war = strong resist. war 100 → 10% dmg, war 50 → 55% dmg, war 0 → 100%
                            const war = (enemyGeneral.general && enemyGeneral.general.war) || 50;
                            const dmgFactor = Math.max(0.1, 1 - war / 110);
                            const dmg = dmgFactor * (s.type === 'cavalry' ? 2 : 1);
                            enemyGeneral.hp -= dmg;
                            if (enemyGeneral.hp < 0) enemyGeneral.hp = 0;
                        }
                    } else {
                        s.state = 'idle';
                        s.x += Math.sin(s.frame * 0.08 + i) * 0.4;
                        s.y += Math.cos(s.frame * 0.06 + i) * 0.4;
                    }
                }
            }
        };

        updateSide(this._s.battle.soldiers.left,  this._s.battle.soldiers.right, duel.left,  duel.right, 1,  duel.leftFormation,  duel.soldierOrderLeft);
        updateSide(this._s.battle.soldiers.right, this._s.battle.soldiers.left,  duel.right, duel.left,  -1, duel.rightFormation, duel.soldierOrderRight);

        // 武将攻击周围敌方士兵
        const generalAttackSoldiers = (unit, enemySoldiers) => {
            if (!unit || unit.state === 'dead') return;
            if (!unit.soldierAttackTimer) unit.soldierAttackTimer = 0;
            unit.soldierAttackTimer += dt;
            const atkInterval = 1.0;
            if (unit.soldierAttackTimer < atkInterval) return;
            unit.soldierAttackTimer = 0;

            const war = (unit.general && unit.general.war) || 50;
            const unitType = unit.general && unit.general.unitType || 'infantry';
            const dmg = (war / 20) * (unitType === 'cavalry' ? 1.5 : 1);
            const range = 60;

            for (let i = enemySoldiers.length - 1; i >= 0; i--) {
                const s = enemySoldiers[i];
                const dx = s.x - unit.x;
                const dy = s.y - unit.y;
                if (Math.sqrt(dx * dx + dy * dy) <= range) {
                    s.hp -= dmg;
                }
            }
        };

        generalAttackSoldiers(duel.left,  this._s.battle.soldiers.right);
        generalAttackSoldiers(duel.right, this._s.battle.soldiers.left);
    }
}
