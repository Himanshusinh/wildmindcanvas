'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { MusicModalTooltip } from './MusicModalTooltip';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { MusicModalFrame } from './MusicModalFrame';
import { MusicModalNodes } from './MusicModalNodes';
import { MusicModalControls } from './MusicModalControls';
import { MusicModalTabs, MusicCategory } from './MusicModalTabs';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { DialogueInput } from '../../canvas-overlays/types';

interface MusicUploadModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onMusicSelect?: (file: File) => void;
  onGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, lyrics?: string, sampleRate?: string, bitrate?: string, audioFormat?: string, filename?: string, voiceId?: string, stability?: number, similarityBoost?: number, style?: number, speed?: number, exaggeration?: number, temperature?: number, cfgScale?: number, voicePrompt?: string, topP?: number, maxTokens?: number, repetitionPenalty?: number, dialogueInputs?: DialogueInput[], useSpeakerBoost?: boolean, duration?: number, promptInfluence?: number, loop?: boolean) => Promise<void>;

  generatedMusicUrl?: string | null;
  initialModel?: string;
  initialFrame?: string;
  initialAspectRatio?: string;
  initialPrompt?: string;
  initialCategory?: MusicCategory;
  initialLyrics?: string;
  initialSampleRate?: string;
  initialBitrate?: string;
  initialAudioFormat?: string;
  initialVoiceId?: string;
  initialExaggeration?: number;
  initialTemperature?: number;
  initialCfgScale?: number;
  initialStability?: number;
  initialSimilarityBoost?: number;
  initialStyle?: number;
  initialSpeed?: number;
  initialVoicePrompt?: string;
  initialTopP?: number;
  initialMaxTokens?: number;
  initialRepetitionPenalty?: number;
  initialDialogueInputs?: DialogueInput[];
  initialUseSpeakerBoost?: boolean;
  initialFilename?: string;
  initialDuration?: number;
  initialPromptInfluence?: number;
  initialLoop?: boolean;
  onOptionsChange?: (opts: {
    model?: string;
    frame?: string;
    aspectRatio?: string;
    prompt?: string;
    frameWidth?: number;
    frameHeight?: number;
    isGenerating?: boolean;
    activeCategory?: MusicCategory;
    lyrics?: string;
    sampleRate?: string;
    bitrate?: string;
    audioFormat?: string;
    voiceId?: string;
    exaggeration?: number;
    temperature?: number;
    cfgScale?: number;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    speed?: number;
    voicePrompt?: string;
    topP?: number;
    maxTokens?: number;
    repetitionPenalty?: number;
    dialogueInputs?: DialogueInput[];
    useSpeakerBoost?: boolean;
    filename?: string;
    duration?: number;
    promptInfluence?: number;
    loop?: boolean;
  }) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
  x: number;
  y: number;
  onPositionChange?: (x: number, y: number) => void;
  onPositionCommit?: (x: number, y: number) => void;
  stageRef?: React.RefObject<any>;
  scale: number;
  position: { x: number; y: number };
  connections?: any[];
  textInputStates?: Array<{ id: string; value?: string; sentValue?: string }>;
  projectId?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const MusicUploadModal: React.FC<MusicUploadModalProps> = ({
  isOpen,
  id,
  onClose,
  onMusicSelect,
  onGenerate,
  generatedMusicUrl,
  stageRef,
  scale,
  position,
  x,
  y,
  onPositionChange,
  onPositionCommit,
  onSelect,
  onDelete,
  onDownload,
  onDuplicate,
  isSelected,
  initialModel,
  initialFrame,
  initialAspectRatio,
  initialPrompt,
  initialCategory,
  initialLyrics,
  initialSampleRate,
  initialBitrate,
  initialAudioFormat,
  initialVoiceId,
  initialExaggeration,
  initialTemperature,
  initialCfgScale,
  initialStability,
  initialSimilarityBoost,
  initialStyle,
  initialSpeed,
  initialVoicePrompt,
  initialTopP,
  initialMaxTokens,
  initialRepetitionPenalty,
  initialDialogueInputs,
  initialUseSpeakerBoost,
  initialFilename,
  initialDuration,
  initialPromptInfluence,
  initialLoop,
  onOptionsChange,
  connections = [],
  textInputStates = [],
  onContextMenu,
  isPinned = false,
  onTogglePin,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'MiniMax Music 2');
  const [selectedFrame, setSelectedFrame] = useState(initialFrame ?? 'Frame');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(initialAspectRatio ?? '1:1');
  const [lyricsPrompt, setLyricsPrompt] = useState(initialLyrics ?? '');
  const [sampleRate, setSampleRate] = useState(initialSampleRate ?? '44100');
  const [bitrate, setBitrate] = useState(initialBitrate ?? '256000');
  const [audioFormat, setAudioFormat] = useState(initialAudioFormat ?? 'MP3');
  const [voiceId, setVoiceId] = useState(initialVoiceId ?? 'Aria');
  const [stability, setStability] = useState(initialStability ?? 0.5);
  const [similarityBoost, setSimilarityBoost] = useState(initialSimilarityBoost ?? 0.75);
  const [style, setStyle] = useState(initialStyle ?? 0.0);
  const [speed, setSpeed] = useState(initialSpeed ?? 1.0);
  const [exaggeration, setExaggeration] = useState(initialExaggeration ?? 0.5);
  const [temperature, setTemperature] = useState(initialTemperature ?? 0.8);
  const [cfgScale, setCfgScale] = useState(initialCfgScale ?? 0.5);
  const [voicePrompt, setVoicePrompt] = useState(initialVoicePrompt ?? 'Realistic male voice in the 30s age with american accent. Normal pitch, warm timbre, conversational pacing, neutral tone delivery at med intensity.');
  const [topP, setTopP] = useState(initialTopP ?? 0.9);
  const [maxTokens, setMaxTokens] = useState(initialMaxTokens ?? 2000);
  const [repetitionPenalty, setRepetitionPenalty] = useState(initialRepetitionPenalty ?? 1.1);
  const [dialogueInputs, setDialogueInputs] = useState<DialogueInput[]>(initialDialogueInputs ?? [{ text: '', voice: 'Aria' }]);
  const [useSpeakerBoost, setUseSpeakerBoost] = useState(initialUseSpeakerBoost ?? true);

  const [filename, setFilename] = useState(initialFilename ?? '');
  const [duration, setDuration] = useState(initialDuration ?? 18.00);
  const [promptInfluence, setPromptInfluence] = useState(initialPromptInfluence ?? 1.00);
  const [loop, setLoop] = useState(initialLoop ?? false);
  const [activeCategory, setActiveCategory] = useState<MusicCategory>(initialCategory ?? null);
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Removed local isPinned state
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Refs to track initial props for cycle-free syncing
  const initialCategoryRef = useRef(initialCategory);
  const initialLyricsRef = useRef(initialLyrics);
  const initialSampleRateRef = useRef(initialSampleRate);
  const initialBitrateRef = useRef(initialBitrate);
  const initialAudioFormatRef = useRef(initialAudioFormat);
  const initialVoiceIdRef = useRef(initialVoiceId);
  const initialStabilityRef = useRef(initialStability);
  const initialSimilarityBoostRef = useRef(initialSimilarityBoost);
  const initialStyleRef = useRef(initialStyle);
  const initialSpeedRef = useRef(initialSpeed);
  const initialExaggerationRef = useRef(initialExaggeration);
  const initialTemperatureRef = useRef(initialTemperature);
  const initialCfgScaleRef = useRef(initialCfgScale);
  const initialDialogueInputsRef = useRef(initialDialogueInputs);
  const initialUseSpeakerBoostRef = useRef(initialUseSpeakerBoost);
  const initialVoicePromptRef = useRef(initialVoicePrompt);
  const initialTopPRef = useRef(initialTopP);
  const initialMaxTokensRef = useRef(initialMaxTokens);
  const initialRepetitionPenaltyRef = useRef(initialRepetitionPenalty);
  const initialFilenameRef = useRef(initialFilename);
  const initialDurationRef = useRef(initialDuration);
  const initialPromptInfluenceRef = useRef(initialPromptInfluence);
  const initialLoopRef = useRef(initialLoop);
  const initialPromptRef = useRef(initialPrompt);
  const initialModelRef = useRef(initialModel);
  const initialFrameRef = useRef(initialFrame);
  const initialAspectRatioRef = useRef(initialAspectRatio);

  // Listen for global node-drag active state so nodes remain visible while dragging
  useEffect(() => {
    const handleActive = (e: Event) => {
      const ce = e as CustomEvent;
      setGlobalDragActive(Boolean(ce.detail?.active));
    };
    window.addEventListener('canvas-node-active', handleActive as any);
    return () => window.removeEventListener('canvas-node-active', handleActive as any);
  }, []);

  // Listen for pin toggle keyboard shortcut (P key)
  useEffect(() => {
    const handleTogglePin = (e: Event) => {
      const ce = e as CustomEvent;
      const { selectedMusicModalIds, selectedMusicModalId } = ce.detail || {};
      const isThisSelected = (selectedMusicModalIds && Array.isArray(selectedMusicModalIds) && selectedMusicModalIds.includes(id)) ||
        (selectedMusicModalId === id);
      if (isThisSelected) {
        onTogglePin?.();
      }
    };
    window.addEventListener('canvas-toggle-pin', handleTogglePin as any);
    return () => window.removeEventListener('canvas-toggle-pin', handleTogglePin as any);
  }, [id]);

  // Listen for frame dim events (when dragging connection near disallowed frame)
  useEffect(() => {
    if (!id) return;
    const handleFrameDim = (e: Event) => {
      const ce = e as CustomEvent;
      const { frameId, dimmed } = ce.detail || {};
      if (frameId === id) {
        setIsDimmed(dimmed === true);
      }
    };
    window.addEventListener('canvas-frame-dim', handleFrameDim as any);
    return () => {
      window.removeEventListener('canvas-frame-dim', handleFrameDim as any);
    };
  }, [id]);


  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);

  // Detect connected text input
  const connectedTextInput = useMemo(() => {
    if (!id || !connections || connections.length === 0 || !textInputStates || textInputStates.length === 0) {
      return null;
    }
    // Find connection where this modal is the target (to === id)
    const connection = connections.find(c => c.to === id);
    if (!connection) return null;

    // Find the text input state that matches the connection source
    const textInput = textInputStates.find(t => t.id === connection.from);
    return textInput || null;
  }, [id, connections, textInputStates]);

  const onOptionsChangeRef = useRef(onOptionsChange);

  // Update ref when onOptionsChange changes
  useEffect(() => {
    onOptionsChangeRef.current = onOptionsChange;
  }, [onOptionsChange]);

  // Update prompt when text input value changes (real-time sync)
  useEffect(() => {
    const currentTextValue = connectedTextInput?.value;
    if (currentTextValue !== undefined && currentTextValue !== prompt) {
      setPrompt(currentTextValue);
    }
  }, [connectedTextInput?.value, prompt]);

  // Use local prompt or connected prompt
  const effectivePrompt = prompt;

  // Calculate aspect ratio from string (e.g., "16:9" -> 16/9)
  const getAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

  const isDark = useIsDarkTheme();

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected
    ? '#437eb5'
    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;

  const setGeneratingState = (next: boolean) => {
    setIsGenerating(next);
    onOptionsChange?.({ isGenerating: next });
  };

  const handleGenerate = async () => {
    let promptToUse = effectivePrompt;
    let lyricsToUse = lyricsPrompt;
    let modelToUse = selectedModel;

    // Force correct model based on category for single-model tabs
    if (activeCategory === 'sfx') {
      modelToUse = 'ElevenLabs Sound Effects';
    } else if (activeCategory === 'dialogue') {
      modelToUse = 'ElevenLabs Dialogue V3';
    } else if (activeCategory === 'music') {
      modelToUse = 'MiniMax Music 2';
    }

    // For dialogue, automatically construct prompt and lyrics from inputs if not manually set
    if (activeCategory === 'dialogue') {
      const dialogueText = dialogueInputs
        .filter(i => i.text.trim())
        .map(i => `[${i.voice}]: ${i.text.trim()}`)
        .join(' | ');

      if (dialogueText) {
        promptToUse = dialogueText;
        lyricsToUse = dialogueText;
      }
    }

    const canGenerateDialogue = activeCategory === 'dialogue' && dialogueInputs.length > 0 && dialogueInputs.some(i => i.text.trim());
    const canGenerateOther = activeCategory !== 'dialogue' && promptToUse.trim();

    if (onGenerate && (canGenerateDialogue || canGenerateOther) && !isGenerating) {
      setGeneratingState(true);
      onGenerate(
        promptToUse,
        modelToUse,
        selectedFrame,
        selectedAspectRatio,
        lyricsToUse,
        sampleRate,
        bitrate,
        audioFormat,
        filename,
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
        duration,
        promptInfluence,
        loop
      )
        .then(() => setGeneratingState(false))
        .catch((err) => {
          console.error('Error generating music:', err);
          alert('Failed to generate music. Please try again.');
          setGeneratingState(false);
        });
    }
  };

  // Sync state from props (hydration support)
  useEffect(() => {
    if (initialPrompt !== undefined && initialPrompt !== initialPromptRef.current) {
      setPrompt(initialPrompt);
      initialPromptRef.current = initialPrompt;
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialModel && initialModel !== initialModelRef.current) {
      setSelectedModel(initialModel);
      initialModelRef.current = initialModel;
    }
  }, [initialModel]);

  useEffect(() => {
    if (initialFrame && initialFrame !== initialFrameRef.current) {
      setSelectedFrame(initialFrame);
      initialFrameRef.current = initialFrame;
    }
  }, [initialFrame]);

  useEffect(() => {
    if (initialAspectRatio && initialAspectRatio !== initialAspectRatioRef.current) {
      setSelectedAspectRatio(initialAspectRatio);
      initialAspectRatioRef.current = initialAspectRatio;
    }
  }, [initialAspectRatio]);

  useEffect(() => {
    if (initialCategory && initialCategory !== initialCategoryRef.current) {
      setActiveCategory(initialCategory);
      initialCategoryRef.current = initialCategory;
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialLyrics && initialLyrics !== initialLyricsRef.current) {
      setLyricsPrompt(initialLyrics);
      initialLyricsRef.current = initialLyrics;
    }
  }, [initialLyrics]);

  useEffect(() => {
    if (initialFilename !== undefined && initialFilename !== initialFilenameRef.current) {
      setFilename(initialFilename);
      initialFilenameRef.current = initialFilename;
    }
  }, [initialFilename]);

  useEffect(() => {
    if (initialLoop !== undefined && initialLoop !== initialLoopRef.current) {
      setLoop(initialLoop);
      initialLoopRef.current = initialLoop;
    }
  }, [initialLoop]);

  useEffect(() => {
    if (initialDuration !== undefined && initialDuration !== initialDurationRef.current) {
      setDuration(initialDuration);
      initialDurationRef.current = initialDuration;
    }
  }, [initialDuration]);

  useEffect(() => {
    if (initialPromptInfluence !== undefined && initialPromptInfluence !== initialPromptInfluenceRef.current) {
      setPromptInfluence(initialPromptInfluence);
      initialPromptInfluenceRef.current = initialPromptInfluence;
    }
  }, [initialPromptInfluence]);

  useEffect(() => {
    if (initialStability !== undefined && initialStability !== initialStabilityRef.current) {
      setStability(initialStability);
      initialStabilityRef.current = initialStability;
    }
  }, [initialStability]);

  useEffect(() => {
    if (initialSimilarityBoost !== undefined && initialSimilarityBoost !== initialSimilarityBoostRef.current) {
      setSimilarityBoost(initialSimilarityBoost);
      initialSimilarityBoostRef.current = initialSimilarityBoost;
    }
  }, [initialSimilarityBoost]);

  useEffect(() => {
    if (initialStyle !== undefined && initialStyle !== initialStyleRef.current) {
      setStyle(initialStyle);
      initialStyleRef.current = initialStyle;
    }
  }, [initialStyle]);

  useEffect(() => {
    if (initialSpeed !== undefined && initialSpeed !== initialSpeedRef.current) {
      setSpeed(initialSpeed);
      initialSpeedRef.current = initialSpeed;
    }
  }, [initialSpeed]);

  useEffect(() => {
    if (initialExaggeration !== undefined && initialExaggeration !== initialExaggerationRef.current) {
      setExaggeration(initialExaggeration);
      initialExaggerationRef.current = initialExaggeration;
    }
  }, [initialExaggeration]);

  useEffect(() => {
    if (initialTemperature !== undefined && initialTemperature !== initialTemperatureRef.current) {
      setTemperature(initialTemperature);
      initialTemperatureRef.current = initialTemperature;
    }
  }, [initialTemperature]);

  useEffect(() => {
    if (initialCfgScale !== undefined && initialCfgScale !== initialCfgScaleRef.current) {
      setCfgScale(initialCfgScale);
      initialCfgScaleRef.current = initialCfgScale;
    }
  }, [initialCfgScale]);

  useEffect(() => {
    const dialogPropStr = JSON.stringify(initialDialogueInputs);
    const dialogRefStr = JSON.stringify(initialDialogueInputsRef.current);
    if (initialDialogueInputs && dialogPropStr !== dialogRefStr) {
      setDialogueInputs(initialDialogueInputs);
      initialDialogueInputsRef.current = initialDialogueInputs;
    }
  }, [initialDialogueInputs]);

  useEffect(() => {
    if (initialUseSpeakerBoost !== undefined && initialUseSpeakerBoost !== initialUseSpeakerBoostRef.current) {
      setUseSpeakerBoost(initialUseSpeakerBoost);
      initialUseSpeakerBoostRef.current = initialUseSpeakerBoost;
    }
  }, [initialUseSpeakerBoost]);

  // Sync state changes to parent (immediate for dropdowns/toggles, debounced for text/sliders)
  useEffect(() => {
    if (prompt !== (initialPromptRef.current || '')) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ prompt });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [prompt]);

  useEffect(() => {
    if (selectedModel !== initialModelRef.current) {
      onOptionsChange?.({ model: selectedModel });
    }
  }, [selectedModel]);

  useEffect(() => {
    if (selectedFrame !== initialFrameRef.current) {
      onOptionsChange?.({ frame: selectedFrame });
    }
  }, [selectedFrame]);

  useEffect(() => {
    if (selectedAspectRatio !== initialAspectRatioRef.current) {
      onOptionsChange?.({ aspectRatio: selectedAspectRatio });
    }
  }, [selectedAspectRatio]);

  useEffect(() => {
    if (activeCategory && activeCategory !== initialCategoryRef.current) {
      onOptionsChange?.({ activeCategory });
    }
  }, [activeCategory]);

  useEffect(() => {
    if (lyricsPrompt !== (initialLyricsRef.current || '')) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ lyrics: lyricsPrompt });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lyricsPrompt]);

  useEffect(() => {
    if (sampleRate && sampleRate !== initialSampleRateRef.current) {
      onOptionsChange?.({ sampleRate });
    }
  }, [sampleRate]);

  useEffect(() => {
    if (bitrate && bitrate !== initialBitrateRef.current) {
      onOptionsChange?.({ bitrate });
    }
  }, [bitrate]);

  useEffect(() => {
    if (audioFormat && audioFormat !== initialAudioFormatRef.current) {
      onOptionsChange?.({ audioFormat });
    }
  }, [audioFormat]);

  useEffect(() => {
    if (voiceId !== initialVoiceIdRef.current) {
      onOptionsChange?.({ voiceId });
    }
  }, [voiceId]);

  useEffect(() => {
    if (stability !== initialStabilityRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ stability });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [stability]);

  useEffect(() => {
    if (activeCategory === 'sfx' && audioFormat === 'MP3') {
      setAudioFormat('mp3_44100_128');
    }
  }, [activeCategory, audioFormat]);

  useEffect(() => {
    if (similarityBoost !== initialSimilarityBoostRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ similarityBoost });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [similarityBoost]);

  useEffect(() => {
    if (style !== initialStyleRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ style });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [style]);

  useEffect(() => {
    if (speed !== initialSpeedRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ speed });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [speed]);

  useEffect(() => {
    if (exaggeration !== initialExaggerationRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ exaggeration });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [exaggeration]);

  useEffect(() => {
    if (temperature !== initialTemperatureRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ temperature });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [temperature]);

  useEffect(() => {
    if (cfgScale !== initialCfgScaleRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ cfgScale });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [cfgScale]);

  useEffect(() => {
    if (voicePrompt !== (initialVoicePromptRef.current || '')) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ voicePrompt });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [voicePrompt]);

  useEffect(() => {
    onOptionsChange?.({ filename });
  }, [filename]);

  useEffect(() => {
    onOptionsChange?.({ loop });
  }, [loop]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onOptionsChange?.({ duration });
    }, 500);
    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onOptionsChange?.({ promptInfluence });
    }, 500);
    return () => clearTimeout(timer);
  }, [promptInfluence]);

  useEffect(() => {
    if (topP !== initialTopPRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ topP });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [topP]);

  useEffect(() => {
    if (maxTokens !== initialMaxTokensRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ maxTokens });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [maxTokens]);

  useEffect(() => {
    if (repetitionPenalty !== initialRepetitionPenaltyRef.current) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ repetitionPenalty });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [repetitionPenalty]);

  useEffect(() => {
    const dialogPropStr = JSON.stringify(initialDialogueInputsRef.current || []);
    const dialogStateStr = JSON.stringify(dialogueInputs);
    if (dialogStateStr !== dialogPropStr) {
      const timer = setTimeout(() => {
        onOptionsChange?.({ dialogueInputs });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dialogueInputs]);

  useEffect(() => {
    if (useSpeakerBoost !== initialUseSpeakerBoostRef.current) {
      onOptionsChange?.({ useSpeakerBoost });
    }
  }, [useSpeakerBoost]);



  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isAudio = target.tagName === 'AUDIO';
    const isControls = target.closest('.controls-overlay');

    // Call onSelect when clicking on the modal (this will trigger context menu)
    if (onSelect && !isInput && !isButton && !isControls) {
      onSelect();
    }

    // Only allow dragging from the frame, not from controls
    if (!isInput && !isButton && !isAudio && !isControls) {
      setIsDraggingContainer(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle drag move
  useEffect(() => {
    if (!isDraggingContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !onPositionChange) return;

      // Calculate new screen position
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;

      // Convert screen coordinates back to canvas coordinates
      const newCanvasX = (newScreenX - position.x) / scale;
      const newCanvasY = (newScreenY - position.y) / scale;

      onPositionChange(newCanvasX, newCanvasY);
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
    };

    const handleMouseUp = () => {
      setIsDraggingContainer(false);
      if (onPositionCommit && lastCanvasPosRef.current) {
        onPositionCommit(lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    // Capture so child stopPropagation (e.g. nodes) can't block drag end
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange]);


  if (!isOpen) return null;

  // Fallback: If we have a URL but no category (e.g. legacy data), default to 'music' so controls show
  const effectiveCategory = activeCategory || (generatedMusicUrl ? 'music' : null);

  return (
    <div
      ref={containerRef}
      data-modal-component="music"
      data-overlay-id={id}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
        userSelect: 'none',
        opacity: isDimmed ? 0.4 : 1,
      }}
    >
      <MusicModalTooltip
        isHovered={isHovered}
        scale={scale}
      />

      <div style={{ position: 'relative' }}>
        <MusicModalFrame
          id={id}
          scale={scale}
          selectedAspectRatio={selectedAspectRatio}
          isHovered={isHovered}
          isPinned={isPinned}
          isSelected={!!isSelected}
          isDraggingContainer={isDraggingContainer}
          generatedMusicUrl={generatedMusicUrl}
          isGenerating={isGenerating}
          frameBorderColor={frameBorderColor}
          frameBorderWidth={frameBorderWidth}
          onSelect={onSelect}
          getAspectRatio={getAspectRatio}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <MusicModalNodes
          id={id}
          scale={scale}
          isHovered={isHovered}
          isSelected={!!isSelected}
          globalDragActive={globalDragActive}
          activeCategory={activeCategory}
        />
      </div>

      {effectiveCategory && (
        <MusicModalControls
          scale={scale}
          isHovered={isHovered}
          isPinned={isPinned}
          isSelected={Boolean(isSelected)}
          prompt={effectivePrompt}
          isPromptDisabled={!!connectedTextInput}
          selectedModel={selectedModel}
          selectedAspectRatio={selectedAspectRatio}
          selectedFrame={selectedFrame}
          generatedMusicUrl={generatedMusicUrl}
          isGenerating={isGenerating}
          isModelDropdownOpen={isModelDropdownOpen}
          isAspectRatioDropdownOpen={isAspectRatioDropdownOpen}
          frameBorderColor={frameBorderColor}
          frameBorderWidth={frameBorderWidth}
          onPromptChange={(val) => {
            if (!connectedTextInput) {
              setPrompt(val);
            }
          }}
          onModelChange={(model) => {
            setSelectedModel(model);
          }}
          onAspectRatioChange={(ratio) => {
            setSelectedAspectRatio(ratio);
          }}
          lyricsPrompt={lyricsPrompt}
          onLyricsPromptChange={setLyricsPrompt}
          sampleRate={sampleRate}
          onSampleRateChange={setSampleRate}
          bitrate={bitrate}
          onBitrateChange={setBitrate}
          audioFormat={audioFormat}
          onAudioFormatChange={setAudioFormat}
          voiceId={voiceId}
          onVoiceIdChange={setVoiceId}
          filename={filename}
          onFilenameChange={setFilename}
          onGenerate={handleGenerate}
          onSetIsHovered={setIsHovered}
          onSetIsPinned={(val) => onTogglePin?.()}
          onSetIsModelDropdownOpen={setIsModelDropdownOpen}
          onSetIsAspectRatioDropdownOpen={setIsAspectRatioDropdownOpen}
          onOptionsChange={onOptionsChange}
          activeCategory={effectiveCategory}
          stability={stability}
          onStabilityChange={setStability}
          similarityBoost={similarityBoost}
          onSimilarityBoostChange={setSimilarityBoost}
          style={style}
          onStyleChange={setStyle}
          speed={speed}
          onSpeedChange={setSpeed}
          exaggeration={exaggeration}
          onExaggerationChange={setExaggeration}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          cfgScale={cfgScale}
          onCfgScaleChange={setCfgScale}
          dialogueInputs={dialogueInputs}
          onDialogueInputsChange={setDialogueInputs}
          useSpeakerBoost={useSpeakerBoost}
          onUseSpeakerBoostChange={setUseSpeakerBoost}
          duration={duration}
          onDurationChange={setDuration}
          promptInfluence={promptInfluence}
          onPromptInfluenceChange={setPromptInfluence}
          loop={loop}
          onLoopChange={setLoop}
        />
      )}
    </div>
  );
};
