'use client';

import React from 'react';
import { RemoveBgPluginModal } from '@/modules/plugins/RemoveBgPluginModal/RemoveBgPluginModal';
import { RemoveBgModalState } from './types';
import { downloadImage, generateDownloadFilename } from '@/core/api/downloadUtils';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { useRemoveBgStore, useRemoveBgSelection } from '@/modules/stores';

interface RemoveBgModalOverlayProps {
    data: RemoveBgModalState;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<RemoveBgModalState>) => void;
    scale: number;
}

export const RemoveBgModalOverlay: React.FC<RemoveBgModalOverlayProps> = ({
    data,
    isSelected,
    onSelect,
    onUpdate,
    scale,
}) => {
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);
    const { removeRemoveBgModal, addRemoveBgModal } = useRemoveBgStore();
    const { selectedIds } = useRemoveBgSelection();

    const handleDuplicate = () => {
        const duplicated = {
            ...data,
            id: `removebg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: data.x + 50,
            y: data.y + 50,
        };
        addRemoveBgModal(duplicated);
    };

    const handleDelete = () => {
        removeRemoveBgModal(data.id);
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
            <RemoveBgPluginModal
                isOpen={true}
                isExpanded={data.isExpanded}
                id={data.id}
                isAttachedToChat={false}
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
                onRemoveBg={async (model, backgroundType, scaleValue, sourceImageUrl) => {
                    console.warn("RemoveBg action triggered - handler to be connected");
                    return null;
                }}
                removedBgImageUrl={data.removedBgImageUrl}
                isRemovingBg={data.isRemovingBg || false}
                onSelect={() => onSelect(data.id)}
                onDelete={handleDelete}
                onDownload={async () => {
                    if (data.removedBgImageUrl) {
                        const filename = generateDownloadFilename('removebg', data.id, 'png');
                        await downloadImage(data.removedBgImageUrl, filename);
                    }
                }}
                onDuplicate={handleDuplicate}
                isSelected={isSelected}
                initialModel={data.model}
                initialBackgroundType={undefined} // data.backgroundType?
                initialScaleValue={undefined} // data.scaleValue?
                initialSourceImageUrl={data.sourceImageUrl}
                initialLocalRemovedBgImageUrl={data.localRemovedBgImageUrl}
                onOptionsChange={(opts) => {
                    onUpdate(data.id, opts);
                }}
                onPersistRemoveBgModalCreate={() => { }}
                onUpdateModalState={(mid, updates) => onUpdate(mid, updates)}
                onPersistImageModalCreate={() => { }}
                onUpdateImageModalState={() => { }}
                connections={[]}
                imageModalStates={[]}
                images={[]}
                onPersistConnectorCreate={() => { }}
                stageRef={React.createRef()}
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
