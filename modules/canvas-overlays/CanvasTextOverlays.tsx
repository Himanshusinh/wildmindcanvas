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

export const CanvasTextOverlays: React.FC<CanvasTextOverlaysProps> = React.memo(({
    canvasTextStates,
    selectedCanvasTextId,
    onSelect,
    onUpdate,
    onDelete,
    scale,
    position,
}) => {
    if (!canvasTextStates || canvasTextStates.length === 0) {
        return null;
    }

    return (
        <>
            {canvasTextStates.map((textState) => {
                const screenX = textState.x * scale + position.x;
                const screenY = textState.y * scale + position.y;
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
}, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
        prevProps.canvasTextStates === nextProps.canvasTextStates &&
        prevProps.selectedCanvasTextId === nextProps.selectedCanvasTextId &&
        prevProps.scale === nextProps.scale &&
        prevProps.position.x === nextProps.position.x &&
        prevProps.position.y === nextProps.position.y &&
        prevProps.onSelect === nextProps.onSelect &&
        prevProps.onUpdate === nextProps.onUpdate &&
        prevProps.onDelete === nextProps.onDelete
    );
});
