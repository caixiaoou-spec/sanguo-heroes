// 经济/内政系统
import { checkLevelUp as _checkLevelUp } from '../utils/generalUtils.js';

export default class EconomySystem {
    // Turn settlement - collect taxes and consume food
    static processTurnSettlement(gameState) {
        const reports = [];

        for (const faction of gameState.getAliveFactions()) {
            let totalGold = 0;
            let totalFood = 0;
            let totalConsume = 0;

            const cities = gameState.getCitiesOf(faction.id);
            for (const city of cities) {
                // Income
                const goldIncome = Math.floor(city.commerce * city.population / 10000);
                const foodIncome = Math.floor(city.agriculture * city.population / 1500);
                totalGold += goldIncome;
                totalFood += foodIncome;

                // Soldiers consume food
                const soldiers = city.soldiers;
                const generals = gameState.getGeneralsInCity(city.id);
                const genSoldiers = generals.reduce((sum, g) => sum + g.soldiers, 0);
                totalConsume += Math.floor((soldiers + genSoldiers) * 0.1);

                // Population growth
                if (city.morale > 50) {
                    city.population += Math.floor(city.population * 0.01 * (city.morale / 100));
                }
            }

            faction.gold += totalGold;
            faction.food += totalFood - totalConsume;

            if (faction.food < 0) {
                faction.food = 0;
                // Low food causes morale drop
                cities.forEach(c => { c.morale = Math.max(10, c.morale - 5); });
                if (faction.isPlayer) {
                    reports.push({ text: `粮草不足！各城士气下降`, type: 'warning' });
                }
            }

            if (faction.isPlayer) {
                reports.push({ text: `税收：金 +${totalGold} 粮 +${totalFood} 消耗粮 -${totalConsume}`, type: 'info' });
            }
        }

        return reports;
    }

    // Develop a city (improve agriculture or commerce)
    static develop(gameState, cityId, type) {
        const city = gameState.getCity(cityId);
        if (!city) return { success: false, msg: '城池不存在' };

        const faction = gameState.getFaction(city.owner);
        if (!faction) return { success: false, msg: '无势力控制' };

        const cost = 1000;
        if (faction.gold < cost) return { success: false, msg: '金钱不足' };

        // Need a general with high politics
        const generals = gameState.getGeneralsInCity(cityId);
        const bestPol = generals.reduce((best, g) => g.pol > (best?.pol || 0) ? g : best, null);
        if (!bestPol) return { success: false, msg: '城中无武将执行' };

        faction.gold -= cost;
        const boost = Math.floor(5 + bestPol.pol / 10);

        if (type === 'agriculture') {
            city.agriculture = Math.min(100, city.agriculture + boost);
            bestPol.exp += 20;
            return { success: true, msg: `${bestPol.name}开发农业，农业 +${boost}` };
        } else {
            city.commerce = Math.min(100, city.commerce + boost);
            bestPol.exp += 20;
            return { success: true, msg: `${bestPol.name}开发商业，商业 +${boost}` };
        }
    }

    // Recruit soldiers
    static recruit(gameState, cityId) {
        const city = gameState.getCity(cityId);
        if (!city) return { success: false, msg: '城池不存在' };

        const faction = gameState.getFaction(city.owner);
        const cost = 2000;
        if (faction.gold < cost) return { success: false, msg: '金钱不足' };

        const maxRecruit = Math.floor(city.population * 0.02);
        const amount = Math.min(maxRecruit, 1000 + Math.floor(Math.random() * 500));

        faction.gold -= cost;
        city.morale = Math.max(30, city.morale - 3);

        // Distribute recruits: first replenish generals with low soldiers, then city garrison
        const generals = gameState.getGeneralsInCity(cityId);
        let remaining = amount;
        for (const gen of generals) {
            if (remaining <= 0) break;
            const cap = gen.lead * 50;
            const need = Math.max(0, Math.min(cap, 1000) - gen.soldiers);
            if (need > 0) {
                const give = Math.min(need, remaining);
                gen.soldiers += give;
                remaining -= give;
            }
        }
        city.soldiers += remaining;

        return { success: true, msg: `征兵 ${amount} 人` };
    }

