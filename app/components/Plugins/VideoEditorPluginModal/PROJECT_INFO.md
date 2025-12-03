# Video Editor Plugin - Project Information

## Overview
The **Video Editor Plugin** is a comprehensive, professional-grade video editing suite integrated directly into the Wild Mind Canvas application. It provides a modal-based interface for creating, editing, and producing high-quality video content with support for multi-track timelines, advanced effects, and high-resolution media.

## Core Features

### 1. Multi-Track Timeline
-   **Layer-Based Editing**: Support for unlimited Video, Audio, and Overlay (Text/Image) tracks.
-   **Drag & Drop**: Seamlessly drag clips between tracks, reorder layers, and adjust timing.
-   **Clip Management**:
    -   **Split**: Cut clips at the playhead.
    -   **Trim**: Resize clips from start or end.
    -   **Move**: Drag to reposition in time.
    -   **Duplicate/Copy/Paste**: Quickly replicate content.
    -   **Lock/Unlock**: Prevent accidental edits.
    -   **Delete**: Remove unwanted clips.

### 2. Advanced Canvas & Preview
-   **Interactive Manipulation**: Drag, resize, and rotate elements directly on the canvas.
-   **Snap-to-Grid**: Intelligent snapping for alignment.
-   **Auto-Scaling**: Dropped media automatically fills the canvas ("Cover" mode).
-   **High-Performance Rendering**:
    -   **Preview Scaling**: Internally renders at max 1080p to ensure smooth playback even for 4K/8K projects.
    -   **Optimized Scrubbing**: Fast seeking and real-time updates.
-   **Resolution Support**: Pre-configured presets for Social Media (Instagram, TikTok, YouTube) and custom dimensions.

### 3. Media Support
-   **Video**: MP4, WebM, etc.
-   **Images**: JPG, PNG, SVG, etc.
-   **Audio**: MP3, WAV, OGG, etc.
-   **Text**: Rich text editing with custom fonts and styles.

### 4. Visual Effects & Transitions
-   **Transitions**: A vast library of Premiere Pro-style transitions:
    -   *Standard*: Dissolve, Dip to Black/White, Wipe.
    -   *Motion*: Slide, Push, Whip, Zoom, Spin.
    -   *Creative*: Glitch, RGB Split, Film Burn, Light Leak, Ripple.
    -   *Shapes*: Iris (Round, Box, Diamond), Page Peel, Barn Doors.
-   **Animations**:
    -   **Page**: Rise, Pan, Fade, Scale.
    -   **Photo**: Zoom, Rotate, Wipe.
    -   **Timing Control**: Enter, Exit, or Both.

### 5. Color & Image Adjustments
-   **Filters**: 20+ preset filters (Vintage, B&W, Cinematic, etc.).
-   **Manual Adjustments**:
    -   Brightness, Contrast, Saturation.
    -   Highlights, Shadows, Whites, Blacks.
    -   Temperature, Tint.
    -   Vignette, Clarity, Sharpness.

### 6. Text Engine
-   **Rich Styling**: Font family, size, weight, alignment, color, letter spacing, line height.
-   **Text Effects**:
    -   Shadow, Lift, Hollow, Splice, Outline.
    -   Echo, Glitch, Neon, Background.
-   **Lists**: Bullet and Numbered list support.

### 7. Tools
-   **Eraser Tool**: "Magic Eraser" functionality to mask out parts of images/videos.
-   **Crop Tool**: Non-destructive cropping of media.
-   **Background Removal**: (Planned/UI placeholder) One-click background removal.

## Technical Architecture

### Component Structure
-   **`index.tsx`**: Main entry point. Manages global state (tracks, history, playback) and orchestrates sub-components.
-   **`components/Header.tsx`**: Top bar with File menu, Resize options, and Zoom controls.
-   **`components/Canvas.tsx`**: The visual rendering engine. Handles item transformation, rendering, and interaction logic.
-   **`components/Timeline.tsx`**: The sequencer view. Handles track rendering, clip manipulation, and scrubbing.
-   **`components/EditPanel.tsx`**: The properties inspector. Context-aware panel for editing selected item attributes (Color, Animation, Text, etc.).
-   **`components/ResourcePanel.tsx`**: Sidebar for accessing media assets (Uploads, Stock Video/Image, Audio, Text presets).
-   **`types.ts`**: Centralized type definitions and style helper functions.

### Key Libraries
-   **React**: UI Framework.
-   **Tailwind CSS**: Styling.
-   **tailwindcss-animate**: Animation utilities.
-   **Lucide React**: Icons.

### Performance Optimizations
-   **Preview Scaling**: The `Canvas` component calculates a `renderScale` based on a `MAX_RENDER_WIDTH` (1920px). All pixel-based rendering (fonts, borders, shadows) is scaled down internally, while the CSS transform scales it back up for display. This decouples the logical project resolution (e.g., 8K) from the browser's rendering load.
-   **Memoization**: Heavy computations are memoized where possible.

## Usage Guide

1.  **Start**: Open the modal. Choose a preset size or create a custom canvas.
2.  **Import**: Use the "Uploads" tab to add your own media or browse stock assets.
3.  **Compose**: Drag media onto the Timeline.
    -   *Video/Images* go to the Main Video track or Overlay tracks.
    -   *Audio* goes to the Audio track.
4.  **Edit**: Click a clip in the Timeline or Canvas to select it. Use the **Edit Panel** (right side) to adjust properties.
5.  **Refine**:
    -   Add **Transitions** by clicking the `+` icon between clips.
    -   Add **Animations** from the "Animate" tab.
    -   Use the **Scissors** tool to split clips.
6.  **Export**: (Backend integration required for final rendering) Use the "Export" button to generate the final video.
