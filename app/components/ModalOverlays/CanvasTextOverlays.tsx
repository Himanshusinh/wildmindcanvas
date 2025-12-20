import React from 'react';
import { CanvasTextState } from './types';
import { CanvasText } from './CanvasText';

interface CanvasTextOverlaysProps {
    canvasTextStates: CanvasTextState[];
    selectedCanvasTextId: string | null;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<CanvasTextState>) => void;
    onDelete: (id: string) => void;
    scale: number;
    position: { x: number; y: number };
}

export const CanvasTextOverlays: React.FC<CanvasTextOverlaysProps> = ({
    canvasTextStates,
    selectedCanvasTextId,
    onSelect,
    onUpdate,
    onDelete,
    scale,
    position,
}) => {
    console.log('[CanvasTextOverlays] Rendering with states:', canvasTextStates, 'count:', canvasTextStates?.length, 'scale:', scale, 'position:', position);
    
    if (!canvasTextStates || canvasTextStates.length === 0) {
        console.log('[CanvasTextOverlays] No text states to render - array is empty or undefined');
        return null;
    }
    
    console.log('[CanvasTextOverlays] Rendering', canvasTextStates.length, 'text element(s)');
    
    return (
        <>
            {canvasTextStates.map((textState) => {
                const screenX = textState.x * scale + position.x;
                const screenY = textState.y * scale + position.y;
                console.log('[CanvasTextOverlays] Rendering text:', {
                    id: textState.id,
                    canvasX: textState.x,
                    canvasY: textState.y,
                    screenX,
                    screenY,
                    scale,
                    position,
                    isSelected: selectedCanvasTextId === textState.id
                });
                return (
                    <CanvasText
                        key={textState.id}
                        data={textState}
                        isSelected={selectedCanvasTextId === textState.id}
                        onSelect={onSelect}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        scale={scale}
                        position={position}
                    />
                );
            })}
        </>
    );
};
