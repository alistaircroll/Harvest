/**
 * Body Part Loader
 * 
 * Loads and validates body part data from body-parts.json
 * Provides type-safe access to body part definitions
 */

import bodyPartsData from '../game-data/body-parts.json';
import { attackLoader } from './attackLoader';
import type { HeadBodyPart, TorsoBodyPart, LimbBodyPart, AnimalType } from '../../types';

class BodyPartLoader {
    private heads: Map<AnimalType, HeadBodyPart> = new Map();
    private torsos: Map<AnimalType, TorsoBodyPart> = new Map();
    private arms: Map<AnimalType, LimbBodyPart> = new Map();
    private legs: Map<AnimalType, LimbBodyPart> = new Map();
    private tails: Map<AnimalType, LimbBodyPart> = new Map();

    constructor() {
        this.load();
    }

    private load() {
        // Load heads
        for (const [animal, data] of Object.entries(bodyPartsData.bodyParts.heads)) {
            this.heads.set(animal as AnimalType, {
                partType: 'head',
                animalType: data.animalType as AnimalType,
                hpBonus: data.hpBonus,
                defense: data.defense,
                speedBonus: data.speedBonus,
                attacks: attackLoader.getAttacks(data.attacks),
            });
        }

        // Load torsos
        for (const [animal, data] of Object.entries(bodyPartsData.bodyParts.torsos)) {
            this.torsos.set(animal as AnimalType, {
                partType: 'torso',
                animalType: data.animalType as AnimalType,
                hpBonus: data.hpBonus,
                defense: data.defense,
                attacks: attackLoader.getAttacks(data.attacks),
            });
        }

        // Load arms
        for (const [animal, data] of Object.entries(bodyPartsData.bodyParts.arms)) {
            this.arms.set(animal as AnimalType, {
                partType: 'arm',
                animalType: data.animalType as AnimalType,
                defense: data.defense,
                attacks: attackLoader.getAttacks(data.attacks),
            });
        }

        // Load legs
        for (const [animal, data] of Object.entries(bodyPartsData.bodyParts.legs)) {
            this.legs.set(animal as AnimalType, {
                partType: 'leg',
                animalType: data.animalType as AnimalType,
                defense: data.defense,
                attacks: attackLoader.getAttacks(data.attacks),
            });
        }

        // Load tails
        for (const [animal, data] of Object.entries(bodyPartsData.bodyParts.tails)) {
            this.tails.set(animal as AnimalType, {
                partType: 'tail',
                animalType: data.animalType as AnimalType,
                defense: data.defense,
                attacks: attackLoader.getAttacks(data.attacks),
            });
        }

        console.log(`✅ Loaded body parts: ${this.heads.size} heads, ${this.torsos.size} torsos, ${this.arms.size} arms, ${this.legs.size} legs, ${this.tails.size} tails`);
    }

    // Head getters
    getHead(animal: AnimalType): HeadBodyPart {
        const head = this.heads.get(animal);
        if (!head) throw new Error(`Head not found: ${animal}`);
        return head;
    }

    getAllHeads(): Record<AnimalType, HeadBodyPart> {
        return Object.fromEntries(this.heads) as Record<AnimalType, HeadBodyPart>;
    }

    // Torso getters
    getTorso(animal: AnimalType): TorsoBodyPart {
        const torso = this.torsos.get(animal);
        if (!torso) throw new Error(`Torso not found: ${animal}`);
        return torso;
    }

    getAllTorsos(): Record<AnimalType, TorsoBodyPart> {
        return Object.fromEntries(this.torsos) as Record<AnimalType, TorsoBodyPart>;
    }

    // Arm getters
    getArm(animal: AnimalType): LimbBodyPart {
        const arm = this.arms.get(animal);
        if (!arm) throw new Error(`Arm not found: ${animal}`);
        return arm;
    }

    getAllArms(): Record<AnimalType, LimbBodyPart> {
        return Object.fromEntries(this.arms) as Record<AnimalType, LimbBodyPart>;
    }

    // Leg getters
    getLeg(animal: AnimalType): LimbBodyPart {
        const leg = this.legs.get(animal);
        if (!leg) throw new Error(`Leg not found: ${animal}`);
        return leg;
    }

    getAllLegs(): Record<AnimalType, LimbBodyPart> {
        return Object.fromEntries(this.legs) as Record<AnimalType, LimbBodyPart>;
    }

    // Tail getters
    getTail(animal: AnimalType): LimbBodyPart {
        const tail = this.tails.get(animal);
        if (!tail) throw new Error(`Tail not found: ${animal}`);
        return tail;
    }

    getAllTails(): Record<AnimalType, LimbBodyPart> {
        return Object.fromEntries(this.tails) as Record<AnimalType, LimbBodyPart>;
    }
}

// Singleton instance
export const bodyPartLoader = new BodyPartLoader();

// Export convenience objects that match the old API
export const heads = bodyPartLoader.getAllHeads();
export const torsos = bodyPartLoader.getAllTorsos();
export const arms = bodyPartLoader.getAllArms();
export const legs = bodyPartLoader.getAllLegs();
export const tails = bodyPartLoader.getAllTails();
