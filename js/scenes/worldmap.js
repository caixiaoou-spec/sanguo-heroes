// 大地图场景
import EconomySystem from '../systems/economy.js';
import DiplomacySystem from '../systems/diplomacy.js';
import Renderer from '../engine/renderer.js';
import GameState from '../engine/game.js';
import { MAX_GARRISON } from '../utils/constants.js';
import { WorldMapLogic } from './worldmap_logic.js';
import { WorldMapRenderer } from './worldmap_renderer.js';

export default class WorldMapScene {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        this.input = game.input;
        this.gs = game.gameState;

        this.hoveredCity = null;
        this.selectedCity = null;
        this.showCityPanel = false;
        this.showGeneralList = false;
        this.showGeneralDetail = null;
        this.showDiplomacy = false;
        this.showTurnReport = false;
        this.turnReports = [];
        this.showAttackSelect = false;
        this.attackTarget = null;
        this.selectedAttackers = [];
        this.showTransferSelect = false;
        this.transferTarget = null;
        this.selectedTransfers = [];
        this.notification = null;
        this.notificationTimer = 0;
        this.menuOpen = null;
        this._pendingBattleAlert = null; // {attackerIds, defenderCityId, attackerFaction}
        this._pendingBreakAllianceAttack = null; // {city, allyTargets} - confirm break alliance to attack
        this._pendingBreakAllianceName = null;

        // Scroll offsets for long lists
        this._diplomacyScroll = 0;
        this._generalListScroll = 0;
        this._attackScroll = 0;
        this._transferScroll = 0;
        this._cityGenScroll = 0;

        // Map animation
        this.cloudOffset = 0;
        this.flagWave = 0;
        this.riverPhase = 0;

        // March system
        this.hoveredMarch = null;
        this._battleFlashes = [];
        this._marchNotifications = [];

        // Map layout: fits entirely on screen, cities spread across full area
        this._mapArea = { x: 60, y: 78, w: 1160, h: 620 };
        this._dataRange = { xMin: 130, xMax: 690, yMin: 70, yMax: 580 };

        // Camera offset (how far the virtual map is scrolled)
        this._camX = 0;
        this._camY = 0;
        this._wasDragging = false;
        this._dragStartCamX = 0;
        this._dragStartCamY = 0;

        // Play map BGM when entering worldmap
        if (!game.audio.muted) {
            game.audio.playBGM('map');
        }

        // UI button positions
        this.bottomButtons = [
            { text: '武将', action: 'generals', x: 0, w: 70 },
            { text: '外交', action: 'diplomacy', x: 80, w: 70 },
            { text: '存档', action: 'save', x: 160, w: 70 },
            { text: '结束回合', action: 'end_turn', x: 0, w: 100 },
        ];

        // Victory screen state (null when not active)
        this._victoryScreen = null;

        // Real-time turn progress tracker (seconds elapsed since turn started, used for march animation)
        this._turnElapsed = 0;
        this._turnDuration = 3.0; // visual seconds per turn (how long flags animate across the map)
        this._lastVisualTurn = this.gs.turn; // tracks previous frame's visualTurn for event detection

        // Logic layer (pure game logic, no canvas dependencies)
        // Must be created before any delegated method calls below (e.g. _finishEndTurn)
        this._logic = new WorldMapLogic(this.gs, {
            onTurnReport:    (text, type)         => this._turnReports && this._turnReports.push({ text, type }),
            onMarchNote:     (text, timer)         => this._marchNotifications.push({ text, timer }),
            onBattleFlash:   (cityId, timer, text) => this._battleFlashes.push({ cityId, timer, text }),
            startNextBattle: ()                    => this._startNextQueuedBattle(),
        });

        // Rendering layer (all _draw* methods)
        this._renderer_wm = new WorldMapRenderer(this);

