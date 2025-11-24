'use client';

import React, { useEffect, useState } from 'react';

interface ReplaceButtonProps {
  scale: number;
  isReplacing: boolean;
  externalIsReplacing?: boolean;
  sourceImageUrl: string | null;
  onReplace: () => void;
}

export const ReplaceButton: React.FC<ReplaceButtonProps> = ({
  scale,
  isReplacing,
  externalIsReplacing,
  sourceImageUrl,
  onReplace,
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

  const isDisabled = isReplacing || externalIsReplacing || !sourceImageUrl;
  const isActive = !isDisabled;
  const disabledBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <button
      onClick={onReplace}
      disabled={isDisabled}
      style={{
        minWidth: `${80 * scale}px`,
        height: `${40 * scale}px`,
        padding: `0 ${16 * scale}px`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isActive ? '#437eb5' : disabledBg,
        border: 'none',
        borderRadius: `${10 * scale}px`,
        cursor: isActive ? 'pointer' : 'not-allowed',
        color: 'white',
        boxShadow: isActive ? `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)` : 'none',
        opacity: (isReplacing || externalIsReplacing) ? 0.6 : 1,
        fontSize: `${14 * scale}px`,
        fontWeight: 500,
        transition: 'background-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        if (isActive) {
          e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        if (isActive) {
          e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isReplacing || externalIsReplacing ? (
        <span>Replacing...</span>
      ) : (
        <span>Replace</span>
      )}
    </button>
  );
};

