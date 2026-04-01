// 事件系统
export default class EventSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.triggeredStoryEvents = new Set();
        // 记录本局已触发过的随机事件 id，防止同一随机事件反复出现
        this.triggeredRandomEvents = new Set();
    }

    // Process events at end of turn
    processEvents() {
        const gs = this.gameState;
        const triggered = [];

        // Check random events（过滤本局已触发过的，避免同一事件反复出现）
        if (Math.random() < 0.3) {
            const randomEvents = gs.events.filter(e => e.type === 'random' && !this.triggeredRandomEvents.has(e.id));
            if (randomEvents.length > 0) {
                const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
                this.triggeredRandomEvents.add(event.id);
                triggered.push(this._applyEvent(event));
            }
        }

        // Check story events
        for (const event of gs.events) {
            if (event.type !== 'story') continue;
            if (this.triggeredStoryEvents.has(event.id)) continue;
            if (this._checkCondition(event.condition)) {
                this.triggeredStoryEvents.add(event.id);
                triggered.push(event);
            }
        }

        return triggered;
    }

    _checkCondition(condition) {
        if (!condition) return false;
        const gs = this.gameState;

        switch (condition.type) {
            case 'turn_range':
                return gs.turn >= condition.params.min && gs.turn <= condition.params.max;
            case 'faction':
                return gs.playerFaction === condition.params.factionId;
            case 'generals_in_city': {
                const city = gs.getCity(condition.params.cityId);
                if (!city) return false;
                return condition.params.generalIds.every(gid =>
                    city.generals.includes(gid)
                );
            }
            case 'fame': {
                const pf = gs.getPlayerFaction();
                return pf && pf.fame >= condition.params.min;
            }
            case 'cities_count': {
                const cities = gs.getCitiesOf(gs.playerFaction);
                return cities.length >= condition.params.min;
            }
            default:
                return false;
        }
    }

    _applyEvent(event) {
        const gs = this.gameState;
        const playerFaction = gs.getPlayerFaction();
        const playerCities = gs.getCitiesOf(gs.playerFaction);

        if (!event.effects || playerCities.length === 0) return event;

        for (const effect of event.effects) {
            const targetCity = playerCities[Math.floor(Math.random() * playerCities.length)];

            switch (effect.type) {
                case 'gold':
                    playerFaction.gold = Math.max(0, playerFaction.gold + effect.value);
                    break;
                case 'food':
                    playerFaction.food = Math.max(0, playerFaction.food + effect.value);
                    break;
                case 'population':
                    if (targetCity) targetCity.population = Math.max(1000, targetCity.population + effect.value);
                    break;
                case 'agriculture':
                    if (targetCity) targetCity.agriculture = Math.max(0, Math.min(100, targetCity.agriculture + effect.value));
                    break;
                case 'morale':
                    if (targetCity) targetCity.morale = Math.max(0, Math.min(100, targetCity.morale + effect.value));
                    break;
                case 'loyalty': {
                    const generals = gs.getGeneralsOf(gs.playerFaction);
                    for (const gen of generals) {
                        gen.loyalty = Math.max(0, Math.min(100, gen.loyalty + effect.value));
                    }
                    break;
                }
                case 'fame': {
                    playerFaction.fame = Math.max(0, Math.min(100, playerFaction.fame + effect.value));
                    break;
                }
                case 'general_join': {
                    // A random unaffiliated general joins
                    const unaffiliated = gs.getUnaffiliatedGenerals();
                    if (unaffiliated.length > 0) {
                        const gen = unaffiliated[Math.floor(Math.random() * unaffiliated.length)];
                        gen.faction = gs.playerFaction;
                        gen.loyalty = 70;
                        gen.status = 'idle';
                        if (playerCities.length > 0) {
                            gen.city = playerCities[0].id;
                            playerCities[0].generals.push(gen.id);
                        }
                    }
                    break;
                }
            }
        }

        return event;
    }

    // Apply player choice
    applyChoice(event, choiceIndex) {
        if (!event.choices || !event.choices[choiceIndex]) return;
        const choice = event.choices[choiceIndex];
        if (choice.effects) {
            for (const effect of choice.effects) {
                this._applyEvent({ effects: [effect] });
            }
        }
    }
}
