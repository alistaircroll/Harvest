/**
 * Creature Loader
 * 
 * Loads and validates wild creature data from creatures.json
 * Provides type-safe access to wild creature definitions
 */

import creaturesData from '../game-data/creatures.json';
import { bodyPartLoader } from './bodyPartLoader';
import { attackLoader } from './attackLoader';
import type { WildCreatureDefinition, WildCreature, AnimalType, Biome } from '../../types';

class CreatureLoader {
    private definitions: Map<string, WildCreatureDefinition> = new Map();
    private definitionsByBiome: Map<Biome, WildCreatureDefinition[]> = new Map();

    constructor() {
        this.load();
    }

    private load() {
        // Load all creature definitions
        for (const [biome, creatures] of Object.entries(creaturesData.wildCreatures)) {
            const biomeCreatures: WildCreatureDefinition[] = [];

            for (const data of creatures) {
                const definition: WildCreatureDefinition = {
                    type: data.type as AnimalType,
                    totalHp: data.totalHp,
                    defense: data.defense,
                    apPerTurn: data.apPerTurn,
                    attacks: attackLoader.getAttacks(data.attacks),
                };

                this.definitions.set(data.id, definition);
                biomeCreatures.push(definition);
            }

            this.definitionsByBiome.set(biome as Biome, biomeCreatures);
        }

        console.log(`✅ Loaded ${this.definitions.size} wild creature definitions across ${this.definitionsByBiome.size} biomes`);
    }

    /**
     * Get creature definition by type and biome
     */
    getDefinition(type: AnimalType, biome: Biome = 'city'): WildCreatureDefinition {
        const creatures = this.definitionsByBiome.get(biome) || [];
        const definition = creatures.find(c => c.type === type);

        if (!definition) {
            throw new Error(`No wild creature of type ${type} found in biome ${biome}`);
        }

        return definition;
    }

    /**
     * Get all definitions for a biome
     */
    getDefinitionsByBiome(biome: Biome): WildCreatureDefinition[] {
        return this.definitionsByBiome.get(biome) || [];
    }

    /**
     * Create a wild creature instance for combat
     */
    createWildCreature(
        type: AnimalType,
        biome: Biome = 'city',
        difficultyMultiplier: number = 1.0
    ): WildCreature {
        const definition = this.getDefinition(type, biome);

        const scaledHp = Math.floor(definition.totalHp * difficultyMultiplier);
        const scaledDefense = Math.floor(definition.defense * difficultyMultiplier);

        return {
            type: definition.type,
            biome,
            totalHp: scaledHp,
            currentHp: scaledHp,
            defense: scaledDefense,
            apPerTurn: definition.apPerTurn,
            attacks: definition.attacks,
            activeEffects: [],
            lootTable: {
                torso: bodyPartLoader.getTorso(type),
                head: bodyPartLoader.getHead(type),
                arm: bodyPartLoader.getArm(type),
                leg: bodyPartLoader.getLeg(type),
                tail: bodyPartLoader.getTail(type),
            },
        };
    }

    /**
     * Get random creatures for encounter selection
     */
    getRandomEncounters(biome: Biome, count: number = 3): AnimalType[] {
        const available = this.getDefinitionsByBiome(biome);

        if (available.length === 0) {
            throw new Error(`No creatures available in biome ${biome}`);
        }

        const encounters: AnimalType[] = [];

        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            encounters.push(available[randomIndex].type);
        }

        return encounters;
    }

    /**
     * Get all creature types available in a biome
     */
    getAvailableCreatures(biome: Biome): AnimalType[] {
        return this.getDefinitionsByBiome(biome).map(c => c.type);
    }
}

// Singleton instance
export const creatureLoader = new CreatureLoader();

// Export factory functions that match the old API
export const wildCreatureDefinitions = {
    city: creatureLoader.getDefinitionsByBiome('city'),
    woods: creatureLoader.getDefinitionsByBiome('woods'),
    pond: creatureLoader.getDefinitionsByBiome('pond'),
    beach: creatureLoader.getDefinitionsByBiome('beach'),
    jungle: creatureLoader.getDefinitionsByBiome('jungle'),
};

export const createWildCreature = creatureLoader.createWildCreature.bind(creatureLoader);
export const getRandomEncounters = creatureLoader.getRandomEncounters.bind(creatureLoader);
export const getAvailableCreatures = creatureLoader.getAvailableCreatures.bind(creatureLoader);
export const getCreatureDefinition = creatureLoader.getDefinition.bind(creatureLoader);
