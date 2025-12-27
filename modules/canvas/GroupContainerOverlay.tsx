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
    onChildSelect?: (elementId: string, type: 'image' | 'text' | 'video') => void;
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
    onChildSelect,
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
                        {/* Render Group Children (Images) using Relative Coordinates */}
                        {group.children?.map(child => {
                            if (child.type === 'image') {
                                const originalData = images.find((img: any) => img.elementId === child.id);
                                if (originalData) {
                                    // Construct relative data for rendering
                                    // We override x/y to be the relative coordinates
                                    const relativeData = {
                                        ...originalData,
                                        x: child.relativeTransform.x,
                                        y: child.relativeTransform.y,
                                        rotation: child.relativeTransform.rotation || 0,
                                        // Let CanvasImage handle internal scaling logic if needed, 
                                        // OR we might need to apply scale here if CanvasImage doesn't use it directly from data.
                                        // CanvasImage uses 'scale' prop for stage scale, but 'imageData.width/height' for dimensions.
                                        // Assuming width/height are already correct in originalData.
                                    };

                                    return (
                                        <CanvasImage
                                            key={child.id}
                                            imageData={relativeData}
                                            index={-1} // Dummy index
                                            isDraggable={false}
                                            // redirect selection: prefer child select, fallback to group select
                                            onSelect={(e) => {
                                                // Event is not a Konva event, it's custom data from CanvasImage.onSelect
                                                // CanvasImage already handled cancelBubble
                                                if (onChildSelect) {
                                                    // Convert internal elementId to index or pass ID?
                                                    // CanvasImage passed 'originalData' which has elementId matching child.id
                                                    // onChildSelect expects elementId
                                                    onChildSelect(child.id, 'image');
                                                } else if (onGroupSelect) {
                                                    onGroupSelect(group.id);
                                                }
                                            }}
                                            // Disable interactions that might conflict
                                            isSelected={false}
                                        />
                                    );
                                }
                            }
                            // Text elements and other logic can be added here
                            return null;
                        })}

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
                                >
                                    {ungroupImg ? (
                                        <KonvaImage
                                            image={ungroupImg}
                                            x={- (controlSize - 8) / 2}
                                            y={- (controlSize - 8) / 2}
                                            width={controlSize - 8}
                                            height={controlSize - 8}
                                        />
                                    ) : (
                                        <Text
                                            x={-6}
                                            y={-8}
                                            text={`×`}
                                            fontSize={14}
                                            fill="#ffffff"
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
