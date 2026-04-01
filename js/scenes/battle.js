// 战斗场景 - 逐一单挑模式
import CombatSystem from '../systems/combat.js';
import Renderer from '../engine/renderer.js';
import { BattleLogic } from './battle_logic.js';
import { BattleRenderer } from './battle_renderer.js';

const FORMATIONS = [
    { id: 'crane_wing', name: '鹤翼阵', desc: '主将居中，士兵两翼展开', bonus: '均衡（默认）', bonusTag: '' },
    { id: 'arrow', name: '锋矢阵', desc: '主将冲锋在前，V形跟随', bonus: '主将攻击+10%', bonusTag: '攻+10%' },
    { id: 'fish', name: '鱼鳞阵', desc: '士兵密集前排，保护主将', bonus: '受伤-15%', bonusTag: '伤-15%' },
    { id: 'goose', name: '雁行阵', desc: '斜线排列，远程靠后', bonus: '弓兵射程+30', bonusTag: '射程+' },
    { id: 'circle', name: '方圆阵', desc: '主将居中，士兵围绕防御', bonus: '全体HP+10%', bonusTag: 'HP+10%' },
    { id: 'charge', name: '冲锋阵', desc: '全军并排，齐头冲锋', bonus: '移速+20%', bonusTag: '速+20%' },
];

