/**
 * Attack Loader
 * 
 * Loads and validates attack data from attacks.json
 * Provides type-safe access to attack definitions
 */

import attacksData from '../game-data/attacks.json';
import type { Attack } from '../../types';

interface AttackData {
    id: string;
    name: string;
    apCost: number;
    damage: number;
    speed: number;
    effect: Attack['effect'];
    requiresBothLegs?: boolean;
    description?: string;
    tags?: string[];
}

class AttackLoader {
    private attacks: Map<string, Attack> = new Map();
    private attackData: Map<string, AttackData> = new Map();

    constructor() {
        this.load();
    }

    private load() {
        // Convert JSON to Attack objects
        for (const [id, data] of Object.entries(attacksData.attacks)) {
            // Store raw data for metadata
            this.attackData.set(id, data as AttackData);

            // Create Attack object with all fields from JSON
            const attack: Attack = {
                id,  // Preserve ID for tutorial tracking
                name: data.name,
                apCost: data.apCost,
                damage: data.damage,
                speed: data.speed,
                effect: data.effect as Attack['effect'],
            };

            // Add optional properties
            if ('requiresBothLegs' in data && data.requiresBothLegs) {
                attack.requiresBothLegs = data.requiresBothLegs;
            }
            if ('description' in data && data.description) {
                attack.description = data.description;
            }
            if ('tutorial' in data && data.tutorial) {
                attack.tutorial = data.tutorial as Attack['tutorial'];
            }

            this.attacks.set(id, attack);
        }

        console.log(`✅ Loaded ${this.attacks.size} attacks from attacks.json`);
    }

    /**
     * Get attack by ID
     */
    getAttack(id: string): Attack {
        const attack = this.attacks.get(id);
        if (!attack) {
            throw new Error(`Attack not found: ${id}. Available: ${Array.from(this.attacks.keys()).join(', ')}`);
        }
        return attack;
    }

    /**
     * Get multiple attacks by IDs
     */
    getAttacks(ids: string[]): Attack[] {
        return ids.map(id => this.getAttack(id));
    }

    /**
     * Get attacks by tags (for filtering/searching)
     */
    getAttacksByTags(tags: string[]): Attack[] {
        const results: Attack[] = [];

        for (const [id, data] of this.attackData.entries()) {
            if (data.tags && tags.some(tag => data.tags!.includes(tag))) {
                const attack = this.attacks.get(id);
                if (attack) {
                    results.push(attack);
                }
            }
        }

        return results;
    }

    /**
     * Get all attacks
     */
    getAllAttacks(): Attack[] {
        return Array.from(this.attacks.values());
    }

    /**
     * Get attack metadata (description, tags)
     */
    getAttackMetadata(id: string): AttackData | undefined {
        return this.attackData.get(id);
    }
}

// Singleton instance
export const attackLoader = new AttackLoader();
