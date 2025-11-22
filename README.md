# Wildmind Canvas

A powerful, collaborative canvas application for AI-powered media generation and editing. Built with Next.js, React, Konva, and Three.js, this application provides an infinite canvas workspace where users can generate, edit, and connect images, videos, music, and 3D models through a visual node-based interface.

## 🎯 Purpose

Wildmind Canvas is a visual creative workspace that enables users to:
- **Generate AI Media**: Create images, videos, and music using various AI models
- **Edit & Transform**: Apply plugins like upscaling, background removal, and vectorization
- **Visual Workflow**: Connect different generators and plugins through a node-based connection system
- **Collaborate**: Real-time collaboration with undo/redo support
- **Persist Work**: Save projects with snapshot-based persistence
- **Infinite Canvas**: Work on an unlimited canvas space with zoom and pan capabilities

## 🏗️ Architecture Overview

The application follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Main Application                      │
│  - page.tsx: Main entry point, state management         │
│  - layout.tsx: Root layout with fonts and styling       │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Canvas     │   │  Components  │   │  Libraries   │
│  (Konva)     │   │  (React)     │   │  (Utils)     │
└──────────────┘   └──────────────┘   └──────────────┘
```

## 📁 Complete Folder Structure

```
wildmindcanvas/
├── app/                                    # Next.js App Router directory
│   ├── components/                         # React components
│   │   ├── AuthGuard.tsx                   # Authentication wrapper component
│   │   │
│   │   ├── Canvas/                         # Core canvas components
│   │   │   ├── AvatarButton.tsx            # User avatar button component
│   │   │   ├── Canvas.tsx                  # Main canvas component (3,273 lines)
│   │   │   ├── CanvasBackground.tsx        # Canvas background pattern (dot grid)
│   │   │   ├── CanvasImage.tsx             # Individual image/video/text element rendering
│   │   │   ├── CanvasImageConnectionNodes.tsx  # Connection nodes for linking elements
│   │   │   ├── GenerationQueue.tsx         # Display generation queue status
│   │   │   ├── index.ts                    # Barrel export file
│   │   │   ├── LibrarySidebar.tsx          # Media library sidebar
│   │   │   ├── MediaActionIcons.tsx        # Action icons (delete, download, duplicate)
│   │   │   ├── Model3DOverlay.tsx          # 3D model overlay rendering
│   │   │   ├── PluginSidebar.tsx           # Plugin selection sidebar
│   │   │   ├── ResizeHandle.tsx             # Resize handle component for elements
│   │   │   ├── SelectionBox.tsx            # Multi-select selection box
│   │   │   ├── SettingsButton.tsx          # Settings toggle button
│   │   │   └── TextElements.tsx            # Text element rendering on canvas
│   │   │
│   │   ├── CanvasApp/                       # Canvas application logic
│   │   │   ├── CanvasApp.tsx                # Canvas app wrapper component
│   │   │   ├── CanvasAppImpl.tsx           # Canvas app implementation
│   │   │   ├── index.ts                    # Barrel export file
│   │   │   ├── types.ts                     # TypeScript types for canvas app state
│   │   │   │
│   │   │   ├── handlers/                    # Event handlers
│   │   │   │   ├── imageHandlers.ts         # Handlers for image operations (440 lines)
│   │   │   │   └── pluginHandlers.ts        # Handlers for plugin operations (661 lines)
│   │   │   │
│   │   │   ├── hooks/                       # Custom hooks
│   │   │   │   ├── useCanvasState.ts       # Canvas state management hook
│   │   │   │   ├── useOpManagerIntegration.ts  # Operation manager integration hook
│   │   │   │   ├── useRealtimeConnection.ts    # Real-time collaboration hook
│   │   │   │   └── useSnapshotManager.ts       # Snapshot persistence hook
│   │   │   │
│   │   │   └── utils/                       # Utility functions
│   │   │       └── buildSnapshotElements.ts    # Builds snapshot from current state (158 lines)
│   │   │
│   │   ├── common/                          # Shared/common components
│   │   │   ├── canvasCaptureGuard.ts       # Prevents canvas capture in screenshots
│   │   │   ├── FrameSpinner.tsx            # Loading spinner component
│   │   │   └── ModalActionIcons.tsx        # Action icons for modals
│   │   │
│   │   ├── ContextMenu/                     # Right-click context menu
│   │   │   ├── ContextMenu.tsx              # Context menu component
│   │   │   └── index.ts                     # Barrel export file
│   │   │
│   │   ├── GenerationCompo/                 # Media generation components
│   │   │   │
│   │   │   ├── ImageUploadModal/             # Image generation modal
│   │   │   │   ├── ImageModalControls.tsx   # Generation controls (prompt, model, aspect ratio)
│   │   │   │   ├── ImageModalFrame.tsx      # Image display frame
│   │   │   │   ├── ImageModalNodes.tsx      # Connection nodes
│   │   │   │   ├── ImageModalTooltip.tsx    # Tooltip information
│   │   │   │   ├── ImageUploadModal.tsx      # Main image generation component
│   │   │   │   └── index.ts                 # Barrel export file
│   │   │   │
│   │   │   ├── VideoUploadModal/            # Video generation modal
│   │   │   │   ├── VideoModalControls.tsx   # Video generation controls
│   │   │   │   ├── VideoModalFrame.tsx      # Video display frame
│   │   │   │   ├── VideoModalNodes.tsx      # Connection nodes
│   │   │   │   ├── VideoModalTooltip.tsx    # Tooltip information
│   │   │   │   ├── VideoUploadModal.tsx     # Main video generation component
│   │   │   │   └── index.ts                 # Barrel export file
│   │   │   │
│   │   │   ├── MusicUploadModal/            # Music generation modal
│   │   │   │   ├── MusicModalControls.tsx   # Music generation controls
│   │   │   │   ├── MusicModalFrame.tsx      # Music display frame
│   │   │   │   ├── MusicModalNodes.tsx      # Connection nodes
│   │   │   │   ├── MusicModalTooltip.tsx    # Tooltip information
│   │   │   │   ├── MusicUploadModal.tsx     # Main music generation component
│   │   │   │   └── index.ts                 # Barrel export file
│   │   │   │
│   │   │   ├── TextInput/                   # Text input overlay
│   │   │   │   ├── TextInput.tsx            # Main text input component
│   │   │   │   ├── TextModalControls.tsx    # Text input controls
│   │   │   │   ├── TextModalFrame.tsx       # Text display frame
│   │   │   │   ├── TextModalNodes.tsx       # Connection nodes
│   │   │   │   ├── TextModalTooltip.tsx     # Tooltip information
│   │   │   │   └── index.ts                 # Barrel export file
│   │   │   │
│   │   │   ├── Model3D/                     # 3D model viewer
│   │   │   │   ├── Model3D.tsx              # Main 3D model component
│   │   │   │   ├── Model3DZoomControls.tsx  # Zoom controls
│   │   │   │   ├── types.ts                  # TypeScript types
│   │   │   │   ├── useModel3DControls.ts    # 3D model controls hook
│   │   │   │   ├── useModel3DLoader.ts       # 3D model loading hook
│   │   │   │   ├── useModel3DScene.ts        # Three.js scene management
│   │   │   │   └── index.ts                 # Barrel export file
│   │   │   │
│   │   │   └── UploadButton/                # File upload button
│   │   │       ├── UploadButton.tsx         # Upload button component
│   │   │       └── index.ts                 # Barrel export file
│   │   │
│   │   ├── Header/                          # Top navigation header
│   │   │   ├── Header.tsx                   # Header component with navigation
│   │   │   └── index.ts                     # Barrel export file
│   │   │
│   │   ├── ModalOverlays/                   # Modal overlay system
│   │   │   ├── ComponentCreationMenu.tsx    # Component creation menu
│   │   │   ├── ConnectionLines.tsx          # Visual connection lines between nodes
│   │   │   ├── ImageModalOverlays.tsx       # Image modal overlays
│   │   │   ├── index.ts                     # Barrel export file
│   │   │   ├── ModalOverlays.tsx             # Main overlay container
│   │   │   ├── MusicModalOverlays.tsx       # Music modal overlays
│   │   │   ├── RemoveBgModalOverlays.tsx    # RemoveBG plugin overlays
│   │   │   ├── TextInputOverlays.tsx        # Text input overlays
│   │   │   ├── types.ts                     # Type definitions for overlays
│   │   │   ├── UpscaleModalOverlays.tsx     # Upscale plugin overlays
│   │   │   ├── useConnectionManager.ts       # Connection management hook
│   │   │   ├── utils.ts                      # Utility functions for overlays
│   │   │   ├── VectorizeModalOverlays.tsx   # Vectorize plugin overlays
│   │   │   └── VideoModalOverlays.tsx       # Video modal overlays
│   │   │
│   │   ├── Plugins/                         # Plugin components
│   │   │   │
│   │   │   ├── UpscalePluginModal/          # Image upscaling plugin
│   │   │   │   ├── ConnectionNodes.tsx      # Connection nodes
│   │   │   │   ├── ModelDropdown.tsx        # Model selection dropdown
│   │   │   │   ├── ScaleInput.tsx           # Scale input control
│   │   │   │   ├── UpscaleButton.tsx        # Upscale action button
│   │   │   │   ├── UpscaleControls.tsx      # Upscale controls (model, scale)
│   │   │   │   ├── UpscaleImageFrame.tsx    # Image display frame
│   │   │   │   ├── UpscaleLabel.tsx         # Plugin label
│   │   │   │   └── UpscalePluginModal.tsx   # Main upscale component
│   │   │   │
│   │   │   ├── RemoveBgPluginModal/         # Background removal plugin
│   │   │   │   ├── BackgroundTypeDropdown.tsx  # Background type selector
│   │   │   │   ├── ModelDropdown.tsx        # Model selection dropdown
│   │   │   │   ├── RemoveBgButton.tsx      # RemoveBG action button
│   │   │   │   ├── RemoveBgControls.tsx     # Controls (model, background type, scale)
│   │   │   │   ├── RemoveBgImageFrame.tsx   # Image display frame
│   │   │   │   ├── RemoveBgLabel.tsx        # Plugin label
│   │   │   │   ├── RemoveBgPluginModal.tsx  # Main RemoveBG component
│   │   │   │   └── ScaleInput.tsx           # Scale input control
│   │   │   │
│   │   │   └── VectorizePluginModal/        # Image vectorization plugin
│   │   │       ├── ModeSwitch.tsx           # Mode selection switch
│   │   │       ├── VectorizeButton.tsx      # Vectorize action button
│   │   │       ├── VectorizeControls.tsx    # Vectorize controls
│   │   │       ├── VectorizeImageFrame.tsx  # Image display frame
│   │   │       ├── VectorizeLabel.tsx       # Plugin label
│   │   │       └── VectorizePluginModal.tsx # Main vectorize component
│   │   │
│   │   ├── Profile/                         # User profile component
│   │   │   ├── Profile.tsx                  # Profile component
│   │   │   └── useProfile.tsx               # Profile data hook
│   │   │
│   │   ├── ProjectSelector/                 # Project selection UI
│   │   │   └── ProjectSelector.tsx          # Project selector component
│   │   │
│   │   ├── Settings/                        # Settings panel
│   │   │   ├── CanvasSection.tsx           # Canvas settings section
│   │   │   ├── index.ts                     # Barrel export file
│   │   │   ├── KeyboardShortcutsSection.tsx # Keyboard shortcuts section
│   │   │   ├── NotificationSection.tsx      # Notification settings section
│   │   │   ├── ProfileSection.tsx           # Profile settings section
│   │   │   ├── SettingsHeader.tsx           # Settings header
│   │   │   ├── SettingsPopup.tsx            # Main settings popup
│   │   │   ├── SettingsSidebar.tsx          # Settings sidebar
│   │   │   ├── ThemeSection.tsx             # Theme settings section
│   │   │   └── types.ts                     # Settings types
│   │   │
│   │   └── ToolbarPanel/                    # Toolbar with tools
│   │       ├── ToolbarPanel.tsx             # Main toolbar component
│   │       └── index.ts                     # Barrel export file
│   │
│   ├── favicon.ico                          # Site favicon
│   ├── globals.css                           # Global styles
│   ├── layout.tsx                            # Root layout component
│   └── page.tsx                              # Main application page (2,188 lines)
│
├── hooks/                                   # Custom React hooks
│   ├── useOpManager.ts                      # Operation manager hook (undo/redo)
│   ├── useProject.ts                        # Project management hook
│   └── useUIVisibility.ts                   # UI visibility toggle hook
│
├── lib/                                     # Utility libraries
│   ├── api.ts                               # API client for media generation
│   ├── apiCache.ts                          # API response caching
│   ├── auth.ts                              # Authentication utilities
│   ├── canvasApi.ts                         # Canvas-specific API calls
│   ├── canvasHelpers.ts                     # Canvas helper functions
│   ├── opManager.ts                          # Operation manager (undo/redo system)
│   ├── proxyUtils.ts                        # URL proxy utilities
│   ├── realtime.ts                          # Real-time collaboration client
│   └── videoModelConfig.ts                  # Video model configuration
│
├── types/                                   # TypeScript type definitions
│   ├── canvas.ts                            # Canvas-related types
│   └── modalStates.ts                       # Modal state types
│
├── public/                                  # Static assets
│   ├── file.svg                             # File icon
│   ├── globe.svg                            # Globe icon
│   ├── next.svg                             # Next.js logo
│   ├── vercel.svg                           # Vercel logo
│   └── window.svg                           # Window icon
│
├── .next/                                   # Next.js build output (generated, not tracked)
│   ├── dev/                                 # Development build files
│   ├── static/                              # Static assets
│   └── server/                              # Server-side files
│
├── node_modules/                            # Dependencies (generated, not tracked)
│
├── Documentation Files:
│   ├── IMPLEMENTING_SNAPSHOT_PERSISTENCE.md    # Snapshot system implementation guide
│   ├── SNAPSHOT_SYSTEM_DOCUMENTATION.md       # Complete snapshot system documentation
│   ├── REFACTORING_PLAN.md                    # Refactoring strategy and plan
│   ├── REFACTORING_SUMMARY.md                  # Refactoring results and summary
│   └── Rules.md                                # Coding standards and rules
│
└── Configuration Files:
    ├── .gitignore                           # Git ignore rules
    ├── eslint.config.mjs                    # ESLint configuration
    ├── next.config.ts                        # Next.js configuration
    ├── next-env.d.ts                         # Next.js TypeScript environment
    ├── package.json                          # Dependencies and scripts
    ├── package-lock.json                     # Locked dependency versions
    ├── postcss.config.mjs                    # PostCSS configuration
    ├── README.md                             # This file - project documentation
    ├── tsconfig.json                         # TypeScript configuration
    └── tsconfig.tsbuildinfo                  # TypeScript build info (generated)
