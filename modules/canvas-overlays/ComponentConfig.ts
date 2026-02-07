export interface ComponentConfigType {
    defaultWidth: number;
    defaultHeight: number;
    minWidth: number;
    minHeight: number;
    iconSize: number; // Size when component is collapsed (plugin mode)
    handlePositions?: {
        source: string; // 'right' | 'top' | 'bottom' | 'left'
        target: string; // 'left' | 'top' | 'bottom' | 'right'
    };
}

// Default dimensions for standard nodes
const DEFAULT_NODE_SIZE = { width: 600, height: 600 };
const DEFAULT_PLUGIN_SIZE = { width: 400, height: 500 };
const PLUGIN_ICON_SIZE = 110;

export const COMPONENT_CONFIG: Record<string, ComponentConfigType> = {
    // --- Core Components ---
    text: {
        defaultWidth: 400,
        defaultHeight: 400,
        minWidth: 200,
        minHeight: 100,
        iconSize: 0, // Not applicable
    },
    image: {
        defaultWidth: 600,
        defaultHeight: 600,
        minWidth: 300,
        minHeight: 300,
        iconSize: 0,
    },
    video: {
        defaultWidth: 600,
        defaultHeight: 338, // 16:9 aspect ratio
        minWidth: 300,
        minHeight: 169,
        iconSize: 0,
    },
    music: {
        defaultWidth: 600,
        defaultHeight: 300,
        minWidth: 300,
        minHeight: 150,
        iconSize: 0,
    },

    // --- Plugins ---
    upscale: {
        defaultWidth: 400,
        defaultHeight: 500,
        minWidth: 300,
        minHeight: 400,
        iconSize: PLUGIN_ICON_SIZE,
    },
    'removebg': {
        defaultWidth: 400,
        defaultHeight: 500,
        minWidth: 300,
        minHeight: 400,
        iconSize: PLUGIN_ICON_SIZE,
    },
    'multiangle-camera': {
        defaultWidth: 400,
        defaultHeight: 500,
        minWidth: 300,
        minHeight: 400,
        iconSize: PLUGIN_ICON_SIZE,
    },
    erase: {
        defaultWidth: 400,
        defaultHeight: 500,
        minWidth: 300,
        minHeight: 400,
        iconSize: PLUGIN_ICON_SIZE,
    },
    expand: {
        defaultWidth: 400,
        defaultHeight: 500,
        minWidth: 300,
        minHeight: 400,
        iconSize: PLUGIN_ICON_SIZE,
    },
    vectorize: {
        defaultWidth: 400,
        defaultHeight: 500,
        minWidth: 300,
        minHeight: 400,
        iconSize: PLUGIN_ICON_SIZE,
    },
    'next-scene': {
        defaultWidth: 400,
        defaultHeight: 500,
        minWidth: 300,
        minHeight: 400,
        iconSize: PLUGIN_ICON_SIZE,
    },
    storyboard: {
        defaultWidth: 400,
        defaultHeight: 500,
        minWidth: 300,
        minHeight: 400,
        iconSize: PLUGIN_ICON_SIZE,
    },
    compare: {
        defaultWidth: 110, // Compare effectively acts as just an icon/small tool
        defaultHeight: 110,
        minWidth: 110,
        minHeight: 110,
        iconSize: PLUGIN_ICON_SIZE,
    },
    'image-editor': {
        defaultWidth: 110,
        defaultHeight: 110,
        minWidth: 110,
        minHeight: 110,
        iconSize: PLUGIN_ICON_SIZE,
    },
    'video-editor': {
        defaultWidth: 110,
        defaultHeight: 110,
        minWidth: 110,
        minHeight: 110,
        iconSize: PLUGIN_ICON_SIZE,
    },
};

export const getComponentConfig = (type: string): ComponentConfigType => {
    // Normalize type string (remove '-plugin' suffix if present)
    const normalizedType = type.replace('-plugin', '');
    return COMPONENT_CONFIG[normalizedType] || COMPONENT_CONFIG['image']; // Fallback to image
};
