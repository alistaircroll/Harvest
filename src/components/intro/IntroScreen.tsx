/**
 * IntroScreen Component
 * 
 * Launch screen with title, backstory progression, and pet naming.
 * Creates an atmospheric introduction to the game.
 */

import { useState, useCallback } from 'react';
import './intro.css';

interface IntroScreenProps {
    onComplete: (petName: string) => void;
}

type IntroPhase = 'title' | 'story1' | 'story2' | 'naming';

const STORY_LINES = [
    "You're a lonely scientist. Locked up in your lab, you decide to build yourself a friend.",
    "Digging through your cabinets and jars, you begin work on your creation.",
];

export function IntroScreen({ onComplete }: IntroScreenProps) {
    const [phase, setPhase] = useState<IntroPhase>('title');
    const [petName, setPetName] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleContinue = useCallback(() => {
        setIsTransitioning(true);
        setTimeout(() => {
            switch (phase) {
                case 'title':
                    setPhase('story1');
                    break;
                case 'story1':
                    setPhase('story2');
                    break;
                case 'story2':
                    setPhase('naming');
                    break;
            }
            setIsTransitioning(false);
        }, 300);
    }, [phase]);

    const handleStart = useCallback(() => {
        const name = petName.trim() || 'Friend';
        onComplete(name);
    }, [petName, onComplete]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Limit to 15 characters
        const value = e.target.value.slice(0, 15);
        setPetName(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && petName.trim()) {
            handleStart();
        }
    };

    return (
        <div className={`intro-screen ${isTransitioning ? 'intro-screen--transitioning' : ''}`}>
            {/* Title Screen */}
            {phase === 'title' && (
                <div className="intro-screen__content intro-screen__content--title">
                    <h1 className="intro-screen__title">Stitch-a-Pet</h1>
                    <p className="intro-screen__tagline">
                        Build your lifelong companion<br />
                        <span className="intro-screen__tagline-emphasis">... one limb at a time.</span>
                    </p>
                    <button
                        className="intro-screen__button"
                        onClick={handleContinue}
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Story 1 */}
            {phase === 'story1' && (
                <div className="intro-screen__content intro-screen__content--story">
                    <p className="intro-screen__story-text">{STORY_LINES[0]}</p>
                    <button
                        className="intro-screen__button"
                        onClick={handleContinue}
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Story 2 */}
            {phase === 'story2' && (
                <div className="intro-screen__content intro-screen__content--story">
                    <p className="intro-screen__story-text">{STORY_LINES[1]}</p>
                    <button
                        className="intro-screen__button"
                        onClick={handleContinue}
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Naming Screen */}
            {phase === 'naming' && (
                <div className="intro-screen__content intro-screen__content--naming">
                    <p className="intro-screen__prompt">What will you name your creation?</p>
                    <input
                        type="text"
                        className="intro-screen__input"
                        value={petName}
                        onChange={handleNameChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter a name..."
                        maxLength={15}
                        autoFocus
                    />
                    <span className="intro-screen__char-count">{petName.length}/15</span>
                    <button
                        className="intro-screen__button intro-screen__button--start"
                        onClick={handleStart}
                        disabled={!petName.trim()}
                    >
                        START
                    </button>
                </div>
            )}
        </div>
    );
}

export default IntroScreen;