```

## 📂 Detailed Folder & File Descriptions

### `/app` - Next.js Application

#### `/app/page.tsx`
**Purpose**: Main application entry point
**Contents**:
- State management for all canvas elements (images, videos, music, generators, plugins)
- Project management integration
- Real-time collaboration setup
- Snapshot persistence
- Operation manager (undo/redo) integration
- Event handlers for all canvas interactions

#### `/app/layout.tsx`
**Purpose**: Root layout component
**Contents**:
- Font configuration (Geist Sans & Mono)
- Global metadata
- HTML structure wrapper

#### `/app/globals.css`
**Purpose**: Global CSS styles
**Contents**: Application-wide styling, Tailwind CSS imports

---

### `/app/components` - React Components

#### `/app/components/AuthGuard.tsx`
**Purpose**: Authentication wrapper
**Functionality**:
- Checks user authentication before rendering children
- Redirects to login if not authenticated
- Fetches and provides user data
- Debug logging for auth issues

---

#### `/app/components/Canvas/` - Core Canvas Components

**Purpose**: Core canvas rendering and interaction components. This folder contains all the low-level canvas rendering logic using Konva for 2D graphics.

##### `Canvas.tsx` (3,273 lines) - Main Canvas Component
**Purpose**: The central canvas component that orchestrates all canvas functionality
**What's Inside**:
- **Konva Stage & Layer Setup**: Initializes the Konva Stage (10,000,000 x 10,000,000 infinite canvas) and Layer for rendering
- **Viewport Management**: Handles zoom (mouse wheel, pinch), pan (drag, arrow keys), and viewport state
- **State Management**: Manages local state for:
  - Image modal states (image generators)
  - Video modal states (video generators)
  - Music modal states (music generators)
  - Upscale plugin modals
  - RemoveBG plugin modals
  - Vectorize plugin modals
  - Text input modals
  - Selected elements (single and multi-select)
  - Context menu state
  - Selection box coordinates
- **Event Handlers**:
  - Mouse events (click, drag, wheel)
  - Keyboard shortcuts (Space for pan, Delete for remove, etc.)
  - Drop events (file uploads, library media)
  - Selection events (single, multi-select with Shift)
- **Rendering Logic**:
  - Renders CanvasImage components for each image/video/text
  - Renders ModalOverlays for all generator modals
  - Renders SelectionBox for multi-select
  - Renders ContextMenu on right-click
  - Renders CanvasBackground with dot grid pattern
- **Persistence Integration**:
  - Syncs with external modal states from parent
  - Persists modal states to localStorage
  - Handles modal create/move/delete callbacks
- **Connection System**:
  - Manages connections between elements
  - Renders connection lines
  - Handles connection node interactions
- **Tool Management**:
  - Cursor tool (selection)
  - Move tool (pan canvas)
  - Text tool (create text elements)
  - Image/Video/Music tools (create generators)
  - Library tool (add from library)
  - Plugin tool (add plugins)
- **Keyboard Shortcuts**:
  - Space: Pan mode
  - Delete/Backspace: Delete selected
  - Ctrl/Cmd+D: Duplicate
  - Ctrl/Cmd+A: Select all
  - Arrow keys: Move selected elements
  - Ctrl/Cmd+Z/Y: Undo/Redo (handled by parent)
- **Performance Optimizations**:
  - Uses requestAnimationFrame for smooth updates
  - Debounced viewport updates
  - Optimized re-renders with React.memo patterns

##### `CanvasImage.tsx` - Individual Element Component
**Purpose**: Renders a single image, video, text, or 3D model element on the canvas
**What's Inside**:
- **Konva Rendering**:
  - Uses Konva Image for images
  - Uses Konva Video for videos
  - Uses Konva Text for text elements
  - Handles 3D model overlays separately
- **Position & Transform**:
  - X, Y position tracking
  - Width, height management
  - Rotation angle (degrees)
  - Real-time position updates during drag
- **Drag & Drop**:
  - Mouse down/move/up handlers
  - Drag offset calculation
  - Canvas coordinate conversion
  - Position commit on drag end
- **Resize Handles**:
  - Corner resize handles
  - Maintains aspect ratio option
  - Minimum/maximum size constraints
- **Connection Nodes**:
  - Send node (output)
  - Receive node (input)
  - Node position calculation
  - Connection interaction handlers
- **Selection State**:
  - Selected visual indicator (border)
  - Multi-select support
  - Selection box integration
- **Action Icons**:
  - Delete button
  - Download button
  - Duplicate button
  - Conditional rendering based on hover/selection
- **Real-time Updates**:
  - Listens for position updates from parent
  - Syncs with external state changes
  - Handles real-time collaboration updates
- **Proxy URL Handling**:
  - Converts Zata URLs to proxy URLs for CORS
  - Handles blob URLs for local files
  - Image loading with error handling

##### `CanvasBackground.tsx` - Background Pattern
**Purpose**: Renders the dot grid background pattern
**What's Inside**:
- **Pattern Generation**:
  - Creates canvas pattern with dots
  - Configurable dot spacing (DOT_SPACING)
  - Configurable dot size (DOT_SIZE)
  - Configurable opacity (DOT_OPACITY)
- **Rendering**:
  - Uses Konva Rect with pattern fill
  - Covers entire infinite canvas area
  - Updates on zoom level changes
- **Visual Reference**:
  - Provides visual grid for alignment
  - Helps with spatial orientation
  - Subtle enough not to distract

##### `TextElements.tsx` - Text Rendering
**Purpose**: Renders text elements on the canvas
**What's Inside**:
- **Text Rendering**:
  - Uses Konva Text component
  - Supports font family, size, color
  - Text alignment options
  - Word wrap support
- **Text Properties**:
  - Editable text content
  - Font styling (family, size, weight)
  - Fill color
  - Position and rotation
- **Integration**:
  - Works with CanvasImage for text type
  - Supports text editing mode
  - Handles text selection

##### `Model3DOverlay.tsx` - 3D Model Overlay
**Purpose**: Renders 3D models on the canvas
**What's Inside**:
- **3D Model Integration**:
  - Integrates Three.js for 3D rendering
  - GLTF/GLB model loading
  - Model positioning on 2D canvas
- **3D Controls**:
  - Rotation controls (X, Y axes)
  - Zoom controls
  - Camera positioning
- **Overlay Rendering**:
  - Renders 3D scene as overlay
  - Maintains 2D canvas coordinate system
  - Handles viewport transformations

##### `SelectionBox.tsx` - Multi-Select Box
**Purpose**: Rectangle selection box for multi-select
**What's Inside**:
- **Selection Rectangle**:
  - Draws rectangle during drag
  - Calculates selection bounds
  - Visual feedback (dashed border)
- **Element Detection**:
  - Detects elements within selection box
  - Updates selected element indices
  - Handles partial overlaps
- **Interaction**:
  - Mouse down to start selection
  - Mouse move to resize box
  - Mouse up to complete selection
  - Escape to cancel selection
- **Visual Feedback**:
  - Dashed border style
  - Semi-transparent fill
  - Updates in real-time during drag

##### `CanvasImageConnectionNodes.tsx` - Connection Nodes
**Purpose**: Renders connection nodes for linking elements
**What's Inside**:
- **Node Types**:
  - Send node (output, right side)
  - Receive node (input, left side)
  - Visual distinction (color, shape)
- **Node Rendering**:
  - Circular node indicators
  - Hover effects
  - Active connection highlighting
- **Connection Logic**:
  - Node position calculation
  - Connection line endpoints
  - Drag-to-connect interaction
- **State Management**:
  - Tracks connected nodes
  - Manages connection state
  - Updates on element move

##### `GenerationQueue.tsx` - Generation Queue Display
**Purpose**: Shows the status of AI generation jobs
**What's Inside**:
- **Queue Display**:
  - Lists pending generation jobs
  - Shows job progress
  - Displays model and prompt info
- **Job Status**:
  - Queued status
  - In progress indicator
  - Completion notification
- **Queue Management**:
  - Adds jobs to queue
  - Removes completed jobs
  - Updates job status
- **UI Components**:
  - Queue list component
  - Job item component
  - Progress indicators

##### `LibrarySidebar.tsx` - Media Library Sidebar
**Purpose**: Sidebar for browsing and adding media from library
**What's Inside**:
- **Library Display**:
  - Lists user's media library
  - Thumbnail previews
  - Media metadata (model, prompt, date)
- **Media Types**:
  - Images
  - Videos
  - Music
  - Uploaded files
- **Interaction**:
  - Click to add to canvas
  - Drag to drop on canvas
  - Search/filter functionality
- **API Integration**:
  - Fetches media from API
  - Handles pagination
  - Caches media data

##### `PluginSidebar.tsx` - Plugin Selection Sidebar
**Purpose**: Sidebar for adding plugins to canvas
**What's Inside**:
- **Plugin List**:
  - Upscale plugin
  - Remove Background plugin
  - Vectorize plugin
- **Plugin Icons**:
  - Visual plugin representations
  - Plugin descriptions
- **Interaction**:
  - Click to add plugin to canvas
  - Drag to drop plugin
- **Plugin Creation**:
  - Creates plugin modal on canvas
  - Sets initial position
  - Initializes plugin state

##### `MediaActionIcons.tsx` - Action Icons Component
**Purpose**: Action buttons for media elements (delete, download, duplicate)
**What's Inside**:
- **Icon Buttons**:
  - Delete icon (trash)
  - Download icon (download arrow)
  - Duplicate icon (copy)
- **Conditional Rendering**:
  - Shows on hover
  - Shows when selected
  - Positioned relative to element
- **Event Handlers**:
  - Delete handler
  - Download handler
  - Duplicate handler
- **Styling**:
  - Icon styling
  - Hover effects
  - Tooltip support

##### `AvatarButton.tsx` - User Avatar Button
**Purpose**: Displays user avatar and profile access
**What's Inside**:
- **Avatar Display**:
  - User profile image
  - Fallback to initials
  - Avatar styling
- **Profile Access**:
  - Click to open profile
  - Dropdown menu
  - User info display

##### `SettingsButton.tsx` - Settings Toggle
**Purpose**: Button to open/close settings panel
**What's Inside**:
- **Toggle Functionality**:
  - Opens settings popup
  - Closes settings popup
  - Toggle state management
- **Icon**:
  - Settings gear icon
  - Visual indicator

##### `ResizeHandle.tsx` - Resize Handle Component
**Purpose**: Resize handles for elements
**What's Inside**:
- **Handle Rendering**:
  - Corner resize handles
  - Edge resize handles (optional)
  - Visual handle indicators
- **Resize Logic**:
  - Mouse drag to resize
  - Maintains aspect ratio option
  - Size constraints
- **Interaction**:
  - Cursor change on hover
  - Drag start/move/end handlers
  - Size calculation

##### `index.ts` - Canvas Exports
**Purpose**: Barrel export file for Canvas components
**What's Inside**:
- Exports Canvas component
- Re-exports for clean imports

---

#### `/app/components/CanvasApp/` - Canvas Application Logic

**Purpose**: Business logic and state management layer that sits between the UI components and the main page component. This folder contains all the handlers, hooks, and utilities for managing canvas operations.

##### `CanvasApp.tsx` - Canvas App Wrapper
**Purpose**: Main entry point for CanvasApp component
**What's Inside**:
- Re-exports CanvasAppImpl as default
- Placeholder for future refactoring
- Clean export interface

##### `CanvasAppImpl.tsx` - Canvas App Implementation
**Purpose**: Implementation file (currently re-exports from page.tsx)
**What's Inside**:
- Placeholder for refactored CanvasApp
- Currently re-exports CanvasApp from page.tsx
- Will be gradually refactored from page.tsx

##### `/handlers/` - Event Handlers

**Purpose**: Contains all event handlers for canvas operations. These handlers encapsulate business logic for creating, updating, deleting, and managing canvas elements.

##### `/handlers/imageHandlers.ts` (440 lines) - Image Operation Handlers
**Purpose**: Handles all image-related operations
**What's Inside**:
- **`handleImageUpdate`**:
  - Updates image properties (position, size, rotation)
  - Sends move operations to server
  - Broadcasts real-time updates
  - Handles position deltas
  - Creates inverse operations for undo/redo
- **`handleImageDelete`**:
  - Removes image from state
  - Cleans up blob URLs
  - Sends delete operation to server
  - Broadcasts real-time delete
  - Creates inverse create operation for undo
- **`handleImageDownload`**:
  - Downloads image file
  - Handles blob URLs
  - Uses proxy for external URLs
  - Extracts filename from URL
  - Creates download link
- **`handleImageDuplicate`**:
  - Creates duplicate image
  - Offsets position (right side)
  - Handles blob URL duplication
  - Broadcasts real-time create
  - Sends create operation to server
- **`handleImageUpload`**:
  - Processes single file upload
  - Calls processMediaFile
  - Handles file processing
- **`handleImagesDrop`**:
  - Processes multiple file drops
  - Handles file array
  - Processes with offsets
- **`handleImageSelect`**:
  - Handles file selection
  - Processes selected file
- **`handleImageGenerate`**:
  - Generates AI images
  - Manages generation queue
  - Calls API for image generation
  - Handles multiple image generation
  - Parses aspect ratio
  - Calculates dimensions
  - Returns generated URLs
  - Updates generation queue
- **`handleTextCreate`**:
  - Creates text element
  - Generates unique elementId
  - Sets text properties
  - Broadcasts real-time create
  - Sends create operation to server
- **`handleAddImageToCanvas`**:
  - Adds image URL to canvas
  - Loads image to get dimensions
  - Places at viewport center
  - Creates image element
  - Broadcasts real-time create
  - Sends create operation to server

**Key Features**:
- Operation manager integration (undo/redo)
- Real-time collaboration support
- Server synchronization
- Error handling
- Optimistic updates

##### `/handlers/pluginHandlers.ts` (661 lines) - Plugin Operation Handlers
**Purpose**: Handles all plugin-related operations (Upscale, RemoveBG, Vectorize)
**What's Inside**:

**Upscale Plugin Handlers**:
- **`onPersistUpscaleModalCreate`**:
  - Creates upscale plugin modal
  - Optimistic state update
  - Broadcasts real-time create
  - Sends create operation to server
  - Structures element metadata
- **`onPersistUpscaleModalMove`**:
  - Updates upscale modal position/properties
  - Captures previous state for inverse
  - Optimistic update
  - Broadcasts real-time update
  - Structures updates (meta vs position)
  - Creates inverse operation
- **`onPersistUpscaleModalDelete`**:
  - Deletes upscale modal
  - Immediate state update
  - Broadcasts real-time delete
  - Removes connectors
  - Creates inverse create operation
- **`onUpscale`**:
  - Calls upscale API
  - Validates source image
  - Handles errors
  - Returns upscaled image URL

**RemoveBG Plugin Handlers**:
- **`onPersistRemoveBgModalCreate`**:
  - Creates removeBG plugin modal
  - Similar structure to upscale
  - Handles background type and scale
- **`onPersistRemoveBgModalMove`**:
  - Updates removeBG modal
  - Handles model, backgroundType, scaleValue
- **`onPersistRemoveBgModalDelete`**:
  - Deletes removeBG modal
  - Cleans up connections
- **`onRemoveBg`**:
  - Calls removeBG API
  - Validates source image
  - Returns removed background image URL

**Vectorize Plugin Handlers**:
- **`onPersistVectorizeModalCreate`**:
  - Creates vectorize plugin modal
  - Handles mode selection
- **`onPersistVectorizeModalMove`**:
  - Updates vectorize modal
  - Handles mode changes
- **`onPersistVectorizeModalDelete`**:
  - Deletes vectorize modal
- **`onVectorize`**:
  - Calls vectorize API
  - Validates source image
  - Returns vectorized image URL

**Key Features**:
- Consistent structure across all plugins
- Operation manager integration
- Real-time collaboration
- Metadata structure (meta vs position)
- Inverse operations for undo/redo
- Connector cleanup on delete

##### `/hooks/` - Custom Hooks

**Purpose**: Reusable React hooks for canvas state management and operations.

##### `/hooks/useCanvasState.ts` - Canvas State Hook
**Purpose**: Manages all canvas state using React useState
**What's Inside**:
- **State Variables**:
  - `images`: Array of ImageUpload elements
  - `imageGenerators`: Array of ImageGenerator
  - `videoGenerators`: Array of VideoGenerator
  - `musicGenerators`: Array of MusicGenerator
  - `upscaleGenerators`: Array of UpscaleGenerator
  - `textGenerators`: Array of TextGenerator
  - `connectors`: Array of Connector
  - `generationQueue`: Array of GenerationQueueItem
- **State Object**:
  - Combines all state into CanvasAppState
  - Provides typed state access
- **Setters Object**:
  - Provides all setState functions
  - Typed as CanvasAppSetters
- **Return Value**:
  - Returns { state, setters } object
  - Used by parent components

##### `/hooks/useOpManagerIntegration.ts` - Operation Manager Integration
**Purpose**: Integrates operation manager (undo/redo) with canvas state
**What's Inside**:
- **Operation Manager Setup**:
  - Initializes useOpManager hook
  - Configures with projectId and user
  - Sets up onOpApplied callback
- **Snapshot Handling**:
  - Detects snapshot operations
  - Rebuilds state from snapshot
  - Handles element map structure
  - Converts elements to state arrays
- **Operation Application**:
  - Applies create operations
  - Applies update operations
  - Applies delete operations
  - Applies move operations
  - Handles inverse operations
- **State Updates**:
  - Updates images array
  - Updates generator arrays
  - Updates connectors
  - Maintains state consistency
- **Element Type Detection**:
  - Identifies element types from operations
  - Routes to correct state array
  - Handles metadata extraction
- **Return Value**:
  - Returns operation manager functions
  - Provides undo/redo capabilities
  - Returns initialization status

##### `/hooks/useRealtimeConnection.ts` - Real-time Collaboration Hook
**Purpose**: Manages WebSocket connection for real-time collaboration
**What's Inside**:
- **Connection Setup**:
  - Initializes RealtimeClient
  - Connects to WebSocket server
  - Manages connection state
- **Event Handlers**:
  - Handles connected event
  - Handles disconnected event
  - Handles error events
- **Message Handling**:
  - Receives real-time updates
  - Applies remote changes
  - Handles create/update/delete events
- **State Synchronization**:
  - Keeps realtimeActiveRef in sync
  - Updates connection status
  - Manages reconnection logic
- **Return Value**:
  - Returns realtimeRef
  - Returns realtimeActive status
  - Provides connection utilities

##### `/hooks/useSnapshotManager.ts` - Snapshot Persistence Hook
**Purpose**: Manages snapshot creation and persistence
**What's Inside**:
- **Snapshot Building**:
  - Calls buildSnapshotElements
  - Converts state to element map
  - Structures elements with metadata
- **Persistence Logic**:
  - Debounced persistence (300ms)
  - Calls API to save snapshot
  - Handles persistence errors
- **Snapshot Loading**:
  - Loads current snapshot on mount
  - Applies snapshot to state
  - Handles empty snapshots
- **Timer Management**:
  - Manages persistTimerRef
  - Clears timer on unmount
  - Debounces rapid changes
- **Dependencies**:
  - Watches all state arrays
  - Triggers on state changes
  - Optimizes with debouncing

##### `/utils/` - Utility Functions

##### `/utils/buildSnapshotElements.ts` (158 lines) - Snapshot Builder
**Purpose**: Converts canvas state into snapshot element map
**What's Inside**:
- **Element Map Structure**:
  - Creates Record<string, any> map
  - Keys are element IDs
  - Values are element data
- **Image Processing**:
  - Converts images array to elements
  - Extracts elementId
  - Structures metadata (url, text, etc.)
  - Handles connections
- **Generator Processing**:
  - Converts imageGenerators to elements
  - Converts videoGenerators to elements
  - Converts musicGenerators to elements
  - Converts plugin generators to elements
  - Structures generator metadata
- **Connector Processing**:
  - Processes connectors array
  - Structures connection data
  - Attaches to source elements
- **Metadata Structure**:
  - Type-specific metadata
  - Connection information
  - Position and transform data
- **Return Value**:
  - Returns element map
  - Ready for API persistence

##### `types.ts` - TypeScript Type Definitions
**Purpose**: TypeScript interfaces and types for CanvasApp
**What's Inside**:
- **Generator Interfaces**:
  - `ImageGenerator`: Image generation modal state
  - `VideoGenerator`: Video generation modal state
  - `MusicGenerator`: Music generation modal state
  - `UpscaleGenerator`: Upscale plugin state
  - `RemoveBgGenerator`: RemoveBG plugin state
  - `VectorizeGenerator`: Vectorize plugin state
  - `TextGenerator`: Text input overlay state
- **Connector Interface**:
  - `Connector`: Connection between elements
  - Connection properties (from, to, color, anchors)
- **State Interface**:
  - `CanvasAppState`: Complete canvas state
  - All state arrays
  - Generation queue
- **Setters Interface**:
  - `CanvasAppSetters`: All setState functions
  - Typed dispatchers
- **Viewport Interface**:
  - `ViewportCenter`: Viewport position and scale

---

#### `/app/components/GenerationCompo/` - Media Generation Components

**Purpose**: Components for generating different media types

##### `/ImageUploadModal/`
**Purpose**: Image generation modal
**Files**:
- `ImageUploadModal.tsx`: Main image generation component
- `ImageModalControls.tsx`: Generation controls (prompt, model, aspect ratio)
- `ImageModalFrame.tsx`: Image display frame
- `ImageModalNodes.tsx`: Connection nodes
- `ImageModalTooltip.tsx`: Tooltip information

##### `/VideoUploadModal/`
**Purpose**: Video generation modal
**Files**: Similar structure to ImageUploadModal

##### `/MusicUploadModal/`
**Purpose**: Music generation modal
**Files**: Similar structure to ImageUploadModal

##### `/TextInput/`
**Purpose**: Text input overlay
**Files**: Text input modal components

##### `/Model3D/`
**Purpose**: 3D model viewer
**Files**:
- `Model3D.tsx`: Main 3D model component
- `useModel3DLoader.ts`: 3D model loading hook
- `useModel3DScene.ts`: Three.js scene management
- `useModel3DControls.ts`: 3D model controls hook
- `Model3DZoomControls.tsx`: Zoom controls

##### `/UploadButton/`
**Purpose**: File upload button component

---

#### `/app/components/Plugins/` - Plugin Components

**Purpose**: Image processing plugins

##### `/UpscalePluginModal/`
**Purpose**: Image upscaling plugin
**Files**:
- `UpscalePluginModal.tsx`: Main upscale component
- `UpscaleControls.tsx`: Upscale controls (model, scale)
- `UpscaleImageFrame.tsx`: Image display
- `UpscaleButton.tsx`: Upscale action button
- `ModelDropdown.tsx`: Model selection
- `ScaleInput.tsx`: Scale input control
- `UpscaleLabel.tsx`: Plugin label
- `ConnectionNodes.tsx`: Connection nodes

##### `/RemoveBgPluginModal/`
**Purpose**: Background removal plugin
**Files**: Similar structure to UpscalePluginModal
- `RemoveBgPluginModal.tsx`: Main component
- `RemoveBgControls.tsx`: Controls (model, background type, scale)
- `BackgroundTypeDropdown.tsx`: Background type selector
- `ModelDropdown.tsx`: Model selection
- `ScaleInput.tsx`: Scale input
- `RemoveBgImageFrame.tsx`: Image display
- `RemoveBgButton.tsx`: Action button
- `RemoveBgLabel.tsx`: Plugin label

##### `/VectorizePluginModal/`
**Purpose**: Image vectorization plugin
**Files**: Similar structure
- `VectorizePluginModal.tsx`: Main component
- `VectorizeControls.tsx`: Controls
- `ModeSwitch.tsx`: Mode selection
- `VectorizeButton.tsx`: Action button
- `VectorizeImageFrame.tsx`: Image display
- `VectorizeLabel.tsx`: Plugin label

---

#### `/app/components/ModalOverlays/` - Modal Overlay System

**Purpose**: Overlay system for modals on canvas

##### `ModalOverlays.tsx`
**Purpose**: Main overlay container
**Features**: Manages all modal overlays on canvas

##### `ConnectionLines.tsx`
**Purpose**: Visual connection lines between nodes
**Features**: Draws lines connecting generator nodes

##### `useConnectionManager.ts`
**Purpose**: Connection management hook
**Features**: Manages connections between elements

##### `utils.ts`
**Purpose**: Utility functions for overlays

##### `types.ts`
**Purpose**: Type definitions for overlays

##### Individual Overlay Components:
- `ImageModalOverlays.tsx`: Image modal overlays
- `VideoModalOverlays.tsx`: Video modal overlays
- `MusicModalOverlays.tsx`: Music modal overlays
- `TextInputOverlays.tsx`: Text input overlays
- `UpscaleModalOverlays.tsx`: Upscale plugin overlays
- `RemoveBgModalOverlays.tsx`: RemoveBG plugin overlays
- `VectorizeModalOverlays.tsx`: Vectorize plugin overlays
- `ComponentCreationMenu.tsx`: Component creation menu

---

#### `/app/components/common/` - Common Components

**Purpose**: Shared components used across the app

##### `ModalActionIcons.tsx`
**Purpose**: Action icons for modals (delete, download, duplicate)

##### `FrameSpinner.tsx`
**Purpose**: Loading spinner component

##### `canvasCaptureGuard.ts`
**Purpose**: Prevents canvas capture in screenshots

---

#### `/app/components/ContextMenu/`
**Purpose**: Right-click context menu
**Files**:
- `ContextMenu.tsx`: Context menu component
- `index.ts`: Export file

---

#### `/app/components/Header/`
**Purpose**: Top navigation header
**Files**:
- `Header.tsx`: Header component with navigation
- `index.ts`: Export file

---

#### `/app/components/Profile/`
**Purpose**: User profile management
**Files**:
- `Profile.tsx`: Profile component
- `useProfile.tsx`: Profile data hook

---

#### `/app/components/ProjectSelector/`
**Purpose**: Project selection UI
**Files**:
- `ProjectSelector.tsx`: Project selector component

---

#### `/app/components/Settings/`
**Purpose**: Settings panel
**Files**:
- `SettingsPopup.tsx`: Main settings popup
- `SettingsSidebar.tsx`: Settings sidebar
- `SettingsHeader.tsx`: Settings header
- `ProfileSection.tsx`: Profile settings
- `CanvasSection.tsx`: Canvas settings
- `ThemeSection.tsx`: Theme settings
- `KeyboardShortcutsSection.tsx`: Keyboard shortcuts
- `NotificationSection.tsx`: Notification settings
- `types.ts`: Settings types
- `index.ts`: Export file

---

#### `/app/components/ToolbarPanel/`
**Purpose**: Toolbar with tools
**Files**:
- `ToolbarPanel.tsx`: Main toolbar component
- `index.ts`: Export file

---

### `/hooks/` - Custom React Hooks

**Purpose**: Reusable React hooks

##### `useOpManager.ts`
**Purpose**: Operation manager hook
**Features**:
- Undo/redo functionality
- Operation history management
- Server synchronization

##### `useProject.ts`
**Purpose**: Project management hook
**Features**:
- Project loading
- Project creation
- Project switching

##### `useUIVisibility.ts`
**Purpose**: UI visibility toggle hook
**Features**: Show/hide UI elements

---

### `/lib/` - Utility Libraries

**Purpose**: Core utility functions and API clients

##### `api.ts`
**Purpose**: Main API client
**Features**:
- Image generation (FAL API, Google Nano Banana, Seedream)
- Video generation
- Music generation
- User authentication
- Credit management
- API caching

##### `apiCache.ts`
**Purpose**: API response caching
**Features**: Caches API responses to reduce server load

##### `auth.ts`
**Purpose**: Authentication utilities
**Features**: Auth token management

##### `canvasApi.ts`
**Purpose**: Canvas-specific API calls
**Features**:
- Project CRUD operations
- Snapshot management
- Operation persistence

##### `canvasHelpers.ts`
**Purpose**: Canvas helper functions
**Features**:
- Position calculations
- Overlap detection
- Blank space finding
- Viewport utilities
- Cursor management

##### `opManager.ts`
**Purpose**: Operation manager
**Features**:
- Create, update, delete operations
- Undo/redo stack
- Server synchronization
- Inverse operations

##### `proxyUtils.ts`
**Purpose**: URL proxy utilities
**Features**:
- Proxy URLs for CORS issues
- Download URL generation
- Resource URL building

##### `realtime.ts`
**Purpose**: Real-time collaboration client
**Features**:
- WebSocket connection
- Real-time updates
- Collaborative editing
- Event broadcasting

##### `videoModelConfig.ts`
**Purpose**: Video model configuration
**Features**: Video model settings and configurations

---

### `/types/` - TypeScript Type Definitions

**Purpose**: TypeScript type definitions

##### `canvas.ts`
**Purpose**: Canvas-related types
**Types**:
- `MediaType`: 'image' | 'video' | 'model3d' | 'text'
- `ImageUpload`: Image/video/text element interface

##### `modalStates.ts`
**Purpose**: Modal state types
**Types**: State interfaces for various modals

---

### `/public/` - Static Assets

**Purpose**: Static files served directly
**Contents**: SVG icons and assets

---

## 🔧 Key Technologies

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **Konva**: 2D canvas library for rendering
- **react-konva**: React bindings for Konva
- **Three.js**: 3D model rendering
- **Tailwind CSS**: Styling
- **WebSocket**: Real-time collaboration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=https://api-gateway-services-wildmind.onrender.com
```

