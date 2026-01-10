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

const COLORS = [
    '#FFFFFF', '#000000', '#F87171', '#FB923C',
    '#FBBF24', '#A3E635', '#34D399', '#22D3EE',
    '#3B82F6', '#818CF8', '#C084FC', '#F472B6',
    'transparent'
];

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
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    return (
        <>
            {groups.map(group => {
                const isSelected = selectedGroupIds.includes(group.id);
                const isToolbarVisible = isSelected && selectedGroupId === group.id;
                const isEditing = editingGroupId === group.id;
                const groupName = (group && group.meta && typeof group.meta.name === 'string') ? group.meta.name : '';

                const bgColor = group.meta.color || 'rgba(59, 130, 246, 0.1)';
                const strokeColor = group.meta.color && group.meta.color !== 'transparent'
                    ? (group.meta.color.startsWith('rgba(59, 130, 246, 0.1)') ? '#3b82f6' : group.meta.color.split(',')[0].replace('rgba', 'rgb'))
                    : '#3b82f6';

                // Simple helper to get display hex for indicator
                const getDisplayColor = (colorStr: string) => {
                    if (!colorStr || colorStr === 'transparent') return '#3b82f6';
                    if (colorStr.startsWith('#')) return colorStr;
                    if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
                        const match = colorStr.match(/(\d+),\s*(\d+),\s*(\d+)/);
                        if (match) {
                            const r = parseInt(match[1]);
                            const g = parseInt(match[2]);
                            const b = parseInt(match[3]);
                            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                        }
                    }
                    return '#3b82f6';
                };

                const padding = 12;
                const MAX_UI_SCALE = 3;
                const inverseScale = 1 / Math.max(scale, 0.001);
                const uiScale = Math.min(inverseScale, MAX_UI_SCALE);

                const handleNameSave = () => {
                    if (tempName.trim() && tempName !== groupName) {
                        onGroupUpdate(group.id, { meta: { ...group.meta, name: tempName.trim() } });
                    }
                    setEditingGroupId(null);
                };

                return (
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
                            stroke={strokeColor === 'transparent' ? '#3b82f6' : strokeColor}
                            strokeWidth={1.5}
                            fill={bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor}
                            listening={true}
                            cornerRadius={20}
                            dash={[0, 0]}
                            opacity={isSelected ? 1 : 0.7}
                            hitStrokeWidth={20}
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
                                        style={{ backgroundColor: getDisplayColor(group.meta.color || '') }}
                                    />
                                    {isEditing ? (
                                        <input
                                            className="group-name-input bg-transparent border-none color-white outline-none w-[120px]"
                                            value={tempName}
                                            autoFocus
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={handleNameSave}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleNameSave();
                                                if (e.key === 'Escape') setEditingGroupId(null);
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
                                            border-radius: 12px;
                                            padding: 8px 12px;
                                            z-index: 1000;
                                            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                                            transform: translate(-50%, -100%) scale(${uiScale});
                                            transform-origin: bottom center;
                                            left: ${group.width / 2}px;
                                            top: -45px;
                                            min-width: max-content;
                                            animation: toolbarFadeIn 0.2s ease-out;
                                        }
                                        @keyframes toolbarFadeIn {
                                            from { opacity: 0; transform: translate(-50%, -90%) scale(${uiScale}); }
                                            to { opacity: 1; transform: translate(-50%, -100%) scale(${uiScale}); }
                                        }
                                        .toolbar-grid-btn {
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                            gap: 2px;
                                            padding: 6px;
                                            border-radius: 8px;
                                            color: #a1a1aa;
                                            cursor: pointer;
                                            transition: all 0.2s;
                                        }
                                        .toolbar-grid-btn:hover {
                                            background: rgba(255, 255, 255, 0.1);
                                            color: #fff;
                                        }
                                        .color-grid-popover {
                                            position: absolute;
                                            bottom: 100%;
                                            left: 50%;
                                            transform: translateX(-50%);
                                            margin-bottom: 12px;
                                            background: rgba(26, 26, 26, 0.98);
                                            backdrop-blur: 12px;
                                            border: 1px solid rgba(255, 255, 255, 0.1);
                                            border-radius: 16px;
                                            padding: 12px;
                                            display: grid;
                                            grid-template-columns: repeat(4, 1fr);
                                            gap: 10px;
                                            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                                            z-index: 2000;
                                            animation: popoverScaleIn 0.15s ease-out;
                                        }
                                        @keyframes popoverScaleIn {
                                            from { opacity: 0; transform: translateX(-50%) scale(0.9); }
                                            to { opacity: 1; transform: translateX(-50%) scale(1); }
                                        }
                                        .color-swatch {
                                            width: 32px;
                                            height: 32px;
                                            border-radius: 50%;
                                            border: 2px solid transparent;
                                            cursor: pointer;
                                            transition: transform 0.2s;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            overflow: hidden;
                                        }
                                        .color-swatch:hover {
                                            transform: scale(1.1);
                                        }
                                        .no-color-line {
                                            width: 100%;
                                            height: 2px;
                                            background: #ef4444;
                                            transform: rotate(45deg);
                                        }
                                        `}
                                    </style>

                                    <div className="group-toolbar" onMouseDown={(e) => e.stopPropagation()}>
                                        <div className="relative">
                                            <button
                                                className={`toolbar-grid-btn ${isColorPickerOpen ? 'bg-white/10 text-white' : ''}`}
                                                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                                                title="Background Color"
                                            >
                                                <Palette size={20} />
                                                <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: getDisplayColor(group.meta.color || '') }} />
                                            </button>

                                            {isColorPickerOpen && (
                                                <div className="color-grid-popover">
                                                    {COLORS.map(color => (
                                                        <button
                                                            key={color}
                                                            className="color-swatch"
                                                            style={{ backgroundColor: color === 'transparent' ? 'rgba(255,255,255,0.05)' : color, border: color === 'transparent' ? '1px solid rgba(255,255,255,0.2)' : 'none' }}
                                                            onClick={() => {
                                                                const finalColor = color === 'transparent' ? 'transparent' : (color === '#FFFFFF' ? 'rgba(255,255,255,0.1)' : color.replace('#', 'rgba(') + ', 0.1)').replace('rgba(#', 'rgba(');
                                                                // Convert hex to rgba for the 0.1 opacity effect if desired, or just use hex
                                                                let updatedColor = color;
                                                                if (color !== 'transparent' && color.startsWith('#')) {
                                                                    const r = parseInt(color.slice(1, 3), 16);
                                                                    const g = parseInt(color.slice(3, 5), 16);
                                                                    const b = parseInt(color.slice(5, 7), 16);
                                                                    updatedColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
                                                                }

                                                                onGroupUpdate(group.id, { meta: { ...group.meta, color: updatedColor } });
                                                                setIsColorPickerOpen(false);
                                                            }}
                                                        >
                                                            {color === 'transparent' && <div className="no-color-line" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-px h-6 bg-white/10 mx-1" />

                                        {/* Ungroup Button */}
                                        {onUngroup && (
                                            <button
                                                className="toolbar-grid-btn text-red-400 hover:text-red-300"
                                                onClick={() => onUngroup(group.id)}
                                                title="Ungroup"
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
