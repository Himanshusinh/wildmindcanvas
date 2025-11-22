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
                setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, generatedMusicUrl: url } : m));
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
          onSelect={() => {
            clearAllSelections();
            setSelectedMusicModalId(modalState.id);
            setSelectedMusicModalIds([modalState.id]);
          }}
          onDelete={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
            if (onPersistMusicModalDelete) {
              Promise.resolve(onPersistMusicModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onDuplicate={() => {
            const duplicated = {
              id: `music-modal-${Date.now()}`,
              x: modalState.x + 600 + 50,
              y: modalState.y,
              generatedMusicUrl: modalState.generatedMusicUrl,
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