## 📊 Key Features

### 1. Infinite Canvas
- Unlimited workspace
- Zoom and pan
- Grid background
- Viewport management

### 2. Media Generation
- **Images**: AI image generation with multiple models
- **Videos**: AI video generation
- **Music**: AI music generation
- **Text**: Text overlay elements
- **3D Models**: GLTF model viewer

### 3. Image Processing Plugins
- **Upscale**: Enhance image resolution
- **Remove Background**: Remove image backgrounds
- **Vectorize**: Convert images to vectors

### 4. Node-Based Connections
- Visual connections between generators
- Send/receive nodes
- Connection lines
- Data flow visualization

### 5. Collaboration
- Real-time updates via WebSocket
- Undo/redo system
- Operation history
- Snapshot persistence

### 6. Project Management
- Create/load projects
- Snapshot-based persistence
- Auto-save functionality
- Project switching

## 🏛️ Architecture Patterns

### State Management
- React hooks for local state
- Centralized state in `page.tsx`
- Real-time synchronization

### Persistence Strategy
- **Operations (Ops)**: Individual actions for undo/redo
- **Snapshots**: Complete state snapshots for fast loading
- **Dual Persistence**: Both ops and snapshots for reliability

### Component Structure
- **Container Components**: `page.tsx`, `CanvasApp.tsx`
- **Presentational Components**: Individual UI components
- **Custom Hooks**: Reusable logic extraction

