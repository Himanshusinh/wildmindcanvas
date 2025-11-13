# WildMind Canvas - Technical Architecture & Dataflow Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Application Structure](#application-structure)
5. [Canvas Rendering Architecture](#canvas-rendering-architecture)
6. [State Management](#state-management)
7. [Data Flow Patterns](#data-flow-patterns)
8. [Selection & Grouping System](#selection--grouping-system)
9. [Authentication & Authorization](#authentication--authorization)
10. [File Upload & Media Handling](#file-upload--media-handling)
11. [AI Generation Integration](#ai-generation-integration)
12. [Component Architecture](#component-architecture)
13. [Performance Optimizations](#performance-optimizations)
14. [Security](#security)
15. [Deployment](#deployment)

---

## Overview

WildMind Canvas is a Next.js-based infinite canvas application that provides a powerful workspace for creating, organizing, and manipulating visual content. Built with Konva.js for 2D canvas rendering and Three.js for 3D model support, it offers features like multi-element selection, grouping, text editing, and AI-powered content generation.

### Key Responsibilities
- **Infinite Canvas**: 1,000,000 x 1,000,000 pixel canvas with pan and zoom
- **Media Management**: Support for images, videos, 3D models, and text elements
- **Selection System**: Multi-element selection with marquee selection
- **Grouping**: Create and manage groups of elements
- **AI Generation**: Integrate with AI services for image/video/music generation
- **Authentication**: Cross-subdomain authentication with main WildMind project
- **Project Management**: Save and manage canvas projects

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Browser                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Next.js 16 Application (Canvas Studio)           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Pages      │→ │  Components  │→ │   Canvas     │  │   │
│  │  │  (App Router)│  │  (React 19)  │  │   (Konva)    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │         │                  │                  │           │   │
│  │         ▼                  ▼                  ▼           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Services    │  │   Auth       │  │   Three.js   │  │   │
│  │  │   (lib/)     │  │   (Cookies)  │  │   (3D Models)│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTPS
                             │ CORS + Cookies
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway Services (Backend)                      │
│  https://api-gateway-services-wildmind.onrender.com             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth API   │  │  Generation   │  │   Credits    │         │
│  │   /api/auth  │  │   /api/bfl   │  │  /api/credits│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬──────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Firebase    │    │    Redis     │    │    Zata      │
│  (Auth + DB) │    │   (Cache)    │    │   (Storage)  │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Component Hierarchy

```
RootLayout
└── AuthGuard
    └── CanvasApp
        ├── Header (Project Name)
        ├── Canvas (Main Canvas Component)
        │   ├── CanvasBackground (Dot Pattern)
        │   ├── CanvasImage (Image/Video Elements)
        │   ├── TextElements (Text Elements)
        │   ├── Model3DOverlay (3D Models)
        │   ├── ModalOverlays (Text/Image/Video/Music Modals)
        │   ├── SelectionBox (Selection & Grouping UI)
        │   ├── GroupLabel (Group Labels)
        │   └── MediaActionIcons (Action Icons)
        ├── ToolbarPanel (Left Side Toolbar)
        └── Profile (Top Right Profile)
```

---

## Technology Stack

### Core Technologies
- **Framework**: Next.js 16.0.1 (App Router)
- **UI Library**: React 19.2.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Canvas Library**: Konva.js 10.0.8, react-konva 19.2.0
- **3D Rendering**: Three.js 0.169.0
- **Image Processing**: UTIF 3.1.0 (TIFF support)

### Key Dependencies
- **Canvas Rendering**: Konva.js for 2D graphics
- **3D Models**: Three.js for WebGL rendering
- **State Management**: React useState/useRef (local state)
- **Authentication**: Cookie-based (cross-subdomain)
- **API Communication**: Native fetch API

---

## Application Structure

### Directory Structure

```
wildmindcanvas/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main canvas page
│   └── globals.css               # Global styles
├── components/                    # React components
│   ├── AuthGuard.tsx             # Authentication guard
│   ├── Canvas/                   # Canvas-related components
│   │   ├── Canvas.tsx            # Main canvas component
│   │   ├── CanvasBackground.tsx  # Background pattern
│   │   ├── CanvasImage.tsx       # Image/video elements
│   │   ├── TextElements.tsx      # Text elements
│   │   ├── Model3D.tsx           # 3D model component
│   │   ├── Model3DOverlay.tsx    # 3D model overlay
│   │   ├── ModalOverlays.tsx     # Modal overlays manager
│   │   ├── SelectionBox.tsx      # Selection box & toolbar
│   │   ├── GroupLabel.tsx        # Group labels
│   │   └── MediaActionIcons.tsx  # Action icons
│   ├── Header/                    # Header component
│   │   └── Header.tsx            # Project name header
│   ├── ToolbarPanel/              # Toolbar component
│   │   └── ToolbarPanel.tsx      # Left side toolbar
│   ├── Profile/                  # Profile component
│   │   └── Profile.tsx            # User profile dropdown
│   ├── TextInput/                 # Text input component
│   │   └── TextInput.tsx         # Text input modal
│   ├── ImageUploadModal/          # Image upload modal
│   │   └── ImageUploadModal.tsx  # Image generation/upload
│   ├── VideoUploadModal/          # Video upload modal
│   │   └── VideoUploadModal.tsx  # Video generation/upload
│   ├── MusicUploadModal/          # Music upload modal
│   │   └── MusicUploadModal.tsx  # Music generation/upload
│   ├── ContextMenu/               # Context menu
│   │   └── ContextMenu.tsx       # Right-click menu
│   ├── GroupNameModal/            # Group name modal
│   │   └── GroupNameModal.tsx    # Group naming dialog
│   └── UploadButton/              # Upload button
│       └── UploadButton.tsx      # File upload trigger
├── lib/                           # Services and utilities
│   ├── auth.ts                    # Authentication utilities
│   ├── api.ts                     # API client functions
│   └── canvasUtils.ts             # Canvas utilities
├── types/                         # TypeScript types
│   └── canvas.ts                  # Canvas type definitions
└── hooks/                         # Custom React hooks
    └── useCanvas.ts               # Canvas-related hooks
```

---

## Canvas Rendering Architecture

### Konva.js Architecture

The canvas uses **Konva.js** for 2D rendering with the following structure:

```
Konva.Stage (1,000,000 x 1,000,000 pixels)
└── Konva.Layer
    ├── Rect (Background Pattern)
    ├── Image (Canvas Images/Videos)
    ├── Text (Text Elements)
    ├── Group (Selection Box)
    │   ├── Rect (Selection Rectangle)
    │   ├── Group (Toolbar Icons)
    │   └── Text (Group Name)
    └── Group (Group Labels)
```

### Infinite Canvas Implementation

- **Canvas Size**: 1,000,000 x 1,000,000 pixels
- **Viewport**: User's visible area (typically 1200x800)
- **Pan**: Drag to move viewport across canvas
- **Zoom**: Mouse wheel to zoom in/out
- **Center Tracking**: `viewportCenterRef` tracks current viewport center

### Background Pattern

- **Pattern Type**: White background with black dots
- **Dot Spacing**: 20px
- **Dot Size**: 2px
- **Dot Opacity**: 0.90
- **Implementation**: Canvas pattern image created dynamically

### 3D Model Rendering

- **Library**: Three.js for WebGL rendering
- **Supported Formats**: OBJ, GLTF, GLB, FBX, MB, MA
- **Features**: Rotation, zoom, related file support (for GLTF dependencies)
- **Rendering**: Separate WebGL canvas overlay

---

## State Management

### Component State (React useState)

The application uses **local component state** (no Redux) for simplicity:

```typescript
CanvasApp State:
- images: ImageUpload[]           // All canvas elements
- projectName: string             // Project name
- selectedTool: string            // Current tool
- isImageModalOpen: boolean       // Modal states
- isVideoModalOpen: boolean
- isMusicModalOpen: boolean
- generatedImageUrl: string | null // Generated content URLs
- generatedVideoUrl: string | null
- generatedMusicUrl: string | null

Canvas State:
- textInputStates: Array          // Text input positions
- imageModalStates: Array         // Image modal positions
- videoModalStates: Array         // Video modal positions
- musicModalStates: Array         // Music modal positions
- selectedImageIndices: number[]  // Selected images
- selectedTextInputIds: string[]  // Selected text inputs
- selectedImageModalIds: string[] // Selected image modals
- selectedVideoModalIds: string[] // Selected video modals
- selectedMusicModalIds: string[] // Selected music modals
- groups: Map<string, Group>      // Groups of elements
- selectionTightRect: Rect | null // Selection bounding box
- isDragSelection: boolean         // Selection type
- contextMenuOpen: boolean        // Context menu state
```

### State Persistence

- **Project Name**: localStorage (`canvas-project-name`)
- **Canvas Elements**: In-memory only (not persisted)
- **Authentication**: Session cookie (cross-subdomain)

---

## Data Flow Patterns

### 1. **File Upload Flow**

```
User Action (Upload File)
    │
    ▼
[File Input] → File selected
    │
    ▼
[processMediaFile] → Determine file type
    │
    ├─→ [Image] → Create Image object, load metadata
    │   │
    │   └─→ [onload] → Calculate display size, create ImageUpload object
    │
    ├─→ [Video] → Create Video element, load metadata
    │   │
    │   └─→ [onloadedmetadata] → Calculate display size, create ImageUpload object
    │
    └─→ [3D Model] → Create ImageUpload with type='model3d'
    │
    ▼
[setImages] → Add to images array
    │
    ▼
[Canvas Renders] → Konva.Image or Model3DOverlay component
```

### 2. **Selection Flow**

```
User Action (Click/Drag)
    │
    ▼
[handleMouseDown] → Record start position
    │
    ├─→ [Single Click] → Check if clicked on element
    │   │
    │   ├─→ [Element Found] → Select element, clear others
    │   │
    │   └─→ [Empty Space] → Clear all selections
    │
    └─→ [Drag] → Start marquee selection
        │
        ▼
[handleMouseMove] → Update selection box
    │
    ▼
[handleMouseUp] → Finalize selection
    │
    ├─→ [Calculate Tight Rect] → Find bounding box of selected elements
    │
    ├─→ [Check Overlap] → Select all elements overlapping selection box
    │
    └─→ [Update State] → Set selected indices/IDs
    │
    ▼
[SelectionBox Renders] → Show selection box with toolbar
```

### 3. **Grouping Flow**

```
User Action (Select Multiple Elements + Group)
    │
    ▼
[SelectionBox] → Show "Group" button (if 2+ items selected)
    │
    ▼
[Click Group] → Open GroupNameModal
    │
    ▼
[Enter Name] → User enters group name (optional)
    │
    ▼
[Create Group] → 
    │
    ├─→ [Generate Group ID] → UUID
    │
    ├─→ [Create Group Object] → 
    │   {
    │     id: string,
    │     name?: string,
    │     itemIndices: number[],
    │     textIds: string[],
    │     imageModalIds: string[],
    │     videoModalIds: string[],
    │     musicModalIds: string[]
    │   }
    │
    ├─→ [Update Elements] → Set groupId on all elements
    │
    └─→ [Add to Groups Map] → groups.set(groupId, group)
    │
    ▼
[Disable Individual Dragging] → Elements become "stuck"
    │
    ├─→ [CanvasImage] → draggable={!imageData.groupId}
    │
    └─→ [ModalOverlays] → onPositionChange={undefined} if in group
    │
    ▼
[Group Movement] → Move entire group together
    │
    └─→ [handleImageUpdateWithGroup] → Calculate delta, move all group members
```

### 4. **AI Generation Flow**

```
User Action (Select Image Tool)
    │
    ▼
[ToolbarPanel] → handleToolClick('image')
    │
    ▼
[CanvasApp] → setIsImageModalOpen(true)
    │
    ▼
[ImageUploadModal] → Opens modal overlay
    │
    ▼
[User Enters Prompt] → Fill in generation form
    │
    ▼
[Click Generate] → handleImageGenerate()
    │
    ├─→ [Get Auth Token] → getAuthToken() from cookies/localStorage
    │
    ├─→ [Call API] → generateImage(prompt, model, aspectRatio, token)
    │   │
    │   ├─→ [Route to Provider] → Based on model:
    │   │   ├─→ Flux → generateImageBFL()
    │   │   ├─→ Seedream 4K → generateImageReplicate()
    │   │   └─→ Others → generateImageFAL()
    │   │
    │   └─→ [API Gateway] → POST /api/bfl/generate (or /api/fal/generate, /api/replicate/generate)
    │       │
    │       ├─→ [Backend] → Validates credits, calls AI provider
    │       │
    │       └─→ [Response] → Returns image URL
    │
    ├─→ [Update Modal] → Set generatedImageUrl
    │
    └─→ [User Clicks Add] → processMediaFile() with generated image
    │
    ▼
[Add to Canvas] → Image appears on canvas
```

### 5. **Group Movement Flow**

```
User Action (Drag Group)
    │
    ▼
[SelectionBox] → User drags selection box
    │
    ▼
[handleImageUpdateWithGroup] → Called for each element
    │
    ├─→ [Check if in Group] → element.groupId exists
    │
    ├─→ [Calculate Delta] → newX - oldX, newY - oldY
    │
    ├─→ [Check Boundaries] → Is element moving outside group bounds?
    │   │
    │   ├─→ [Inside Bounds] → Move all group members by delta
    │   │
    │   └─→ [Outside Bounds] → Remove from group
    │       │
    │       ├─→ [Clear groupId] → element.groupId = undefined
    │       │
    │       ├─→ [Deselect Element] → Remove from selected arrays
    │       │
    │       └─→ [Keep Position] → Element stays at new position
    │
    └─→ [Update All Group Members] → Apply delta to all members
```

---

## Selection & Grouping System

### Selection Types

1. **Single Selection**
   - Click on element
   - Highlights element
   - Shows action icons (delete, duplicate, download)

2. **Multi-Selection (Marquee)**
   - Drag to create selection box
   - Selects all overlapping elements
   - Shows tight bounding box
   - Shows toolbar with Group/Ungroup button

3. **Group Selection**
   - Select all elements in a group
   - Shows group name label
   - Shows Ungroup button instead of Group

### Selection Box Calculation

**Tight Bounding Box Algorithm**:
```typescript
1. Collect all selected elements:
   - Images: images[index] for each selectedImageIndices
   - Text: textInputStates for each selectedTextInputIds
   - Modals: imageModalStates, videoModalStates, musicModalStates

2. Calculate bounds:
   - minX = minimum x of all elements
   - minY = minimum y of all elements
   - maxX = maximum (x + width) of all elements
   - maxY = maximum (y + height) of all elements

3. Account for element heights:
   - Image Modals: +380px (includes controls)
   - Video Modals: +380px (includes controls)
   - Music Modals: +800px (includes controls)
   - Text Inputs: +400px (includes all sections)

4. Return tight rect:
   {
     x: minX,
     y: minY,
     width: maxX - minX,
     height: maxY - minY
   }
```

### Grouping System

**Group Structure**:
```typescript
interface Group {
  id: string;                    // UUID
  name?: string;                 // Optional group name
  itemIndices: number[];          // Image/video indices
  textIds?: string[];            // Text input IDs
  imageModalIds?: string[];      // Image modal IDs
  videoModalIds?: string[];      // Video modal IDs
  musicModalIds?: string[];      // Music modal IDs
}
```

**Group Operations**:
1. **Create Group**: Select 2+ elements → Click "Group" → Enter name → Create
2. **Move Group**: Drag selection box → All members move together
3. **Ungroup**: Select group → Click "Ungroup" → Remove group, clear groupIds
4. **Remove from Group**: Drag element outside group bounds → Auto-remove

**Group Persistence**:
- Groups stored in `groups` Map (in-memory)
- Element `groupId` property links elements to groups
- Groups persist until explicitly ungrouped

---

## Authentication & Authorization

### Authentication Methods

1. **Session Cookie (Primary)**
   - Cookie name: `app_session`
   - Domain: `.wildmindai.com` (production) for cross-subdomain sharing
   - SameSite: `None` (production), `Lax` (development)
   - Secure: `true` (production)
   - Set by: API Gateway backend

2. **LocalStorage Fallback (Development)**
   - `auth_token`
   - `app_session`
   - `idToken`
   - Used when cookies not available (development)

### AuthGuard Component

**Flow**:
```
1. Component Mount
   │
   ├─→ [Development] → Check API, allow access if API check passes
   │
   └─→ [Production] → 
       │
       ├─→ [Check Cookie] → isAuthenticated()
       │
       ├─→ [Verify with API] → checkAuthStatus()
       │
       └─→ [Not Authenticated] → Redirect to /view/signup?returnUrl={url}
```

**Functions**:
- `isAuthenticated()`: Check for `app_session` cookie
- `checkAuthStatus()`: Verify session with API Gateway
- `getAuthToken()`: Extract token from cookie or localStorage

### Cross-Subdomain Authentication

- **Production**: `studio.wildmindai.com` shares cookies with `wildmindai.com`
- **Development**: Cookies not shared between ports (localhost:3000 vs localhost:3001)
- **Solution**: Development mode allows access if API check passes

---

## File Upload & Media Handling

### Supported File Types

**Images**:
- Formats: JPG, PNG, GIF, WebP, TIFF
- Processing: Auto-scale to max 600px (largest dimension)
- Placement: Center of viewport with slight offset for multiple files

**Videos**:
- Formats: MP4, WebM, OGG, MOV, AVI, MKV, FLV, WMV, M4V, 3GP
- Processing: Auto-scale to max 600px (largest dimension)
- Metadata: Extract original resolution for tooltip

**3D Models**:
- Formats: OBJ, GLTF, GLB, FBX, MB, MA
- Processing: Load with Three.js
- Related Files: Support for GLTF dependencies (.bin, textures)
- Features: Rotation (X/Y), zoom

**Text**:
- Creation: Click text tool → Click canvas → Enter text
- Properties: Font size, font family, color
- Editing: Click text element to edit

### File Processing Flow

```typescript
processMediaFile(file, offsetIndex):
1. Create blob URL: URL.createObjectURL(file)
2. Determine type:
   - Check file extension (.obj, .gltf, etc.) → model3d
   - Check MIME type (video/*) → video
   - Default → image
3. Load metadata:
   - Image: new Image(), wait for onload
   - Video: <video> element, wait for onloadedmetadata
   - 3D Model: Direct assignment
4. Calculate display size:
   - Max dimension: 600px
   - Maintain aspect ratio
5. Calculate position:
   - Center of viewport
   - Offset based on offsetIndex (stagger multiple files)
6. Create ImageUpload object:
   {
     file: File,
     url: string (blob URL),
     type: 'image' | 'video' | 'model3d' | 'text',
     x: number,
     y: number,
     width: number,
     height: number,
     // Additional properties based on type
   }
7. Add to images array: setImages([...prev, newImage])
```

### Blob URL Management

- **Creation**: `URL.createObjectURL(file)` for local files
- **Cleanup**: `URL.revokeObjectURL(url)` on delete
- **Persistence**: Blob URLs stored in component state
- **Download**: Convert blob to downloadable file

---

## AI Generation Integration

### Supported Providers

1. **BFL (Black Forest Labs)**
   - Models: Flux Kontext Max, Flux Kontext Pro
   - Endpoint: `/api/bfl/generate`
   - Response: Image URL

2. **FAL (Fal.ai)**
   - Models: Google Nano Banana, Seedream v4
   - Endpoint: `/api/fal/generate`
   - Response: Image URL

3. **Replicate**
   - Models: Seedream 4K
   - Endpoint: `/api/replicate/generate`
   - Response: Image URL

### Generation Flow

**API Client** (`lib/api.ts`):
```typescript
generateImage(prompt, model, aspectRatio, token):
1. Determine provider based on model:
   - "flux" → generateImageBFL()
   - "seedream" + "4k" → generateImageReplicate()
   - Default → generateImageFAL()
2. Call appropriate function:
   - Map model name to backend format
   - Add Authorization header
   - POST to API Gateway
   - Include credentials: 'include' (for cookies)
3. Parse response:
   - Extract image URL from response.data.images[0].url
   - Return URL string
4. Error handling:
   - Throw error if generation fails
   - Show user-friendly error message
```

**Modal Integration**:
- `ImageUploadModal`: Image generation UI
- `VideoUploadModal`: Video generation UI (TODO)
- `MusicUploadModal`: Music generation UI (TODO)

---

## Component Architecture

### Core Components

1. **Canvas** (`components/Canvas/Canvas.tsx`)
   - **Size**: 2,489 lines (main component)
   - **Responsibilities**:
     - Konva Stage/Layer management
     - Event handling (mouse, keyboard, wheel)
     - Selection logic
     - Grouping logic
     - Viewport management (pan, zoom)
     - Element rendering coordination

2. **SelectionBox** (`components/Canvas/SelectionBox.tsx`)
   - **Responsibilities**:
     - Render selection rectangle
     - Show toolbar (Group/Ungroup buttons)
     - Handle group movement
     - Calculate tight bounding box

3. **CanvasImage** (`components/Canvas/CanvasImage.tsx`)
   - **Responsibilities**:
     - Render image/video elements
     - Handle drag (if not in group)
     - Show action icons (delete, duplicate, download)
     - Handle context menu

4. **ModalOverlays** (`components/Canvas/ModalOverlays.tsx`)
   - **Responsibilities**:
     - Render text input modals
     - Render image/video/music upload modals
     - Manage modal positions
     - Handle modal interactions

5. **ToolbarPanel** (`components/ToolbarPanel/ToolbarPanel.tsx`)
   - **Responsibilities**:
     - Tool selection (cursor, move, text, image, video, music)
     - File upload trigger
     - Tool state management

6. **Header** (`components/Header/Header.tsx`)
   - **Responsibilities**:
     - Display project name
     - Edit project name
     - Save to localStorage

7. **Profile** (`components/Profile/Profile.tsx`)
   - **Responsibilities**:
     - Display user profile
     - Show user dropdown
     - Handle logout
     - Link to account settings

### Modal Components

1. **TextInput** (`components/TextInput/TextInput.tsx`)
   - Text input overlay
   - Text editing
   - Position management

2. **ImageUploadModal** (`components/ImageUploadModal/ImageUploadModal.tsx`)
   - Image generation form
   - Image upload
   - Model selection
   - Prompt input

3. **VideoUploadModal** (`components/VideoUploadModal/VideoUploadModal.tsx`)
   - Video generation form (TODO)
   - Video upload

4. **MusicUploadModal** (`components/MusicUploadModal/MusicUploadModal.tsx`)
   - Music generation form (TODO)
   - Music upload

---

## Performance Optimizations

### Canvas Rendering

1. **WebGL Optimization**
   - `Konva.pixelRatio = window.devicePixelRatio`
   - Enables hardware acceleration

2. **Layer Management**
   - Single Konva Layer for all elements
   - Efficient batch rendering

3. **Pattern Caching**
   - Background pattern created once
   - Cached as HTMLImageElement
   - Reused for all renders

### State Management

1. **Refs for Non-Reactive Data**
   - `viewportCenterRef`: Viewport position (doesn't trigger re-render)
   - `selectionDragOriginRef`: Selection origin
   - `stageRef`, `layerRef`: Konva references

2. **Efficient Updates**
   - Functional updates: `setImages(prev => [...prev, new])`
   - Batch state updates where possible

3. **Memory Management**
   - Revoke blob URLs on delete
   - Clean up event listeners
   - Dispose Three.js resources

### Event Handling

1. **Throttled Updates**
   - Selection box updates on mouse move
   - Viewport updates on wheel/pan

2. **Event Delegation**
   - Single event handlers on Stage
   - Efficient event propagation

---

## Security

### Authentication Security

- **Session Cookie**: HttpOnly, Secure (production)
- **Token Storage**: localStorage fallback (development only)
- **Cross-Subdomain**: Secure cookie sharing in production

### Content Security

- **Blob URLs**: Used for local file previews
- **External URLs**: Fetched through API Gateway
- **CORS**: Handled by API Gateway

### Input Validation

- **File Types**: Accept attribute on file input
- **File Size**: Browser-enforced limits
- **Prompt Validation**: Client-side validation before API call

---

## Deployment

### Environment Variables

**Required**:
- `NEXT_PUBLIC_API_BASE_URL` (defaults to API Gateway URL)

**Optional**:
- None (all config via API Gateway)

### Build & Deploy

```bash
# Development
npm run dev

# Production Build
npm run build

# Start Production Server
npm start
```

### Deployment Platforms

- **Vercel** (Recommended): Automatic deployments
- **Other Platforms**: Build and deploy `.next` directory

### Subdomain Configuration

- **Production**: `studio.wildmindai.com`
- **Development**: `localhost:3001`
- **Cookie Domain**: `.wildmindai.com` (production)

---

## Key Features

### Canvas Features

1. **Infinite Canvas**
   - 1,000,000 x 1,000,000 pixel workspace
   - Pan and zoom navigation
   - Center tracking

2. **Multi-Element Support**
   - Images (JPG, PNG, GIF, WebP, TIFF)
   - Videos (MP4, WebM, MOV, etc.)
   - 3D Models (OBJ, GLTF, GLB, FBX)
   - Text elements

3. **Selection System**
   - Single element selection
   - Multi-element marquee selection
   - Tight bounding box calculation
   - Group detection

4. **Grouping System**
   - Create groups from selected elements
   - Move groups together
   - Ungroup functionality
   - Auto-remove from group when moved outside

5. **AI Generation**
   - Image generation (BFL, FAL, Replicate)
   - Video generation (planned)
   - Music generation (planned)

6. **Project Management**
   - Project name editing
   - LocalStorage persistence
   - Project state in memory

### Interaction Features

1. **Pan**: Drag canvas to move viewport
2. **Zoom**: Mouse wheel to zoom in/out
3. **Select**: Click or drag to select elements
4. **Move**: Drag selected elements
5. **Delete**: Delete key or context menu
6. **Duplicate**: Context menu or action icon
7. **Download**: Action icon
8. **Group**: Toolbar button when 2+ items selected
9. **Ungroup**: Toolbar button when group selected

---

## Key Design Patterns

1. **Component Composition**: Modular component structure
2. **Refs for Performance**: Use refs for non-reactive data
3. **Event Delegation**: Single event handlers on Stage
4. **State Lifting**: State managed in CanvasApp, passed down
5. **Callback Props**: Parent handles state updates
6. **Blob URL Management**: Create/revoke blob URLs properly
7. **Group Pattern**: Map-based group storage with element linking

---

## Future Considerations

1. **Persistence**: Save canvas state to backend
2. **Collaboration**: Real-time multi-user editing
3. **Export**: Export canvas as image/PDF
4. **Templates**: Pre-built canvas templates
5. **Layers**: Layer system for organization
6. **Undo/Redo**: History management
7. **Keyboard Shortcuts**: Power user features
8. **Performance**: Virtualization for large canvases
9. **Offline Support**: Service worker for offline access
10. **Mobile Support**: Touch gestures for mobile devices

---

## Conclusion

WildMind Canvas provides a powerful, infinite canvas workspace with advanced features like multi-element selection, grouping, and AI-powered content generation. Built with Konva.js for 2D rendering and Three.js for 3D support, it offers a seamless user experience with cross-subdomain authentication and integration with the WildMind AI generation platform.

