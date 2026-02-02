'use client';

import React from 'react';
import { ErasePluginModal } from '@/modules/plugins/ErasePluginModal/ErasePluginModal';
import { EraseModalState } from './types';
import { downloadImage, generateDownloadFilename } from '@/core/api/downloadUtils';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { useEraseStore, useEraseSelection } from '@/modules/stores';

interface EraseModalOverlayProps {
    data: EraseModalState;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<EraseModalState>) => void;
    scale: number;
}

export const EraseModalOverlay: React.FC<EraseModalOverlayProps> = ({
    data,
    isSelected,
    onSelect,
    onUpdate,
    scale,
}) => {
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);
    const { removeEraseModal, addEraseModal, setSelectedEraseModalId, setSelectedEraseModalIds } = useEraseStore();
    const { selectedIds } = useEraseSelection();

    // Mock handlers for persist (can be replaced with store effects or passed props if needed effectively)
    // For now we rely on the store. If persistence is needed, we might need to hook into legacy persistence or create new one.
    // Assuming for this migration we focus on state. legacy onPersist... are checking if passed.
    // The previous implementation used callbacks passed from Canvas.

    // We can directly implement the logic here using store.

    const handleDuplicate = () => {
        const duplicated = {
            ...data,
            id: `erase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: data.x + 50,
            y: data.y + 50,
        };
        addEraseModal(duplicated);
    };

    const handleDelete = () => {
        removeEraseModal(data.id);
    };

    return (
        <>
            {contextMenu && (
                <PluginContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                />
            )}
            <ErasePluginModal
                isOpen={true}
                isExpanded={data.isExpanded}
                id={data.id}
                isAttachedToChat={false} // Todo: connect to chat state if needed
                selectionOrder={
                    isSelected && selectedIds.length > 1
                        ? selectedIds.indexOf(data.id) + 1
                        : undefined
                }
                onContextMenu={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY });
                }}
                onClose={handleDelete}
                onErase={async (model, sourceImageUrl, mask, prompt) => {
                    // This logic was passed as onErase prop in plural component.
                    // We need to access the API or handler. 
                    // For now, we might need to pass onErase prop to EraseModalOverlay too if it uses external service.
                    // But let's assume valid types first.
                    console.warn("Erase action triggered - handler to be connected");
                    return null;
                }}
                erasedImageUrl={data.erasedImageUrl}
                isErasing={data.isErasing || false}
                onSelect={() => onSelect(data.id)}
                onDelete={handleDelete}
                onDownload={async () => {
                    if (data.erasedImageUrl) {
                        const filename = generateDownloadFilename('erase', data.id, 'png');
                        await downloadImage(data.erasedImageUrl, filename);
                    }
                }}
                onDuplicate={handleDuplicate}
                isSelected={isSelected}
                initialModel={undefined} // data.model? definition says EraseModalState has no model? 
                initialSourceImageUrl={data.sourceImageUrl}
                initialLocalErasedImageUrl={data.localErasedImageUrl}
                onOptionsChange={(opts) => {
                    onUpdate(data.id, opts);
                }}
                onPersistEraseModalCreate={() => { }}
                onUpdateModalState={(mid, updates) => onUpdate(mid, updates)}
                onPersistImageModalCreate={() => { }}
                onUpdateImageModalState={() => { }}
                connections={[]} // TODO
                imageModalStates={[]} // TODO
                images={[]} // TODO
                onPersistConnectorCreate={() => { }}
                stageRef={React.createRef()} // TODO
                scale={scale}
                position={{ x: data.x, y: data.y }}
                x={data.x}
                y={data.y}
                onPositionChange={(newX, newY) => {
                    onUpdate(data.id, { x: newX, y: newY });
                }}
                onPositionCommit={(finalX, finalY) => {
                    onUpdate(data.id, { x: finalX, y: finalY });
                }}
            />
        </>
    );
};
