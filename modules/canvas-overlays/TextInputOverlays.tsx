'use client';

import React from 'react';
import { TextInput } from '@/modules/generators/TextInput';
import Konva from 'konva';
import { TextModalState, StoryboardModalState, Connection } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { generateDownloadFilename } from '@/core/api/downloadUtils';

interface TextInputOverlaysProps {
  textInputStates: TextModalState[];
  selectedTextInputId: string | null;
  selectedTextInputIds: string[];
  clearAllSelections: () => void;
  setTextInputStates: React.Dispatch<React.SetStateAction<TextModalState[]>>;
  setSelectedTextInputId: (id: string | null) => void;
  onTextCreate?: (text: string, x: number, y: number) => void;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string; sentValue?: string; isPinned?: boolean }>) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  onScriptGenerated?: (textModalId: string, script: string) => void;
  onScriptGenerationStart?: (textModalId: string) => void;
  connections?: Connection[];
  storyboardModalStates?: StoryboardModalState[];
}

export const TextInputOverlays: React.FC<TextInputOverlaysProps> = ({
  textInputStates,
  selectedTextInputId,
  selectedTextInputIds,
  clearAllSelections,
  setTextInputStates,
  setSelectedTextInputId,
  onTextCreate,
  onPersistTextModalDelete,
  onPersistTextModalMove,
  stageRef,
  scale,
  position,
  onScriptGenerated,
  onScriptGenerationStart,
  connections = [],
  storyboardModalStates = [],
}) => {
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {textInputStates.map((textState) => (
        <TextInput
          key={textState.id}
          id={textState.id}
          x={textState.x}
          y={textState.y}
          autoFocusInput={textState.autoFocusInput}
          isSelected={selectedTextInputId === textState.id || selectedTextInputIds.includes(textState.id)}
          isPinned={textState.isPinned}
          onTogglePin={() => {
            if (onPersistTextModalMove) {
              onPersistTextModalMove(textState.id, { isPinned: !textState.isPinned });
            }
          }}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, modalId: textState.id });
          }}
          onDownload={() => {
            if (textState.value) {
              const filename = generateDownloadFilename('text-content', textState.id, 'txt');
              handleDownload(textState.value, filename);
            }
          }}
          onConfirm={(text) => {
            if (onTextCreate) {
              onTextCreate(text, textState.x, textState.y);
            }
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onCancel={() => {
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onPositionChange={(newX, newY) => {
            setTextInputStates(prev => prev.map(t =>
              t.id === textState.id ? { ...t, x: newX, y: newY } : t
            ));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { x: newX, y: newY })).catch(console.error);
            }
          }}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this text input as selected
            setSelectedTextInputId(textState.id);
          }}
          onDelete={() => {
            console.log('[TextInputOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: textState.id,
            });
            // Call persist delete FIRST (it updates the parent state synchronously)
            if (onPersistTextModalDelete) {
              console.log('[TextInputOverlays] Calling onPersistTextModalDelete', textState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistTextModalDelete(textState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch((err) => {
                  console.error('[TextInputOverlays] Error in onPersistTextModalDelete', err);
                });
              }
            }
            // Then update local state (this should match what parent state will be)
            setTextInputStates(prev => {
              const filtered = prev.filter(t => t.id !== textState.id);
              console.log('[TextInputOverlays] Local state updated, remaining modals:', filtered.length);
              return filtered;
            });
            setSelectedTextInputId(null);
          }}
          onDuplicate={() => {
            // Create a duplicate of the text input to the right
            const duplicated = {
              id: `text-${Date.now()}-${Math.random()}`,
              x: textState.x + 300 + 50, // 300px width + 50px spacing
              y: textState.y, // Same Y position
              value: textState.value || ''
            };
            setTextInputStates(prev => [...prev, duplicated]);
          }}
          onValueChange={(val) => {
            setTextInputStates(prev => prev.map(t => t.id === textState.id ? { ...t, value: val } : t));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { value: val })).catch(console.error);
            }
          }}
          onSendPrompt={(sentText) => {
            // Update sentValue when arrow is clicked - this triggers sync in connected components
            setTextInputStates(prev => prev.map(t => t.id === textState.id ? { ...t, sentValue: sentText } : t));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { sentValue: sentText })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
          onScriptGenerated={onScriptGenerated}
          onScriptGenerationStart={onScriptGenerationStart}
          connections={connections}
          storyboardModalStates={storyboardModalStates}
        />
      ))}
      {contextMenu && (
        <PluginContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          isPinned={textInputStates.find((m) => m.id === contextMenu.modalId)?.isPinned}
          onDownload={textInputStates.find((m) => m.id === contextMenu.modalId)?.value ? () => {
            const modal = textInputStates.find(m => m.id === contextMenu.modalId);
            if (modal?.value) {
              const filename = generateDownloadFilename('text-content', modal.id, 'txt');
              handleDownload(modal.value, filename);
            }
          } : undefined}
          onPin={() => {
            const modal = textInputStates.find((m) => m.id === contextMenu.modalId);
            if (modal && onPersistTextModalMove) {
              onPersistTextModalMove(modal.id, { isPinned: !modal.isPinned });
            }
          }}
          onDuplicate={() => {
            const modal = textInputStates.find((m) => m.id === contextMenu.modalId);
            if (modal) {
              const duplicated = {
                id: `text-${Date.now()}-${Math.random()}`,
                x: modal.x + 300 + 50,
                y: modal.y,
                value: modal.value || ''
              };
              setTextInputStates(prev => [...prev, duplicated]);
              // Trigger creation persistence if needed? The original code didn't have persisted create for logic in onDuplicate,
              // but usually there should be onPersistTextModalCreate.
              // It is prop 15: onTextCreate. But onTextCreate signature is (text, x, y) => void.
              // It seems to be used after confirm.
              // If onDuplicate creates a new state, we should probably call onTextCreate?
              // But onTextCreate might be just for "Confirming" an existing input creating a node?
              // Actually, duplicate logic was local: `setTextInputStates(prev => [...prev, duplicated])`.
              // If there is no onPersistTextModalCreate, then it might be purely local until confirmed?
              // I will keep existing logic for duplication which is local state update.
            }
          }}
          onDelete={() => {
            const modalId = contextMenu.modalId;
            setSelectedTextInputId(null);
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(modalId)).catch(console.error);
              setTextInputStates(prev => prev.filter(m => m.id !== modalId));
            }
          }}
        />
      )}
    </>
  );
};

