'use client';

import React, { useState, useEffect } from 'react';
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva';
import { GroupContainerState } from '@/core/types/groupContainer';
import { Html } from 'react-konva-utils';
import { Palette, Highlighter, Ungroup, ChevronDown, Droplets, Minus, Plus } from 'lucide-react';
import { CanvasImage } from './CanvasImage';

interface GroupContainerOverlayProps {
    groups: GroupContainerState[];
    scale: number;
    position: { x: number; y: number };
    selectedGroupIds: string[];
    onGroupMove: (groupId: string, newX: number, newY: number) => void;
    onGroupDrag?: (groupId: string, newX: number, newY: number) => void;
    onGroupDragStart?: (groupId: string, startX: number, startY: number) => void;
    onGroupUpdate: (groupId: string, updates: Record<string, any>) => void;
    onGroupSelect?: (groupId: string) => void;
    onUngroup?: (groupId: string) => void;
    getItemBounds: (id: string) => { x: number; y: number; width: number; height: number } | null;
    images: any[];
    videoModalStates?: any[];
    textInputStates?: any[];
    musicModalStates?: any[];
    upscaleModalStates?: any[];
    multiangleCameraModalStates?: any[];
    removeBgModalStates?: any[];
    eraseModalStates?: any[];
    expandModalStates?: any[];
    vectorizeModalStates?: any[];
    nextSceneModalStates?: any[];
    compareModalStates?: any[];
    storyboardModalStates?: any[];
    scriptFrameModalStates?: any[];
    sceneFrameModalStates?: any[];
    canvasTextStates?: any[];
    onChildSelect?: (elementId: string, type: string) => void;
    stageRef?: React.RefObject<any>;
    onPersistMove?: (type: string, id: string, updates: any) => void;
}