## 📝 Documentation Files

- **SNAPSHOT_SYSTEM_DOCUMENTATION.md**: Complete snapshot system guide
- **IMPLEMENTING_SNAPSHOT_PERSISTENCE.md**: Implementation guide
- **REFACTORING_PLAN.md**: Refactoring strategy
- **REFACTORING_SUMMARY.md**: Refactoring results
- **Rules.md**: Coding standards

## 🔄 Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
State Update (React)
    ↓
Operation Manager (Undo/Redo)
    ↓
Real-time Broadcast (WebSocket)
    ↓
Snapshot Persistence (Debounced)
    ↓
Server API (Persistence)
```

## 🎨 UI/UX Features

- **Infinite Canvas**: Unlimited workspace
- **Drag & Drop**: Intuitive element manipulation
- **Multi-Select**: Select multiple elements
- **Keyboard Shortcuts**: Power user features
- **Context Menu**: Right-click actions
- **Toolbar**: Quick access to tools
- **Settings Panel**: Customization options
- **Generation Queue**: Track AI jobs

## 🔐 Security

- Authentication guard
- Token-based API calls
- CORS proxy for external resources
- Secure WebSocket connections

## 🐛 Known Issues & Limitations

- Large canvas performance with many elements
- Snapshot size limits
- Real-time sync conflicts (resolved via operation manager)

## 📈 Performance Optimizations

- API response caching
- Debounced snapshot persistence (300ms)
- Request animation frame for smooth animations
- Lazy loading of components
- Image proxy for CORS issues

## 🤝 Contributing

1. Follow the coding rules in `Rules.md`
2. Maintain TypeScript types
3. Write component documentation
4. Test undo/redo functionality
5. Ensure real-time sync works

## 📄 License

Private project - All rights reserved

---

**Last Updated**: 2024
**Version**: 0.1.0
**Maintainer**: Wildmind Team
