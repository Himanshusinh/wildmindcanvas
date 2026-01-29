'use client';

import React from 'react';

interface GenerateArrowIconProps {
    scale?: number;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Standardized right-facing arrow icon for generative actions.
 * Maintains consistency in shape, stroke width (2.5), and design across the app.
 */
export const GenerateArrowIcon: React.FC<GenerateArrowIconProps> = ({
    scale = 1,
    size = 18,
    className,
    style,
}) => {
    const finalSize = size * scale;

    return (
        <svg
            width={finalSize}
            height={finalSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
        >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    );
};