export const GroupContainerOverlay: React.FC<GroupContainerOverlayProps> = ({
    groups,
    scale,
    position,
    selectedGroupIds,
    onGroupMove,
    onGroupUpdate,
    onGroupSelect,
    onUngroup,
    onGroupDrag,
    onGroupDragStart,
    getItemBounds,
    images,
    videoModalStates = [],
    textInputStates = [],
    musicModalStates = [],
    upscaleModalStates = [],
    multiangleCameraModalStates = [],
    removeBgModalStates = [],
    eraseModalStates = [],
    expandModalStates = [],
    vectorizeModalStates = [],
    nextSceneModalStates = [],
    compareModalStates = [],
    storyboardModalStates = [],
    scriptFrameModalStates = [],
    sceneFrameModalStates = [],
    canvasTextStates = [],
    onChildSelect,
    stageRef,
    onPersistMove,
}) => {
    const selectedGroupId = selectedGroupIds.length === 1 ? selectedGroupIds[0] : null;
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');

    return (
        <>
            {groups.map(group => {
                const isSelected = selectedGroupIds.includes(group.id);
                const isToolbarVisible = isSelected && selectedGroupId === group.id;
                const isEditing = editingGroupId === group.id;
                const groupName = (group && group.meta && typeof group.meta.name === 'string') ? group.meta.name : '';

                // ... (existing helper formatColor)
                const bgColor = group.meta.color || 'rgba(59, 130, 246, 0.1)';
                const strokeColor = group.meta.color ? (group.meta.color === 'rgba(59, 130, 246, 0.1)' ? '#3b82f6' : group.meta.color) : '#3b82f6';

                // ... (existing logic for scale)
                const padding = 12;
                const MAX_UI_SCALE = 3;
                const inverseScale = 1 / Math.max(scale, 0.001);
                const uiScale = Math.min(inverseScale, MAX_UI_SCALE);

                const handleNameSave = () => {
                    if (tempName.trim() && tempName !== groupName) {
                        onGroupUpdate(group.id, { name: tempName.trim() });
                    }
                    setEditingGroupId(null);
                };

                return (
                    // ... (keep Group component props)
                    <Group
                        key={group.id}
                        x={group.x}
                        y={group.y}
                        draggable
                        onDragStart={(e) => {
                            const node = e.target;
                            if (onGroupDragStart) onGroupDragStart(group.id, node.x(), node.y());
                        }}
                        onDragMove={(e) => {
                            const node = e.target;
                            if (onGroupDrag) onGroupDrag(group.id, node.x(), node.y());
                        }}
                        onDragEnd={(e) => {
                            const node = e.target;
                            onGroupMove(group.id, node.x(), node.y());
                        }}
                        onClick={(e) => {
                            e.cancelBubble = true;
                            if (onGroupSelect) {
                                onGroupSelect(group.id);
                            }
                        }}
                        onTap={(e) => {
                            e.cancelBubble = true;
                            if (onGroupSelect) {
                                onGroupSelect(group.id);
                            }
                        }}
                    >

                        {/* Container box */}
                        <Rect
                            width={group.width}
                            height={group.height}
                            stroke={strokeColor}
                            strokeWidth={1.5}
                            fill={bgColor}
                            listening={true}
                            cornerRadius={20}
                            dash={[0, 0]} // Solid line
                            opacity={0.9}
                            hitStrokeWidth={20} // Easier to grab border
                        />

                        {/* Group name label - Html overlay for glassmorphism style */}
                        <Html
                            divProps={{
                                style: {
                                    pointerEvents: 'none',
                                }
                            }}
                        >
                            <div style={{ pointerEvents: 'auto' }}>
                                <style>
                                    {`
                                    .group-label {
                                        position: absolute;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                        background: rgba(26, 26, 26, 0.85); /* Slightly more transparent */
                                        backdrop-filter: blur(8px);
                                        -webkit-backdrop-filter: blur(8px);
                                        border: 1px solid rgba(255, 255, 255, 0.1);
                                        border-radius: 6px;
                                        padding: 4px 10px;
                                        transform: translateY(-100%) scale(${uiScale});
                                        transform-origin: bottom left;
                                        left: 0;
                                        top: -8px; /* Gap from border */
                                        width: max-content;
                                        max-width: 300px;
                                        cursor: text;
                                    }
                                    .group-label:hover {
                                        background: rgba(26, 26, 26, 0.95);
                                        border-color: rgba(255, 255, 255, 0.2);
                                    }
                                    .group-color-indicator {
                                        width: 8px;
                                        height: 8px;
                                        border-radius: 50%;
                                        flex-shrink: 0;
                                    }
                                    .group-name-text {
                                        color: #fff;
                                        font-family: inherit;
                                        font-size: 13px;
                                        font-weight: 500;
                                        white-space: nowrap;
                                        overflow: hidden;
                                        text-overflow: ellipsis;
                                    }
                                    .group-name-input {
                                        background: transparent;
                                        border: none;
                                        color: #fff;
                                        font-family: inherit;
                                        font-size: 13px;
                                        font-weight: 500;
                                        padding: 0;
                                        margin: 0;
                                        outline: none;
                                        width: 120px;
                                    }
                                    `}
                                </style>
                                <div
                                    className="group-label"
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingGroupId(group.id);
                                        setTempName(groupName);
                                    }}
                                >
                                    <div
                                        className="group-color-indicator"
                                        style={{ backgroundColor: group.meta.color || '#3b82f6' }}
                                    />
                                    {isEditing ? (
                                        <input
                                            className="group-name-input"
                                            value={tempName}
                                            autoFocus
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={handleNameSave}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleNameSave();
                                                }
                                                if (e.key === 'Escape') {
                                                    setEditingGroupId(null);
                                                }
                                                e.stopPropagation();
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="group-name-text">
                                            {groupName || 'Untitled Group'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Html>

                        {/* Floating Toolbar using Html overlay */}
                        {isToolbarVisible && (
                            <Html
                                divProps={{
                                    style: {
                                        pointerEvents: 'none',
                                    }
                                }}
                            >
                                <div style={{ pointerEvents: 'auto' }}>
                                    <style>
                                        {`
                                        .group-toolbar {
                                            position: absolute;
                                            display: flex;
                                            align-items: center;
                                            gap: 6px;
                                            background: rgba(26, 26, 26, 0.95);
                                            backdrop-filter: blur(10px);
                                            -webkit-backdrop-filter: blur(10px);
                                            border: 1px solid rgba(255, 255, 255, 0.1);
                                            border-radius: 10px;
                                            padding: 8px 12px;
                                            z-index: 1000;
                                            box-shadow: 
                                                0 4px 6px -1px rgba(0, 0, 0, 0.1),
                                                0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                            transform: translate(-50%, -100%) scale(${uiScale});
                                            transform-origin: bottom center;
                                            left: ${group.width / 2}px;
                                            top: -45px;
                                            min-width: max-content;
                                            animation: fadeIn 0.15s ease-out;
                                        }
                                        @keyframes fadeIn {
                                            from { opacity: 0; transform: translate(-50%, -90%) scale(${uiScale}); }
                                            to { opacity: 1; transform: translate(-50%, -100%) scale(${uiScale}); }
                                        }
                                        .toolbar-btn {
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            width: 36px;
                                            height: 36px;
                                            border-radius: 8px;
                                            border: 1px solid transparent;
                                            background: transparent;
                                            color: #a1a1aa;
                                            cursor: pointer;

                                        }
                                        .toolbar-btn:hover {
                                            background: rgba(255, 255, 255, 0.1);
                                            color: #fff;
                                            border-color: rgba(255, 255, 255, 0.1);
                                        }
                                        .toolbar-divider {
                                            width: 1px;
                                            height: 20px;
                                            background: rgba(255, 255, 255, 0.15);
                                            margin: 0 2px;
                                        }
                                        .color-picker-wrapper {
                                            position: relative;
                                            display: flex;
                                            align-items: center;
                                            gap: 8px;
                                        }
                                        .color-picker-input {
                                            position: absolute;
                                            opacity: 0;
                                            width: 36px; /* Match button width */
                                            height: 36px;
                                            cursor: pointer;
                                            left: 0;
                                            top: 0;
                                            z-index: 10;
                                        }
                                        .opacity-control {
                                            display: flex;
                                            align-items: center;
                                            gap: 2px;
                                            background: rgba(255, 255, 255, 0.05);
                                            border-radius: 6px;
                                            padding: 2px;
                                            margin: 0 4px;
                                        }
                                        .opacity-btn {
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            width: 24px;
                                            height: 24px;
                                            border: none;
                                            background: transparent;
                                            color: #a1a1aa;
                                            cursor: pointer;
                                            border-radius: 4px;
                                        }
                                        .opacity-btn:hover {
                                            background: rgba(255, 255, 255, 0.1);
                                            color: #fff;
                                        }
                                        `}
                                    </style>

                                    <div className="group-toolbar" onMouseDown={(e) => e.stopPropagation()}>
                                        {/* Color Picker & Opacity */}
                                        <div className="color-picker-wrapper">
                                            {(() => {
                                                const parseColor = (colorStr: string) => {
                                                    if (!colorStr) return { hex: '#3b82f6', opacity: 0.1 };
                                                    if (colorStr.startsWith('#')) return { hex: colorStr, opacity: 1 };
                                                    if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
                                                        const match = colorStr.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
                                                        if (match) {
                                                            const r = parseInt(match[1]);
                                                            const g = parseInt(match[2]);
                                                            const b = parseInt(match[3]);
                                                            const a = match[4] ? parseFloat(match[4]) : 1;
                                                            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                                                            return { hex, opacity: a };
                                                        }
                                                    }
                                                    return { hex: '#3b82f6', opacity: 0.1 };
                                                };

                                                const hexToRgba = (hex: string, alpha: number) => {
                                                    const r = parseInt(hex.slice(1, 3), 16);
                                                    const g = parseInt(hex.slice(3, 5), 16);
                                                    const b = parseInt(hex.slice(5, 7), 16);
                                                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                                                };

                                                const { hex, opacity } = parseColor(group.meta.color || 'rgba(59, 130, 246, 0.1)');

                                                return (
                                                    <>
                                                        <div style={{ position: 'relative', width: 36, height: 36 }}>
                                                            <button className="toolbar-btn" title="Background Color">
                                                                <Highlighter size={20} style={{ color: hex }} />
                                                            </button>
                                                            <input
                                                                type="color"
                                                                className="color-picker-input"
                                                                value={hex}
                                                                onChange={(e) => {
                                                                    const newColor = hexToRgba(e.target.value, opacity);
                                                                    onGroupUpdate(group.id, { color: newColor });
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Opacity Control: [-] [Icon] [+] */}
                                                        <div className="opacity-control">
                                                            <button
                                                                className="opacity-btn"
                                                                onClick={() => {
                                                                    const newOpacity = Math.max(0, opacity - 0.1);
                                                                    onGroupUpdate(group.id, { color: hexToRgba(hex, newOpacity) });
                                                                }}
                                                                title="Decrease Opacity"
                                                            >
                                                                <Minus size={14} />
                                                            </button>

                                                            <div
                                                                style={{ padding: '0 4px', color: '#a1a1aa', cursor: 'default' }}
                                                                title={`Current Opacity: ${Math.round(opacity * 100)}%`}
                                                            >
                                                                <Droplets size={16} />
                                                            </div>

                                                            <button
                                                                className="opacity-btn"
                                                                onClick={() => {
                                                                    const newOpacity = Math.min(1, opacity + 0.1);
                                                                    onGroupUpdate(group.id, { color: hexToRgba(hex, newOpacity) });
                                                                }}
                                                                title="Increase Opacity"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>

                                                        {/* Reset Button */}
                                                        {group.meta.color && group.meta.color !== 'rgba(59, 130, 246, 0.1)' && (
                                                            <button
                                                                className="toolbar-btn"
                                                                style={{ fontSize: '16px', width: '24px', height: '24px', minHeight: 'unset', marginLeft: '4px' }}
                                                                onClick={() => onGroupUpdate(group.id, { color: 'rgba(59, 130, 246, 0.1)' })}
                                                                title="Reset Color & Opacity"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="toolbar-divider" />

                                        {/* Ungroup Button */}
                                        {onUngroup && (
                                            <button
                                                className="toolbar-btn"
                                                onClick={() => onUngroup(group.id)}
                                                title="Ungroup"
                                                style={{ color: '#ef4444' }}
                                            >
                                                <Ungroup size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Html>
                        )}
                    </Group>
                );
            })}
        </>
    );
};