export default class BattleScene {
    constructor(game, attackerIds, defenderCityId, playerSide = 'attacker', interceptionOpts = null) {
        this.game = game;
        this.renderer = game.renderer;
        this.input = game.input;
        this.gs = game.gameState;
        this.playerSide = playerSide;

        this.combat = new CombatSystem(this.gs);
        if (interceptionOpts && interceptionOpts.isInterception) {
            this.battle = this.combat.createInterceptionBattle(
                attackerIds,
                interceptionOpts.defenderIds,
                interceptionOpts.attackerFactionId,
                interceptionOpts.defenderFactionId
            );
            // Store source cities on battle so settleBattle can retreat losers correctly
            const rd = game._battleReturnData;
            if (rd) {
                this.battle.attackerSourceCity = rd.attackerSourceCity || null;
                this.battle.defenderSourceCity = rd.defenderSourceCity || null;
            }
        } else {
            this.battle = this.combat.createBattle(attackerIds, defenderCityId);
        }
        this.battle.phase = 'pick';  // Start with pick phase

        // Retreat breakthrough: player is breaking through an enemy city while retreating
        const _rd = game._battleReturnData;
        this._isRetreatBreakthrough = (_rd && _rd.isRetreatBreakthrough) || false;
        this._retreatFinalDestination = (_rd && _rd.retreatFinalDestination) || null;

        this.selectedFormation = 'crane_wing';

        this.cameraX = 600;
        this.selectedUnit = null;
        this.autoMode = false;
        this.speedMultiplier = 1;
        this.showResult = false;
        this.resultData = null;
        this.battleTime = 0;
        this.particles = [];
        this.screenShake = 0;
        this.screenFlash = 0;       // 0~1, 全屏白光强度
        this.hitFlashes = [];       // [{x,y,life,maxLife,side}] 受击白光
        this.slashTrails = [];      // [{x0,y0,x1,y1,life,color}] 刀光残影
        this.skillBigText = null;   // {text,life,maxLife,color} 技能大字演出
        this.cinematicText = null;  // {text,life,maxLife,color,sub} 开场/结束大字
        this.duelAuraLeft = 0;      // 0~1 left general aura intensity
        this.duelAuraRight = 0;     // 0~1 right general aura intensity
        this.slowMoTimer = 0;       // >0 = slow-motion active (skill pre-wind)
        this.slowMoTarget = 1;      // multiplier target (0.1 = near freeze)
        this._hpFlash = { left: 0, right: 0 };   // HP受击闪烁 0~1
        this._prevHp  = { left: -1, right: -1 };  // 上帧 HP，用于检测受伤

        // Sequential duel properties
        this.duelIntroTimer = 0;
        this.duelResultTimer = 0;
        this.duelNumber = 0;
        this.hoveredPickUnit = null;
        this.selectedFormationForDuel = null;
        this.pickPhase = 'general';  // 'general' | 'formation'

        // Historical duel properties
        this.currentHistoricalDuel = null;  // historical duel data if triggered
        this.historicalDuelIntroTimer = 0;
        this.isHistoricalDuel = false;      // whether current duel is a historical duel

        // AI picks first
        this._aiPickedUnit = null;
        this._playerPickedUnit = null;

        // Extracted helpers (must be created before calling any delegated methods)
        this._logic = new BattleLogic(this);
        this._renderer_bt = new BattleRenderer(this);

        // Check if either side has no generals — auto-resolve
        const opponentGenerals = this.playerSide === 'attacker'
            ? this.battle.defender.generals
            : this.battle.attacker.generals;
        const playerGenerals = this.playerSide === 'attacker'
            ? this.battle.attacker.generals
            : this.battle.defender.generals;
        if (opponentGenerals.length === 0) {
            // No enemy generals: player auto-wins
            this.battle.result = this.playerSide === 'attacker' ? 'attacker_wins' : 'defender_wins';
            this.battle.phase = 'result';
        } else if (playerGenerals.length === 0) {
            // No player generals: player auto-loses
            this.battle.result = this.playerSide === 'attacker' ? 'defender_wins' : 'attacker_wins';
            this.battle.phase = 'result';
        } else {
            this._prepareAIPick();
        }

        // Ground tiles
        this.groundTiles = [];
        for (let i = 0; i < 40; i++) {
            this.groundTiles.push({
                x: i * 40,
                type: Math.random() < 0.3 ? 'grass' : 'dirt',
                height: Math.random() * 3
            });
        }

        // Clouds
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * 1600,
                y: 20 + Math.random() * 80,
                w: 80 + Math.random() * 120,
                h: 18 + Math.random() * 22,
                speed: 6 + Math.random() * 10,
                alpha: 0.12 + Math.random() * 0.15,
                layer: i < 3 ? 0 : 1   // 0=far/small, 1=near/large
            });
        }

        // Battle flags (fixed world positions on both sides)
        const factionL = this.battle.attacker.faction;
        const factionR = this.battle.defender.faction;
        this.battleFlags = [];
        const flagPosL = [-150, -220, -310];
        const flagPosR = [1350, 1420, 1510];
        for (const fx of flagPosL) {
            this.battleFlags.push({ x: fx, side: 'left', color: factionL.color || '#4488cc', waveOffset: Math.random() * Math.PI * 2 });
        }
        for (const fx of flagPosR) {
            this.battleFlags.push({ x: fx, side: 'right', color: factionR.color || '#cc4444', waveOffset: Math.random() * Math.PI * 2 });
        }

        // Play battle BGM
        game.audio.playBGM('battle');
    }

    _prepareAIPick() { return this._logic._prepareAIPick(); }

    _getFormationPositions(formationId, generals, side) { return this._logic._getFormationPositions(formationId, generals, side); }

    _spawnDuelSoldiers(leftUnit, rightUnit) { return this._logic._spawnDuelSoldiers(leftUnit, rightUnit); }

    update(dt) {
        dt *= this.speedMultiplier;
        this.battleTime += dt;

        // Global updates (run regardless of phase)
        // Drift clouds
        for (const c of this.clouds) {
            c.x += c.speed * dt;
            if (c.x > 1700) c.x = -c.w - 20;
        }

        if (this.cinematicText) {
            this.cinematicText.life -= dt;
            if (this.cinematicText.life <= 0) this.cinematicText = null;
        }
        if (this.screenShake > 0) {
            this.screenShake *= Math.pow(0.12, dt);
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // HP flash detection (dueling only)
        if (this.battle.phase === 'dueling' && this.battle.currentDuel) {
            const dl = this.battle.currentDuel;
            if (this._prevHp.left >= 0 && dl.left.hp < this._prevHp.left)  this._hpFlash.left  = 1;
            if (this._prevHp.right >= 0 && dl.right.hp < this._prevHp.right) this._hpFlash.right = 1;
            this._prevHp.left  = dl.left.hp;
            this._prevHp.right = dl.right.hp;
        }
        this._hpFlash.left  = Math.max(0, this._hpFlash.left  - dt * 5);
        this._hpFlash.right = Math.max(0, this._hpFlash.right - dt * 5);

        // Pick phase - player selects general then formation
        if (this.battle.phase === 'pick') {
            this._handlePickInput();
            return;
        }

        // Duel intro - 2 second animation
        if (this.battle.phase === 'duel_intro') {
            this.duelIntroTimer += dt;
            if (this.duelIntroTimer >= 2) {
                this.duelIntroTimer = 0;
                this.battle.phase = 'dueling';
                this.input.clearClicks();
                // Spawn soldiers for this duel
                const duel = this.battle.currentDuel;
                this._spawnDuelSoldiers(duel.left, duel.right);
                // 开场大字演出
                this.cinematicText = { text: '决斗开始！', sub: null, life: 1.4, maxLife: 1.4, color: '#ffe080' };
                this.duelAuraLeft = 1;
                this.duelAuraRight = 1;
            }
            return;
        }

        // Historical duel intro - click to proceed, shows historical description
        if (this.battle.phase === 'historical_duel_intro') {
            this.historicalDuelIntroTimer += dt;
            const click = this.input.getClick();
            if (click && this.historicalDuelIntroTimer >= 1.0) {
                this.historicalDuelIntroTimer = 0;
                this.battle.phase = 'dueling';
                // Historical duels have NO soldiers - pure 1v1
                this.battle.soldiers.left = [];
                this.battle.soldiers.right = [];
                // 名将单挑开场演出
                const hd = this.currentHistoricalDuel;
                this.cinematicText = { text: hd ? hd.title : '名将单挑！', sub: '历史名战', life: 1.6, maxLife: 1.6, color: '#ff8844' };
                this.duelAuraLeft = 1;
                this.duelAuraRight = 1;
            }
            return;
        }

        // Active dueling
        if (this.battle.phase === 'dueling') {
            // AI auto-order logic: after a random delay, AI issues its order
            const duel = this.battle.currentDuel;
            if (duel) {
                const playerIsLeft = this.playerSide === 'attacker';
                const aiIsLeft = !playerIsLeft;
                const aiGenKey = aiIsLeft ? 'generalOrderLeft' : 'generalOrderRight';
                const aiSolKey = aiIsLeft ? 'soldierOrderLeft' : 'soldierOrderRight';
                if (!duel[aiGenKey] && !duel[aiSolKey]) {
                    if (this._aiOrderTimer === undefined || this._aiOrderTimer === null) {
                        this._aiOrderTimer = 1.5 + Math.random() * 2.5;
                    }
                    // Use raw dt (before speedMultiplier) for AI think time
                    const rawDt = dt / this.speedMultiplier;
                    this._aiOrderTimer -= rawDt;
                    if (this._aiOrderTimer <= 0) {
                        this._aiOrderTimer = null;
                        // AI randomly issues general or soldier order (or both)
                        const roll = Math.random();
                        if (roll < 0.33) { duel[aiGenKey] = true; }
                        else if (roll < 0.66) { duel[aiSolKey] = true; }
                        else { duel[aiGenKey] = true; duel[aiSolKey] = true; }
                    }
                }
            }

            // Apply slow-mo effect to dt for world simulation
            const slowScale = this.slowMoTimer > 0 ? this.slowMoTarget : 1;
            const simDt = dt * slowScale;
            this.combat.updateSequentialDuel(this.battle, simDt);
            this._updateSoldiers(simDt);
            this._updateSkillAnimations(dt);  // skill anim uses real dt to stay visually smooth

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += (p.gravity !== undefined ? p.gravity : 120) * dt;
                p.life -= dt;
                if (p.life <= 0) this.particles.splice(i, 1);
            }

            // Update hit flashes
            for (let i = this.hitFlashes.length - 1; i >= 0; i--) {
                this.hitFlashes[i].life -= dt;
                if (this.hitFlashes[i].life <= 0) this.hitFlashes.splice(i, 1);
            }

            // Update slash trails
            for (let i = this.slashTrails.length - 1; i >= 0; i--) {
                this.slashTrails[i].life -= dt;
                if (this.slashTrails[i].life <= 0) this.slashTrails.splice(i, 1);
            }

            // Update screen flash
            if (this.screenFlash > 0) {
                this.screenFlash -= dt * 4;
                if (this.screenFlash < 0) this.screenFlash = 0;
            }

            // Update skill big text
            if (this.skillBigText) {
                this.skillBigText.life -= dt;
                if (this.skillBigText.life <= 0) this.skillBigText = null;
            }

            // Update slow-mo
            if (this.slowMoTimer > 0) {
                this.slowMoTimer -= dt;
                if (this.slowMoTimer <= 0) {
                    this.slowMoTimer = 0;
                    this.slowMoTarget = 1;
                }
            }

            // Update duel aura (pulse with HP ratio)
            if (this.battle.currentDuel) {
                const dl = this.battle.currentDuel;
                const targetL = 0.3 + (dl.left.hp / dl.left.maxHp) * 0.7;
                const targetR = 0.3 + (dl.right.hp / dl.right.maxHp) * 0.7;
                this.duelAuraLeft += (targetL - this.duelAuraLeft) * dt * 2;
                this.duelAuraRight += (targetR - this.duelAuraRight) * dt * 2;
            }

            // Spawn particles on damage numbers
            for (const d of this.battle.damageNumbers) {
                if (d.timer === 0 && typeof d.value === 'number') {
                    if (d.value > 20) {
                        this._spawnImpactParticles(d.x, d.y, d.color);
                    }
                    // 受击白光
                    if (d.hitX !== undefined) {
                        this.hitFlashes.push({ x: d.hitX, y: d.hitY, life: 0.18, maxLife: 0.18 });
                    }
                    // 近战刀光残影
                    if (d.isMeleeHit && d.fromX !== undefined) {
                        const dx = d.hitX - d.fromX, dy = d.hitY - d.fromY;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const nx = -dy / dist * 18, ny = dx / dist * 18;
                        this.slashTrails.push({
                            x0: d.hitX - dx / dist * 12 + nx,
                            y0: d.hitY - dy / dist * 12 + ny,
                            x1: d.hitX + nx * 1.8,
                            y1: d.hitY + ny * 1.8,
                            life: 0.22, maxLife: 0.22,
                            color: '#ffffff'
                        });
                        this.slashTrails.push({
                            x0: d.hitX - dx / dist * 8 - nx * 0.5,
                            y0: d.hitY - dy / dist * 8 - ny * 0.5,
                            x1: d.hitX - nx * 1.4,
                            y1: d.hitY - ny * 1.4,
                            life: 0.18, maxLife: 0.18,
                            color: '#ffcc88'
                        });
                    }
                }
            }

            // Camera follows action
            if (this.battle.currentDuel) {
                const midX = (this.battle.currentDuel.left.x + this.battle.currentDuel.right.x) / 2;
                this.cameraX += (midX - this.cameraX) * 3 * dt;
            }

            this._handleDuelInput(dt);
            return;
        }

        // Duel result - 2.5 second display
        if (this.battle.phase === 'duel_result') {
            // Tag the latest result with historical duel info
            if (this.duelResultTimer === 0 && this.battle.duelResults.length > 0) {
                const lastResult = this.battle.duelResults[this.battle.duelResults.length - 1];
                if (this.isHistoricalDuel) {
                    lastResult.isHistorical = true;
                    lastResult.historicalTitle = this.currentHistoricalDuel?.title || '';
                }
                // 屏幕震动
                this.screenShake = Math.max(this.screenShake, 5);
            }
            this.duelResultTimer += dt;
            if (this.duelResultTimer >= 2.5) {
                this.duelResultTimer = 0;
                this.input.clearClicks(); // prevent stale clicks from skipping result/pick screen
                // Check if battle is over
                if (!this.combat.checkBattleEnd(this.battle)) {
                    // Back to pick phase
                    this.battle.phase = 'pick';
                    this.pickPhase = 'general';
                    this._playerPickedUnit = null;
                    this._prepareAIPick();
                }
            }
            return;
        }

        // Result phase
        if (this.battle.phase === 'result') {
            if (!this.showResult) {
                this.resultData = this.combat.settleBattle(this.battle);
                this.showResult = true;
                const playerWins = (this.playerSide === 'attacker' && this.battle.result === 'attacker_wins') ||
                    (this.playerSide === 'defender' && this.battle.result === 'defender_wins');
                this.game.audio.playSFX(playerWins ? 'victory' : 'defeat');
            }
            const click = this.input.getClick();
            if (click) {
                this.game.audio.stopBGM();
                const playerFaction = this.gs.getPlayerFaction();
                if (!playerFaction || !playerFaction.alive) {
                    this.game.switchScene('menu');
                } else {
                    // For interception battles, have the winner continue marching
                    this._handleInterceptionAfterBattle();
                    // Breakthrough battle victory: continue retreating to final destination
                    if (this._isRetreatBreakthrough && this._retreatFinalDestination) {
                        const playerWins = (this.playerSide === 'attacker' && this.battle.result === 'attacker_wins') ||
                            (this.playerSide === 'defender' && this.battle.result === 'defender_wins');
                        if (playerWins) {
                            const capturedCity = this.battle.defender.city;
                            const srcId = capturedCity ? capturedCity.id : null;
                            const genIds = [];
                            for (const unit of this.battle.attacker.generals) {
                                if (unit.state !== 'dead') genIds.push(unit.general.id);
                            }
                            if (srcId && genIds.length > 0) {
                                this.gs.createMarch('transfer', this.gs.playerFaction, genIds, srcId, this._retreatFinalDestination, this.gs.turn + 1);
                                // Remove generals from the breakthrough city so they travel
                                for (const id of genIds) {
                                    const gen = this.gs.getGeneral(id);
                                    if (!gen) continue;
                                    const city = this.gs.getCity(gen.city);
                                    if (city) city.generals = city.generals.filter(gid => gid !== gen.id);
                                    gen.city = null;
                                    gen.status = 'marching';
                                }
                            }
                        }
                    }
                    this.game.switchScene('worldmap');
                }
            }
            return;
        }
    }

    _handleInterceptionAfterBattle() { return this._logic._handleInterceptionAfterBattle(); }

    // Returns { canRetreat, label } for the current player side
    _getRetreatInfo() { return this._logic._getRetreatInfo(); }

    _doRetreat() { return this._logic._doRetreat(); }

    _handlePickInput() {
        if (this.pickPhase === 'formation') {
            this._handleFormationInput();
            return;
        }

        // pickPhase === 'general'
        const r = this.renderer;

        // Track hover
        this.hoveredPickUnit = null;
        const myGenerals = this.playerSide === 'attacker'
            ? this.battle.attacker.generals
            : this.battle.defender.generals;
        const alive = myGenerals.filter(u => u.state !== 'dead');

        // Safety: if no alive generals, end battle immediately
        if (alive.length === 0) {
            this.combat.checkBattleEnd(this.battle);
            return;
        }

        const cardGap = 134;
        const cardW = 120;
        const cardH = 192;
        const ROW_MAX = 8;
        const useDouble = alive.length > ROW_MAX;
        const row1Count = useDouble ? Math.ceil(alive.length / 2) : alive.length;
        const row2Count = useDouble ? alive.length - row1Count : 0;
        const rowSpacing = 10;
        const totalH = useDouble ? cardH * 2 + rowSpacing : cardH;
        const baseY = r.height - totalH - 55;

        const _cardPos = (i) => {
            if (!useDouble) {
                return { x: r.width / 2 - (alive.length * cardGap) / 2 + i * cardGap, y: baseY };
            }
            if (i < row1Count) {
                return { x: r.width / 2 - (row1Count * cardGap) / 2 + i * cardGap, y: baseY };
            }
            const j = i - row1Count;
            return { x: r.width / 2 - (row2Count * cardGap) / 2 + j * cardGap, y: baseY + cardH + rowSpacing };
        };

        for (let i = 0; i < alive.length; i++) {
            const { x: cx, y: cy } = _cardPos(i);
            if (this.input.mouse.x >= cx && this.input.mouse.x <= cx + cardW &&
                this.input.mouse.y >= cy && this.input.mouse.y <= cy + cardH) {
                this.hoveredPickUnit = alive[i];
            }
        }

        const click = this.input.getClick();
        if (!click) return;

        // Check retreat button
        const retreatInfo = this._getRetreatInfo();
        if (retreatInfo.canRetreat) {
            const rBtnW = 180;
            const rBtnH = 40;
            const rBtnX = 20;
            const rBtnY = r.height - 50;
            if (click.x >= rBtnX && click.x <= rBtnX + rBtnW && click.y >= rBtnY && click.y <= rBtnY + rBtnH) {
                this._doRetreat();
                return;
            }
        }

        // Check confirm button (only when a general is selected)
        if (this._playerPickedUnit) {
            const btnW = 180;
            const btnH = 40;
            const btnX = r.width / 2 - btnW / 2;
            const btnY = r.height - 50;
            if (click.x >= btnX && click.x <= btnX + btnW && click.y >= btnY && click.y <= btnY + btnH) {
                this.pickPhase = 'formation';
                this.selectedFormation = 'crane_wing';
                return;
            }
        }

        // Check if clicked on a general card (select/highlight only)
        for (let i = 0; i < alive.length; i++) {
            const { x: cx, y: cy } = _cardPos(i);
            if (click.x >= cx && click.x <= cx + cardW &&
                click.y >= cy && click.y <= cy + cardH) {
                this._playerPickedUnit = alive[i];
                this.selectedUnit = alive[i];
                return;
            }
        }
    }

    _handleFormationInput() {
        const click = this.input.getClick();
        if (!click) return;

        const r = this.renderer;
        const panelX = 20;
        const panelY = 70;

        // Check formation buttons
        for (let i = 0; i < FORMATIONS.length; i++) {
            const btnY = panelY + i * 58;
            if (click.x >= panelX && click.x <= panelX + 210 && click.y >= btnY && click.y <= btnY + 52) {
                this.selectedFormation = FORMATIONS[i].id;
                return;
            }
        }

        // Check "Start" button
        const startBtnX = r.width / 2 - 80;
        const startBtnY = r.height - 60;
        if (click.x >= startBtnX && click.x <= startBtnX + 160 && click.y >= startBtnY && click.y <= startBtnY + 44) {
            this._startDuelWithFormation();
        }
    }

    _startDuelWithFormation() {
        const playerFormation = this.selectedFormation;
        const aiFormation = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)].id;

        const playerUnit = this._playerPickedUnit;
        const aiUnit = this._aiPickedUnit;

        let leftUnit, rightUnit, leftFormation, rightFormation;
        if (this.playerSide === 'attacker') {
            leftUnit = playerUnit;
            rightUnit = aiUnit;
            leftFormation = playerFormation;
            rightFormation = aiFormation;
        } else {
            leftUnit = aiUnit;
            rightUnit = playerUnit;
            leftFormation = aiFormation;
            rightFormation = playerFormation;
        }

        this.duelNumber++;
        this.duelIntroTimer = 0;
        this.duelResultTimer = 0;
        this._aiOrderTimer = null; // reset AI order timer for new duel
        this.cameraX = 600; // snap camera to field center to avoid black-screen pan

        // Check for historical duel
        const historicalDuel = this.combat.findHistoricalDuel(leftUnit.general.id, rightUnit.general.id);
        this.currentHistoricalDuel = historicalDuel;
        this.isHistoricalDuel = !!historicalDuel;
        this.historicalDuelIntroTimer = 0;

        // Clear old visuals
        this.battle.effects = [];
        this.battle.damageNumbers = [];
        this.battle.projectiles = [];
        this.particles = [];
        this.skillBigText = null;

        this.combat.startSequentialDuel(this.battle, leftUnit, rightUnit, leftFormation, rightFormation, this.playerSide);

        // Override phase for historical duel
        if (this.isHistoricalDuel) {
            this.battle.phase = 'historical_duel_intro';
        }

        // Reposition generals according to formation
        const leftPos = this._getFormationPositions(leftFormation, [leftUnit], 'left');
        if (leftPos[0]) {
            leftUnit.x = leftPos[0].x;
            leftUnit.y = leftPos[0].y;
        }
        const rightPos = this._getFormationPositions(rightFormation, [rightUnit], 'right');
        if (rightPos[0]) {
            rightUnit.x = rightPos[0].x;
            rightUnit.y = rightPos[0].y;
        }

        // Store formation positions for soldier spawning
        this._duelLeftPos = leftPos[0];
        this._duelRightPos = rightPos[0];
    }

    _handleDuelInput(dt) {
        const input = this.input;

        // Camera pan
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) this.cameraX -= 200 * dt;
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) this.cameraX += 200 * dt;
        this.cameraX = Math.max(0, Math.min(this.battle.fieldWidth, this.cameraX));

        const click = this.input.getClick();
        if (!click) return;

        const r = this.renderer;
        const hudH = 110;
        const hudY = r.height - hudH;

        // Check skill buttons (match _drawDuelHUD layout)
        if (this.selectedUnit && click.y >= hudY) {
            const pSize = 64;
            const pX = 10;
            const infoX = pX + pSize + 12;
            const divX = infoX + 140;
            const skillH = 64;
            const skillGap = 8;
            const skillStartX = divX + 14;
            const skillY = hudY + (hudH - skillH) / 2;
            const skills = this.selectedUnit.skills;

            let skillCurX = skillStartX;
            for (let i = 0; i < skills.length; i++) {
                const skillW = skills[i].name.length >= 4 ? 80 : 64;
                const bx = skillCurX;
                const by = skillY;
                skillCurX += skillW + skillGap;
                if (click.x >= bx && click.x <= bx + skillW && click.y >= by && click.y <= by + skillH) {
                    if (skills[i].currentCd <= 0 && this.selectedUnit.mp >= skills[i].mpCost) {
                        const duel = this.battle.currentDuel;
                        if (duel) {
                            const target = this.selectedUnit === duel.left ? duel.right : duel.left;
                            if (target && target.state !== 'dead') {
                                this.combat._useSkill(this.battle, this.selectedUnit, skills[i], target);
                                this.game.audio.playSFX('skill');
                            }
                        }
                    }
                    return;
                }
            }
        }

        // Speed button
        const rbx = r.width - 90;
        const rby = hudY + (hudH - 34) / 2;
        if (click.x >= rbx && click.x <= rbx + 80 && click.y >= rby && click.y <= rby + 34) {
            this.speedMultiplier = this.speedMultiplier >= 3 ? 1 : this.speedMultiplier + 1;
            return;
        }

        // Standby order buttons
        const duelForOrder = this.battle.currentDuel;
        if (duelForOrder && this.battle.phase === 'dueling') {
            const playerIsLeft = this.playerSide === 'attacker';
            const bw = 120, bh = 36, gap = 14;
            const totalW = bw * 2 + gap;
            const bx1 = r.width / 2 - totalW / 2;
            const bx2 = bx1 + bw + gap;
            const by = hudY - bh - 8;

            // 武将出击
            if (Renderer.pointInRect(click.x, click.y, bx1, by, bw, bh)) {
                if (playerIsLeft) duelForOrder.generalOrderLeft = true;
                else duelForOrder.generalOrderRight = true;
                this.game.audio.playSFX('click');
                return;
            }
            // 全军出击
            if (Renderer.pointInRect(click.x, click.y, bx2, by, bw, bh)) {
                if (playerIsLeft) duelForOrder.soldierOrderLeft = true;
                else duelForOrder.soldierOrderRight = true;
                this.game.audio.playSFX('click');
                return;
            }
        }
    }

    _updateSoldiers(dt) { return this._logic._updateSoldiers(dt); }

    render() {
        const r = this.renderer;
        const ctx = r.ctx;

        // Pick phase
        if (this.battle.phase === 'pick') {
            if (this.pickPhase === 'general') {
                this._renderPickPhase(r, ctx);
            } else {
                this._renderFormationSelect(r, ctx);
            }
            return;
        }

        // Duel intro
        if (this.battle.phase === 'duel_intro') {
            this._renderBattlefield(r, ctx);
            this._renderDuelIntro(r, ctx);
            return;
        }

        // Historical duel intro - special page with historical description
        if (this.battle.phase === 'historical_duel_intro') {
            this._renderHistoricalDuelIntro(r, ctx);
            return;
        }

        // Active dueling
        if (this.battle.phase === 'dueling') {
            this._renderBattlefield(r, ctx);
            this._drawDuelHUD(r, ctx);
            this._drawOrderButtons(r);
            return;
        }

        // Duel result
        if (this.battle.phase === 'duel_result') {
            this._renderBattlefield(r, ctx);
            this._renderDuelResultOverlay(r, ctx);
            return;
        }

        // Final result
        if (this.battle.phase === 'result') {
            this._renderBattlefield(r, ctx);
            this._drawResultOverlay(r, ctx);
            return;
        }
    }

    // ── PICK PHASE: Select general to send out ──
    _renderPickPhase(r, ctx) { return this._renderer_bt._renderPickPhase(r, ctx); }

    // ── FORMATION SELECT (reused, but for single duel) ──
    _renderFormationSelect(r, ctx) { return this._renderer_bt._renderFormationSelect(r, ctx); }

    // ── DUEL INTRO: Dramatic entrance ──
    _renderDuelIntro(r, ctx) { return this._renderer_bt._renderDuelIntro(r, ctx); }

    // ── HISTORICAL DUEL INTRO: Special page with historical description ──
    _renderHistoricalDuelIntro(r, ctx) { return this._renderer_bt._renderHistoricalDuelIntro(r, ctx); }

    // ── BATTLEFIELD RENDER (extracted from old render) ──
    _renderBattlefield(r, ctx) { return this._renderer_bt._renderBattlefield(r, ctx); }

    // 渐变色 HP 条 + 受击白闪
    _drawGradientHPBar(ctx, x, y, w, h, ratio, flashAlpha = 0, rounded = false) { return this._renderer_bt._drawGradientHPBar(ctx, x, y, w, h, ratio, flashAlpha, rounded); }

    // ── DUEL HUD: Top HP bars, timer, skills, score ──
    _drawDuelHUD(r, ctx) { return this._renderer_bt._drawDuelHUD(r, ctx); }

    // ── ORDER BUTTONS: 武将出击 / 全军出击 ──
    _drawOrderButtons(r) { return this._renderer_bt._drawOrderButtons(r); }

    // ── DUEL RESULT OVERLAY ──
    _renderDuelResultOverlay(r, ctx) { return this._renderer_bt._renderDuelResultOverlay(r, ctx); }

    // ── FINAL RESULT OVERLAY ──
    _drawResultOverlay(r, ctx) { return this._renderer_bt._drawResultOverlay(r, ctx); }

    // ── DRAW GENERALS (only current duel pair) ──
    _drawGeneralUnits(r, ctx) { return this._renderer_bt._drawGeneralUnits(r, ctx); }

    // ── Horse for cavalry generals ──
    _drawGeneralHorse(ctx, s, frame, color, dk, lt) { return this._renderer_bt._drawGeneralHorse(ctx, s, frame, color, dk, lt); }

    // ── Mounted warrior on horse ──
    _drawMountedWarrior(ctx, s, osc, color, dk, dk2, lt, lt2, gen, isFighting, frame) { return this._renderer_bt._drawMountedWarrior(ctx, s, osc, color, dk, dk2, lt, lt2, gen, isFighting, frame); }

    // ── Strategist general ──
    _drawStrategistGeneral(ctx, s, osc, color, dk, lt, lt2, gen, isFighting, frame) { return this._renderer_bt._drawStrategistGeneral(ctx, s, osc, color, dk, lt, lt2, gen, isFighting, frame); }

    // ── Warrior general ──
    _drawWarriorGeneral(ctx, s, osc, color, dk, dk2, lt, lt2, gen, unitType, isFighting, frame) { return this._renderer_bt._drawWarriorGeneral(ctx, s, osc, color, dk, dk2, lt, lt2, gen, unitType, isFighting, frame); }

    // ── General head (shared) ──
    _drawGeneralHead(ctx, s, osc, gen, dk, lt) { return this._renderer_bt._drawGeneralHead(ctx, s, osc, gen, dk, lt); }

    _spawnSkillParticles(x, y, effect, color) {
        const push = (vx, vy, life, col, size, gravity) => {
            this.particles.push({ x, y, vx, vy, life, color: col, size, gravity: gravity !== undefined ? gravity : 120 });
        };
        const rand = () => Math.random();

        if (effect === 'fire' || effect === 'lightning' && false) {
            // 火系：橙红上升火焰粒子，微重力
            for (let i = 0; i < 18; i++) {
                const a = rand() * Math.PI * 2;
                const spd = 60 + rand() * 120;
                push(Math.cos(a) * spd, -rand() * 140 - 40, 0.5 + rand() * 0.4,
                    i % 3 === 0 ? '#ffdd44' : (i % 3 === 1 ? '#ff8800' : '#ff3300'),
                    2 + rand() * 4, -20);
            }
            // 火焰核心大粒子
            for (let i = 0; i < 6; i++) {
                push((rand() - 0.5) * 60, -rand() * 60 - 20, 0.3 + rand() * 0.2,
                    '#ffee88', 5 + rand() * 5, -10);
            }
        } else if (effect === 'lightning') {
            // 雷系：白黄高速四散 + 小闪光点
            for (let i = 0; i < 20; i++) {
                const a = (i / 20) * Math.PI * 2 + rand() * 0.3;
                const spd = 80 + rand() * 200;
                push(Math.cos(a) * spd, Math.sin(a) * spd, 0.2 + rand() * 0.3,
                    i % 2 === 0 ? '#ffffff' : '#ffff88', 1 + rand() * 3, 0);
            }
            // 电弧残留
            for (let i = 0; i < 8; i++) {
                push((rand() - 0.5) * 40, (rand() - 0.5) * 40, 0.4 + rand() * 0.3,
                    '#aaddff', 2 + rand() * 2, 0);
            }
        } else if (effect === 'ice') {
            // 冰系：蓝白结晶碎片，缓慢扩散
            for (let i = 0; i < 16; i++) {
                const a = (i / 16) * Math.PI * 2;
                const spd = 40 + rand() * 80;
                push(Math.cos(a) * spd, Math.sin(a) * spd - 30, 0.6 + rand() * 0.5,
                    i % 2 === 0 ? '#88ddff' : '#ffffff', 2 + rand() * 4, 20);
            }
        } else if (effect === 'damage' || effect === 'aoe_damage' || effect === 'stun') {
            // 物理系：金色冲击波 + 尘土
            for (let i = 0; i < 14; i++) {
                const a = rand() * Math.PI * 2;
                const spd = 70 + rand() * 130;
                push(Math.cos(a) * spd, Math.sin(a) * spd - 40, 0.3 + rand() * 0.35,
                    i % 2 === 0 ? '#ffcc44' : '#ffaa00', 3 + rand() * 4, 80);
            }
            // 尘土粒子
            for (let i = 0; i < 8; i++) {
                push((rand() - 0.5) * 80, -rand() * 50, 0.4 + rand() * 0.3,
                    `rgba(180,150,100,${0.4 + rand() * 0.4})`, 4 + rand() * 6, 60);
            }
        } else {
            // 默认：通用彩色粒子
            for (let i = 0; i < 10; i++) {
                push((rand() - 0.5) * 140, -rand() * 100 - 20, 0.3 + rand() * 0.3,
                    color || '#ffaa44', 2 + rand() * 3, 120);
            }
        }
    }

    _spawnImpactParticles(x, y, color) {
        this._spawnSkillParticles(x, y, 'damage', color);
    }
    _updateSkillAnimations(dt) {
        const anims = this.battle.skillAnimations;
        if (!anims) return;
        for (const anim of anims) {
            anim.timer += dt;
            // 技能命中前短暂慢动作预告
            if (!anim.hitFired && !anim.slowMoTriggered && this.battle.phase === 'dueling'
                && anim.payload && anim.payload.type === 'damage' && anim.payload.dmg >= 100) {
                const timeToHit = anim.hitTime - anim.timer;
                if (timeToHit > 0 && timeToHit < 0.25) {
                    anim.slowMoTriggered = true;
                    this.slowMoTimer = 0.18;
                    this.slowMoTarget = 0.12;
                }
            }
            if (!anim.hitFired && anim.timer >= anim.hitTime) {
                anim.hitFired = true;
                this._applySkillDamage(anim.payload);
                if (anim.payload && anim.payload.type === 'damage') {
                    this._spawnSkillParticles(anim.toX, anim.toY, anim.effect, anim.color);
                    if (anim.animType === 'explosion' || anim.animType === 'beam') {
                        this.screenShake = Math.max(this.screenShake, anim.payload.type === 'instant_kill' ? 14 : 7);
                        if (this.battle.phase === 'dueling') this.screenFlash = Math.max(this.screenFlash, 0.35);
                    }
                    // 单挑中技能大字演出
                    if (this.battle.phase === 'dueling') {
                        this.skillBigText = { text: anim.name, life: 0.7, maxLife: 0.7, color: anim.color };
                        if (anim.payload.dmg >= 150) this.screenFlash = Math.max(this.screenFlash, 0.5);
                    }
                }
            }
        }
        this.battle.skillAnimations = anims.filter(a => a.timer < a.duration);
    }

    _applySkillDamage(payload) {
        if (!payload) return;
        const { type, target } = payload;
        if (type === 'damage') {
            target.hp -= payload.dmg;
            if (target.hp <= 0) { target.hp = 0; target.state = 'dead'; target.soldiers = 0; }
            if (payload.stun && target.state !== 'dead') target.attackTimer = -2;
            this.battle.damageNumbers.push({ x: target.x, y: target.y - 20, value: payload.dmg, color: payload.color, timer: 0 });
        } else if (type === 'heal') {
            target.hp = Math.min(target.maxHp, target.hp + payload.healAmt);
            this.battle.damageNumbers.push({ x: target.x, y: target.y - 20, value: payload.healAmt, color: '#44ff44', timer: 0 });
        } else if (type === 'buff') {
            // Apply buff to unit: duration 8s, stack by refreshing
            if (!target.buffs) target.buffs = {};
            target.buffs[payload.buffType] = { timer: 8, magnitude: payload.magnitude };
            this.battle.damageNumbers.push({ x: target.x, y: target.y - 20, value: payload.skillName, color: '#44aaff', timer: 0 });
        } else if (type === 'instant_kill') {
            target.hp = 0; target.state = 'dead'; target.soldiers = 0;
            this.battle.damageNumbers.push({ x: target.x, y: target.y - 20, value: '灭', color: '#ff0000', timer: 0 });
            this.screenShake = Math.max(this.screenShake, 12);
        }
    }

    // ── SKILL ANIMATIONS RENDER ──
    _drawSkillAnimations(r, ctx) { return this._renderer_bt._drawSkillAnimations(r, ctx); }

    _drawEffect(r, ctx, effect) { return this._renderer_bt._drawEffect(r, ctx, effect); }

    _drawMountains(r, ctx) { return this._renderer_bt._drawMountains(r, ctx); }

    _drawBattleFlags(r, ctx) { return this._renderer_bt._drawBattleFlags(r, ctx); }

    _drawSoldiers(r, ctx, soldiers, facing) { return this._renderer_bt._drawSoldiers(r, ctx, soldiers, facing); }
}