        // Check if returning from a defensive battle mid-turn
        this._battleReturnTimer = 0;
        if (this.gs._pendingFinishTurn) {
            this._turnReports = this.gs._pendingTurnReports || [];
            if (this.gs.battleQueue.length > 0) {
                this._battleReturnTimer = 1.0; // Brief delay before next battle
            } else {
                // All battles done, finish the turn
                this._finishEndTurn();
            }
        }
    }

    update(dt) {
        // Victory screen takes over all input when active
        if (this._victoryScreen) {
            this._victoryScreen.elapsed += dt;
            const vs = this._victoryScreen;
            // After phase 1 intro, accept any click/key to skip to menu
            if (vs.elapsed > 3.0) {
                const click = this.input.getClick();
                if (click) {
                    this.game.audio.stopBGM();
                    this.game.gameState = new GameState();
                    this.game.switchScene('menu');
                    return;
                }
            }
            // Spawn celebration particles
            vs.particles = vs.particles || [];
            if (vs.elapsed < 15) {
                for (let i = 0; i < 3; i++) {
                    const side = Math.random() < 0.5 ? -1 : 1;
                    vs.particles.push({
                        x: Math.random() * this.renderer.width,
                        y: this.renderer.height + 10,
                        vx: side * (30 + Math.random() * 60),
                        vy: -(180 + Math.random() * 220),
                        life: 3.0 + Math.random() * 2,
                        maxLife: 5.0,
                        color: ['#ffd700','#ff6644','#ff4488','#44aaff','#88ff44'][Math.floor(Math.random()*5)],
                        size: 4 + Math.random() * 5,
                    });
                }
            }
            for (let i = vs.particles.length - 1; i >= 0; i--) {
                const p = vs.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 120 * dt; // gravity
                p.life -= dt;
                if (p.life <= 0) vs.particles.splice(i, 1);
            }
            return;
        }

        this.cloudOffset += dt * 5;
        this.flagWave += dt * 4;
        this.riverPhase += dt * 1.5;

        // Advance real-time turn clock (drives march animation)
        this._turnElapsed = Math.min(this._turnElapsed + dt, this._turnDuration);

        // Animate march icons: interpolate position based on real-time elapsed within this turn
        const visualTurnNow = this.gs.turn + (this._turnElapsed / this._turnDuration);
        for (const march of this.gs.marches) {
            if (!march.travelTime || march.departTurn === undefined) {
                // Legacy fallback
                if (march.animProgress === undefined) march.animProgress = 0;
                const speed = 1 / Math.max(1, march.turnsTotal) * 0.15;
                const targetProgress = (march.turnsTotal - march.turnsRemaining) / march.turnsTotal;
                const nextTarget = Math.min(1, targetProgress + 1 / march.turnsTotal);
                if (march.animProgress < nextTarget) {
                    march.animProgress = Math.min(nextTarget, march.animProgress + speed * dt);
                }
                continue;
            }
            // Plan B: compute exact logical progress at current real-time moment
            march.animProgress = Math.min(1, Math.max(0,
                (visualTurnNow - march.departTurn) / march.travelTime
            ));
        }

        // Real-time event detection: check if any meet/arrive events crossed into [prev, now]
        if (!this._pendingBattleAlert && !this._battleReturnTimer && this.gs.battleQueue.length === 0) {
            const triggered = this._checkRealtimeEvents(this._lastVisualTurn, visualTurnNow);
            if (triggered) { this._lastVisualTurn = visualTurnNow; return; }
        }
        this._lastVisualTurn = visualTurnNow;

        // Update battle flashes
        for (let i = this._battleFlashes.length - 1; i >= 0; i--) {
            this._battleFlashes[i].timer -= dt;
            if (this._battleFlashes[i].timer <= 0) this._battleFlashes.splice(i, 1);
        }

        // Update march notifications
        for (let i = this._marchNotifications.length - 1; i >= 0; i--) {
            this._marchNotifications[i].timer -= dt;
            if (this._marchNotifications[i].timer <= 0) this._marchNotifications.splice(i, 1);
        }

        // Handle queued defensive battles
        if (this._battleReturnTimer > 0) {
            this._battleReturnTimer -= dt;
            if (this._battleReturnTimer <= 0) {
                this._startNextQueuedBattle();
                return;
            }
        }

        if (this.notificationTimer > 0) {
            this.notificationTimer -= dt;
            if (this.notificationTimer <= 0) this.notification = null;
        }

        // Handle input based on what panels are open
        if (this._pendingBattleAlert) {
            this._handleBattleAlert();
            return;
        }
        if (this._pendingBreakAllianceAttack) {
            this._handleBreakAllianceAttack();
            return;
        }
        if (this.showAttackSelect) {
            this._handleAttackSelect();
            return;
        }
        if (this.showTransferSelect) {
            this._handleTransferSelect();
            return;
        }
        if (this.showGeneralDetail) {
            this._handleGeneralDetail();
            return;
        }
        if (this.showGeneralList) {
            this._handleGeneralList();
            return;
        }
        if (this.showDiplomacy) {
            this._handleDiplomacy();
            return;
        }
        if (this.showTurnReport) {
            this._handleTurnReport();
            return;
        }

        this._handleMapInput(dt);
    }

    _handleMapInput(dt) {
        const r = this.renderer;
        const input = this.input;

        // Camera pan limits: virtual map size minus usable viewport
        const viewH = r.height - 92;  // between top bar (42px) and bottom bar (50px)
        const maxCamX = Math.max(0, this._mapArea.x + this._mapArea.w - r.width);
        const maxCamY = Math.max(0, this._mapArea.y + this._mapArea.h - viewH);

        // Scroll to pan map (vertical), or scroll city panel generals if open
        const scroll = input.consumeScroll();
        if (scroll) {
            if (this.showCityPanel && this.selectedCity) {
                const generals = this.gs.getGeneralsInCity(this.selectedCity.id);
                const maxVisible = 4;
                const maxScroll = Math.max(0, generals.length - maxVisible);
                this._cityGenScroll = Math.max(0, Math.min(maxScroll, this._cityGenScroll + (scroll > 0 ? 1 : -1)));
            } else {
                this._camY = Math.max(0, Math.min(maxCamY, this._camY + scroll * 0.4));
            }
        }

        // Drag to pan map (only when not hovering a city/clicking)
        const drag = input.getDrag();
        if (drag && !this._wasDragging) {
            this._dragStartCamX = this._camX;
            this._dragStartCamY = this._camY;
        }
        this._wasDragging = !!drag;
        if (drag) {
            this._camX = Math.max(0, Math.min(maxCamX, this._dragStartCamX - drag.dx));
            this._camY = Math.max(0, Math.min(maxCamY, this._dragStartCamY - drag.dy));
        }

        // Mouse coords in virtual map space (add camera offset)
        const vmx = input.mouse.x + this._camX;
        const vmy = input.mouse.y + this._camY;

        // Mouse hover - compare virtual mouse coords to virtual city positions
        this.hoveredCity = null;
        this.hoveredMarch = null;
        for (const city of this.gs.cities) {
            const sp = this._cityScreenPos(city);
            const dist = Math.sqrt((vmx - sp.x) ** 2 + (vmy - sp.y) ** 2);
            if (dist < 22) {
                this.hoveredCity = city;
                break;
            }
        }

        // Check march hover
        if (!this.hoveredCity) {
            for (const march of this.gs.marches) {
                const pos = this._marchScreenPos(march);
                if (!pos) continue;
                const dist = Math.sqrt((vmx - pos.x) ** 2 + (vmy - pos.y) ** 2);
                if (dist < 18) {
                    this.hoveredMarch = march;
                    break;
                }
            }
        }

        // Click handling — skip if this frame was a drag
        if (input.isDragging) return;
        const click = input.getClick();
        if (click) {
            // Check bottom HUD buttons
            if (click.y > r.height - 50) {
                this._handleBottomClick(click);
                return;
            }

            // Check city panel buttons
            if (this.showCityPanel && this.selectedCity) {
                if (this._handleCityPanelClick(click)) return;
            }

            // Click on city
            if (this.hoveredCity) {
                this.game.audio.playSFX('click');
                this.selectedCity = this.hoveredCity;
                this.showCityPanel = true;
                this._cityGenScroll = 0;
            } else {
                this.showCityPanel = false;
                this.selectedCity = null;
            }
        }

        // Right click to deselect
        const rclick = input.getRightClick();
        if (rclick) {
            this.showCityPanel = false;
            this.selectedCity = null;
        }
    }

    _handleBottomClick(click) {
        const r = this.renderer;
        // Left side buttons
        const btns = [
            { text: '武将', action: 'generals', x: 15, w: 80 },
            { text: '外交', action: 'diplomacy', x: 105, w: 80 },
            { text: '存档', action: 'save', x: 195, w: 80 },
        ];
        for (const btn of btns) {
            if (click.x >= btn.x && click.x <= btn.x + btn.w && click.y >= r.height - 44) {
                this.game.audio.playSFX('click');
                switch (btn.action) {
                    case 'generals': this.showGeneralList = true; break;
                    case 'diplomacy': this.showDiplomacy = true; break;
                    case 'save':
                        if (this.game.saveManager.save(this.gs)) {
                            this._notify('存档成功！');
                        }
                        break;
                }
                return;
            }
        }

        // End turn button (right side)
        if (click.x >= r.width - 130 && click.x <= r.width - 14) {
            this.game.audio.playSFX('click');
            this._endTurn();
        }
    }

    _handleCityPanelClick(click) {
        const r = this.renderer;
        const panelX = r.width - 280;
        const panelY = 50;

        if (click.x < panelX) return false;

        const city = this.selectedCity;
        const isOwned = city.owner === this.gs.playerFaction;

        if (isOwned) {
            // Action buttons — must match _drawCityPanel layout exactly
            const actSectionY = panelY + 160;
            const actionsY = actSectionY + 28;
            const btnW = 118;
            const btnH = 24;
            const btnGap = 30;

            const actions = [
                { text: '开发农业', action: 'dev_agr', x: panelX + 10, y: actionsY },
                { text: '开发商业', action: 'dev_com', x: panelX + 138, y: actionsY },
                { text: '征兵', action: 'recruit', x: panelX + 10, y: actionsY + btnGap },
                { text: '修筑城防', action: 'fortify', x: panelX + 138, y: actionsY + btnGap },
                { text: '搜索武将', action: 'search', x: panelX + 10, y: actionsY + btnGap * 2 },
                { text: '调遣', action: 'transfer', x: panelX + 138, y: actionsY + btnGap * 2 },
                { text: '出征', action: 'attack', x: panelX + 10, y: actionsY + btnGap * 3 },
            ];

            for (const act of actions) {
                if (click.x >= act.x && click.x <= act.x + btnW &&
                    click.y >= act.y && click.y <= act.y + btnH) {
                    this.game.audio.playSFX('click');
                    this._executeCityAction(act.action, city);
                    return true;
                }
            }

            // Click on general in the list — must match _drawCityPanel generals layout
            const genSectionY = actionsY + btnGap * 3 + btnH + 12;
            const genListY = genSectionY + 26;
            const generals = this.gs.getGeneralsInCity(city.id);
            const maxVisible = Math.min(generals.length, 4);
            const startIdx = this._cityGenScroll;
            for (let i = 0; i < maxVisible && startIdx + i < generals.length; i++) {
                const gy = genListY + i * 40;
                if (click.y >= gy && click.y <= gy + 38 && click.x >= panelX + 10) {
                    this.showGeneralDetail = generals[startIdx + i];
                    return true;
                }
            }

            // Captive recruit/execute buttons — must match _drawCityPanel captive layout
            const captives = this.gs.getCapturedInCity(city.id);
            if (captives.length > 0) {
                const pw = 270;
                // Recompute capSectionY same way as renderer
                const visibleGens = Math.min(generals.length, 4);
                const genListY = genSectionY + 26;
                const genListEnd = genListY + Math.max(visibleGens, 1) * 40 + (generals.length === 0 ? 20 : 0) + 12;
                const capSectionY = genListEnd;
                for (let i = 0; i < captives.length; i++) {
                    const cap = captives[i];
                    const gy = capSectionY + 26 + i * 36;
                    const btnY = gy + 4;
                    const btnH2 = 22;
                    const recX = panelX + pw - 120;
                    const exeX = panelX + pw - 60;
                    if (click.y >= btnY && click.y <= btnY + btnH2) {
                        if (click.x >= recX && click.x <= recX + 52) {
                            if (this.gs.actionPoints <= 0) { this._notify('行动点已用完，请结束回合'); return true; }
                            const result = EconomySystem.recruitCaptive(this.gs, city.id, cap.id);
                            this._notify(result.msg);
                            if (result.success) { this.gs.actionPoints--; this.game.audio.playSFX('recruit'); }
                            return true;
                        }
                        if (click.x >= exeX && click.x <= exeX + 52) {
                            if (this.gs.actionPoints <= 0) { this._notify('行动点已用完，请结束回合'); return true; }
                            const result = EconomySystem.executeCaptive(this.gs, city.id, cap.id);
                            this._notify(result.msg);
                            if (result.success) this.gs.actionPoints--;
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    _executeCityAction(action, city) {
        if (this.gs.actionPoints <= 0) {
            this._notify('行动点已用完，请结束回合');
            return;
        }

        let result;
        switch (action) {
            case 'dev_agr':
                result = EconomySystem.develop(this.gs, city.id, 'agriculture');
                break;
            case 'dev_com':
                result = EconomySystem.develop(this.gs, city.id, 'commerce');
                break;
            case 'recruit':
                result = EconomySystem.recruit(this.gs, city.id);
                break;
            case 'fortify':
                result = EconomySystem.fortify(this.gs, city.id);
                break;
            case 'search':
                result = EconomySystem.search(this.gs, city.id);
                if (result.general) this.game.audio.playSFX('recruit');
                break;
            case 'attack':
                this._openAttackSelect(city);
                return;
            case 'transfer':
                this._openTransferSelect(city);
                return;
        }

        if (result) {
            this._notify(result.msg);
            if (result.success) this.gs.actionPoints--;
        }
    }

    _openAttackSelect(city) {
        // Find neighboring non-player cities
        const neighbors = city.neighbors || [];
        const allTargets = neighbors.filter(nid => {
            const nc = this.gs.getCity(nid);
            return nc && nc.owner && nc.owner !== this.gs.playerFaction;
        });

        // Separate ally and non-ally targets
        const targets = allTargets.filter(nid => {
            const nc = this.gs.getCity(nid);
            return DiplomacySystem.getRelation(this.gs, this.gs.playerFaction, nc.owner) !== 'ally';
        });

        // Check if any blocked targets are ally cities
        const allyTargets = allTargets.filter(nid => {
            const nc = this.gs.getCity(nid);
            return DiplomacySystem.getRelation(this.gs, this.gs.playerFaction, nc.owner) === 'ally';
        });

        if (allTargets.length === 0) {
            this._notify('没有可攻击的相邻城池');
            return;
        }

        if (targets.length === 0 && allyTargets.length > 0) {
            // All adjacent non-player cities belong to allies; prompt to break alliance
            const allyNames = [...new Set(allyTargets.map(nid => {
                const f = this.gs.getFaction(this.gs.getCity(nid).owner);
                return f ? f.name : '';
            }))].join('、');
            this._pendingBreakAllianceAttack = { city, allyTargets };
            this._pendingBreakAllianceName = allyNames;
            return;
        }

        const generals = this.gs.getGeneralsInCity(city.id).filter(g => g.soldiers > 0);
        if (generals.length === 0) {
            this._notify('城中无可出征武将（需有士兵）');
            return;
        }

        this.showAttackSelect = true;
        this.attackSource = city;
        this.attackTargets = targets;
        this.attackTarget = targets[0];
        this.selectedAttackers = [];
        this.availableAttackers = generals;
    }

    _handleAttackSelect() {
        // Handle scroll
        const scroll = this.input.consumeScroll();
        if (scroll) {
            const maxScroll = Math.max(0, this.availableAttackers.length - 8);
            this._attackScroll = Math.max(0, Math.min(maxScroll, this._attackScroll + (scroll > 0 ? 1 : -1)));
        }

        const click = this.input.getClick();
        if (!click) return;

        const r = this.renderer;
        const cx = r.width / 2 - 200;
        const cy = 100;
        const cw = 400;

        // Close button
        if (click.x >= cx + cw - 25 && click.x <= cx + cw - 5 && click.y >= cy + 5 && click.y <= cy + 25) {
            this.showAttackSelect = false;
            this._attackScroll = 0;
            return;
        }

        // Target selection (max 4 visible)
        const maxTargets = Math.min(this.attackTargets.length, 4);
        for (let i = 0; i < maxTargets; i++) {
            const bx = cx + 10 + i * 90;
            const by = cy + 55;
            if (click.x >= bx && click.x <= bx + 85 && click.y >= by && click.y <= by + 28) {
                this.attackTarget = this.attackTargets[i];
                this.game.audio.playSFX('click');
                return;
            }
        }

        // General selection toggle (with scroll)
        const maxVisible = 8;
        const startIdx = this._attackScroll;
        for (let vi = 0; vi < maxVisible && startIdx + vi < this.availableAttackers.length; vi++) {
            const gy = cy + 110 + vi * 36;
            if (click.y >= gy && click.y <= gy + 34 && click.x >= cx + 10 && click.x <= cx + cw - 10) {
                const gen = this.availableAttackers[startIdx + vi];
                const idx = this.selectedAttackers.indexOf(gen.id);
                if (idx >= 0) {
                    this.selectedAttackers.splice(idx, 1);
                } else if (this.selectedAttackers.length < 5) {
                    this.selectedAttackers.push(gen.id);
                }
                this.game.audio.playSFX('click');
                return;
            }
        }

        // Confirm button
        const visibleCount = Math.min(this.availableAttackers.length, maxVisible);
        const confirmY = cy + 120 + visibleCount * 36;
        if (click.x >= cx + 130 && click.x <= cx + 270 && click.y >= confirmY && click.y <= confirmY + 36) {
            if (this.selectedAttackers.length > 0 && this.attackTarget) {
                // Create march instead of instant battle
                const sourceCity = this.selectedCity;
                for (const genId of this.selectedAttackers) {
                    const gen = this.gs.getGeneral(genId);
                    if (gen) {
                        const oldCity = this.gs.getCity(gen.city);
                        if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== genId);
                        gen.city = null;
                        gen.status = 'marching';
                    }
                }
                const visualTurn = this.gs.turn + (this._turnElapsed / this._turnDuration);
                const march = this.gs.createMarch('attack', this.gs.playerFaction, this.selectedAttackers, sourceCity.id, this.attackTarget, visualTurn);
                const targetCity = this.gs.getCity(this.attackTarget);
                this._notify(`出征${targetCity.name}！预计${march.turnsTotal}回合后到达`);
                this.game.audio.playSFX('click');
                this.showAttackSelect = false;
                this._attackScroll = 0;
                this.gs.actionPoints--;
            }
        }
    }

    _openTransferSelect(city) {
        // Find neighboring friendly cities
        const neighbors = city.neighbors || [];
        const friendlyTargets = neighbors.filter(nid => {
            const nc = this.gs.getCity(nid);
            return nc && nc.owner === this.gs.playerFaction && nc.id !== city.id;
        });

        if (friendlyTargets.length === 0) {
            this._notify('没有相邻的己方城池可以调遣');
            return;
        }

        const generals = this.gs.getGeneralsInCity(city.id);
        if (generals.length === 0) {
            this._notify('城中无武将可调遣');
            return;
        }

        this.showTransferSelect = true;
        this.transferSource = city;
        this.transferTargets = friendlyTargets;
        this.transferTarget = friendlyTargets[0];
        this.selectedTransfers = [];
        this.availableTransfers = generals;
    }

    _handleTransferSelect() {
        // Handle scroll
        const scroll = this.input.consumeScroll();
        if (scroll) {
            const maxScroll = Math.max(0, this.availableTransfers.length - 8);
            this._transferScroll = Math.max(0, Math.min(maxScroll, this._transferScroll + (scroll > 0 ? 1 : -1)));
        }

        const click = this.input.getClick();
        if (!click) return;

        const r = this.renderer;
        const cx = r.width / 2 - 200;
        const cy = 100;
        const cw = 400;

        // Close button
        if (click.x >= cx + cw - 25 && click.x <= cx + cw - 5 && click.y >= cy + 5 && click.y <= cy + 25) {
            this.showTransferSelect = false;
            this._transferScroll = 0;
            return;
        }

        // Target selection (max 4 visible)
        const maxTargets = Math.min(this.transferTargets.length, 4);
        for (let i = 0; i < maxTargets; i++) {
            const bx = cx + 10 + i * 90;
            const by = cy + 55;
            if (click.x >= bx && click.x <= bx + 85 && click.y >= by && click.y <= by + 28) {
                this.transferTarget = this.transferTargets[i];
                this.game.audio.playSFX('click');
                return;
            }
        }

        // General selection toggle (with scroll)
        const maxVisible = 8;
        const startIdx = this._transferScroll;
        for (let vi = 0; vi < maxVisible && startIdx + vi < this.availableTransfers.length; vi++) {
            const gy = cy + 110 + vi * 36;
            if (click.y >= gy && click.y <= gy + 34 && click.x >= cx + 10 && click.x <= cx + cw - 10) {
                const gen = this.availableTransfers[startIdx + vi];
                const idx = this.selectedTransfers.indexOf(gen.id);
                if (idx >= 0) {
                    this.selectedTransfers.splice(idx, 1);
                } else {
                    this.selectedTransfers.push(gen.id);
                }
                this.game.audio.playSFX('click');
                return;
            }
        }

        // Confirm button
        const visibleCount = Math.min(this.availableTransfers.length, maxVisible);
        const confirmY = cy + 120 + visibleCount * 36;
        if (click.x >= cx + 130 && click.x <= cx + 270 && click.y >= confirmY && click.y <= confirmY + 36) {
            if (this.selectedTransfers.length > 0 && this.transferTarget) {
                // Create march instead of instant transfer
                const sourceCity = this.transferSource;
                for (const genId of this.selectedTransfers) {
                    const gen = this.gs.getGeneral(genId);
                    if (gen) {
                        const oldCity = this.gs.getCity(gen.city);
                        if (oldCity) oldCity.generals = oldCity.generals.filter(gid => gid !== genId);
                        gen.city = null;
                        gen.status = 'marching';
                    }
                }
                const visualTurn2 = this.gs.turn + (this._turnElapsed / this._turnDuration);
                const march = this.gs.createMarch('transfer', this.gs.playerFaction, this.selectedTransfers, sourceCity.id, this.transferTarget, visualTurn2);
                const targetCity = this.gs.getCity(this.transferTarget);
                this._notify(`调遣至${targetCity.name}，预计${march.turnsTotal}回合后到达`);
                this.game.audio.playSFX('click');
                this.showTransferSelect = false;
                this._transferScroll = 0;
                this.gs.actionPoints--;
            }
        }
    }

    _handleGeneralList() {
        // Handle scroll
        const scroll = this.input.consumeScroll();
        if (scroll) {
            const generals = this.gs.getGeneralsOf(this.gs.playerFaction);
            const maxScroll = Math.max(0, generals.length - 16);
            this._generalListScroll = Math.max(0, Math.min(maxScroll, this._generalListScroll + (scroll > 0 ? 1 : -1)));
        }

        const click = this.input.getClick();
        if (!click) return;

        const r = this.renderer;
        const px = r.width / 2 - 340;
        const py = 40;
        const pw = 680;
        const generals = this.gs.getGeneralsOf(this.gs.playerFaction);
        const visibleCount = Math.min(generals.length, 16);
        const ph = 50 + visibleCount * 30 + 20;

        // Close button or click outside panel
        const insidePanel = Renderer.pointInRect(click.x, click.y, px, py, pw, ph);
        if (!insidePanel ||
            (click.x >= px + pw - 25 && click.x <= px + pw - 5 && click.y >= py + 5 && click.y <= py + 25)) {
            this.showGeneralList = false;
            this._generalListScroll = 0;
            return;
        }

        // Click on general row (with scroll offset)
        const maxVisible = 16;
        const startIdx = this._generalListScroll;
        for (let vi = 0; vi < maxVisible && startIdx + vi < generals.length; vi++) {
            const gy = py + 60 + vi * 30;
            if (click.y >= gy && click.y <= gy + 28) {
                this.showGeneralDetail = generals[startIdx + vi];
                return;
            }
        }
    }

    _handleGeneralDetail() {
        const click = this.input.getClick();
        if (!click) return;

        const r = this.renderer;
        const gen = this.showGeneralDetail;
        const px = r.width / 2 - 290;
        const pw = 580;
        // Must match the dynamic ph/py calculation in _drawGeneralDetailPanel
        const skills = gen ? gen.skills.map(sid => this.gs.getSkill(sid)).filter(Boolean) : [];
        const skillRows = Math.max(1, Math.ceil(skills.length / 4));
        const ph = 30 + 110 + 12 + 58 + 14 + 26 + 14 + 22 + skillRows * 48 + 16 + 50 + 16;
        const py = Math.max(10, r.height / 2 - ph / 2);

        // Close button (×) or click outside panel
        const insidePanel = Renderer.pointInRect(click.x, click.y, px, py, pw, ph);
        const onCloseBtn = click.x >= px + pw - 25 && click.x <= px + pw - 5 && click.y >= py + 5 && click.y <= py + 25;
        if (onCloseBtn || !insidePanel) {
            this.showGeneralDetail = null;
            return;
        }
    }

    _handleDiplomacy() {
        // Handle scroll for diplomacy list
        const scroll = this.input.consumeScroll();
        if (scroll) {
            const factions = this.gs.getAliveFactions().filter(f => f.id !== this.gs.playerFaction);
            const maxScroll = Math.max(0, factions.length - 6);
            this._diplomacyScroll = Math.max(0, Math.min(maxScroll, this._diplomacyScroll + (scroll > 0 ? 1 : -1)));
        }

        const click = this.input.getClick();
        if (!click) return;

        const r = this.renderer;
        const px = r.width / 2 - 250;
        const py = 60;
        const pw = 500;
        const factions = this.gs.getAliveFactions().filter(f => f.id !== this.gs.playerFaction);
        const visibleCount = Math.min(factions.length, 6);
        const ph = 50 + visibleCount * 80;

        // Close button or click outside panel
        const insidePanel = Renderer.pointInRect(click.x, click.y, px, py, pw, ph);
        if (!insidePanel ||
            (click.x >= px + pw - 25 && click.x <= px + pw - 5 && click.y >= py + 5 && click.y <= py + 25)) {
            this.showDiplomacy = false;
            this._diplomacyScroll = 0;
            return;
        }

        // Faction buttons (with scroll offset)
        const maxVisible = 6;
        const startIdx = this._diplomacyScroll;
        for (let vi = 0; vi < maxVisible && startIdx + vi < factions.length; vi++) {
            const i = startIdx + vi;
            const fy = py + 50 + vi * 80;
            const f = factions[i];

            const relation = DiplomacySystem.getRelation(this.gs, this.gs.playerFaction, f.id);

            // Left button: '同盟' when neutral/enemy, disabled when already allied
            if (relation !== 'ally') {
                if (click.x >= px + 300 && click.x <= px + 370 && click.y >= fy + 25 && click.y <= fy + 50) {
                    const result = DiplomacySystem.formAlliance(this.gs, this.gs.playerFaction, f.id);
                    this._notify(result.msg);
                    return;
                }
            }
            // Right button: '停战' when at war, '宣战' otherwise
            if (relation === 'enemy') {
                if (click.x >= px + 380 && click.x <= px + 450 && click.y >= fy + 25 && click.y <= fy + 50) {
                    const result = DiplomacySystem.ceasefire(this.gs, this.gs.playerFaction, f.id);
                    this._notify(result.msg);
                    return;
                }
            } else {
                if (click.x >= px + 380 && click.x <= px + 450 && click.y >= fy + 25 && click.y <= fy + 50) {
                    const result = DiplomacySystem.declareWar(this.gs, this.gs.playerFaction, f.id);
                    this._notify(result.msg);
                    return;
                }
            }
        }
    }

    _handleBreakAllianceAttack() {
        const click = this.input.getClick();
        if (!click) return;

        const r = this.renderer;
        const pw = 420, ph = 160;
        const px = r.width / 2 - pw / 2;
        const py = r.height / 2 - ph / 2;

        // Confirm: break alliance and proceed to attack
        const confirmX = px + pw / 2 - 130;
        const confirmY = py + ph - 46;
        if (click.x >= confirmX && click.x <= confirmX + 120 && click.y >= confirmY && click.y <= confirmY + 36) {
            const { city, allyTargets } = this._pendingBreakAllianceAttack;
            // Break all relevant alliances
            const allyFactions = [...new Set(allyTargets.map(nid => this.gs.getCity(nid).owner))];
            for (const fid of allyFactions) {
                DiplomacySystem.declareWar(this.gs, this.gs.playerFaction, fid);
            }
            this._pendingBreakAllianceAttack = null;
            this._pendingBreakAllianceName = null;
            // Reopen attack select now that targets are unlocked
            this._openAttackSelect(city);
            return;
        }

        // Cancel
        const cancelX = px + pw / 2 + 10;
        if (click.x >= cancelX && click.x <= cancelX + 120 && click.y >= confirmY && click.y <= confirmY + 36) {
            this._pendingBreakAllianceAttack = null;
            this._pendingBreakAllianceName = null;
        }
    }

    _handleTurnReport() {
        const scroll = this.input.consumeScroll();
        if (scroll && this.turnReports.length > 14) {
            const maxScroll = this.turnReports.length - 14;
            this._turnReportScroll = Math.max(0, Math.min(maxScroll, (this._turnReportScroll || 0) + (scroll > 0 ? 1 : -1)));
        }
        const click = this.input.getClick();
        if (click) {
            this.showTurnReport = false;
            this._turnReportScroll = 0;
            if (this._pendingVictory) {
                this._pendingVictory = false;
                this._victoryScreen = { elapsed: 0, particles: [] };
                this.game.audio.playVictoryFanfare();
                return;
            }
            // 回合结算安全网可能在回合报告显示后入队战斗（极少情况）
            // 关闭回合报告后立即处理
            if (this.gs.battleQueue.length > 0) {
                this._pendingBattleAlert = this.gs.battleQueue.shift();
            }
        }
    }

    _endTurn() {
        this._turnReports = [];

        // Process turn settlement
        const ecoReports = EconomySystem.processTurnSettlement(this.gs);
        this._turnReports.push(...ecoReports);

        // Process events
        const events = this.game.eventSystem.processEvents();
        for (const event of events) {
            this._turnReports.push({ text: `事件：${event.name} - ${event.description}`, type: 'event' });
        }

        // AI turns (create new marches) - must happen before flushing arrivals
        // so that AI always gets to act each turn regardless of battle triggers
        this._processAI();

        // Flush march events that arrive within this turn (arrivalTurn <= turn+1).
        // Keep the window tight so AI marches created this turn (departTurn=turn, arrivalTurn=turn+1..4)
        // stay visible on the map for the player to see before being resolved next turn.
        const flushFrom = this._lastVisualTurn ?? this.gs.turn;
        const flushTo = this.gs.turn + 1;
        if (flushFrom < flushTo) {
            const triggered = this._checkRealtimeEvents(flushFrom, flushTo);
            if (triggered) return; // battle queued, scene switching handled inside
        }

        // Check if there are queued battles against the player
        if (this.gs.battleQueue.length > 0) {
            this._startNextQueuedBattle();
            return;
        }

        this._finishEndTurn();
    }

    _finishEndTurn() {
        const gs = this.gs;
        const reports = this._turnReports || [];

        // Recover generals
        for (const gen of gs.generals) {
            if (gen.status === 'dead' || gen.status === 'captured') continue;
            // Encamped generals outside city walls cannot recover
            if (gen.status === 'encamped') continue;

            gen.hp = Math.min(gen.maxHp, gen.hp + Math.floor(gen.maxHp * 0.1));
            gen.mp = Math.min(gen.maxMp, gen.mp + Math.floor(gen.maxMp * 0.2));
            gen.actionUsed = false;

            // Soldiers recover while garrisoned in city
            if (gen.status === 'idle' && gen.city) {
                const soldierCap = Math.max(500, gen.lead * 40);
                if (gen.soldiers < soldierCap) {
                    const recover = Math.floor(soldierCap * 0.30);
                    gen.soldiers = Math.min(soldierCap, gen.soldiers + recover);
                }
            }
        }

        // ── 被俘将领逃回 ──
        // Each captured general has a 40% chance per turn to escape back to their original faction.
        // If their faction is dead, they become unaffiliated (searchable).
        for (const gen of gs.generals) {
            if (gen.status !== 'captured') continue;
            if (Math.random() > 0.40) continue;

            gs.removeGeneralFromCity(gen.city, gen.id);

            // Find original faction (stored in gen.faction before capture, but it was set to 'none')
            // Use originalFaction field if set, else try to find by id match in FACTIONS_DATA
            const origFactionId = gen.originalFaction || null;
            const faction = origFactionId ? gs.getFaction(origFactionId) : null;
            const homeCities = faction && faction.alive ? gs.getCitiesOf(origFactionId) : [];

            if (homeCities.length > 0) {
                const homeCity = homeCities[0];
                gen.faction = origFactionId;
                gen.city = homeCity.id;
                gen.status = 'idle';
                gen.soldiers = 300;
                gen.hp = Math.floor(gen.maxHp * 0.5);
                if (!homeCity.generals.includes(gen.id)) homeCity.generals.push(gen.id);
            } else {
                // Faction dead or unknown — become searchable unaffiliated general
                gen.status = 'idle';
                gen.city = null;
                gen.soldiers = 200;
            }
        }

        // ── 在野将领城池引用清理 ──
        // 无主武将若仍持有城池引用但该城已换主，清空引用，避免数据错乱。
        // （不自动归附任何势力：武将只能通过搜索或俘虏获得）
        for (const gen of gs.generals) {
            if (gen.faction !== 'none' || gen.status === 'dead' || gen.status === 'captured') continue;
            if (gen.city) {
                const occupiedCity = gs.getCity(gen.city);
                if (!occupiedCity || !occupiedCity.owner || occupiedCity.owner === 'none') {
                    gen.city = null; // 城池无主或已被摧毁，清空引用
                }
                // 保留 gen.city 但不自动归附城主——等待玩家/AI 主动搜索
            }
        }

        // ── 城池驻将上限检查（MAX_GARRISON人）──
        for (const city of gs.cities) {
            if (!city.owner || city.owner === 'none') continue;
            const idleGens = gs.getGeneralsInCity(city.id).filter(g => g.status === 'idle');
            if (idleGens.length <= MAX_GARRISON) continue;
            const overflow = idleGens.slice(MAX_GARRISON);
            for (const gen of overflow) {
                const friendly = gs.getCitiesOf(gen.faction)
                    .filter(c => c.id !== city.id && gs.getGarrisonCount(c.id) < MAX_GARRISON);
                if (friendly.length > 0) {
                    const best = friendly.reduce((a, b) => {
                        const da = Math.hypot((a.x||0)-(city.x||0), (a.y||0)-(city.y||0));
                        const db = Math.hypot((b.x||0)-(city.x||0), (b.y||0)-(city.y||0));
                        return da <= db ? a : b;
                    });
                    city.generals = city.generals.filter(gid => gid !== gen.id);
                    gen.city = null;
                    gen.status = 'marching';
                    gs.createMarch('transfer', gen.faction, [gen.id], city.id, best.id);
                } else {
                    // No room anywhere — encamp outside the city walls
                    gen.status = 'encamped';
                }
            }
        }

        // ── Encamped generals re-check: let them in if space opened up ──
        for (const gen of gs.generals) {
            if (gen.status !== 'encamped' || !gen.city) continue;
            if (gs.getGarrisonCount(gen.city) < MAX_GARRISON) {
                gen.status = 'idle';
            }
        }

        this.gs.turn++;
        this.gs.actionPoints = this.gs.maxActionPoints;
        this._turnElapsed = 0; // reset visual clock for new turn's march animation
        this._lastVisualTurn = this.gs.turn; // reset realtime event tracker

        // Safety net: force-resolve any march whose arrivalTurn is still in the past.
        // This catches transfers/marches with fractional departTurn that slipped through the flush window.
        const now = this.gs.turn;
        const stale = [...this.gs.marches].filter(m => m.arrivalTurn < now);
        for (const march of stale) {
            if (!this.gs.marches.includes(march)) continue;
            this._resolveArrival(march); // may push battleQueue, handled after turn report
        }

        // Check victory
        const victory = this.gs.checkVictory();
        if (victory === 'victory') {
            reports.push({ text: '天下统一！你赢得了胜利！', type: 'victory' });
            // Trigger victory screen after turn report is dismissed
            this._pendingVictory = true;
        } else if (victory === 'defeat') {
            reports.push({ text: '势力灭亡，游戏结束...', type: 'defeat' });
        }

        this.turnReports = reports;
        this.showTurnReport = true;
        this.gs._pendingFinishTurn = false;
    }

    _startNextQueuedBattle() {
        const battle = this.gs.battleQueue.shift();
        if (!battle) {
            this._finishEndTurn();
            return;
        }

        // Show alert dialog instead of immediately entering battle
        this._pendingBattleAlert = battle;

        // Store turn reports on gameState so they persist across scene switches
        this.gs._pendingTurnReports = this._turnReports || [];
        this.gs._pendingFinishTurn = true;
    }

    _handleBattleAlert() {
        const alert = this._pendingBattleAlert;

        // Interception battle: no city required
        if (alert.isInterception) {
            this._handleInterceptionAlert(alert);
            return;
        }

        // Safety: if city no longer exists, dismiss
        if (!this.gs.getCity(alert.defenderCityId)) {
            this._pendingBattleAlert = null;
            return;
        }
        const attackerGens = alert.attackerIds.map(id => this.gs.getGeneral(id)).filter(Boolean);

        const r = this.renderer;
        const pw = 420;
        const ph = 38 + 40 + 20 + attackerGens.length * 52 + 40 + 20 + 36 + 20;
        const px = r.width / 2 - pw / 2;
        const py = r.height / 2 - ph / 2;

        // Escape key dismisses and confirms (no way to avoid battle)
        if (this.input.isKeyDown('Escape')) {
            this._pendingBattleAlert = null;
            if (alert.playerIsAttacker) {
                this.game.startBattle(alert.attackerIds, alert.defenderCityId, alert.attackerSourceCity, { isRetreatBreakthrough: alert.isRetreatBreakthrough, retreatFinalDestination: alert.retreatFinalDestination });
            } else {
                this.game.startDefenseBattle(alert.attackerIds, alert.defenderCityId, alert.attackerSourceCity);
            }
            return;
        }

        const click = this.input.getClick();
        if (!click) return;

        // Confirm button hit test
        const btnW = 120, btnH = 36;
        const btnX = px + pw / 2 - btnW / 2;
        const btnY = py + ph - btnH - 16;
        if (Renderer.pointInRect(click.x, click.y, btnX, btnY, btnW, btnH)) {
            this._pendingBattleAlert = null;
            this.game.audio.playSFX('click');
            if (alert.playerIsAttacker) {
                this.game.startBattle(alert.attackerIds, alert.defenderCityId, alert.attackerSourceCity, { isRetreatBreakthrough: alert.isRetreatBreakthrough, retreatFinalDestination: alert.retreatFinalDestination });
            } else {
                this.game.startDefenseBattle(alert.attackerIds, alert.defenderCityId, alert.attackerSourceCity);
            }
        }
    }

    _handleInterceptionAlert(alert) {
        const r = this.renderer;
        const atkGens = alert.attackerIds.map(id => this.gs.getGeneral(id)).filter(Boolean);
        const defGens = alert.defenderIds.map(id => this.gs.getGeneral(id)).filter(Boolean);
        const totalGens = Math.max(atkGens.length, defGens.length);
        const pw = 460;
        const ph = 38 + 30 + 20 + totalGens * 52 + 20 + 36 + 20;
        const px = r.width / 2 - pw / 2;
        const py = r.height / 2 - ph / 2;

        const startBattle = () => {
            this._pendingBattleAlert = null;
            this.game.audio.playSFX('click');
            this.game.startInterceptionBattle(
                alert.attackerIds, alert.defenderIds,
                alert.attackerFactionId, alert.defenderFactionId,
                alert.playerSide,
                alert.attackerSourceCity, alert.defenderSourceCity,
                alert.attackerTargetCity, alert.defenderTargetCity
            );
        };

        if (this.input.isKeyDown('Escape')) { startBattle(); return; }

        const click = this.input.getClick();
        if (!click) return;

        const btnW = 120, btnH = 36;
        const btnX = px + pw / 2 - btnW / 2;
        const btnY = py + ph - btnH - 16;
        if (Renderer.pointInRect(click.x, click.y, btnX, btnY, btnW, btnH)) {
            startBattle();
        }
    }

    _processAI() {
        return this._logic._processAI();
    }

    // Check if any two opposing marches have crossed paths this turn
    _checkMarchInterceptions() {
        const marches = this.gs.marches;
        const intercepted = new Set(); // march ids already involved in an interception

        for (let i = 0; i < marches.length; i++) {
            const a = marches[i];
            if (intercepted.has(a.id)) continue;
            if (a.type !== 'attack') continue;

            for (let j = i + 1; j < marches.length; j++) {
                const b = marches[j];
                if (intercepted.has(b.id)) continue;
                if (b.type !== 'attack') continue;

                // Must be opposing factions
                if (a.faction === b.faction) continue;

                // Must be travelling in opposite directions on the same route
                const isOpposite = (a.sourceCity === b.targetCity && a.targetCity === b.sourceCity);
                if (!isOpposite) continue;

                // They have crossed: a.progress + b.progress >= 1
                if (a.progress + b.progress < 1) continue;

                // Interception confirmed — remove both marches from active list
                intercepted.add(a.id);
                intercepted.add(b.id);

                this._resolveInterception(a, b);
                break; // march A is consumed; stop looking for more matches for it
            }
        }

        // Remove intercepted marches from gs.marches
        if (intercepted.size > 0) {
            this.gs.marches = this.gs.marches.filter(m => !intercepted.has(m.id));
        }
    }

    _resolveInterception(marchA, marchB) {
        return this._logic._resolveInterception(marchA, marchB);
    }

    _autoResolveInterception(marchA, generalsA, marchB, generalsB) {
        return this._logic._autoResolveInterception(marchA, generalsA, marchB, generalsB);
    }

    _autoResolveBattle(attackerGenerals, defenderCityId, attackerFaction, attackerSourceCityId) {
        return this._logic._autoResolveBattle(attackerGenerals, defenderCityId, attackerFaction, attackerSourceCityId);
    }

    _notify(text) {
        this.notification = text;
        this.notificationTimer = 2;
    }

    // ── Plan B: 实时时间轴行军系统 ──

    /**
     * 收集当前回合窗口 [currentTurn, currentTurn+1) 内的所有事件
     * 事件类型: 'meet' (拦截) 或 'arrive' (到达)
     */
    _buildTimeline(currentTurn) {
        return this._logic._buildTimeline(currentTurn);
    }

    /**
     * 处理单支行军到达目标城市
     * 返回 true 表示触发了玩家参与的战斗（需暂停后续事件）
     */
    // 将领进入城市，超过 MAX_GARRISON 人上限则溢出到最近己方城市（创建transfer行军）
    _enterCity(gen, cityId) {
        return this._logic._enterCity(gen, cityId);
    }

    _resolveArrival(march) {
        return this._logic._resolveArrival(march);
    }

    /**
     * 更新所有行军的 progress，然后按时间轴顺序处理本回合事件
     */
    _runTimeline() {
        return this._logic._runTimeline();
    }

    // ── 实时事件检测：在 update() 每帧调用，检查 [prevVT, nowVT] 窗口内的 meet/arrive ──
    _checkRealtimeEvents(prevVT, nowVT) {
        return this._logic._checkRealtimeEvents(prevVT, nowVT);
    }

    // ── 构建任意时间窗口内的事件（_buildTimeline 的泛化版本） ──
    _buildTimelineWindow(fromVT, toVT) {
        return this._logic._buildTimelineWindow(fromVT, toVT);
    }

    // ── 行军结算（Plan B 入口） ──
    _processMarches() {
        return this._logic._processMarches();
    }

    render() {
        const r = this.renderer;
        const ctx = r.ctx;

        // Draw map with camera transform (clipped above HUD)
        r.clear('#1a2a1a');
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 42, r.width, r.height - 92);  // clip between top and bottom HUD bars
        ctx.clip();
        ctx.translate(-this._camX, -this._camY);
        this._drawMapBackground(r, ctx);
        this._drawRoutes(r, ctx);
        this._drawCities(r, ctx);
        this._drawMarches(r, ctx);
        this._drawEncampedGenerals(r, ctx);
        this._drawBattleFlashes(r, ctx);
        ctx.restore();

        // Draw HUD (screen space)
        this._drawHUD(r, ctx);

        // Draw panels
        if (this.showCityPanel && this.selectedCity) this._drawCityPanel(r, ctx);
        if (this.showAttackSelect) this._drawAttackSelectPanel(r, ctx);
        if (this.showTransferSelect) this._drawTransferSelectPanel(r, ctx);
        if (this.showGeneralList) this._drawGeneralListPanel(r, ctx);
        if (this.showGeneralDetail) this._drawGeneralDetailPanel(r, ctx);
        if (this.showDiplomacy) this._drawDiplomacyPanel(r, ctx);
        if (this.showTurnReport) this._drawTurnReportPanel(r, ctx);
        if (this._pendingBattleAlert) this._drawBattleAlertPanel(r, ctx);
        if (this._pendingBreakAllianceAttack) this._drawBreakAlliancePanel(r, ctx);

        // Notification — suppressed while any modal panel is open to avoid overlap
        const modalOpen = this.showTurnReport || this._pendingBattleAlert || this._pendingBreakAllianceAttack ||
            this.showAttackSelect || this.showTransferSelect ||
            this.showGeneralList || this.showGeneralDetail || this.showDiplomacy;
        if (this.notification && !modalOpen) {
            r.roundRect(r.width / 2 - 180, 50, 360, 36, 4, 'rgba(30,15,5,0.95)', '#c8a850');
            r.drawText(this.notification, r.width / 2, 68, {
                color: '#ffe080', size: 17, align: 'center', baseline: 'middle', shadow: true
            });
        }

        // March notifications (AI battle results) — suppressed during modal panels
        if (!modalOpen) {
        for (let i = 0; i < this._marchNotifications.length; i++) {
            const mn = this._marchNotifications[i];
            const alpha = Math.min(1, mn.timer / 0.5);
            ctx.globalAlpha = alpha;
            const ny = 92 + i * 30;
            r.roundRect(r.width / 2 - 200, ny, 400, 26, 3, 'rgba(80,20,10,0.9)', '#ff6633');
            r.drawText(mn.text, r.width / 2, ny + 13, {
                color: '#ffe080', size: 15, align: 'center', baseline: 'middle'
            });
            ctx.globalAlpha = 1;
        }
        }

        // March tooltip
        if (this.hoveredMarch) this._drawMarchTooltip(r, ctx);

        // Victory screen — full-screen overlay, drawn last
        if (this._victoryScreen) this._drawVictoryScreen(r, ctx);
    }

    _drawMapBackground(r, ctx) { return this._renderer_wm._drawMapBackground(r, ctx); }

    _drawTerrain(ctx, m) { return this._renderer_wm._drawTerrain(ctx, m); }

    _drawMountains(ctx, m) { return this._renderer_wm._drawMountains(ctx, m); }

    _drawRivers(ctx, m) { return this._renderer_wm._drawRivers(ctx, m); }

    _drawRegionLabels(r, ctx) { return this._renderer_wm._drawRegionLabels(r, ctx); }

    _drawRoutes(r, ctx) { return this._renderer_wm._drawRoutes(r, ctx); }

    _drawCities(r, ctx) { return this._renderer_wm._drawCities(r, ctx); }

    _drawCityIcon(ctx, x, y, color, faction, highlighted) { return this._renderer_wm._drawCityIcon(ctx, x, y, color, faction, highlighted); }

    _drawHUD(r, ctx) { return this._renderer_wm._drawHUD(r, ctx); }

    _drawCityPanel(r, ctx) { return this._renderer_wm._drawCityPanel(r, ctx); }

    _drawAttackSelectPanel(r, ctx) { return this._renderer_wm._drawAttackSelectPanel(r, ctx); }

    _drawTransferSelectPanel(r, ctx) { return this._renderer_wm._drawTransferSelectPanel(r, ctx); }

    _drawGeneralListPanel(r, ctx) { return this._renderer_wm._drawGeneralListPanel(r, ctx); }

    _drawGeneralDetailPanel(r, ctx) { return this._renderer_wm._drawGeneralDetailPanel(r, ctx); }

    _drawDiplomacyPanel(r, ctx) { return this._renderer_wm._drawDiplomacyPanel(r, ctx); }

    _drawBattleAlertPanel(r, ctx) { return this._renderer_wm._drawBattleAlertPanel(r, ctx); }

    _drawBreakAlliancePanel(r, ctx) { return this._renderer_wm._drawBreakAlliancePanel(r, ctx); }

    _drawInterceptionAlertPanel(r, ctx) { return this._renderer_wm._drawInterceptionAlertPanel(r, ctx); }

    _drawTurnReportPanel(r, ctx) { return this._renderer_wm._drawTurnReportPanel(r, ctx); }

    _drawVictoryScreen(r, ctx) { return this._renderer_wm._drawVictoryScreen(r, ctx); }

    _unitTypeName(type) {
        const names = { infantry: '步兵', cavalry: '骑兵', archer: '弓兵', spear: '枪兵' };
        return names[type] || type;
    }

    _skillTypeColor(type) {
        const colors = { martial: '#ff6644', strategist: '#44aaff', support: '#44ff44' };
        return colors[type] || '#ccc';
    }

    // ── 行军渲染 ──

    _marchScreenPos(march) {
        const srcCity = this.gs.getCity(march.sourceCity);
        const tgtCity = this.gs.getCity(march.targetCity);
        if (!srcCity || !tgtCity) return null;
        const sp = this._cityScreenPos(srcCity);
        const tp = this._cityScreenPos(tgtCity);
        const p = march.animProgress || 0;
        return { x: sp.x + (tp.x - sp.x) * p, y: sp.y + (tp.y - sp.y) * p };
    }

    _drawMarches(r, ctx) { return this._renderer_wm._drawMarches(r, ctx); }

    // Draw stationary camp triangles for encamped generals (over garrison cap, no other city)
    _drawEncampedGenerals(r, ctx) { return this._renderer_wm._drawEncampedGenerals(r, ctx); }

    _drawBattleFlashes(r, ctx) { return this._renderer_wm._drawBattleFlashes(r, ctx); }

    _drawMarchTooltip(r, ctx) { return this._renderer_wm._drawMarchTooltip(r, ctx); }

    // Convert city data coordinates to virtual map position (camera-independent)
    _cityScreenPos(city) {
        const m = this._mapArea;
        const d = this._dataRange;
        return {
            x: m.x + (city.x - d.xMin) / (d.xMax - d.xMin) * m.w,
            y: m.y + (city.y - d.yMin) / (d.yMax - d.yMin) * m.h
        };
    }
}
