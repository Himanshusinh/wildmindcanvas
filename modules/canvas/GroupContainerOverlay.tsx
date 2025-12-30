'use client';

import React, { useState, useEffect } from 'react';
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva';
import { GroupContainerState } from '@/core/types/groupContainer';
import { CanvasImage } from './CanvasImage';

interface GroupContainerOverlayProps {
    groups: GroupContainerState[];
    scale: number;
    position: { x: number; y: number };
    selectedGroupIds: string[];
    onGroupMove: (groupId: string, newX: number, newY: number) => void;
    onGroupDrag?: (groupId: string, newX: number, newY: number) => void;
    onGroupDragStart?: (groupId: string, startX: number, startY: number) => void;
    onGroupNameChange: (groupId: string, newName: string) => void;
    onGroupSelect?: (groupId: string) => void;
    onUngroup?: (groupId: string) => void;
    getItemBounds: (id: string) => { x: number; y: number; width: number; height: number } | null;
    images: any[]; // Pass full images array to render image children
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
    onGroupNameChange,
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
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>('');
    const [ungroupImg, setUngroupImg] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        // Try to load a public asset at /ungroup.png first, then fall back to /ungroup-icon.png.
        // Place your provided icon at `wildmindcanvas/public/ungroup.png` so it becomes available at runtime.
        const tryLoad = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('failed'));
        });

        (async () => {
            try {
                const img = await tryLoad('/icons/ungroup.png'); // Corrected path
                setUngroupImg(img);
            } catch (e1) {
                try {
                    const img2 = await tryLoad('/icons/ungroup.svg');
                    setUngroupImg(img2);
                } catch (e2) {
                    setUngroupImg(null);
                }
            }
        })();
    }, []);

    return (
        <>
            {groups.map(group => {
                const isSelected = selectedGroupIds.includes(group.id);
                const groupName = (group && group.meta && typeof group.meta.name === 'string') ? group.meta.name : '';
                // Use canvas coordinates directly - the Stage handles the transform

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
                    >

                        {/* Container box with SOLID border matching selection style */}
                        <Rect
                            width={group.width}
                            height={group.height}
                            stroke={'#3b82f6'} // Always Blue
                            strokeWidth={2}
                            fill={'rgba(59, 130, 246, 0.1)'} // Always Blue tint
                            listening={true}
                            cornerRadius={20}
                            dashEnabled={false}
                        />

                        {/* Group name label */}
                        {(() => {
                            const labelHeight = 24;
                            const labelWidth = Math.max(100, groupName.length * 8 + 20);
                            return (
                                <>
                                    <Rect
                                        x={0}
                                        y={-28}
                                        width={labelWidth}
                                        height={labelHeight}
                                        fill={'#3b82f6'} // Always Blue
                                        cornerRadius={[4, 4, 0, 0]}
                                    />
                                    <Text
                                        x={8}
                                        y={-22}
                                        text={groupName}
                                        fontSize={14}
                                        fill="#ffffff"
                                        fontStyle="bold"
                                        listening={true}
                                        onDblClick={() => {
                                            setEditingGroupId(group.id);
                                            setEditingName(groupName);
                                            const newName = prompt('Edit group name:', groupName);
                                            if (newName && newName.trim()) {
                                                onGroupNameChange(group.id, newName.trim());
                                            }
                                        }}
                                    />
                                </>
                            );
                        })()}

                        {/* Ungroup floating button - centered above the top border */}
                        {onUngroup && (() => {
                            const labelHeight = 24;
                            const controlSize = labelHeight; // make control same size as label height

                            return (
                                <Group
                                    x={group.width / 2}
                                    y={- (labelHeight)}
                                    onClick={(e) => {
                                        e.cancelBubble = true;
                                        onUngroup(group.id);
                                    }}
                                    onMouseEnter={(e) => {
                                        const stage = e.target.getStage();
                                        if (stage) stage.container().style.cursor = 'pointer';
                                    }}
                                    onMouseLeave={(e) => {
                                        const stage = e.target.getStage();
                                        if (stage) stage.container().style.cursor = 'default';
                                    }}
                                >
                                    <Rect
                                        x={-controlSize / 2}
                                        y={-controlSize / 2}
                                        width={controlSize}
                                        height={controlSize}
                                        fill="#ef4444"
                                        cornerRadius={controlSize / 2}
                                        shadowColor="rgba(0,0,0,0.2)"
                                        shadowBlur={4}
                                        shadowOffset={{ x: 0, y: 2 }}
                                    />
                                    {ungroupImg ? (
                                        <KonvaImage
                                            image={ungroupImg}
                                            x={- (controlSize - 10) / 2}
                                            y={- (controlSize - 10) / 2}
                                            width={controlSize - 10}
                                            height={controlSize - 10}
                                        />
                                    ) : (
                                        <Text
                                            x={-6}
                                            y={-8}
                                            text={`×`}
                                            fontSize={18}
                                            fill="#ffffff"
                                            fontStyle="bold"
                                            listening={false}
                                        />
                                    )}
                                </Group>
                            );
                        })()}

                    </Group>
                );
            })}
        </>
    );
};
