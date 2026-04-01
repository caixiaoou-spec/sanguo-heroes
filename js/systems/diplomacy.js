// 外交系统
export default class DiplomacySystem {
    // Form alliance
    static formAlliance(gameState, factionId1, factionId2) {
        const f1 = gameState.getFaction(factionId1);
        const f2 = gameState.getFaction(factionId2);
        if (!f1 || !f2) return { success: false, msg: '势力不存在' };

        if (f1.allies.includes(factionId2)) return { success: false, msg: '已是同盟' };
        if (f1.enemies.includes(factionId2)) return { success: false, msg: '正在交战中' };

        // Acceptance based on fame and threat
        const acceptance = 0.5 + f1.fame / 200 + (f1.allies.length < f2.allies.length ? 0.1 : 0);
        if (Math.random() > acceptance) {
            return { success: false, msg: `${f2.name}拒绝了同盟提议` };
        }

        f1.allies.push(factionId2);
        f2.allies.push(factionId1);
        f1.enemies = f1.enemies.filter(e => e !== factionId2);
        f2.enemies = f2.enemies.filter(e => e !== factionId1);

        return { success: true, msg: `与${f2.name}结为同盟！` };
    }

    // Declare war
    static declareWar(gameState, factionId1, factionId2) {
        const f1 = gameState.getFaction(factionId1);
        const f2 = gameState.getFaction(factionId2);
        if (!f1 || !f2) return { success: false, msg: '势力不存在' };

        if (f1.enemies.includes(factionId2)) return { success: false, msg: '已在交战' };

        f1.enemies.push(factionId2);
        f2.enemies.push(factionId1);
        f1.allies = f1.allies.filter(a => a !== factionId2);
        f2.allies = f2.allies.filter(a => a !== factionId1);

        return { success: true, msg: `向${f2.name}宣战！` };
    }

    // Ceasefire
    static ceasefire(gameState, factionId1, factionId2) {
        const f1 = gameState.getFaction(factionId1);
        const f2 = gameState.getFaction(factionId2);
        if (!f1 || !f2) return { success: false, msg: '势力不存在' };

        const cost = 5000;
        if (f1.gold < cost) return { success: false, msg: '金钱不足（需5000金）' };

        const chance = 0.3 + f1.fame / 200;
        if (Math.random() > chance) return { success: false, msg: `${f2.name}拒绝停战` };

        f1.gold -= cost;
        f1.enemies = f1.enemies.filter(e => e !== factionId2);
        f2.enemies = f2.enemies.filter(e => e !== factionId1);

        return { success: true, msg: `与${f2.name}达成停战协议` };
    }

    // Persuade surrender
    static persuadeSurrender(gameState, factionId1, factionId2) {
        const f1 = gameState.getFaction(factionId1);
        const f2 = gameState.getFaction(factionId2);
        if (!f1 || !f2) return { success: false, msg: '势力不存在' };

        const f2Cities = gameState.getCitiesOf(factionId2);
        if (f2Cities.length > 2) return { success: false, msg: `${f2.name}势力尚强，不会投降` };

        const chance = 0.1 + (f1.fame - f2.fame) / 200;
        if (Math.random() > chance) return { success: false, msg: `${f2.name}拒绝投降` };

        // Transfer all cities and generals
        for (const city of f2Cities) {
            city.owner = factionId1;
        }
        const f2Generals = gameState.getGeneralsOf(factionId2);
        for (const gen of f2Generals) {
            gen.faction = factionId1;
            gen.loyalty = 40 + Math.floor(Math.random() * 20);
        }
        f2.alive = false;

        // 从所有势力的 allies/enemies 中清除已灭亡势力的引用，防止数据泄漏
        for (const faction of gameState.factions) {
            faction.allies  = faction.allies.filter(id => id !== factionId2);
            faction.enemies = faction.enemies.filter(id => id !== factionId2);
        }

        return { success: true, msg: `${f2.name}投降！获得所有领地和武将！` };
    }

    // Get diplomatic status between factions
    static getRelation(gameState, factionId1, factionId2) {
        const f1 = gameState.getFaction(factionId1);
        if (f1.allies.includes(factionId2)) return 'ally';
        if (f1.enemies.includes(factionId2)) return 'enemy';
        return 'neutral';
    }

    // Can attack check
    static canAttack(gameState, attackerFactionId, defenderFactionId) {
        if (attackerFactionId === defenderFactionId) return false;
        const f = gameState.getFaction(attackerFactionId);
        // Can attack enemies or neutrals (not allies)
        return !f.allies.includes(defenderFactionId);
    }
}
