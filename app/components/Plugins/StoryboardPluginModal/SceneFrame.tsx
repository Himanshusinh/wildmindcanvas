'use client';

import { useState, useEffect } from 'react';

interface SceneFrameProps {
    scale: number;
    sceneNumber: number;
    sceneContent: string;
    isDark?: boolean;
}

export const SceneFrame: React.FC<SceneFrameProps> = ({
    scale,
    sceneNumber,
    sceneContent,
    isDark: externalIsDark,
}) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Use external isDark if provided, otherwise use internal state
    const themeIsDark = externalIsDark !== undefined ? externalIsDark : isDark;

    // Theme colors
    const bgColor = themeIsDark ? '#1a1a1a' : '#ffffff';
    const textColor = themeIsDark ? '#ffffff' : '#1f2937';
    const borderColor = themeIsDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
    const accentColor = themeIsDark ? '#60a5fa' : '#3b82f6';
    const secondaryTextColor = themeIsDark ? '#cccccc' : '#6b7280';

    return (
        <div
            style={{
                width: '100%',
                minHeight: `${200 * scale}px`,
                maxHeight: `${350 * scale}px`,
                backgroundColor: bgColor,
                border: `${2 * scale}px solid ${borderColor}`,
                borderRadius: `${12 * scale}px`,
                padding: `${16 * scale}px`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
            }}
        >
            {/* Header with scene number */}
            <div
                style={{
                    marginBottom: `${12 * scale}px`,
                    paddingBottom: `${8 * scale}px`,
                    borderBottom: `${1 * scale}px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: `${8 * scale}px`,
                }}
            >
                <div
                    style={{
                        width: `${32 * scale}px`,
                        height: `${32 * scale}px`,
                        borderRadius: '50%',
                        backgroundColor: accentColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: `${14 * scale}px`,
                        fontWeight: 700,
                    }}
                >
                    {sceneNumber}
                </div>
                <h4
                    style={{
                        margin: 0,
                        fontSize: `${15 * scale}px`,
                        fontWeight: 600,
                        color: textColor,
                        letterSpacing: '0.3px',
                    }}
                >
                    Scene {sceneNumber}
                </h4>
            </div>

            {/* Scene Content */}
            <div
                className="scene-frame-content"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: `${8 * scale}px 0`,
                    scrollbarWidth: 'thin',
                    scrollbarColor: themeIsDark
                        ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)',
                }}
            >
                {sceneContent ? (
                    <div
                        style={{
                            fontSize: `${13 * scale}px`,
                            lineHeight: `${20 * scale}px`,
                            color: textColor,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                        }}
                    >
                        {sceneContent}
                    </div>
                ) : (
                    <div
                        style={{
                            fontSize: `${13 * scale}px`,
                            lineHeight: `${20 * scale}px`,
                            color: secondaryTextColor,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            padding: `${40 * scale}px 0`,
                        }}
                    >
                        No scene content available.
                    </div>
                )}
            </div>
        </div>
    );
};
