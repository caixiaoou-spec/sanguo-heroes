// 战斗逻辑系统 - 逐一单挑模式
import historicalDuels from '../data/duels.js';
import { checkLevelUp } from '../utils/generalUtils.js';

export default class CombatSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // Check if two generals have a historical duel record
    findHistoricalDuel(generalId1, generalId2) {
        return historicalDuels.find(d =>
            (d.generals[0] === generalId1 && d.generals[1] === generalId2) ||
            (d.generals[0] === generalId2 && d.generals[1] === generalId1)
        ) || null;
    }

    // Initialize a battle
    createBattle(attackerGeneralIds, defenderCityId) {
        const gs = this.gameState;
        const defenderCity = gs.getCity(defenderCityId);
        const defenderFaction = gs.getFaction(defenderCity.owner);
        const defenderGenerals = gs.getGeneralsInCity(defenderCityId);

        const attackerGenerals = attackerGeneralIds.map(id => gs.getGeneral(id)).filter(Boolean);
        if (attackerGenerals.length === 0) {
            console.warn('createBattle: no valid attacker generals found for ids', attackerGeneralIds);
        }
        const attackerFaction = attackerGenerals.length > 0
            ? gs.getFaction(attackerGenerals[0].faction)
            : gs.getFaction(defenderCity.owner); // fallback, shouldn't happen

        return {
            phase: 'init', // pick, duel_intro, dueling, duel_result, result
            timer: 0,
            fieldWidth: 1200,
            fieldHeight: 400,

            attacker: {
                faction: attackerFaction,
                generals: attackerGenerals.map(g => this._createBattleUnit(g, 'left')),
                totalSoldiers: attackerGenerals.reduce((s, g) => s + g.soldiers, 0)
            },
            defender: {
                faction: defenderFaction,
                city: defenderCity,
                generals: defenderGenerals.map(g => this._createBattleUnit(g, 'right')),
                totalSoldiers: defenderGenerals.reduce((s, g) => s + g.soldiers, 0) + defenderCity.soldiers,
                cityDefenseBonus: defenderCity.defense / 100
            },

            soldiers: { left: [], right: [] },
            projectiles: [],
            effects: [],
            damageNumbers: [],
            skillAnimations: [],

            // Sequential duel fields
            currentDuel: null,        // { left, right, timer, maxTime: 60, leftFormation, rightFormation }
            duelResults: [],          // [{ winnerName, loserName, winnerSide }]
            matchScore: { left: 0, right: 0 },

            result: null
        };
    }

    // Initialize a field interception battle (no city, no defense bonus)
    createInterceptionBattle(attackerGeneralIds, defenderGeneralIds, attackerFactionId, defenderFactionId) {
        const gs = this.gameState;
        const attackerGenerals = attackerGeneralIds.map(id => gs.getGeneral(id)).filter(Boolean);
        const defenderGenerals = defenderGeneralIds.map(id => gs.getGeneral(id)).filter(Boolean);
        const attackerFaction = gs.getFaction(attackerFactionId);
        const defenderFaction = gs.getFaction(defenderFactionId);

        return {
            phase: 'init',
            timer: 0,
            fieldWidth: 1200,
            fieldHeight: 400,
            isInterception: true,

            attacker: {
                faction: attackerFaction,
                generals: attackerGenerals.map(g => this._createBattleUnit(g, 'left')),
                totalSoldiers: attackerGenerals.reduce((s, g) => s + g.soldiers, 0)
            },
            defender: {
                faction: defenderFaction,
                city: null,
                generals: defenderGenerals.map(g => this._createBattleUnit(g, 'right')),
                totalSoldiers: defenderGenerals.reduce((s, g) => s + g.soldiers, 0),
                cityDefenseBonus: 0
            },

            soldiers: { left: [], right: [] },
            projectiles: [],
            effects: [],
            damageNumbers: [],
            skillAnimations: [],

            currentDuel: null,
            duelResults: [],
            matchScore: { left: 0, right: 0 },

            result: null
        };
    }

    _createBattleUnit(general, side, pos = null) {
        const skills = general.skills.map(sid => this.gameState.getSkill(sid)).filter(Boolean);
        return {
            general,
            side,
            x: pos ? pos.x : (side === 'left' ? 50 + Math.random() * 100 : 1050 + Math.random() * 100),
            y: pos ? pos.y : (150 + Math.random() * 100),
            hp: general.hp > 0 ? general.hp : general.maxHp, // 防止hp=0的将领进战场直接败北
            maxHp: general.maxHp,
            mp: general.mp,
            maxMp: general.maxMp,
            soldiers: general.soldiers,
            maxSoldiers: general.soldiers,
            skills: skills.map(s => ({ ...s, currentCd: 0 })),
            targetX: 0,
            targetY: 0,
            state: 'advance', // advance, fight, skill, retreat, dead
            attackTimer: 0,
            frame: 0,
            facing: side === 'left' ? 1 : -1
        };
    }

    // Start a sequential duel between two units
    startSequentialDuel(battle, leftUnit, rightUnit, leftFormation, rightFormation, playerSide = 'attacker') {
        // Reset positions to battlefield ends
        leftUnit.x = 150;
        leftUnit.y = 200;
        rightUnit.x = 1050;
        rightUnit.y = 200;

        // Reset states - start in standby (waiting for order)
        leftUnit.state = 'standby';
        leftUnit.attackTimer = 0;
        leftUnit.facing = 1;
        rightUnit.state = 'standby';
        rightUnit.attackTimer = 0;
        rightUnit.facing = -1;

        // Reset cooldowns
        for (const skill of leftUnit.skills) skill.currentCd = 0;
        for (const skill of rightUnit.skills) skill.currentCd = 0;

        // Apply circle formation HP bonus at duel start
        if (leftFormation === 'circle') {
            leftUnit.hp = Math.floor(leftUnit.hp * 1.1);
            leftUnit.maxHp = Math.floor(leftUnit.maxHp * 1.1);
        }
        if (rightFormation === 'circle') {
            rightUnit.hp = Math.floor(rightUnit.hp * 1.1);
            rightUnit.maxHp = Math.floor(rightUnit.maxHp * 1.1);
        }

        battle.currentDuel = {
            left: leftUnit,
            right: rightUnit,
            timer: 0,
            maxTime: 60,
            leftFormation,
            rightFormation,
            // Independent orders for general and soldiers (each side)
            generalOrderLeft: false,
            generalOrderRight: false,
            soldierOrderLeft: false,
            soldierOrderRight: false,
            playerSide  // 'attacker' = player is left, 'defender' = player is right
        };

        battle.phase = 'duel_intro';
    }

    // Update a single 1v1 duel each frame
    updateSequentialDuel(battle, dt) {
        if (battle.phase !== 'dueling') return;
        const duel = battle.currentDuel;
        if (!duel) return;

        // Only advance duel timer once at least one side has issued any order
        const leftAny = duel.generalOrderLeft || duel.soldierOrderLeft;
        const rightAny = duel.generalOrderRight || duel.soldierOrderRight;
        if (leftAny || rightAny) {
            duel.timer += dt;
        }

        // Update visuals
        this._updateVisuals(battle, dt);

        const units = [duel.left, duel.right];

        for (const unit of units) {
            if (unit.state === 'dead') continue;

            unit.frame++;

            const enemy = unit === duel.left ? duel.right : duel.left;
            if (enemy.state === 'dead') {
                // Enemy is dead, duel over
                this._endCurrentDuel(battle, unit, enemy);
                return;
            }

            // Update cooldowns
            for (const skill of unit.skills) {
                if (skill.currentCd > 0) skill.currentCd -= dt;
            }

            // MP regen
            unit.mp = Math.min(unit.maxMp, unit.mp + dt * 2);

            const bonusId = unit === duel.left ? duel.leftFormation : duel.rightFormation;
            const generalOrder = unit === duel.left ? duel.generalOrderLeft : duel.generalOrderRight;
            const unitType = unit.general.unitType || 'infantry';
            const isArcher = unitType === 'archer';

            // Archers can shoot from anywhere, but when ordered they advance to melee range like other units
            const attackRange = isArcher ? Infinity : (unitType === 'spear' ? 70 : 60);
            const effectiveRange = attackRange;
            // When given 武将出击 order, archer advances to same melee range as other units
            const archerAdvanceRange = 65;

            const dist = Math.abs(unit.x - enemy.x);
            const shouldAdvance = generalOrder && (isArcher ? dist > archerAdvanceRange : dist > attackRange);

            if (shouldAdvance) {
                // 武将出击 - general advances (even archers move until archerAdvanceRange)
                unit.state = 'advance';
                const speed = unitType === 'cavalry' ? 90 : (unitType === 'spear' ? 50 : (isArcher ? 45 : 60));
                const speedMult = bonusId === 'charge' ? 1.2 : 1.0;
                unit.x += unit.facing * speed * speedMult * dt;
            } else if (isArcher || dist <= effectiveRange) {
                // In range (or archer with no advance order) - fight
                unit.state = 'fight';
                unit.attackTimer += dt;

                // Archers attack slower (pulling bow), cavalry faster
                const atkInterval = unitType === 'cavalry' ? 1.1 : (isArcher ? 2.0 : 1.5);

                // Try to use skill — only AI side auto-uses; player must click manually
                const isPlayerUnit = (duel.playerSide === 'attacker' && unit === duel.left)
                    || (duel.playerSide === 'defender' && unit === duel.right);

                const readySkill = unit.skills.find(s =>
                    s.currentCd <= 0 && unit.mp >= s.mpCost && s.targetType !== 'self'
                );

                if (!isPlayerUnit && readySkill && Math.random() < 0.02) {
                    this._useSkill(battle, unit, readySkill, enemy);
                } else if (unit.attackTimer >= atkInterval) {
                    this._normalAttack(battle, unit, enemy);
                    unit.attackTimer = 0;
                }
            } else {
                // No general order - hold position (standby idle)
                unit.state = 'standby';
            }

            // Update soldier count based on unit HP ratio
            const hpRatio = unit.hp / unit.maxHp;
            unit.soldiers = Math.max(0, Math.floor(unit.maxSoldiers * hpRatio));

            if (unit.hp <= 0) {
                unit.state = 'dead';
                unit.soldiers = 0;
            }
        }

        // Check timeout
        if (duel.timer >= duel.maxTime) {
            const leftRatio = duel.left.hp / duel.left.maxHp;
            const rightRatio = duel.right.hp / duel.right.maxHp;
            if (leftRatio >= rightRatio) {
                duel.right.hp = 0;
                duel.right.state = 'dead';
                duel.right.soldiers = 0;
                this._endCurrentDuel(battle, duel.left, duel.right);
            } else {
                duel.left.hp = 0;
                duel.left.state = 'dead';
                duel.left.soldiers = 0;
                this._endCurrentDuel(battle, duel.right, duel.left);
            }
        }
    }

    // Extract visual updates from updateBattle
    _updateVisuals(battle, dt) {
        // Update effects
        battle.effects = battle.effects.filter(e => {
            e.timer += dt;
            return e.timer < e.duration;
        });

        // Update damage numbers
        battle.damageNumbers = battle.damageNumbers.filter(d => {
            d.timer += dt;
            d.y -= 30 * dt;
            return d.timer < 1;
        });

        // Update projectiles
        for (let i = battle.projectiles.length - 1; i >= 0; i--) {
            const p = battle.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.gravity) p.vy += p.gravity * dt; // arc gravity for arrows
            p.timer += dt;
            const maxT = p.maxTimer || 3;
            if (p.timer > maxT) battle.projectiles.splice(i, 1);
        }
    }

    // End the current duel, record result
    _endCurrentDuel(battle, winner, loser) {
        battle.duelResults.push({
            winnerName: winner.general.name,
            loserName: loser.general.name,
            winnerSide: winner.side
        });

        if (winner.side === 'left') {
            battle.matchScore.left++;
        } else {
            battle.matchScore.right++;
        }

        battle.phase = 'duel_result';
    }

    // Check if battle is over (one side all dead)
    checkBattleEnd(battle) {
        const leftAlive = battle.attacker.generals.filter(u => u.state !== 'dead');
        const rightAlive = battle.defender.generals.filter(u => u.state !== 'dead');

        if (leftAlive.length === 0) {
            battle.result = 'defender_wins';
            battle.phase = 'result';
            return true;
        }
        if (rightAlive.length === 0) {
            battle.result = 'attacker_wins';
            battle.phase = 'result';
            return true;
        }
        return false;
    }

    // AI picks next general: highest war stat among alive
    aiPickNextGeneral(generals) {
        const alive = generals.filter(u => u.state !== 'dead');
        if (alive.length === 0) return null;
        alive.sort((a, b) => b.general.war - a.general.war);
        return alive[0];
    }

    _normalAttack(battle, attacker, defender) {
        const atk = attacker.general;
        const def = defender.general;
        const atkType = atk.unitType || 'infantry';
        const defType = def.unitType || 'infantry';
        const isRanged = atkType === 'archer';

        let baseDmg = atk.war * 0.3 + atk.lead * 0.15;
        const defense = def.lead * 0.3 + (defender.side === 'right' ? battle.defender.cityDefenseBonus * 20 : 0);
        let damage = Math.max(1, Math.floor(baseDmg - defense + Math.random() * 6));

        // Unit type advantages
        const advantage = this._getUnitAdvantage(atkType, defType);
        damage = Math.floor(damage * advantage);

        // Ranged attack modifier
        if (isRanged) {
            damage = Math.floor(damage * 0.6); // archers deal less damage at range
            // Ranged damage reduction by defender type
            if (defType === 'infantry') damage = Math.floor(damage * 0.6);       // infantry shields block arrows well
            else if (defType === 'spear') damage = Math.floor(damage * 0.8);     // spear has some shield
            else if (defType === 'cavalry') damage = Math.floor(damage * 1.1);   // big target, easy to hit
            // archer vs archer: no modifier (default 1.0)
        }

        // Cavalry charge bonus: higher damage when far from enemy (closing in fast)
        if (atkType === 'cavalry') {
            const dist = Math.abs(attacker.x - defender.x);
            if (dist > 200) damage = Math.floor(damage * 1.3);
        }

        // Soldier count affects damage
        const soldierRatio = attacker.soldiers / Math.max(1, attacker.maxSoldiers);
        damage = Math.floor(damage * (0.5 + soldierRatio * 0.5));

        // Formation bonuses - read from currentDuel
        const duel = battle.currentDuel;
        if (duel) {
            const atkBonus = attacker === duel.left ? duel.leftFormation : duel.rightFormation;
            const defBonus = defender === duel.left ? duel.leftFormation : duel.rightFormation;
            if (atkBonus === 'arrow') damage = Math.floor(damage * 1.1);
            if (defBonus === 'fish') damage = Math.floor(damage * 0.85);
        }

        defender.hp -= damage;
        if (defender.hp <= 0) {
            defender.hp = 0;
            defender.state = 'dead';
            defender.soldiers = 0;
        }

        // Ranged attack: spawn arrow projectile with arc
        if (isRanged) {
            const dx = defender.x - attacker.x;
            const dy = defender.y - attacker.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const travelTime = 0.4;
            battle.projectiles.push({
                x: attacker.x, y: attacker.y - 10,
                targetX: defender.x, targetY: defender.y - 10,
                vx: dx / travelTime,
                vy: dy / travelTime - 80, // arc upward
                gravity: 160,
                color: '#c8a030',
                timer: 0, maxTimer: travelTime,
                isArrow: true
            });
        }

        battle.damageNumbers.push({
            x: defender.x, y: defender.y - 20,
            value: damage,
            color: isRanged ? '#ffaa44' : '#ff4444',
            timer: 0,
            // 普攻特效标记
            hitX: defender.x, hitY: defender.y,
            fromX: attacker.x, fromY: attacker.y,
            isRanged,
            isMeleeHit: !isRanged
        });
    }

    _useSkill(battle, user, skill, target) {
        user.mp -= skill.mpCost;
        skill.currentCd = skill.cooldown;
        user.state = 'skill';

        const baseDmg = skill.damage * (user.general.war + user.general.int) / 2 * 0.65;
        const color = this._getSkillColor(skill.effect);

        // Build damage payload — applied after animation travel time
        let payload = null;

        if (skill.targetType === 'area') {
            const duel = battle.currentDuel;
            if (duel) {
                const enemy = user === duel.left ? duel.right : duel.left;
                if (enemy.state !== 'dead') {
                    const dist = Math.abs(enemy.x - target.x) + Math.abs(enemy.y - target.y);
                    if (dist < 150) {
                        const dmg = Math.max(1, Math.floor(baseDmg * (1 - dist / 300)));
                        payload = { type: 'damage', target: enemy, dmg, color: '#ff8800', stun: false };
                    }
                }
            }
        } else if (skill.effect === 'heal') {
            const healAmt = Math.max(1, Math.floor(user.general.int * 0.6 + 10));
            payload = { type: 'heal', target: user, healAmt };
        } else if (skill.effect === 'buff_atk' || skill.effect === 'buff_def' || skill.effect === 'buff_speed') {
            payload = { type: 'buff', target: user, skillName: skill.name };
        } else if (skill.effect === 'instant_kill') {
            payload = { type: 'instant_kill', target };
        } else {
            const dmg = Math.max(1, Math.floor(baseDmg));
            payload = { type: 'damage', target, dmg, color: '#ff8800', stun: skill.effect === 'stun' };
        }

        // Push to skillAnimations for animated delivery (managed in battle.js)
        const isAura = (skill.effect === 'heal' || skill.effect === 'buff_atk' ||
                        skill.effect === 'buff_def' || skill.effect === 'buff_speed');
        const hitTime = skill.animation === 'beam' ? 0.1 : 0.28;
        const duration = skill.effect === 'instant_kill' ? 0.9 :
                         isAura ? 0.6 : 0.55;

        if (!battle.skillAnimations) battle.skillAnimations = [];
        battle.skillAnimations.push({
            animType: skill.animation,
            effect: skill.effect,
            color,
            name: skill.name,
            fromX: user.x, fromY: user.y,
            toX: isAura ? user.x : target.x,
            toY: isAura ? user.y : target.y,
            timer: 0,
            duration,
            hitTime,
            hitFired: false,
            payload,
            isAura,
        });
    }

    _getUnitAdvantage(atkType, defType) {
        const advantages = {
            // 骑兵速度快，近战猛，克步兵
            'cavalry_infantry': 1.2,
            'cavalry_archer': 1.1,   // 冲到跟前，弓兵难以应对
            // 枪兵克骑兵（长枪破冲锋）
            'spear_cavalry': 1.5,
            'spear_infantry': 1.0,
            // 步兵克弓兵（冲近身，弓兵近战弱）
            'infantry_archer': 1.3,
            'infantry_spear': 1.0,
            // 弓兵克骑兵（大目标好射）
            'archer_cavalry': 1.2,
            'archer_spear': 1.1,
        };
        return advantages[`${atkType}_${defType}`] || 1.0;
    }

    _getSkillColor(effect) {
        const colors = {
            'fire': '#ff4400', 'ice': '#44aaff', 'lightning': '#ffff44',
            'damage': '#ff8844', 'aoe_damage': '#ff6600', 'instant_kill': '#ff0000',
            'heal': '#44ff44', 'buff_atk': '#ff4444', 'buff_def': '#4444ff',
            'buff_speed': '#44ffff', 'stun': '#ffff00', 'debuff': '#aa44aa'
        };
        return colors[effect] || '#ffffff';
    }

    // Settle battle results
    settleBattle(battle) {
        const gs = this.gameState;
        const results = { captures: [], killed: [], escaped: [], exp: 0, loot: { gold: 0, food: 0 } };

        const winners = battle.result === 'attacker_wins' ? battle.attacker : battle.defender;
        const losers = battle.result === 'attacker_wins' ? battle.defender : battle.attacker;

        // Award exp to winners; revive defeated-but-on-winning-side generals with minimal HP
        for (const unit of winners.generals) {
            const gen = unit.general;
            if (unit.state !== 'dead') {
                gen.hp = unit.hp;
                gen.mp = unit.mp;
                gen.soldiers = unit.soldiers;
                gen.exp += 50 + losers.generals.length * 20;
                checkLevelUp(gen, gs);
            } else {
                // General was defeated in their duel but their side won overall —
                // they survive badly wounded, staying in the formation
                gen.hp = Math.max(1, Math.floor(gen.maxHp * 0.05));
                gen.mp = 0;
                gen.soldiers = Math.max(10, Math.floor(unit.maxSoldiers * 0.05));
                gen.exp += 20; // small exp even for defeat
                checkLevelUp(gen, gs);
            }
        }

        // Determine the physical location of the battle (used as retreat march start)
        // - Siege: at the defender's city
        // - Interception: at the loser's source city (they retreat back the way they came)
        const battleCityId = battle.defender.city?.id || null;
        const loserIsAttacker = losers === battle.attacker;
        const loserInterceptSourceCity = battle.isInterception
            ? (loserIsAttacker ? battle.attackerSourceCity : battle.defenderSourceCity)
            : null;

        // Collect retreating generals grouped by (sourceCityId -> targetCityId) to batch into marches
        const retreatGroups = {}; // key: `${src}->${tgt}` → { sourceCityId, targetCityId, faction, genIds }

        const queueRetreat = (gen, targetCityId) => {
            // Determine march start: for siege losers use battleCityId; for interception use loserInterceptSourceCity
            const sourceCityId = battle.isInterception ? loserInterceptSourceCity : battleCityId;
            if (!sourceCityId || !targetCityId || sourceCityId === targetCityId) {
                // Same city or unknown location — just place directly
                const oldCity = gs.getCity(gen.city);
                if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                gen.city = targetCityId;
                gen.status = 'idle';
                const tgtCity = gs.getCity(targetCityId);
                if (tgtCity && !tgtCity.generals.includes(gen.id)) tgtCity.generals.push(gen.id);
                return;
            }
            const key = `${sourceCityId}->${targetCityId}`;
            if (!retreatGroups[key]) {
                retreatGroups[key] = { sourceCityId, targetCityId, faction: gen.faction, genIds: [] };
            }
            retreatGroups[key].genIds.push(gen.id);
            // Remove from current city list; gen.city = null while marching
            const oldCity = gs.getCity(gen.city);
            if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
            gen.city = null;
            gen.status = 'marching';
        };

        // Process losers
        for (const unit of losers.generals) {
            const gen = unit.general;
            if (unit.state === 'dead' || unit.hp <= 0) {
                gen.soldiers = 0;

                // If the faction leader is killed, the faction is destroyed
                if (gen.id === losers.faction.id) {
                    gen.status = 'dead';
                    gen.faction = 'none';
                    const city = gs.getCity(gen.city);
                    if (city) city.generals = city.generals.filter(gid => gid !== gen.id);
                    gen.city = null;
                    losers.faction.alive = false;
                    // 清理所有势力外交关系中对灭亡势力的引用
                    const deadId = losers.faction.id;
                    for (const f of gs.factions) {
                        f.allies  = f.allies.filter(id => id !== deadId);
                        f.enemies = f.enemies.filter(id => id !== deadId);
                    }
                    results.leaderKilled = gen.name;
                    results.killed.push(gen);
                    continue;
                }
                // Capture or escape — capture chance is low; most generals escape wounded
                const captureChance = 0.12 + winners.faction.fame / 600;
                if (Math.random() < captureChance) {
                    gen.status = 'captured';
                    gen.hp = Math.floor(gen.maxHp * 0.3);
                    gen.originalFaction = gen.faction;
                    gen.faction = 'none';
                    const oldCity = gs.getCity(gen.city);
                    if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                    // Hold prisoner in the battle city (now controlled by winners)
                    gen.city = battleCityId;
                    results.captures.push(gen);
                } else {
                    // Escaped — retreat march to home city
                    gen.hp = Math.floor(gen.maxHp * 0.3);
                    gen.soldiers = Math.floor(unit.maxSoldiers * 0.1);
                    results.escaped.push(gen); // 负伤逃脱
                    const retreatCities = loserInterceptSourceCity
                        ? [gs.getCity(loserInterceptSourceCity)].filter(Boolean)
                        : gs.getCitiesOf(losers.faction.id).filter(c => c.id !== battleCityId);
                    if (retreatCities.length > 0) {
                        queueRetreat(gen, retreatCities[0].id);
                    } else {
                        // No home city — stay as unaffiliated
                        gen.originalFaction = gen.faction;
                        gen.faction = 'none';
                        gen.status = 'idle';
                        // Remove from city list to prevent being selected as attacker
                        const oldCity = gs.getCity(gen.city);
                        if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                        gen.city = null;
                    }
                }
            } else {
                // Survived but lost — retreat march to home city
                gen.hp = unit.hp;
                gen.soldiers = unit.soldiers;
                const retreatCities = loserInterceptSourceCity
                    ? [gs.getCity(loserInterceptSourceCity)].filter(Boolean)
                    : gs.getCitiesOf(losers.faction.id).filter(c => c.id !== battleCityId);
                if (retreatCities.length > 0) {
                    queueRetreat(gen, retreatCities[0].id);
                }
                // If no retreat city, gen stays idle in current city
            }
        }

        // Create retreat marches (one per group)
        // departTurn+1：战斗结算后立即回到大地图，turn会+1，用+1确保animProgress从0开始，
        // 玩家能在地图上看到撤退行军动画
        for (const group of Object.values(retreatGroups)) {
            if (group.genIds.length > 0) {
                gs.createMarch('transfer', group.faction, group.genIds, group.sourceCityId, group.targetCityId, gs.turn + 1);
            }
        }

        // If attacker wins, capture the city
        if (battle.result === 'attacker_wins' && battle.defender.city) {
            const city = battle.defender.city;
            const oldOwner = city.owner;
            const newOwner = battle.attacker.faction.id;

            city.owner = newOwner;
            city.soldiers = 0;

            // Move ALL winning generals (including wounded) to the captured city
            for (const unit of battle.attacker.generals) {
                const gen = unit.general;
                const oldCity = gs.getCity(gen.city);
                if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== gen.id);
                gen.city = city.id;
                gen.status = 'idle';
                if (!city.generals.includes(gen.id)) city.generals.push(gen.id);
            }

            results.loot.gold = Math.floor(Math.random() * 5000);
            results.loot.food = Math.floor(Math.random() * 8000);
            const faction = gs.getFaction(newOwner);
            faction.gold += results.loot.gold;
            faction.food += results.loot.food;

            // Check if old owner lost all cities
            const oldFaction = gs.getFaction(oldOwner);
            if (oldFaction && gs.getCitiesOf(oldOwner).length === 0) {
                oldFaction.alive = false;
                // 清理所有势力外交关系中对灭亡势力的引用
                for (const f of gs.factions) {
                    f.allies  = f.allies.filter(id => id !== oldOwner);
                    f.enemies = f.enemies.filter(id => id !== oldOwner);
                }
            }

            // Encamped generals of old owner at this city must flee or become unaffiliated
            for (const gen of gs.generals) {
                if (gen.status !== 'encamped' || gen.city !== city.id || gen.faction !== oldOwner) continue;
                city.generals = city.generals.filter(gid => gid !== gen.id);
                const retreatCities = gs.getCitiesOf(oldOwner);
                if (retreatCities.length > 0) {
                    const nearest = retreatCities.reduce((a, b) =>
                        Math.hypot((a.x||0)-(city.x||0),(a.y||0)-(city.y||0)) <=
                        Math.hypot((b.x||0)-(city.x||0),(b.y||0)-(city.y||0)) ? a : b);
                    gen.city = null;
                    gen.status = 'marching';
                    gs.createMarch('transfer', oldOwner, [gen.id], city.id, nearest.id);
                } else {
                    gen.city = null;
                    gen.status = 'idle';
                    gen.faction = 'none';
                }
            }
        }

        // Interception battle: ALL winners (including wounded) return to their source city
        if (battle.isInterception) {
            const winnerSourceCity = winners === battle.attacker ? battle.attackerSourceCity : battle.defenderSourceCity;
            for (const unit of winners.generals) {
                const gen = unit.general;
                // If gen.city is not set or doesn't match a real city, reassign to source city
                if (!gen.city || !gs.getCity(gen.city)) {
                    const returnCityId = winnerSourceCity || (gs.getCitiesOf(winners.faction.id)[0]?.id);
                    if (returnCityId) {
                        const returnCity = gs.getCity(returnCityId);
                        gen.city = returnCityId;
                        if (returnCity && !returnCity.generals.includes(gen.id)) returnCity.generals.push(gen.id);
                    }
                }
                gen.status = 'idle';
            }
        }

        // Defender wins (siege): ensure all winning defenders stay in their city
        if (battle.result === 'defender_wins' && battle.defender.city) {
            const city = battle.defender.city;
            for (const unit of battle.defender.generals) {
                const gen = unit.general;
                // Make sure every defender general is registered in the city
                if (!city.generals.includes(gen.id)) city.generals.push(gen.id);
                gen.city = city.id;
                gen.status = 'idle';
            }
        }

        return results;
    }
}

