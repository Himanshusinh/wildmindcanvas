'use client';

import React from 'react';
import { MusicUploadModal } from '@/modules/generators/MusicUploadModal';
import Konva from 'konva';
import { MusicModalState } from './types';
import { downloadAudio, generateDownloadFilename } from '@/core/api/downloadUtils';
import { generateMusicForCanvas } from '@/core/api/api';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';

/**
 * Calculate aspect ratio string (e.g., "9:16") from width and height
 */
function calculateAspectRatioFromDimensions(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) return '1:1';

  const ratio = width / height;
  const tolerance = 0.01;

  const commonRatios: Array<{ ratio: number; label: string }> = [
    { ratio: 1.0, label: '1:1' },
    { ratio: 4 / 3, label: '4:3' },
    { ratio: 3 / 4, label: '3:4' },
    { ratio: 16 / 9, label: '16:9' },
    { ratio: 9 / 16, label: '9:16' },
    { ratio: 3 / 2, label: '3:2' },
    { ratio: 2 / 3, label: '2:3' },
    { ratio: 21 / 9, label: '21:9' },
    { ratio: 9 / 21, label: '9:21' },
    { ratio: 16 / 10, label: '16:10' },
    { ratio: 10 / 16, label: '10:16' },
    { ratio: 5 / 4, label: '5:4' },
    { ratio: 4 / 5, label: '4:5' },
  ];

  for (const common of commonRatios) {
    if (Math.abs(ratio - common.ratio) < tolerance || Math.abs(ratio - 1 / common.ratio) < tolerance) {
      return common.label;
    }
  }

  // Calculate GCD for custom ratios
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  if (w <= 100 && h <= 100) return `${w}:${h}`;
  return `${Math.round(ratio * 100) / 100}:1`;
}

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
  onPersistMusicModalCreate?: (modal: { id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; filename?: string; duration?: number; promptInfluence?: number; loop?: boolean }) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; activeCategory?: string | null; lyrics?: string; sampleRate?: string; bitrate?: string; audioFormat?: string; isPinned?: boolean; voiceId?: string; stability?: number; similarityBoost?: number; style?: number; speed?: number; exaggeration?: number; temperature?: number; cfgScale?: number; voicePrompt?: string; topP?: number; maxTokens?: number; repetitionPenalty?: number; dialogueInputs?: any[]; useSpeakerBoost?: boolean; filename?: string; duration?: number; promptInfluence?: number; loop?: boolean }>) => void | Promise<void>;
  onPersistMusicModalDelete?: (id: string) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  connections?: any[];
  textInputStates?: Array<{ id: string; value?: string; sentValue?: string }>;
  projectId?: string;
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
  connections = [],
  textInputStates = [],
  projectId,
}) => {
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

  return (
    <>
      {contextMenu && (
        <PluginContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          isPinned={musicModalStates.find((m) => m.id === contextMenu.modalId)?.isPinned}
          onDownload={musicModalStates.find((m) => m.id === contextMenu.modalId)?.generatedMusicUrl ? async () => {
            const modal = musicModalStates.find((m) => m.id === contextMenu.modalId);
            if (modal?.generatedMusicUrl) {
              const filename = generateDownloadFilename('generated-music', modal.id, 'mp3');
              await downloadAudio(modal.generatedMusicUrl, filename);
            }
          } : undefined}
          onPin={() => {
            const modal = musicModalStates.find((m) => m.id === contextMenu.modalId);
            if (modal && onPersistMusicModalMove) {
              onPersistMusicModalMove(modal.id, { isPinned: !modal.isPinned });
            }
          }}
          onDuplicate={() => {
            const modalState = musicModalStates.find(m => m.id === contextMenu.modalId);
            if (modalState) {
              const duplicated = {
                id: `music-modal-${Date.now()}`,
                x: modalState.x + 600 + 50,
                y: modalState.y,
                generatedMusicUrl: modalState.generatedMusicUrl,
                model: modalState.model,
                frame: modalState.frame,
                aspectRatio: modalState.aspectRatio,
                prompt: modalState.prompt,
                activeCategory: modalState.activeCategory,
                lyrics: modalState.lyrics,
                sampleRate: modalState.sampleRate,
                bitrate: modalState.bitrate,
                audioFormat: modalState.audioFormat,
                dialogueInputs: modalState.dialogueInputs,
                useSpeakerBoost: modalState.useSpeakerBoost,
                isGenerating: false,
              };
              setMusicModalStates(prev => [...prev, duplicated]);
              if (onPersistMusicModalCreate) {
                Promise.resolve(onPersistMusicModalCreate(duplicated)).catch(console.error);
              }
            }
          }}
          onDelete={() => {
            if (onPersistMusicModalDelete) {
              const modalId = contextMenu.modalId;
              setSelectedMusicModalId(null);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistMusicModalDelete(modalId);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
          }}
        />
      )}
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
          isPinned={modalState.isPinned}
          onTogglePin={() => {
            if (onPersistMusicModalMove) {
              onPersistMusicModalMove(modalState.id, { isPinned: !modalState.isPinned });
            }
          }}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, modalId: modalState.id });
          }}
          onGenerate={async (prompt, model, frame, aspectRatio, lyrics, sampleRate, bitrate, audioFormat, filename, voiceId, stability, similarityBoost, style, speed, exaggeration, temperature, cfgScale, voicePrompt, topP, maxTokens, repetitionPenalty, dialogueInputs, useSpeakerBoost, duration, promptInfluence, loop) => {
            if (onMusicGenerate) {
              // Logic for external handler (Canvas Page) if provided
              try {
                // ... legacy logic ...
              } catch (e) { }
            }

            try {
              setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, isGenerating: true } : m));

              const backendModel = model === 'MiniMax Music 2' ? 'music-2.0' : model;

              // Map new fields to what backend expects if needed, or pass them in options
              const result = await generateMusicForCanvas(
                prompt,
                backendModel,
                lyrics || '',
                {
                  sample_rate: sampleRate ? parseInt(sampleRate) : 44100,
                  bitrate: bitrate ? parseInt(bitrate) : 256000,
                  format: audioFormat ? audioFormat.toLowerCase() : 'mp3',
                  voiceId,
                  stability,
                  similarityBoost,
                  style,
                  speed,
                  exaggeration,
                  temperature,
                  cfgScale,
                  voicePrompt,
                  topP,
                  maxTokens,
                  repetitionPenalty,
                  dialogueInputs,
                  useSpeakerBoost,
                  fileName: filename,
                  duration_seconds: duration,
                  prompt_influence: promptInfluence,
                  loop: loop
                },
                projectId
              );

              const url = result.url || (result as any).audio?.url;

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
                    prompt,
                    frameWidth,
                    frameHeight,
                    activeCategory: (modalState.activeCategory as any),
                    lyrics,
                    sampleRate: sampleRate ? sampleRate.toString() : '44100',
                    bitrate: bitrate ? bitrate.toString() : '256000',
                    audioFormat: audioFormat ? audioFormat.toLowerCase() : 'mp3',
                    voiceId,
                    stability,
                    similarityBoost,
                    style,
                    speed,
                    exaggeration,
                    temperature,
                    cfgScale,
                    voicePrompt,
                    topP,
                    maxTokens,
                    repetitionPenalty,
                    dialogueInputs,
                    useSpeakerBoost,
                    filename: filename,
                    duration,
                    promptInfluence,
                    loop
                  })).catch(console.error);
                }
              } else {
                setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, isGenerating: false } : m));
              }
            } catch (err) {
              console.error('[ModalOverlays] music generation failed', err);
              setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, isGenerating: false } : m));
              alert('Music generation failed. Please try again.');
            }
            return Promise.resolve();
          }}
          generatedMusicUrl={modalState.generatedMusicUrl}
          initialModel={modalState.model}
          initialFrame={modalState.frame}
          initialAspectRatio={modalState.aspectRatio || (modalState.frameWidth && modalState.frameHeight ? calculateAspectRatioFromDimensions(modalState.frameWidth, modalState.frameHeight) : undefined)}
          initialPrompt={modalState.prompt}
          initialCategory={(modalState.activeCategory as any)}
          initialLyrics={modalState.lyrics}
          initialSampleRate={modalState.sampleRate}
          initialBitrate={modalState.bitrate}
          initialAudioFormat={modalState.audioFormat}
          initialVoiceId={modalState.voiceId}
          initialStability={modalState.stability}
          initialSimilarityBoost={modalState.similarityBoost}
          initialStyle={modalState.style}
          initialSpeed={modalState.speed}
          initialExaggeration={modalState.exaggeration}
          initialTemperature={modalState.temperature}
          initialCfgScale={modalState.cfgScale}
          initialVoicePrompt={modalState.voicePrompt}
          initialTopP={modalState.topP}
          initialMaxTokens={modalState.maxTokens}
          initialRepetitionPenalty={modalState.repetitionPenalty}
          initialDialogueInputs={modalState.dialogueInputs}
          initialUseSpeakerBoost={modalState.useSpeakerBoost}
          initialFilename={modalState.filename}
          initialDuration={modalState.duration}
          initialPromptInfluence={modalState.promptInfluence}
          initialLoop={modalState.loop}
          onOptionsChange={(opts) => {
            setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m));
            // Trigger persistence for options changes (category, prompt, etc)
            if (onPersistMusicModalMove) {
              // Debouncing/throttling might be ideal for text inputs but for category/dropdowns it's fine.
              // We need to extract valid keys for persistence
              const validUpdates: any = {};
              if (opts.prompt !== undefined) validUpdates.prompt = opts.prompt;
              if (opts.model !== undefined) validUpdates.model = opts.model;
              if (opts.frame !== undefined) validUpdates.frame = opts.frame;
              if (opts.aspectRatio !== undefined) validUpdates.aspectRatio = opts.aspectRatio;
              if (opts.frameWidth !== undefined) validUpdates.frameWidth = opts.frameWidth;
              if (opts.frameHeight !== undefined) validUpdates.frameHeight = opts.frameHeight;
              if (opts.audioFormat !== undefined) validUpdates.audioFormat = opts.audioFormat;
              if (opts.activeCategory !== undefined) validUpdates.activeCategory = opts.activeCategory;
              if (opts.lyrics !== undefined) validUpdates.lyrics = opts.lyrics;
              if (opts.voiceId !== undefined) validUpdates.voiceId = opts.voiceId;
              if (opts.stability !== undefined) validUpdates.stability = opts.stability;
              if (opts.similarityBoost !== undefined) validUpdates.similarityBoost = opts.similarityBoost;
              if (opts.style !== undefined) validUpdates.style = opts.style;
              if (opts.speed !== undefined) validUpdates.speed = opts.speed;
              if (opts.exaggeration !== undefined) validUpdates.exaggeration = opts.exaggeration;
              if (opts.temperature !== undefined) validUpdates.temperature = opts.temperature;
              if (opts.cfgScale !== undefined) validUpdates.cfgScale = opts.cfgScale;
              if (opts.voicePrompt !== undefined) validUpdates.voicePrompt = opts.voicePrompt;
              if (opts.topP !== undefined) validUpdates.topP = opts.topP;
              if (opts.maxTokens !== undefined) validUpdates.maxTokens = opts.maxTokens;
              if (opts.repetitionPenalty !== undefined) validUpdates.repetitionPenalty = opts.repetitionPenalty;
              if (opts.dialogueInputs !== undefined) validUpdates.dialogueInputs = opts.dialogueInputs;
              if (opts.useSpeakerBoost !== undefined) validUpdates.useSpeakerBoost = opts.useSpeakerBoost;
              if (opts.filename !== undefined) validUpdates.filename = opts.filename;
              if (opts.duration !== undefined) validUpdates.duration = opts.duration;
              if (opts.promptInfluence !== undefined) validUpdates.promptInfluence = opts.promptInfluence;
              if (opts.loop !== undefined) validUpdates.loop = opts.loop;

              if (Object.keys(validUpdates).length > 0) {
                Promise.resolve(onPersistMusicModalMove(modalState.id, validUpdates)).catch(console.error);
              }
            }
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
          onDownload={async () => {
            // Download the generated music if available
            if (modalState.generatedMusicUrl) {
              const filename = generateDownloadFilename('generated-music', modalState.id, 'mp3');
              await downloadAudio(modalState.generatedMusicUrl, filename);
            }
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
              activeCategory: modalState.activeCategory,
              lyrics: modalState.lyrics,
              sampleRate: modalState.sampleRate,
              bitrate: modalState.bitrate,
              audioFormat: modalState.audioFormat,
              isGenerating: false,
            };
            setMusicModalStates(prev => [...prev, duplicated]);
            if (onPersistMusicModalCreate) {
              Promise.resolve(onPersistMusicModalCreate(duplicated)).catch(console.error);
            }
          }}
          onPersistMusicModalCreate={onPersistMusicModalCreate}
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
          connections={connections}
          textInputStates={textInputStates}
          projectId={projectId}
        />
      ))}
    </>
  );
};

