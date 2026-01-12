# Wildmind Canvas System Architecture

This document provides a comprehensive overview of the components, plugins, and architectural patterns used in the Wildmind Canvas application.

## System Overview

The application is a sophisticated infinite canvas built using **Next.js** and **Konva.js**. It employs a hybrid rendering approach where core canvas elements are rendered via HTML5 Canvas (Konva), while complex UI and AI tools are rendered as HTML overlays.

---

## Core Architecture

### 1. The Rendering Pipeline
The application uses two main layers:
- **Canvas Layer**: Handled by `CanvasStage.tsx` and `react-konva`. This layer manages the rendering of images, videos, and text nodes that need to be part of the infinite, zoomable space.
- **Overlay Layer**: Handled by `ModalOverlays.tsx`. This layer renders standard React/HTML components (like AI generator modals) on top of the canvas, synchronizing their positions with canvas coordinates.

### 2. State Management
The system is driven by a series of core hooks:
- `useCanvasState`: Manages the lists of all items on the canvas (images, rich text, modals).
- `useCanvasSelection`: Tracks which items are currently active or selected.
- `useCanvasEvents`: Handles global mouse/keyboard interactions like region selection, panning, and zooming.

---

## Component Breakdown

### Canvas Components (`modules/canvas`)
These are the primary building blocks rendered on the Konva stage.

| Component | Purpose | Usage |
|-----------|---------|-------|
| `CanvasStage` | The Root Container | Sets up the Konva Stage/Layer and integrates all canvas nodes and overlay systems. |
| `RichTextNode` | Advanced Text Node | Renders rich text with custom styling, individual transformers, and an integrated editor. |
| `CanvasImage` | Image Entity | Handles image rendering, connectivity nodes, and transformation logic. |
| `CanvasVideoNode` | Video Entity | Renders video frames with playback indicators on the canvas. |
| `SelectionBox` | Global UI Controller | Manages the multi-selection bounding box (Transformer), group actions, and the smart toolbar. |
| `GroupContainerOverlay` | Grouping Logic | Visually encompasses grouped items and provides ungrouping/movement handles. |

### Generator Plugins (`modules/generators`)
These components provide specific AI-driven functionalities.

| Component | Purpose | Usage |
|-----------|---------|-------|
| `ImageUploadModal` | Image Ingestion | Entry point for uploading or generating new image assets. |
| `TextInput` | AI Prompting | Specialized text inputs for generating scripts or AI prompts. |
| `MusicUploadModal` | Audio Asset Handling | Manages background music and audio generation tasks. |
| `VideoUploadModal` | Video Asset Handling | Handles raw video uploads and AI video generation. |
| `Model3D` | 3D Visualization | Provides tools for viewing and interacting with 3D model assets on the canvas. |

### Overlay Systems (`modules/canvas-overlays`)
These components synchronize HTML UI with canvas coordinates.

| Component | Purpose | Usage |
|-----------|---------|-------|
| `ModalOverlays` | Root Overlay Manager | Aggregates all specialized modals and ensures they track canvas movement. |
| `ConnectionLines` | Visual Programming | Renders the "wires" or connectors between different nodes on the canvas. |
| `ComponentCreationMenu` | Quick-Add Tool | The radial or context menu used to spawn new generators and nodes. |

---

## Specialized Plugin Overlays
The application includes a wide array of "Plugin" overlays that operate on selected assets:

| Plugin | Purpose |
|--------|---------|
| **Upscale** | Enhances image resolution and clarity using AI. |
| **Remove BG** | Automatically isolates the main subject of an image by removing the background. |
| **Vectorize** | Converts raster images into clean, scalable vector-like paths. |
| **Erase** | Removes unwanted objects or areas from an image via AI in-painting. |
| **Expand** | Generates new pixels beyond the existing borders of an image (out-painting). |
| **Next Scene** | Generates a sequential image or transition for cinematic storyboarding. |
| **Multiangle Camera** | Simulates different camera angles for a single 3D or 2D asset. |
| **Compare** | Provides a side-by-side or slider-based comparison between two assets (e.g., original vs. upscaled). |
| **Video Editor** | A specialized overlay for cutting, trimming, and arranging video generated on the canvas. |

---

## Frame Components & Storyboarding
The application features a dedicated "cinematic workflow" system for storyboarding and script-to-scene generation:

| Component | Purpose | Usage |
|-----------|---------|-------|
| `StoryboardModal` | Management Hub | Coordinates the generation of entire storyboards from scripts. |
| `ScriptFrameNode` | Script Segment | Represents a specific section of dialogue or action from a generated script. |
| `SceneFrameNode` | Visual Scene | Represents a specific "shot" or scene tied to a script frame, often containing generated media. |

---

## Technical Patterns

- **Coordinate Inversion**: UI elements in the Overlay layer use an "inverse scale" calculation (`1 / canvasScale`) to maintain a consistent size regardless of how far the user zooms in or out.
- **Transformer Standardization**: High-interaction nodes (like Rich Text) use standardized blue (`#4C83FF`) bounding boxes and white square anchors for a professional design aesthetic.
- **Persistence**: Most components hook into `onPersist...` callbacks that sync local UI changes back to the backend database via the API gateway.
- **Connectivity**: Nodes can be visually linked via `ConnectionLines`, allowing data (like prompts or images) to flow from one generator or plugin to another.
