'use client';
import { useRef, useEffect, useState } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { MusicCategory } from './MusicModalTabs';
import { MusicCategoryView } from './categories/MusicCategoryView';
import { VoiceCategoryView } from './categories/VoiceCategoryView';
import { DialogueCategoryView } from './categories/DialogueCategoryView';
import { SfxCategoryView } from './categories/SfxCategoryView';
import { DefaultCategoryView } from './categories/DefaultCategoryView';
import { DialogueInput } from '../../canvas-overlays/types';

interface MusicModalControlsProps {
  scale: number;
  isHovered: boolean;
  isPinned: boolean;
  isSelected?: boolean;
  prompt: string;
  isPromptDisabled?: boolean;
  selectedModel: string;
  selectedAspectRatio: string;
  selectedFrame: string;
  generatedMusicUrl?: string | null;
  isGenerating: boolean;
  isModelDropdownOpen: boolean;
  isAspectRatioDropdownOpen: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  onPromptChange: (value: string) => void;
  onModelChange: (model: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onGenerate: () => void;
  onSetIsHovered: (hovered: boolean) => void;
  onSetIsPinned: (pinned: boolean) => void;
  onSetIsModelDropdownOpen: (open: boolean) => void;
  onSetIsAspectRatioDropdownOpen: (open: boolean) => void;
  onOptionsChange?: (opts: {
    model?: string;
    frame?: string;
    aspectRatio?: string;
    prompt?: string;
    frameWidth?: number;
    frameHeight?: number;
    activeCategory?: MusicCategory;
    isGenerating?: boolean;
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
  }) => void;
  activeCategory: MusicCategory;
  lyricsPrompt: string;
  onLyricsPromptChange: (val: string) => void;
  sampleRate: string;
  onSampleRateChange: (val: string) => void;
  bitrate: string;
  onBitrateChange: (val: string) => void;
  audioFormat: string;
  onAudioFormatChange: (val: string) => void;
  filename: string;
  onFilenameChange: (val: string) => void;
  voiceId?: string;
  onVoiceIdChange?: (val: string) => void;
  stability?: number;
  onStabilityChange?: (val: number) => void;
  similarityBoost?: number;
  onSimilarityBoostChange?: (val: number) => void;
  style?: number;
  onStyleChange?: (val: number) => void;
  speed?: number;
  onSpeedChange?: (val: number) => void;
  exaggeration?: number;
  onExaggerationChange?: (val: number) => void;
  temperature?: number;
  onTemperatureChange?: (val: number) => void;
  cfgScale?: number;
  onCfgScaleChange?: (val: number) => void;
  voicePrompt?: string;
  onVoicePromptChange?: (val: string) => void;
  topP?: number;
  onTopPChange?: (val: number) => void;
  maxTokens?: number;
  onMaxTokensChange?: (val: number) => void;
  repetitionPenalty?: number;
  onRepetitionPenaltyChange?: (val: number) => void;
  dialogueInputs?: DialogueInput[];
  onDialogueInputsChange?: (inputs: DialogueInput[]) => void;
  useSpeakerBoost?: boolean;
  onUseSpeakerBoostChange?: (val: boolean) => void;
  duration?: number;
  onDurationChange?: (val: number) => void;
  promptInfluence?: number;
  onPromptInfluenceChange?: (val: number) => void;
  loop?: boolean;
  onLoopChange?: (val: boolean) => void;
}

export const MusicModalControls: React.FC<MusicModalControlsProps> = ({
  scale,
  isHovered,
  isPinned,
  isSelected = false,
  prompt,
  isPromptDisabled = false,
  selectedModel,
  selectedAspectRatio,
  selectedFrame,
  generatedMusicUrl,
  isGenerating,
  isModelDropdownOpen,
  isAspectRatioDropdownOpen,
  frameBorderColor,
  frameBorderWidth,
  onPromptChange,
  onModelChange,
  onAspectRatioChange,
  onGenerate,
  onSetIsHovered,
  onSetIsPinned,
  onSetIsModelDropdownOpen,
  onSetIsAspectRatioDropdownOpen,
  onOptionsChange,
  activeCategory,
  lyricsPrompt,
  onLyricsPromptChange,
  sampleRate,
  onSampleRateChange,
  bitrate,
  onBitrateChange,
  audioFormat,
  onAudioFormatChange,
  filename,
  onFilenameChange,
  voiceId,
  onVoiceIdChange,
  stability,
  onStabilityChange,
  similarityBoost,
  onSimilarityBoostChange,
  style,
  onStyleChange,
  speed,
  onSpeedChange,
  exaggeration,
  onExaggerationChange,
  temperature,
  onTemperatureChange,
  cfgScale,
  onCfgScaleChange,
  voicePrompt,
  onVoicePromptChange,
  topP,
  onTopPChange,
  maxTokens,
  onMaxTokensChange,
  repetitionPenalty,
  onRepetitionPenaltyChange,
  dialogueInputs = [],
  onDialogueInputsChange,
  useSpeakerBoost = false,
  onUseSpeakerBoostChange,
  duration,
  onDurationChange,
  promptInfluence,
  onPromptInfluenceChange,
  loop,
  onLoopChange,
}) => {
  const isDark = useIsDarkTheme();

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);

  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const controlFontSize = `${13 * scale}px`;
  const inputFontSize = `${12 * scale}px`;
  const controlsFrameBorderColor = isSelected ? '#437eb5' : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const controlsBg = isDark ? '#121212' : '#ffffff';
  const inputBg = isDark ? (isPromptDisabled ? '#1a1a1a' : '#121212') : (isPromptDisabled ? '#f3f4f6' : '#ffffff');
  const inputText = isDark ? (isPromptDisabled ? '#666666' : '#ffffff') : (isPromptDisabled ? '#6b7280' : '#1f2937');
  const dropdownBg = isDark ? '#121212' : '#ffffff';
  const dropdownText = isDark ? '#ffffff' : '#1f2937';
  const iconColor = isDark ? '#cccccc' : '#4b5563';

