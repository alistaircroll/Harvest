/**
 * DefeatScreen Component
 * 
 * Shows part loss after defeat.
 * If in death state (only head+torso), enables freezer access for recovery.
 */

import type { PlayerCreature, BodyPart } from '../../types';
import { CreatureDisplay } from '../creature/CreatureDisplay';
import { BodyPartCard } from '../creature/BodyPartCard';
import './screens.css';

interface DefeatScreenProps {
    lostPart: BodyPart | null;
    creature: PlayerCreature;
    onContinue: () => void;
}

export function DefeatScreen({
    lostPart,
    creature,
    onContinue
}: DefeatScreenProps) {
    return (
        <div className="defeat-screen">
            {/* Header */}
            <header className="result-header result-header--defeat">
                <h1 className="result-header__title">💀 DEFEAT 💀</h1>
                <p className="result-header__subtitle">
                    You lost a body part!
                </p>
            </header>

            {/* Lost Part */}
            {lostPart && (
                <section className="lost-part-section">
                    <h2 className="lost-part-section__title">Lost Part</h2>
                    <div className="lost-part-card">
                        <BodyPartCard
                            part={lostPart}
                            isInteractive={false}
                            compact={false}
                            showImage={true}
                        />
                        <div className="lost-part-card__overlay">
                            <span className="lost-part-card__cross">✕</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Creature Section */}
            <section className="creature-section">
                <h2 className="creature-section__title">Your Creature</h2>
                <CreatureDisplay
                    creature={creature}
                    isInteractive={false}
                    showStats={true}
                    isDraggable={false}
                />
            </section>

            {/* Actions */}
            <footer className="result-footer">
                <button
                    className="btn btn--primary btn--large"
                    onClick={onContinue}
                >
                    Return to Lab
                </button>
            </footer>
        </div>
    );
}

export default DefeatScreen;
