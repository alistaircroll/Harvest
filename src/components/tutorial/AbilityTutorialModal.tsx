/**
 * AbilityTutorialModal Component
 * 
 * Displays an educational popup when the player first encounters
 * a creature with a special ability.
 */

import React from 'react';
import type { Attack, AnimalType } from '../../types';
import './tutorial.css';

interface AbilityTutorialModalProps {
    /** The ability being explained */
    ability: Attack;
    /** The creature type that has this ability */
    creatureType: AnimalType;
    /** Handler for when user dismisses the tutorial */
    onDismiss: () => void;
    /** Current tutorial index (for multi-ability sequences) */
    currentIndex?: number;
    /** Total number of tutorials in sequence */
    totalCount?: number;
}

// Emoji icons for different effect types
const EFFECT_ICONS: Record<string, string> = {
    bleed: '🩸',
    dot: '🔥',
    heal: '💚',
    buff_evasion: '💨',
    buff_defense: '🛡️',
    debuff_defense: '⬇️',
    debuff_accuracy: '🌀',
    debuff_ap: '⚡',
    execute: '💀',
    mark: '🎯',
};

// Creature display names
const CREATURE_NAMES: Record<AnimalType, string> = {
    rat: 'Rat',
    squirrel: 'Squirrel',
    cat: 'Cat',
    dog: 'Dog',
    skunk: 'Skunk',
};

// Body part display names
const BODY_PART_NAMES: Record<string, string> = {
    head: 'Head',
    arms: 'Arms',
    legs: 'Legs',
    tail: 'Tail',
    torso: 'Torso',
};

export const AbilityTutorialModal: React.FC<AbilityTutorialModalProps> = ({
    ability,
    creatureType,
    onDismiss,
    currentIndex = 0,
    totalCount = 1,
}) => {
    // Get tutorial data from ability
    const tutorial = ability.tutorial;
    const effectType = ability.effect?.type || 'damage';
    const icon = EFFECT_ICONS[effectType] || '⚔️';

    const headline = tutorial?.headline || `New Ability: ${ability.name}!`;
    const description = tutorial?.description || ability.description || '';
    const bodyPart = tutorial?.bodyPart || 'body';

    return (
        <div className="tutorial-overlay">
            <div className="tutorial-modal">
                {/* Header */}
                <div className="tutorial-header">
                    <span className="tutorial-icon">⚠️</span>
                    <h2 className="tutorial-title">NEW ABILITY DISCOVERED!</h2>
                </div>

                {/* Creature info */}
                <div className="tutorial-creature">
                    The <strong>{CREATURE_NAMES[creatureType]}</strong> has a special ability:
                </div>

                {/* Ability card */}
                <div className="tutorial-ability-card">
                    <div className="tutorial-ability-header">
                        <span className="tutorial-ability-icon">{icon}</span>
                        <span className="tutorial-ability-name">{ability.name}</span>
                    </div>

                    <div className="tutorial-ability-meta">
                        <span className="tutorial-meta-item">
                            📍 {BODY_PART_NAMES[bodyPart] || bodyPart}
                        </span>
                        <span className="tutorial-meta-item">
                            ⚡ {ability.apCost} AP
                        </span>
                        {ability.damage > 0 && (
                            <span className="tutorial-meta-item">
                                💥 {ability.damage} DMG
                            </span>
                        )}
                    </div>

                    <p className="tutorial-ability-description">
                        "{description}"
                    </p>

                    <div className="tutorial-headline">
                        {headline}
                    </div>
                </div>

                {/* Pagination indicator */}
                {totalCount > 1 && (
                    <div className="tutorial-pagination">
                        {currentIndex + 1} of {totalCount}
                    </div>
                )}

                {/* Dismiss button */}
                <button
                    className="tutorial-dismiss-btn"
                    onClick={onDismiss}
                >
                    {currentIndex < totalCount - 1 ? 'Next →' : 'Got it! 👍'}
                </button>
            </div>
        </div>
    );
};

export default AbilityTutorialModal;