  const categoryConfig: Record<Exclude<MusicCategory, null>, { placeholder: string; models: string[] }> = {
    music: {
      placeholder: 'Describe your music...',
      models: ['MiniMax Music 2'],
    },
    voice: {
      placeholder: 'Enter the text you want to convert to speech...',
      models: ['ElevenLabs TTS v3', 'Chatterbox Multilingual', 'Maya TTS'],
    },
    dialogue: {
      placeholder: 'Enter dialogue script...',
      models: ['ElevenLabs Dialogue V3'],
    },
    sfx: {
      placeholder: 'Describe sound effect...',
      models: ['ElevenLabs Sound Effects'],
    },
    'voice-cloning': {
      placeholder: 'Enter text to clone voice...',
      models: ['CloneGen', 'VoiceCraft', 'Audio-LM'],
    },
  };

  const currentConfig = (activeCategory && categoryConfig[activeCategory]) || categoryConfig.music;

  // Global dropdown handlers (only model and aspect ratio are global)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        onSetIsModelDropdownOpen(false);
      }
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target as Node)) {
        onSetIsAspectRatioDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen || isAspectRatioDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen, isAspectRatioDropdownOpen, onSetIsModelDropdownOpen, onSetIsAspectRatioDropdownOpen]);

  const baseProps = {
    scale,
    isDark,
    controlFontSize,
    inputFontSize,
    dropdownBorderColor,
    iconColor,
    selectedModel,
    onModelChange,
    prompt,
    onPromptChange,
    onGenerate,
    isGenerating,
    models: currentConfig.models,
    modelDropdownRef,
    isModelDropdownOpen,
    onSetIsModelDropdownOpen,
  };

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'music':
        return (
          <MusicCategoryView
            {...baseProps}
            lyricsPrompt={lyricsPrompt}
            onLyricsPromptChange={onLyricsPromptChange}
          />
        );
      case 'voice':
        return (
          <VoiceCategoryView
            {...baseProps}
            voiceId={voiceId}
            onVoiceIdChange={onVoiceIdChange}
            stability={stability}
            onStabilityChange={onStabilityChange}
            similarityBoost={similarityBoost}
            onSimilarityBoostChange={onSimilarityBoostChange}
            style={style}
            onStyleChange={onStyleChange}
            speed={speed}
            onSpeedChange={onSpeedChange}
            exaggeration={exaggeration}
            onExaggerationChange={onExaggerationChange}
            temperature={temperature}
            onTemperatureChange={onTemperatureChange}
            cfgScale={cfgScale}
            onCfgScaleChange={onCfgScaleChange}
            voicePrompt={voicePrompt}
            onVoicePromptChange={onVoicePromptChange}
            topP={topP}
            onTopPChange={onTopPChange}
            maxTokens={maxTokens}
            onMaxTokensChange={onMaxTokensChange}
            repetitionPenalty={repetitionPenalty}
            onRepetitionPenaltyChange={onRepetitionPenaltyChange}
            filename={filename}
            onFilenameChange={onFilenameChange}
          />
        );
      case 'dialogue':
        return (
          <DialogueCategoryView
            {...baseProps}
            dialogueInputs={dialogueInputs}
            onDialogueInputsChange={onDialogueInputsChange!}
            stability={stability || 0.5}
            onStabilityChange={onStabilityChange!}
            useSpeakerBoost={useSpeakerBoost}
            onUseSpeakerBoostChange={onUseSpeakerBoostChange!}
            filename={filename}
            onFilenameChange={onFilenameChange}
          />
        );
      case 'sfx':
        return (
          <SfxCategoryView
            {...baseProps}
            duration={duration || 18}
            onDurationChange={onDurationChange!}
            promptInfluence={promptInfluence || 1}
            onPromptInfluenceChange={onPromptInfluenceChange!}
            audioFormat={audioFormat}
            onAudioFormatChange={onAudioFormatChange}
            loop={loop || false}
            onLoopChange={onLoopChange!}
            filename={filename}
            onFilenameChange={onFilenameChange}
          />
        );
      default:
        return (
          <DefaultCategoryView
            {...baseProps}
            dropdownBg={dropdownBg}
            dropdownText={dropdownText}
            inputText={inputText}
            inputBg={inputBg}
            selectedAspectRatio={selectedAspectRatio}
            onAspectRatioChange={onAspectRatioChange}
            selectedFrame={selectedFrame}
            isPromptDisabled={isPromptDisabled}
            placeholder={currentConfig.placeholder}
            aspectRatioDropdownRef={aspectRatioDropdownRef}
            isAspectRatioDropdownOpen={isAspectRatioDropdownOpen}
            onSetIsAspectRatioDropdownOpen={onSetIsAspectRatioDropdownOpen}
            onOptionsChange={onOptionsChange}
          />
        );
    }
  };

  return (
    <div
      className="controls-overlay"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        width: `${600 * scale}px`,
        maxWidth: '90vw',
        padding: `${16 * scale}px`,
        backgroundColor: controlsBg,
        borderRadius: `0 0 ${16 * scale}px ${16 * scale}px`,
        boxShadow: 'none',
        transform: (isHovered || isPinned) ? 'translateY(0)' : `translateY(-100%)`,
        opacity: (isHovered || isPinned) ? 1 : 0,
        maxHeight: (isHovered || isPinned) ? '1000px' : '0px',
        display: 'flex',
        flexDirection: 'column',
        gap: `${16 * scale}px`,
        pointerEvents: (isHovered || isPinned) ? 'auto' : 'none',
        overflow: 'visible',
        zIndex: 3,
        borderLeft: `${frameBorderWidth * scale}px solid ${controlsFrameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${controlsFrameBorderColor}`,
        borderBottom: `${frameBorderWidth * scale}px solid ${controlsFrameBorderColor}`,
      }}
      onMouseEnter={() => onSetIsHovered(true)}
      onMouseLeave={() => onSetIsHovered(false)}
    >
      {renderCategoryContent()}
    </div>
  );
};