    // Search for unaffiliated generals
    static search(gameState, cityId) {
        const city = gameState.getCity(cityId);
        if (!city) return { success: false, msg: '城池不存在' };

        const generals = gameState.getGeneralsInCity(cityId);
        const bestCha = generals.reduce((best, g) => g.cha > (best?.cha || 0) ? g : best, null);
        if (!bestCha) return { success: false, msg: '城中无武将搜索' };

        // Only find unaffiliated generals whose homeCity matches this city
        const localPool = gameState.getUnaffiliatedGenerals().filter(g => g.homeCity === cityId);
        if (localPool.length === 0) {
            return { success: false, msg: '此处已无在野贤才' };
        }

        // Chance based on charisma
        const chance = 0.3 + bestCha.cha / 200;
        if (Math.random() > chance) {
            return { success: false, msg: '搜索未果，下次再试' };
        }

        // Found a general from the local pool
        const found = localPool[Math.floor(Math.random() * localPool.length)];

        // Try to recruit based on charisma
        const recruitChance = 0.4 + bestCha.cha / 150;
        if (Math.random() < recruitChance) {
            found.faction = city.owner;
            found.city = cityId;
            found.loyalty = 60 + Math.floor(Math.random() * 20);
            found.status = 'idle';
            found.soldiers = 500;
            city.generals.push(found.id);

            // Assign skills
            gameState._assignSkills(found);

            return { success: true, msg: `发现并招募了 ${found.name}！`, general: found };
        }

        return { success: true, msg: `发现 ${found.name}，但未能招募` };
    }

    // Recruit a captured general — costs gold, success based on charisma of best general in city
    static recruitCaptive(gameState, cityId, captiveId) {
        const city = gameState.getCity(cityId);
        const captive = gameState.getGeneral(captiveId);
        if (!city || !captive || captive.status !== 'captured' || captive.city !== cityId) {
            return { success: false, msg: '俘虏不在此城' };
        }
        const faction = gameState.getFaction(city.owner);
        const cost = 500 + captive.level * 100;
        if (faction.gold < cost) {
            return { success: false, msg: `金钱不足（需 ${cost} 金）` };
        }
        const generals = gameState.getGeneralsInCity(cityId);
        const bestCha = generals.reduce((best, g) => g.stats.cha > (best?.stats?.cha || 0) ? g : best, null);
        const cha = bestCha ? bestCha.stats.cha : 50;
        // Recruit chance based on charisma and captive loyalty tendency
        const chance = 0.25 + cha / 200;
        if (Math.random() > chance) {
            faction.gold -= Math.floor(cost / 2); // partial cost even on failure
            return { success: false, msg: `${captive.name}不愿归降，消耗 ${Math.floor(cost/2)} 金` };
        }
        faction.gold -= cost;
        captive.status = 'idle';
        captive.faction = city.owner;
        captive.loyalty = 40 + Math.floor(Math.random() * 20);
        captive.soldiers = 300;
        captive.originalFaction = null;
        gameState._assignSkills(captive);
        if (!city.generals.includes(captive.id)) city.generals.push(captive.id);
        return { success: true, msg: `${captive.name}归降！消耗 ${cost} 金`, general: captive };
    }

    // Execute a captured general — gains gold (ransom), removes prisoner
    static executeCaptive(gameState, cityId, captiveId) {
        const city = gameState.getCity(cityId);
        const captive = gameState.getGeneral(captiveId);
        if (!city || !captive || captive.status !== 'captured' || captive.city !== cityId) {
            return { success: false, msg: '俘虏不在此城' };
        }
        const faction = gameState.getFaction(city.owner);
        const ransom = 200 + captive.level * 50;
        faction.gold += ransom;
        captive.status = 'dead';
        captive.city = null;
        captive.faction = 'none';
        return { success: true, msg: `斩杀 ${captive.name}，获得 ${ransom} 金` };
    }

    // Fortify city defenses
    static fortify(gameState, cityId) {
        const city = gameState.getCity(cityId);
        if (!city) return { success: false, msg: '城池不存在' };

        const faction = gameState.getFaction(city.owner);
        const cost = 1500;
        if (faction.gold < cost) return { success: false, msg: '金钱不足' };

        const generals = gameState.getGeneralsInCity(cityId);
        const bestLead = generals.reduce((best, g) => g.lead > (best?.lead || 0) ? g : best, null);
        if (!bestLead) return { success: false, msg: '城中无武将执行' };

        faction.gold -= cost;
        const boost = Math.floor(3 + bestLead.lead / 15);
        city.defense = Math.min(100, city.defense + boost);
        bestLead.exp += 20;

        return { success: true, msg: `${bestLead.name}修筑城防，防御 +${boost}` };
    }

    // Assign soldiers to a general
    static assignSoldiers(gameState, generalId, amount) {
        const general = gameState.getGeneral(generalId);
        if (!general || !general.city) return { success: false, msg: '武将不在城中' };

        const city = gameState.getCity(general.city);
        if (!city) return { success: false, msg: '城池不存在' };

        const maxAssign = Math.min(amount, city.soldiers, general.lead * 50 - general.soldiers);
        if (maxAssign <= 0) return { success: false, msg: '无法分配更多士兵' };

        city.soldiers -= maxAssign;
        general.soldiers += maxAssign;

        return { success: true, msg: `${general.name}获得 ${maxAssign} 士兵` };
    }

    // Level up check — 委托给 generalUtils.checkLevelUp
    static checkLevelUp(general, gameState) {
        return _checkLevelUp(general, gameState);
    }
}
