'use client';

import React from 'react';
import { TextInput } from '@/app/components/GenerationCompo/TextInput';
import Konva from 'konva';
import { TextModalState } from './types';

interface TextInputOverlaysProps {
  textInputStates: TextModalState[];
  selectedTextInputId: string | null;
  selectedTextInputIds: string[];
  clearAllSelections: () => void;
  setTextInputStates: React.Dispatch<React.SetStateAction<TextModalState[]>>;
  setSelectedTextInputId: (id: string | null) => void;
  onTextCreate?: (text: string, x: number, y: number) => void;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string }>) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
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
}) => {
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
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
    </>
  );
};

