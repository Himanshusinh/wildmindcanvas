'use client';

import { TextInput } from '@/components/TextInput';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { VideoUploadModal } from '@/components/VideoUploadModal';
import { MusicUploadModal } from '@/components/MusicUploadModal';
import Konva from 'konva';

interface ModalOverlaysProps {
  textInputStates: Array<{ id: string; x: number; y: number }>;
  imageModalStates: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  videoModalStates: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null }>;
  musicModalStates: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }>;
  selectedTextInputId: string | null;
  selectedTextInputIds: string[];
  selectedImageModalId: string | null;
  selectedImageModalIds: string[];
  selectedVideoModalId: string | null;
  selectedVideoModalIds: string[];
  selectedMusicModalId: string | null;
  selectedMusicModalIds: string[];
  clearAllSelections: () => void;
  setTextInputStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number }>>>;
  setSelectedTextInputId: (id: string | null) => void;
  setSelectedTextInputIds: (ids: string[]) => void;
  setImageModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>>>;
  setSelectedImageModalId: (id: string | null) => void;
  setSelectedImageModalIds: (ids: string[]) => void;
  setVideoModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null }>>>;
  setSelectedVideoModalId: (id: string | null) => void;
  setSelectedVideoModalIds: (ids: string[]) => void;
  setMusicModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }>>>;
  setSelectedMusicModalId: (id: string | null) => void;
  setSelectedMusicModalIds: (ids: string[]) => void;
  onTextCreate?: (text: string, x: number, y: number) => void;
  onImageSelect?: (file: File) => void;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string) => Promise<string | null>;
  onVideoSelect?: (file: File) => void;
  onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  onMusicSelect?: (file: File) => void;
  onMusicGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  generatedVideoUrl?: string | null;
  generatedMusicUrl?: string | null;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
}

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  selectedTextInputId,
  selectedTextInputIds,
  selectedImageModalId,
  selectedImageModalIds,
  selectedVideoModalId,
  selectedVideoModalIds,
  selectedMusicModalId,
  selectedMusicModalIds,
  clearAllSelections,
  setTextInputStates,
  setSelectedTextInputId,
  setSelectedTextInputIds,
  setImageModalStates,
  setSelectedImageModalId,
  setSelectedImageModalIds,
  setVideoModalStates,
  setSelectedVideoModalId,
  setSelectedVideoModalIds,
  setMusicModalStates,
  setSelectedMusicModalId,
  setSelectedMusicModalIds,
  onTextCreate,
  onImageSelect,
  onImageGenerate,
  onVideoSelect,
  onVideoGenerate,
  onMusicSelect,
  onMusicGenerate,
  generatedVideoUrl,
  generatedMusicUrl,
  stageRef,
  scale,
  position,
}) => {
  return (
    <>
      {/* Text Input Overlays */}
      {textInputStates.map((textState) => (
        <TextInput
          key={textState.id}
          x={textState.x}
          y={textState.y}
          isSelected={selectedTextInputId === textState.id || selectedTextInputIds.includes(textState.id)}
          onConfirm={(text) => {
            if (onTextCreate) {
              onTextCreate(text, textState.x, textState.y);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onCancel={() => {
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onPositionChange={(newX, newY) => {
            setTextInputStates(prev => prev.map(t => 
              t.id === textState.id ? { ...t, x: newX, y: newY } : t
            ));
          }}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this text input as selected
            setSelectedTextInputId(textState.id);
            setSelectedTextInputIds([textState.id]);
          }}
          onDelete={() => {
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onDuplicate={() => {
            // Create a duplicate of the text input to the right
            const duplicated = {
              id: `text-${Date.now()}-${Math.random()}`,
              x: textState.x + 300 + 50, // 300px width + 50px spacing
              y: textState.y, // Same Y position
            };
            setTextInputStates(prev => [...prev, duplicated]);
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Image Upload Modal Overlays */}
      {imageModalStates.map((modalState) => (
        <ImageUploadModal
          key={modalState.id}
          isOpen={true}
          onClose={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
          }}
          onImageSelect={onImageSelect}
          onGenerate={async (prompt, model, frame, aspectRatio) => {
            if (onImageGenerate) {
              try {
                const imageUrl = await onImageGenerate(prompt, model, frame, aspectRatio, modalState.id);
                if (imageUrl) {
                  // Update the modal state with the generated image URL
                  setImageModalStates(prev => 
                    prev.map(m => m.id === modalState.id ? { ...m, generatedImageUrl: imageUrl } : m)
                  );
                }
              } catch (error) {
                console.error('Error generating image:', error);
                // Error is already handled in the modal component
              }
            }
          }}
          generatedImageUrl={modalState.generatedImageUrl}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedImageModalId(modalState.id);
            setSelectedImageModalIds([modalState.id]);
          }}
          onDelete={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
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
          }}
          isSelected={selectedImageModalId === modalState.id || selectedImageModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setImageModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Video Upload Modal Overlays */}
      {videoModalStates.map((modalState) => (
        <VideoUploadModal
          key={modalState.id}
          isOpen={true}
          onClose={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
          }}
          onVideoSelect={onVideoSelect}
          onGenerate={(prompt, model, frame, aspectRatio) => {
            if (onVideoGenerate) {
              onVideoGenerate(prompt, model, frame, aspectRatio);
              // Store generated video URL when generation completes
              // This will be updated via a callback or prop update
            }
          }}
          generatedVideoUrl={modalState.generatedVideoUrl || generatedVideoUrl}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedVideoModalId(modalState.id);
            setSelectedVideoModalIds([modalState.id]);
            // Context menu removed - icons are now shown at top-right corner of modal
          }}
          onDelete={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
          }}
          onDownload={async () => {
            // Download the generated video if available
            if (modalState.generatedVideoUrl) {
              try {
                // Fetch the video to handle CORS issues
                const response = await fetch(modalState.generatedVideoUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-video-${modalState.id}-${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download video:', error);
                // Fallback: try direct download
                const link = document.createElement('a');
                link.href = modalState.generatedVideoUrl!;
                link.download = `generated-video-${modalState.id}-${Date.now()}.mp4`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
          }}
          onDuplicate={() => {
            // Create a duplicate of the video modal to the right
            const duplicated = {
              id: `video-modal-${Date.now()}`,
              x: modalState.x + 600 + 50, // 600px width + 50px spacing
              y: modalState.y, // Same Y position
              generatedVideoUrl: modalState.generatedVideoUrl,
            };
            setVideoModalStates(prev => [...prev, duplicated]);
          }}
          isSelected={selectedVideoModalId === modalState.id || selectedVideoModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setVideoModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Music Upload Modal Overlays */}
      {musicModalStates.map((modalState) => (
        <MusicUploadModal
          key={modalState.id}
          isOpen={true}
          onClose={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
          }}
          onMusicSelect={onMusicSelect}
          onGenerate={(prompt, model, frame, aspectRatio) => {
            if (onMusicGenerate) {
              onMusicGenerate(prompt, model, frame, aspectRatio);
              // Store generated music URL when generation completes
              // This will be updated via a callback or prop update
            }
          }}
          generatedMusicUrl={modalState.generatedMusicUrl || generatedMusicUrl}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedMusicModalId(modalState.id);
            setSelectedMusicModalIds([modalState.id]);
            // Context menu removed - icons are now shown at top-right corner of modal
          }}
          onDelete={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
          }}
          onDownload={async () => {
            // Download the generated music if available
            if (modalState.generatedMusicUrl) {
              try {
                // Fetch the music to handle CORS issues
                const response = await fetch(modalState.generatedMusicUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-music-${modalState.id}-${Date.now()}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download music:', error);
                // Fallback: try direct download
                const link = document.createElement('a');
                link.href = modalState.generatedMusicUrl!;
                link.download = `generated-music-${modalState.id}-${Date.now()}.mp3`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
          }}
          onDuplicate={() => {
            // Create a duplicate of the music modal to the right
            const duplicated = {
              id: `music-modal-${Date.now()}`,
              x: modalState.x + 600 + 50, // 600px width + 50px spacing
              y: modalState.y, // Same Y position
              generatedMusicUrl: modalState.generatedMusicUrl,
            };
            setMusicModalStates(prev => [...prev, duplicated]);
          }}
          isSelected={selectedMusicModalId === modalState.id || selectedMusicModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setMusicModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
    </>
  );
};

