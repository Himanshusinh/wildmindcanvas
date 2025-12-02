'use client';

import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

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
    const internalIsDark = useIsDarkTheme();

    // Use external isDark if provided, otherwise use internal state
    const themeIsDark = externalIsDark !== undefined ? externalIsDark : internalIsDark;

    const textColor = themeIsDark ? '#ffffff' : '#1f2937';
    const secondaryTextColor = themeIsDark ? '#cccccc' : '#6b7280';

    return (
        <div
            style={{
                width: '100%',
                minHeight: `${200 * scale}px`,
                maxHeight: `${350 * scale}px`,
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
            }}
        >
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
