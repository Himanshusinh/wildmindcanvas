'use client';

import React from 'react';
import { ImageUploadModal } from '@/app/components/GenerationCompo/ImageUploadModal';
import Konva from 'konva';
import { ImageModalState, Connection } from './types';
import { ImageUpload } from '@/types/canvas';

interface ImageModalOverlaysProps {
  imageModalStates: ImageModalState[];
  selectedImageModalId: string | null;
  selectedImageModalIds: string[];
  clearAllSelections: () => void;
  setImageModalStates: React.Dispatch<React.SetStateAction<ImageModalState[]>>;
  setSelectedImageModalId: (id: string | null) => void;
  setSelectedImageModalIds: (ids: string[]) => void;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string, imageCount?: number, sourceImageUrl?: string) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
  onAddImageToCanvas?: (url: string) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistImageModalDelete?: (id: string) => void | Promise<void>;
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  connections: Connection[];
  imageModalStatesForConnections: ImageModalState[];
  images: ImageUpload[];
  textInputStates?: Array<{ id: string; value?: string }>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
}

export const ImageModalOverlays: React.FC<ImageModalOverlaysProps> = ({
  imageModalStates,
  selectedImageModalId,
  selectedImageModalIds,
  clearAllSelections,
  setImageModalStates,
  setSelectedImageModalId,
  setSelectedImageModalIds,
  onImageGenerate,
  onAddImageToCanvas,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  onPersistImageModalDelete,
  onPersistConnectorCreate,
  connections,
  imageModalStatesForConnections,
  images,
  textInputStates = [],
  stageRef,
  scale,
  position,
}) => {
  return (
    <>
      {imageModalStates.map((modalState) => (
        <ImageUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
            if (onPersistImageModalDelete) {
              Promise.resolve(onPersistImageModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onGenerate={async (prompt, model, frame, aspectRatio) => {
            if (onImageGenerate) {
              try {
                const imageCount = modalState.imageCount || 1;
                const result = await onImageGenerate(prompt, model, frame, aspectRatio, modalState.id, imageCount);
                if (result) {
                  // Extract image URLs
                  const imageUrls = result.images && result.images.length > 0 
                    ? result.images.map(img => img.url)
                    : result.url 
                      ? [result.url]
                      : [];
                  
                  // Keep the modal visible and show the generated image(s) inside the frame
                  setImageModalStates(prev => prev.map(m => m.id === modalState.id ? { 
                    ...m, 
                    generatedImageUrl: imageUrls[0] || null,
                    generatedImageUrls: imageUrls,
                  } : m));
                  if (onPersistImageModalMove) {
                    // Compute frame size: width fixed 600, height based on aspect ratio (min 400)
                    const [w, h] = aspectRatio.split(':').map(Number);
                    const frameWidth = 600;
                    const ar = w && h ? (w / h) : 1;
                    const rawHeight = ar ? Math.round(frameWidth / ar) : 600;
                    const frameHeight = Math.max(400, rawHeight);
                    Promise.resolve(onPersistImageModalMove(modalState.id, {
                      generatedImageUrl: imageUrls[0] || null,
                      generatedImageUrls: imageUrls,
                      model,
                      frame,
                      aspectRatio,
                      frameWidth,
                      frameHeight,
                      prompt,
                    } as any)).catch(console.error);
                  }
                }
              } catch (error) {
                console.error('Error generating image:', error);
                // Error is already handled in the modal component
              }
            }
          }}
          generatedImageUrl={modalState.generatedImageUrl}
          generatedImageUrls={modalState.generatedImageUrls}
          isGenerating={modalState.isGenerating}
          initialModel={modalState.model}
          initialFrame={modalState.frame}
          initialAspectRatio={modalState.aspectRatio}
          initialPrompt={modalState.prompt}
          onOptionsChange={(opts) => {
            // Update local state to keep UI in sync
            setImageModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts, frameWidth: opts.frameWidth ?? m.frameWidth, frameHeight: opts.frameHeight ?? m.frameHeight, model: opts.model ?? m.model, frame: opts.frame ?? m.frame, aspectRatio: opts.aspectRatio ?? m.aspectRatio, prompt: opts.prompt ?? m.prompt } : m));
            // Persist to parent (which will broadcast + snapshot)
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          onAddToCanvas={onAddImageToCanvas}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedImageModalId(modalState.id);
            setSelectedImageModalIds([modalState.id]);
          }}
          onDelete={() => {
            console.log('[ImageModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedImageModalId(null);
            // Call persist delete - it updates parent state (imageGenerators) which flows down as externalImageModals
            // Canvas will sync imageModalStates with externalImageModals via useEffect
            if (onPersistImageModalDelete) {
              console.log('[ImageModalOverlays] Calling onPersistImageModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistImageModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
            }
            }
            // DO NOT update local state here - let parent state flow down through props
            // The useEffect in Canvas will sync imageModalStates with externalImageModals
          }}
          onDownload={async () => {
            // Download the generated image if available
            if (modalState.generatedImageUrl) {
              try {
                // Fetch the image to handle CORS issues
                const response = await fetch(modalState.generatedImageUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-image-${modalState.id}-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download image:', error);
                // Fallback: try direct download
                const link = document.createElement('a');
                link.href = modalState.generatedImageUrl!;
                link.download = `generated-image-${modalState.id}-${Date.now()}.png`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
          }}
          onDuplicate={() => {
            // Create a duplicate of the image modal to the right
            const duplicated = {
              id: `image-modal-${Date.now()}`,
              x: modalState.x + 600 + 50, // 600px width + 50px spacing
              y: modalState.y, // Same Y position
              generatedImageUrl: modalState.generatedImageUrl,
            };
            setImageModalStates(prev => [...prev, duplicated]);
            if (onPersistImageModalCreate) {
              Promise.resolve(onPersistImageModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedImageModalId === modalState.id || selectedImageModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setImageModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
          onPersistImageModalCreate={onPersistImageModalCreate}
          onImageGenerate={onImageGenerate}
          initialCount={modalState.imageCount}
          onUpdateModalState={(modalId, updates) => {
            setImageModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalId, updates)).catch(console.error);
            }
          }}
          connections={connections}
          imageModalStates={imageModalStatesForConnections}
          images={images}
          textInputStates={textInputStates}
          onPersistConnectorCreate={onPersistConnectorCreate}
        />
      ))}
    </>
  );
};

