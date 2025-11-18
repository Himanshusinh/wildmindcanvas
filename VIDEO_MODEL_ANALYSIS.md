# Video Generation Model Analysis & Implementation

## Overview
This document summarizes the analysis of all 21 video generation models and the implementation of model-specific constraints in the canvas frontend.

## Model Configurations

### Resolution Support Summary

| Model | Supported Resolutions | Default | Notes |
|-------|----------------------|---------|-------|
| Sora 2 Pro | 720p, 1080p | 720p | Text-to-Video and Image-to-Video |
| Veo 3.1 Pro | 720p, 1080p | 720p | Fixed 8s duration |
| Veo 3 Pro | 720p, 1080p | 720p | 4s, 6s, or 8s duration |
| Kling Models | 720p, 1080p | 720p | Controlled via mode (standard=720p, pro=1080p) |
| Seedance 1.0 Pro/Lite | 480p, 720p, 1080p | 1080p | Most flexible (2-12s duration) |
| PixVerse v5 | 360p, 540p, 720p, 1080p | 720p | Quality parameter |
| LTX V2 Pro/Fast | 1080p, 1440p, 2160p (4K) | 1080p | Highest resolution support |
| WAN 2.5 | 480p, 720p, 1080p | 720p | Mapped from size parameter |
| Gen-4 Turbo | 720p, 1080p | 720p | Runway model |
| Gen-3a Turbo | 720p, 1080p | 720p | Runway model |
| MiniMax-Hailuo-02 | 512P, 768P, 1080P | 768P | 1080P only supports 6s |
| MiniMax T2V/I2V/S2V | 720P | 720P | Fixed 6s duration |

### OpenAI Models

#### Sora 2 Pro
- **Durations**: 4s, 8s, 12s (default: 8s)
- **Resolutions**: 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16 (default: 16:9)
- **Resolution Notes**: Text-to-Video and Image-to-Video both support 720p and 1080p

### Google Models

#### Veo 3.1 Pro
- **Durations**: 8s (fixed)
- **Resolutions**: 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

#### Veo 3.1 Fast Pro
- **Durations**: 8s (fixed)
- **Resolutions**: 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

#### Veo 3 Pro
- **Durations**: 4s, 6s, 8s (default: 8s)
- **Resolutions**: 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

#### Veo 3 Fast Pro
- **Durations**: 4s, 6s, 8s (default: 8s)
- **Resolutions**: 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

### Kling Models

#### Kling 2.5 Turbo Pro
- **Durations**: 5s, 10s (default: 5s)
- **Resolutions**: 720p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

#### Kling 2.1
- **Durations**: 5s, 10s (default: 5s)
- **Resolutions**: 720p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

#### Kling 2.1 Master Pro
- **Durations**: 5s, 10s (default: 5s)
- **Resolutions**: 720p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

### Seedance Models

#### Seedance 1.0 Pro
- **Durations**: 2-12s (default: 5s)
- **Resolutions**: 480p, 720p, 1080p (default: 1080p)
- **Aspect Ratios**: 16:9, 4:3, 1:1, 3:4, 9:16, 21:9, 9:21 (default: 16:9)
- **Note**: Most flexible model with wide range of durations

#### Seedance 1.0 Lite
- **Durations**: 2-12s (default: 5s)
- **Resolutions**: 480p, 720p, 1080p (default: 1080p)
- **Aspect Ratios**: 16:9, 4:3, 1:1, 3:4, 9:16, 21:9, 9:21 (default: 16:9)

### PixVerse Models

#### PixVerse v5
- **Durations**: 5s, 8s (default: 5s)
- **Resolutions**: 360p, 540p, 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

### LTX Models

#### LTX V2 Pro
- **Durations**: 6s, 8s, 10s (default: 8s)
- **Resolutions**: 1080p, 1440p, 2160p (default: 1080p)
- **Aspect Ratios**: 16:9, 9:16 (default: 16:9)
- **Note**: Highest resolution support (up to 4K)

#### LTX V2 Fast
- **Durations**: 6s, 8s, 10s (default: 8s)
- **Resolutions**: 1080p, 1440p, 2160p (default: 1080p)
- **Aspect Ratios**: 16:9, 9:16 (default: 16:9)

### WAN Models

#### WAN 2.5
- **Durations**: 5s, 10s (default: 5s)
- **Resolutions**: 480p, 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

#### WAN 2.5 Fast
- **Durations**: 5s, 10s (default: 5s)
- **Resolutions**: 480p, 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

### Runway Models

#### Gen-4 Turbo
- **Durations**: 5s, 10s (default: 5s)
- **Resolutions**: 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1, 4:3, 3:4 (default: 16:9)

