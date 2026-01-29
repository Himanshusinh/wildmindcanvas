'use client';

import React from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

const CATEGORIES = [
  { value: 'view-morph', label: 'View Morph' },
  { value: 'multiview', label: 'MultiView' },
];

interface CategorySwitchProps {
  selectedCategory: string;
  scale: number;
  onCategoryChange: (category: string) => void;
}

export const CategorySwitch: React.FC<CategorySwitchProps> = ({
  selectedCategory,
  scale,
  onCategoryChange,
}) => {
  const isDark = useIsDarkTheme();

  const containerBg = isDark ? '#1a1a1a' : '#f3f4f6';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.3)' : '#3B82F64D';
  const selectedText = isDark ? '#ffffff' : '#1f2937';
  const unselectedText = isDark ? '#999999' : '#6b7280';
  const unselectedHoverText = isDark ? '#cccccc' : '#1f2937';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${8 * scale}px`,
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: `${8 * scale}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            backgroundColor: containerBg,
            borderRadius: `${6 * scale}px`,
            padding: `${3 * scale}px`,
            gap: `${3 * scale}px`,
            position: 'relative',
            transition: 'background-color 0.3s ease',
            maxWidth: '280px',
            margin: '0 auto',
          }}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.value;
            return (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              style={{
                flex: 1,
                padding: `${6 * scale}px ${10 * scale}px`,
                borderRadius: `${6 * scale}px`,
                fontSize: `${11 * scale}px`,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: isSelected ? selectedBg : 'transparent',
                color: isSelected ? selectedText : unselectedText,
                boxShadow: isSelected ? (isDark ? `0 ${2 * scale}px ${4 * scale}px rgba(0, 0, 0, 0.3)` : `0 ${2 * scale}px ${4 * scale}px rgba(0, 0, 0, 0.1)`) : 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.color = unselectedHoverText;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.color = unselectedText;
                  }
                }}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

