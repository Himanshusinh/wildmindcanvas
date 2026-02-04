'use client';

import React from 'react';

export function PluginNodeShell(props: {
  id?: string;
  modalKey?: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  screenX: number;
  screenY: number;
  isHovered?: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
  style?: React.CSSProperties;
  scale?: number;
  width?: number;
  children: React.ReactNode;
}) {
  const {
    id,
    modalKey,
    containerRef,
    screenX,
    screenY,
    isHovered = false,
    isSelected = false,
    isDimmed = false,
    onMouseDown,
    onPointerDown,
    onContextMenu,
    onMouseEnter,
    onMouseLeave,
    className,
    style,
    scale = 1,
    width = 110,
    children,
  } = props;

  return (
    <div
      ref={containerRef as any}
      data-modal-component={modalKey}
      data-overlay-id={id}
      onMouseDown={onMouseDown}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${width * scale}px`, // Predictable width
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: isHovered || isSelected ? 2001 : 2000,
        userSelect: 'none',
        opacity: isDimmed ? 0.4 : 1,
        transition: 'opacity 0.2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