#### Gen-3a Turbo
- **Durations**: 5s, 10s (default: 5s)
- **Resolutions**: 720p, 1080p (default: 720p)
- **Aspect Ratios**: 16:9, 9:16, 1:1, 4:3, 3:4 (default: 16:9)

### MiniMax Models

#### MiniMax-Hailuo-02
- **Durations**: 6s, 10s (default: 6s)
- **Resolutions**: 512P, 768P, 1080P (default: 768P)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)
- **Note**: 1080P supports only 6s duration

#### T2V-01-Director
- **Durations**: 6s (fixed)
- **Resolutions**: 720P (default: 720P)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

#### I2V-01-Director
- **Durations**: 6s (fixed)
- **Resolutions**: 720P (default: 720P)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

#### S2V-01
- **Durations**: 6s (fixed)
- **Resolutions**: 720P (default: 720P)
- **Aspect Ratios**: 16:9, 9:16, 1:1 (default: 16:9)

## Implementation Details

### Files Created/Modified

1. **`lib/videoModelConfig.ts`** (NEW)
   - Contains configuration for all 21 video models
   - Provides helper functions to get valid options for each model
   - Includes validation functions

2. **`components/VideoUploadModal/VideoUploadModal.tsx`** (MODIFIED)
   - Imports model configuration functions
   - Dynamically updates duration dropdown based on selected model
   - Dynamically updates aspect ratio dropdown based on selected model
   - Automatically adjusts duration/aspect ratio when model changes
   - Sets appropriate defaults when model is selected

### Key Features

1. **Dynamic Duration Options**: The duration dropdown now shows only valid durations for the selected model. For example:
   - Veo 3.1 Pro: Only shows 8s
   - Seedance 1.0 Pro: Shows 2-12s range
   - MiniMax-Hailuo-02: Shows 6s and 10s

2. **Dynamic Aspect Ratio Options**: The aspect ratio dropdown shows only valid ratios for the selected model. For example:
   - Sora 2 Pro: Only 16:9 and 9:16
   - Seedance 1.0 Pro: Includes 21:9 and 9:21
   - LTX V2 Pro: Only 16:9 and 9:16

3. **Dynamic Resolution Options**: The resolution dropdown shows only valid resolutions for the selected model. For example:
   - Sora 2 Pro: 720p, 1080p
   - PixVerse v5: 360p, 540p, 720p, 1080p
   - LTX V2 Pro: 1080p, 1440p, 2160p (4K)
   - MiniMax-Hailuo-02: 512P, 768P, 1080P

4. **Automatic Adjustment**: When a user selects a different model:
   - If the current duration is not valid for the new model, it automatically changes to the default
   - If the current aspect ratio is not valid for the new model, it automatically changes to the default
   - If the current resolution is not valid for the new model, it automatically changes to the default

5. **Default Values**: Each model has sensible defaults that are automatically applied when the model is first selected.

## Usage Example

When a user selects "Veo 3 Pro":
- Duration dropdown will show: 4s, 6s, 8s (default: 8s)
- Aspect ratio dropdown will show: 16:9, 9:16, 1:1 (default: 16:9)

When a user switches from "Veo 3 Pro" (8s, 16:9) to "Veo 3.1 Pro":
- Duration automatically changes to 8s (still valid)
- Aspect ratio remains 16:9 (still valid)

When a user switches from "Seedance 1.0 Pro" (5s, 21:9, 1080p) to "Sora 2 Pro":
- Duration automatically changes to 8s (default for Sora 2 Pro)
- Aspect ratio automatically changes to 16:9 (21:9 not supported by Sora 2 Pro)
- Resolution remains 1080p (valid for Sora 2 Pro)

When a user switches from "PixVerse v5" (5s, 16:9, 360p) to "LTX V2 Pro":
- Duration automatically changes to 8s (default for LTX V2 Pro)
- Aspect ratio remains 16:9 (valid for LTX V2 Pro)
- Resolution automatically changes to 1080p (360p not supported, default for LTX V2 Pro)

## Backend Validation

All constraints are validated in the backend through validators:
- `validateFalGenerate.ts` - For Sora, Veo, LTX models
- `validateKlingT2V.ts` / `validateKlingI2V.ts` - For Kling models
- `validateSeedanceT2V.ts` - For Seedance models
- `validatePixverseT2V.ts` - For PixVerse models
- `validateWan25T2V.ts` / `validateWan25I2V.ts` - For WAN models
- `validateRunway.ts` - For Runway models
- `validateMinimaxVideo.ts` - For MiniMax models

The frontend now matches these backend constraints, preventing invalid requests and improving user experience.

