'use client';

import React from 'react';
import { MusicUploadModal } from '@/app/components/GenerationCompo/MusicUploadModal';
import Konva from 'konva';
import { MusicModalState } from './types';

interface MusicModalOverlaysProps {
  musicModalStates: MusicModalState[];
  selectedMusicModalId: string | null;
  selectedMusicModalIds: string[];
  clearAllSelections: () => void;
  setMusicModalStates: React.Dispatch<React.SetStateAction<MusicModalState[]>>;
  setSelectedMusicModalId: (id: string | null) => void;
  setSelectedMusicModalIds: (ids: string[]) => void;
  onMusicSelect?: (file: File) => void;
  onMusicGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => Promise<string | null>;
  onPersistMusicModalCreate?: (modal: { id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistMusicModalDelete?: (id: string) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
}

export const MusicModalOverlays: React.FC<MusicModalOverlaysProps> = ({
  musicModalStates,
  selectedMusicModalId,
  selectedMusicModalIds,
  clearAllSelections,
  setMusicModalStates,
  setSelectedMusicModalId,
  setSelectedMusicModalIds,
  onMusicSelect,
  onMusicGenerate,
  onPersistMusicModalCreate,
  onPersistMusicModalMove,
  onPersistMusicModalDelete,
  stageRef,
  scale,
  position,
}) => {
  return (
    <>
      {musicModalStates.map((modalState) => (
        <MusicUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
            if (onPersistMusicModalDelete) {
              Promise.resolve(onPersistMusicModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onMusicSelect={onMusicSelect}
          onGenerate={async (prompt, model, frame, aspectRatio) => {
            if (!onMusicGenerate) return null;
            try {
              const url = await onMusicGenerate(prompt, model, frame, aspectRatio);
              if (url) {
                setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, generatedMusicUrl: url, isGenerating: false } : m));
                if (onPersistMusicModalMove) {
                  const frameWidth = 600;
                  const frameHeight = 300;
                  Promise.resolve(onPersistMusicModalMove(modalState.id, {
                    generatedMusicUrl: url,
                    model,
                    frame,
                    aspectRatio,
                    frameWidth,
                    frameHeight,
                  })).catch(console.error);
                }
              }
            } catch (err) {
              console.error('[ModalOverlays] music generation failed', err);
            }
            return null;
          }}
          generatedMusicUrl={modalState.generatedMusicUrl}
          initialModel={modalState.model}
          initialFrame={modalState.frame}
          initialAspectRatio={modalState.aspectRatio}
          initialPrompt={modalState.prompt}
          onOptionsChange={(opts) => {
            setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m));
          }}
          onSelect={() => {
            clearAllSelections();
            setSelectedMusicModalId(modalState.id);
            setSelectedMusicModalIds([modalState.id]);
          }}
          onDelete={() => {
            console.log('[MusicModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedMusicModalId(null);
            // Call persist delete - it updates parent state (musicGenerators) which flows down as externalMusicModals
            // Canvas will sync musicModalStates with externalMusicModals via useEffect
            if (onPersistMusicModalDelete) {
              console.log('[MusicModalOverlays] Calling onPersistMusicModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistMusicModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
            }
            }
            // DO NOT update local state here - let parent state flow down through props
            // The useEffect in Canvas will sync musicModalStates with externalMusicModals
          }}
          onDuplicate={() => {
            const duplicated = {
              id: `music-modal-${Date.now()}`,
              x: modalState.x + 600 + 50,
              y: modalState.y,
              generatedMusicUrl: modalState.generatedMusicUrl,
              model: modalState.model,
              frame: modalState.frame,
              aspectRatio: modalState.aspectRatio,
              prompt: modalState.prompt,
              isGenerating: false,
            };
            setMusicModalStates(prev => [...prev, duplicated]);
            if (onPersistMusicModalCreate) {
              Promise.resolve(onPersistMusicModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedMusicModalId === modalState.id || selectedMusicModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistMusicModalMove) {
              Promise.resolve(onPersistMusicModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
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

