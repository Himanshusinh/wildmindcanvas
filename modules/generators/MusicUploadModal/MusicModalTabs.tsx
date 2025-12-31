'use client';
import React from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

export type MusicCategory = 'music' | 'voice' | 'dialogue' | 'sfx' | 'voice-cloning' | null;

interface MusicModalTabsProps {
    activeCategory: MusicCategory;
    onCategoryChange: (category: Exclude<MusicCategory, null>) => void;
    scale: number;
}

export const MusicModalTabs: React.FC<MusicModalTabsProps> = ({
    activeCategory,
    onCategoryChange,
    scale,
}) => {
    const isDark = useIsDarkTheme();

    const categories: { id: Exclude<MusicCategory, null>; label: string }[] = [
        { id: 'music', label: 'Music' },
        { id: 'voice', label: 'Voice (TTS)' },
        { id: 'dialogue', label: 'Dialogue' },
        { id: 'sfx', label: 'SFX' },
        { id: 'voice-cloning', label: 'Voice Cloning' },
    ];

    const buttonBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
    const buttonHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                gap: `${8 * scale}px`,
                justifyContent: 'center',
                boxSizing: 'border-box',
                padding: `${4 * scale}px`,
            }}
        >
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    style={{
                        padding: `${10 * scale}px ${16 * scale}px`,
                        borderRadius: `${24 * scale}px`,
                        border: `1px solid ${borderColor}`,
                        backgroundColor: buttonBg,
                        color: textColor,
                        fontSize: `${13 * scale}px`,
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',

                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 ${1 * scale}px ${2 * scale}px rgba(0, 0, 0, 0.05)`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = buttonHoverBg;
                        e.currentTarget.style.transform = `translateY(${-1 * scale}px)`;
                        e.currentTarget.style.boxShadow = `0 ${2 * scale}px ${4 * scale}px rgba(0, 0, 0, 0.1)`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = buttonBg;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 ${1 * scale}px ${2 * scale}px rgba(0, 0, 0, 0.05)`;
                    }}
                >
                    {cat.label}
                </button>
            ))}
        </div>
    );
};
