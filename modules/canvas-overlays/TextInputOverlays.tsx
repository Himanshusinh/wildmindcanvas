'use client';

import React from 'react';
import { TextInput } from '@/modules/generators/TextInput';
import Konva from 'konva';
import { TextModalState, StoryboardModalState, Connection } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { generateDownloadFilename } from '@/core/api/downloadUtils';
import { useTextStore, useTextModalStates, useTextSelection } from '@/modules/stores';

interface TextInputOverlaysProps {
  // textInputStates: TextModalState[]; // Removed - used from store
  // selectedTextInputId: string | null; // Removed - used from store
  // selectedTextInputIds: string[]; // Removed - used from store
  clearAllSelections: () => void;
  // setTextInputStates: React.Dispatch<React.SetStateAction<TextModalState[]>>; // Removed - used from store
  // setSelectedTextInputId: (id: string | null) => void; // Removed - used from store
  onTextCreate?: (text: string, x: number, y: number) => void;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string; sentValue?: string; isPinned?: boolean; smartTokens?: any[] }>) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  onScriptGenerated?: (textModalId: string, script: string) => void;
  onScriptGenerationStart?: (textModalId: string) => void;
  connections?: Connection[];
  storyboardModalStates?: StoryboardModalState[];
  selectedIds?: string[]; // Added for consistency with other overlays
  isChatOpen?: boolean; // Added for consistency
}

export const TextInputOverlays = React.memo<TextInputOverlaysProps>(({
  // textInputStates,
  // selectedTextInputId,
  // selectedTextInputIds,
  clearAllSelections,
  // setTextInputStates,
  // setSelectedTextInputId,
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
  selectedIds = [],
  isChatOpen = false,
}) => {
  // Zustand Store
  const textInputStates = useTextModalStates();
  const {
    selectedId: selectedTextInputId,
    selectedIds: selectedTextInputIds
  } = useTextSelection();

  const setTextModalStates = useTextStore(state => state.setTextModalStates);
  const setSelectedTextInputId = useTextStore(state => state.setSelectedTextModalId);
  const setSelectedTextInputIds = useTextStore(state => state.setSelectedTextModalIds);

  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

  // Track Shift key locally for robust multi-selection
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
            setTextModalStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onCancel={() => {
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextModalStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onPositionChange={(newX, newY) => {
            setTextModalStates(prev => prev.map(t =>
              t.id === textState.id ? { ...t, x: newX, y: newY } : t
            ));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          onSelect={() => {
            if (isShiftPressed) {
              const isAlreadySelected = (selectedTextInputIds || []).includes(textState.id);
              if (isAlreadySelected) {
                setSelectedTextInputIds((selectedTextInputIds || []).filter(id => id !== textState.id));
              } else {
                setSelectedTextInputIds([...(selectedTextInputIds || []), textState.id]);
              }
              setSelectedTextInputId(textState.id);
            } else {
              clearAllSelections();
              setSelectedTextInputId(textState.id);
              setSelectedTextInputIds([textState.id]);
            }
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
            setTextModalStates(prev => {
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
            setTextModalStates(prev => [...prev, duplicated]);
          }}
          onValueChange={(val) => {
            setTextModalStates(prev => prev.map(t => t.id === textState.id ? { ...t, value: val } : t));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { value: val })).catch(console.error);
            }
          }}
          onSendPrompt={(sentText) => {
            // Update sentValue when arrow is clicked - this triggers sync in connected components
            setTextModalStates(prev => prev.map(t => t.id === textState.id ? { ...t, sentValue: sentText } : t));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { sentValue: sentText })).catch(console.error);
            }
          }}
          value={textState.value}
          smartTokens={textState.smartTokens}
          onSmartTokensChange={(tokens) => {
            setTextModalStates(prev => prev.map(t => t.id === textState.id ? { ...t, smartTokens: tokens } : t));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { smartTokens: tokens })).catch(console.error);
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
              setTextModalStates(prev => [...prev, duplicated]);
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
              setTextModalStates(prev => prev.filter(m => m.id !== modalId));
            }
          }}
        />
      )}
    </>
  );
});

TextInputOverlays.displayName = 'TextInputOverlays';

