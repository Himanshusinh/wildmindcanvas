
export type Tab = 'tools' | 'text' | 'images' | 'videos' | 'audio' | 'uploads' | 'projects';

export interface Project {
    id: string;
    name: string;
    lastModified: string;
    thumbnail: string;
}

import React from 'react';
export type ClipType = 'video' | 'audio' | 'image' | 'text' | 'color';

export type TransitionType =
    | 'none'
    | 'dissolve' | 'additive-dissolve' | 'dip-to-black' | 'dip-to-white' | 'film-dissolve'
    | 'iris-box' | 'iris-cross' | 'iris-diamond' | 'iris-round'
    | 'slide' | 'push' | 'split' | 'whip' | 'band-slide'
    | 'wipe' | 'band-wipe' | 'barn-doors' | 'checker-wipe' | 'clock-wipe' | 'radial-wipe' | 'venetian-blinds' | 'wedge-wipe' | 'zig-zag' | 'random-blocks'
    | 'cross-zoom' | 'morph-cut' | 'zoom-in' | 'zoom-out' | 'gradient-wipe'
    | 'page-peel' | 'page-turn'
    | 'circle' | 'line-wipe' | 'match-move' | 'flow' | 'stack' | 'chop'
    | 'fade-dissolve' | 'flash-zoom-in' | 'flash-zoom-out' | 'film-roll'
    | 'non-additive-dissolve' | 'ripple-dissolve' | 'smooth-wipe' | 'spin' | 'zoom-blur' | 'glitch' | 'rgb-split' | 'film-burn';

export interface Transition {
    type: TransitionType;
    duration: number; // seconds
    speed?: number; // 0.1 (slow) to 2.0 (fast)
    direction?: 'left' | 'right' | 'up' | 'down' | 'in' | 'out';
    origin?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom';
    timing?: 'prefix' | 'overlap' | 'postfix';
}

export interface Animation {
    type: string; // e.g., 'rise', 'pan', 'neon'
    category: 'page' | 'photo' | 'element' | 'loop';
    duration?: number; // seconds
    delay?: number; // seconds
    timing?: 'enter' | 'exit' | 'both';
}

export interface BorderStyle {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted' | 'none';
}

export interface TextEffect {
    type: 'none' | 'shadow' | 'lift' | 'hollow' | 'splice' | 'outline' | 'echo' | 'glitch' | 'neon' | 'background';
    color?: string;
    intensity?: number; // 0-100
    offset?: number; // 0-100
    direction?: number; // degrees
}

export interface Adjustments {
    // White Balance
    temperature: number; // -100 to 100
    tint: number; // -100 to 100

    // Light
    brightness: number; // -100 to 100
    contrast: number; // -100 to 100
    highlights: number; // -100 to 100
    shadows: number; // -100 to 100
    whites: number; // -100 to 100
    blacks: number; // -100 to 100

    // Color
    saturation: number; // -100 to 100
    vibrance: number; // -100 to 100
    hue: number; // -100 to 100 (Color Edit)

    // Texture
    sharpness: number; // -100 to 100
    clarity: number; // -100 to 100
    vignette: number; // 0 to 100
    blur: number; // 0 to 100
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
    temperature: 0, tint: 0,
    brightness: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
    saturation: 0, vibrance: 0, hue: 0,
    sharpness: 0, clarity: 0, vignette: 0, blur: 0
};

export interface Filter {
    id: string;
    name: string;
    style: string; // CSS filter string suffix
}

export const FILTERS: Filter[] = [
    { id: 'none', name: 'None', style: '' },
    { id: 'fresco', name: 'Fresco', style: 'sepia(30%) brightness(110%) contrast(110%)' },
    { id: 'belvedere', name: 'Belvedere', style: 'sepia(40%) contrast(90%)' },
    { id: 'flint', name: 'Flint', style: 'brightness(110%) contrast(90%) grayscale(20%)' },
    { id: 'luna', name: 'Luna', style: 'grayscale(100%) contrast(110%)' },
    { id: 'festive', name: 'Festive', style: 'saturate(150%) brightness(105%)' },
    { id: 'summer', name: 'Summer', style: 'saturate(120%) sepia(20%) brightness(110%)' },
];

export const FONTS = [
    // --- Sans-Serif ---
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Open Sans', family: '"Open Sans", sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'Helvetica', family: 'Helvetica, sans-serif' },
    { name: 'Arial', family: 'Arial, sans-serif' },
    { name: 'Futura', family: 'Futura, "Trebuchet MS", Arial, sans-serif' },
    { name: 'Avenir', family: 'Avenir, "Segoe UI", sans-serif' },
    { name: 'Proxima Nova', family: '"Proxima Nova", sans-serif' },
    { name: 'Gotham', family: 'Gotham, "Montserrat", sans-serif' },
    { name: 'Segoe UI', family: '"Segoe UI", sans-serif' },
    { name: 'Ubuntu', family: 'Ubuntu, sans-serif' },
    { name: 'Noto Sans', family: '"Noto Sans", sans-serif' },
    { name: 'Source Sans Pro', family: '"Source Sans Pro", sans-serif' },
    { name: 'Nunito', family: 'Nunito, sans-serif' },
    { name: 'Raleway', family: 'Raleway, sans-serif' },
    { name: 'Oswald', family: 'Oswald, sans-serif' },
    { name: 'Bebas Neue', family: '"Bebas Neue", sans-serif' },
    { name: 'DIN', family: 'DIN, "Roboto", sans-serif' },
    { name: 'SF Pro', family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
    { name: 'Arimo', family: 'Arimo, sans-serif' },
    { name: 'DM Sans', family: '"DM Sans", sans-serif' },
    { name: 'Quicksand', family: 'Quicksand, sans-serif' },

    // --- Serif ---
    { name: 'Times New Roman', family: '"Times New Roman", serif' },
    { name: 'Georgia', family: 'Georgia, serif' },
    { name: 'Merriweather', family: 'Merriweather, serif' },
    { name: 'Playfair Display', family: '"Playfair Display", serif' },
    { name: 'Garamond', family: '"EB Garamond", serif' },
    { name: 'Baskerville', family: '"Libre Baskerville", serif' },
    { name: 'Bodoni', family: '"Bodoni Moda", serif' },
    { name: 'Didot', family: '"Didot", "Bodoni MT", serif' },
    { name: 'Cambria', family: 'Cambria, serif' },
    { name: 'Caslon', family: '"Libre Caslon Text", serif' },
    { name: 'Palatino', family: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
    { name: 'Lora', family: 'Lora, serif' },
    { name: 'Crimson Text', family: '"Crimson Text", serif' },
    { name: 'Spectral', family: 'Spectral, serif' },
    { name: 'Charter', family: 'Charter, "Bitstream Charter", serif' },
    { name: 'Constantia', family: 'Constantia, serif' },

    // --- Slab Serif ---
    { name: 'Rockwell', family: 'Rockwell, "Courier Bold", serif' },
    { name: 'Roboto Slab', family: '"Roboto Slab", serif' },
    { name: 'Arvo', family: 'Arvo, serif' },
    { name: 'Egyptienne', family: '"Courier New", serif' },
    { name: 'Clarendon', family: 'Clarendon, serif' },
    { name: 'Memphis', family: 'Memphis, serif' },

    // --- Monospace ---
    { name: 'Courier New', family: '"Courier New", monospace' },
    { name: 'Consolas', family: 'Consolas, monospace' },
    { name: 'Fira Code', family: '"Fira Code", monospace' },
    { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace' },
    { name: 'Source Code Pro', family: '"Source Code Pro", monospace' },
    { name: 'Menlo', family: 'Menlo, monospace' },
    { name: 'Monaco', family: 'Monaco, monospace' },
    { name: 'Inconsolata', family: 'Inconsolata, monospace' },
    { name: 'IBM Plex Mono', family: '"IBM Plex Mono", monospace' },
    { name: 'Ubuntu Mono', family: '"Ubuntu Mono", monospace' },

    // --- Script ---
    { name: 'Pacifico', family: 'Pacifico, cursive' },
    { name: 'Lobster', family: 'Lobster, cursive' },
    { name: 'Great Vibes', family: '"Great Vibes", cursive' },
    { name: 'Dancing Script', family: '"Dancing Script", cursive' },
    { name: 'Brush Script', family: '"Brush Script MT", cursive' },
    { name: 'Brittany', family: 'cursive' },
    { name: 'Halimun', family: 'cursive' },
    { name: 'Allura', family: 'Allura, cursive' },
    { name: 'Satisfy', family: 'Satisfy, cursive' },
    { name: 'Alex Brush', family: '"Alex Brush", cursive' },
    { name: 'Parisienne', family: 'Parisienne, cursive' },
    { name: 'Moontime', family: 'cursive' },

    // --- Display ---
    { name: 'Impact', family: 'Impact, sans-serif' },
    { name: 'Anton', family: 'Anton, sans-serif' },
    { name: 'League Spartan', family: '"League Spartan", sans-serif' },
    { name: 'Cooper Black', family: '"Cooper Black", serif' },
    { name: 'Blackletter', family: '"UnifrakturMaguntia", cursive' },
    { name: 'Norwester', family: 'Norwester, sans-serif' },
    { name: 'Avenir Next Heavy', family: 'AvenirNext-Heavy, sans-serif' },
    { name: 'Archivo Black', family: '"Archivo Black", sans-serif' },
    { name: 'Abril Fatface', family: '"Abril Fatface", display' },
    { name: 'Alfa Slab One', family: '"Alfa Slab One", display' },
    { name: 'Shrikhand', family: 'Shrikhand, display' },
    { name: 'Stardos Stencil', family: '"Stardos Stencil", display' },
    { name: 'Rye', family: '"Rye", display' },
    { name: 'Tilt Neon', family: '"Tilt Neon", display' },

    // --- Corporate ---
    { name: 'Tahoma', family: 'Tahoma, sans-serif' },
    { name: 'Verdana', family: 'Verdana, sans-serif' },
    { name: 'Calibri', family: 'Calibri, sans-serif' },
    { name: 'Candara', family: 'Candara, sans-serif' },
    { name: 'Trebuchet MS', family: '"Trebuchet MS", sans-serif' },
    { name: 'Gill Sans', family: '"Gill Sans", sans-serif' },
    { name: 'Franklin Gothic', family: '"Franklin Gothic Medium", sans-serif' },
    { name: 'Lucida Sans', family: '"Lucida Sans", sans-serif' },
    { name: 'Myriad Pro', family: '"Myriad Pro", sans-serif' },
];

export interface FontCombination {
    id: string;
    name: string;
    label: string;
    category: string;
    style: Partial<TimelineItem>;
}

export const FONT_COMBINATIONS: FontCombination[] = [
    {
        id: 'fc_glow',
        name: 'Glow',
        label: 'glow up',
        category: 'Neon',
        style: {
            fontFamily: '"Quicksand", sans-serif',
            fontWeight: 'bold',
            color: '#ccff00',
            textEffect: { type: 'neon', color: '#ccff00', intensity: 80, offset: 0 },
            fontSize: 80
        }
    },
    {
        id: 'fc_party',
        name: 'Party',
        label: 'NOW OPEN',
        category: 'Marketing',
        style: {
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 'bold',
            color: '#8b5cf6',
            textEffect: { type: 'splice', color: '#fbbf24', intensity: 0, offset: 30 },
            fontSize: 70
        }
    },
    {
        id: 'fc_beach',
        name: 'Retro',
        label: 'Beach Please',
        category: 'Retro',
        style: {
            fontFamily: '"Lobster", cursive',
            color: '#22d3ee',
            textEffect: { type: 'lift', color: '#facc15', intensity: 20, offset: 20 },
            fontSize: 80
        }
    },
    {
        id: 'fc_tech',
        name: 'Cyber',
        label: 'PRESS START',
        category: 'Tech',
        style: {
            fontFamily: '"Fira Code", monospace',
            fontWeight: 'bold',
            color: '#00ff00',
            textEffect: { type: 'glitch', color: '#ff00ff', intensity: 60, offset: 40 },
            fontSize: 50
        }
    },
    {
        id: 'fc_elegant',
        name: 'Luxury',
        label: 'Business Model',
        category: 'Elegant',
        style: {
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            color: '#1f2937',
            fontSize: 70
        }
    },
    {
        id: 'fc_sale',
        name: 'Sale',
        label: 'HUGE SALE',
        category: 'Marketing',
        style: {
            fontFamily: '"Anton", sans-serif',
            color: '#ef4444',
            fontSize: 100,
            textEffect: { type: 'shadow', color: '#000000', intensity: 30, offset: 15 }
        }
    },
    {
        id: 'fc_life',
        name: 'Vlog',
        label: 'A day in my life',
        category: 'Social',
        style: {
            fontFamily: '"Brittany", cursive',
            color: '#8b5cf6',
            fontSize: 90
        }
    },
    {
        id: 'fc_coffee',
        name: 'Organic',
        label: 'Coffee Break',
        category: 'Casual',
        style: {
            fontFamily: '"Cooper Black", serif',
            color: '#3f6212',
            fontSize: 60
        }
    },
    {
        id: 'fc_vibe',
        name: 'Vibe',
        label: 'VIBE',
        category: 'Retro',
        style: {
            fontFamily: '"Shrikhand", display',
            color: '#db2777',
            textEffect: { type: 'echo', color: '#db2777', intensity: 40, offset: 40 },
            fontSize: 90
        }
    },
    {
        id: 'fc_golden',
        name: 'Classy',
        label: 'GOLDEN HOUR',
        category: 'Elegant',
        style: {
            fontFamily: '"Playfair Display", serif',
            fontWeight: 'bold',
            color: '#ca8a04',
            textEffect: { type: 'shadow', color: '#ca8a04', intensity: 50, offset: 0 }, // Soft glow
            fontSize: 65
        }
    },
    {
        id: 'fc_wedding',
        name: 'Wedding',
        label: 'Bride & Groom',
        category: 'Elegant',
        style: {
            fontFamily: '"Great Vibes", cursive',
            color: '#111827',
            fontSize: 80
        }
    },
    {
        id: 'fc_thankyou',
        name: '3D',
        label: 'Thank You',
        category: 'Fun',
        style: {
            fontFamily: '"Abril Fatface", display',
            color: '#f472b6',
            textEffect: { type: 'splice', color: '#831843', intensity: 0, offset: 25 },
            fontSize: 70
        }
    },
    {
        id: 'fc_future',
        name: 'Modern',
        label: 'FUTURE READY',
        category: 'Tech',
        style: {
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 'bold',
            color: 'transparent',
            textEffect: { type: 'outline', color: '#000000', intensity: 2, offset: 0 },
            fontSize: 60
        }
    },
    {
        id: 'fc_journal',
        name: 'Editorial',
        label: 'BUSINESS JOURNAL',
        category: 'Corporate',
        style: {
            fontFamily: '"Lora", serif',
            fontWeight: 'bold',
            color: '#000000',
            fontSize: 50
        }
    },
    {
        id: 'fc_paint',
        name: 'Brush',
        label: 'Custom Paint',
        category: 'Artistic',
        style: {
            fontFamily: '"Brush Script MT", cursive',
            color: '#ea580c',
            fontSize: 80,
            rotation: -5
        }
    }
];

export interface TimelineItem {
    id: string;
    type: ClipType;
    src: string;
    name: string;
    thumbnail?: string;

    // Timing
    start: number; // Start time on timeline (seconds)
    duration: number; // Duration on timeline (seconds)
    offset?: number; // Start time within the source media (for trimming)

    // Visuals
    trackId: string;
    layer?: number; // Z-index
    isLocked?: boolean; // Cannot be moved/edited
    isBackground?: boolean; // Fills canvas, lowest z-index

    // Styling
    backgroundColor?: string; // Background color behind the content
    opacity?: number; // 0 to 100
    flipH?: boolean;
    flipV?: boolean;
    rotation?: number; // degrees
    scale?: number; // Legacy scaling, preferred to use width/height for overlays now
    width?: number; // Width in % of canvas
    height?: number; // Height in % of canvas
    x?: number; // Position X in % (-50 to 50 relative to center)
    y?: number; // Position Y in % (-50 to 50 relative to center)

    // Text Styling
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline' | 'line-through';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    textTransform?: 'none' | 'uppercase' | 'lowercase';
    listType?: 'none' | 'bullet' | 'number';
    textEffect?: TextEffect;

    // Border & Radius
    border?: BorderStyle;
    borderRadius?: number;

    // Animation
    animation?: Animation;

    // Audio & Speed
    volume?: number; // 0 to 100
    speed?: number; // 0.1 to 5.0 (multiplier)

    // Crop & Mask
    crop?: { x: number; y: number; zoom: number }; // x,y in % (0-100), zoom multiplier (>=1)
    maskImage?: string; // Data URL for alpha mask (eraser)

    // Image Editing
    adjustments?: Adjustments;
    filter?: string; // Filter ID
    filterIntensity?: number; // 0 to 100

    // Transition IN (from previous clip to this one)
    transition?: Transition;
}

export interface Track {
    id: string;
    type: 'video' | 'audio' | 'overlay';
    name: string;
    items: TimelineItem[];
    isMuted?: boolean;
    isHidden?: boolean;
}

// Helper to generate CSS filter string for Adjustments ONLY
export const getAdjustmentStyle = (item: TimelineItem) => {
    const adj = item.adjustments || DEFAULT_ADJUSTMENTS;

    const filters: string[] = [];

    // Calculate effective values
    let effBrightness = adj.brightness;
    let effContrast = adj.contrast;
    let effSaturation = adj.saturation;

    // Highlights (Approx)
    effBrightness += (adj.highlights * 0.15);
    effContrast += (adj.highlights * 0.05);

    // Shadows (Approx)
    effBrightness += (adj.shadows * 0.15);
    effContrast -= (adj.shadows * 0.1);

    // Whites (Approx)
    effBrightness += (adj.whites * 0.15);

    // Blacks (Approx)
    effBrightness += (adj.blacks * 0.15);

    // Clarity (Approx)
    effContrast += (adj.clarity * 0.2);

    // Vibrance (Approx)
    effSaturation += (adj.vibrance * 0.5);

    // Apply Standard Adjustments
    if (effBrightness !== 0) filters.push(`brightness(${100 + effBrightness}%)`);
    if (effContrast !== 0) filters.push(`contrast(${100 + effContrast}%)`);
    if (effSaturation !== 0) filters.push(`saturate(${100 + effSaturation}%)`);
    if (adj.hue !== 0) filters.push(`hue-rotate(${adj.hue * 1.8}deg)`);

    // Temp/Tint (Approximation)
    if (adj.temperature !== 0) filters.push(adj.temperature > 0 ? `sepia(${adj.temperature * 0.3}%)` : `hue-rotate(${adj.temperature * -0.3}deg)`);
    if (adj.tint !== 0) filters.push(`hue-rotate(${adj.tint}deg)`);

    // Texture (Approximation)
    if (adj.sharpness < 0) filters.push(`blur(${-adj.sharpness * 0.05}px)`);

    return filters.join(' ');
};

// Helper to get Preset Filter Style string
export const getPresetFilterStyle = (filterId: string) => {
    const filterDef = FILTERS.find(f => f.id === filterId);
    if (filterDef && filterDef.id !== 'none') {
        return filterDef.style;
    }
    return '';
};

// Legacy helper for compatibility (combines everything, ignores intensity blending)
export const getComputedFilterStyle = (item: TimelineItem) => {
    const adj = getAdjustmentStyle(item);
    const pre = getPresetFilterStyle(item.filter || 'none');
    return `${adj} ${pre}`.trim();
}

// Helper to generate CSS for Text Effects
export const getTextEffectStyle = (effect: TextEffect, itemColor?: string): React.CSSProperties => {
    if (!effect || effect.type === 'none') return {};

    const { type, color = '#000000', intensity = 50, offset = 50 } = effect;
    const effColor = color;

    const dist = (offset / 100) * 20; // 0 to 20px
    const blur = (intensity / 100) * 20; // 0 to 20px

    const shadowX = dist;
    const shadowY = dist;

    switch (type) {
        case 'shadow':
            return { textShadow: `${shadowX}px ${shadowY}px ${blur}px ${effColor}` };
        case 'lift':
            return { textShadow: `0px ${dist * 0.5 + 4}px ${blur + 10}px rgba(0,0,0,0.5)` };
        case 'hollow':
            return {
                WebkitTextStroke: `${(intensity / 100) * 3 + 1}px ${itemColor}`,
                color: 'transparent'
            };
        case 'splice':
            return {
                WebkitTextStroke: `${(intensity / 100) * 3 + 1}px ${itemColor}`,
                color: 'transparent',
                textShadow: `${shadowX + 2}px ${shadowY + 2}px 0px ${effColor}`
            };
        case 'outline':
            return {
                WebkitTextStroke: `${(intensity / 100) * 3 + 1}px ${effColor}`,
                color: itemColor
            };
        case 'echo':
            return {
                textShadow: `
                    ${shadowX}px ${shadowY}px 0px ${effColor}80,
                    ${shadowX * 2}px ${shadowY * 2}px 0px ${effColor}40,
                    ${shadowX * 3}px ${shadowY * 3}px 0px ${effColor}20
                `
            };
        case 'glitch':
            const gOff = (offset / 100) * 5 + 2;
            return {
                textShadow: `
                    ${-gOff}px ${-gOff}px 0px #00ffff,
                    ${gOff}px ${gOff}px 0px #ff00ff
                `
            };
        case 'neon':
            return {
                textShadow: `
                    0 0 ${intensity * 0.1}px ${effColor},
                    0 0 ${intensity * 0.2}px ${effColor},
                    0 0 ${intensity * 0.4}px ${effColor}
                `,
                color: itemColor || '#ffffff'
            };
        case 'background':
            return {
                backgroundColor: effColor,
                padding: '4px 8px',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone'
            };
        default:
            return {};
    }
};

export interface CanvasDimension {
    width: number;
    height: number;
    name: string;
}

export const RESIZE_OPTIONS: CanvasDimension[] = [
    { name: 'Instagram Story', width: 1080, height: 1920 },
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Facebook Post', width: 940, height: 788 },
    { name: 'YouTube Video', width: 1920, height: 1080 },
    { name: 'TikTok Video', width: 1080, height: 1920 },
    { name: 'Mobile Video', width: 1080, height: 1920 },
    { name: 'Presentation (16:9)', width: 1920, height: 1080 },
    { name: 'Document (A4)', width: 794, height: 1123 },
    { name: 'Logo', width: 500, height: 500 },
];

export const MOCK_UPLOADS = [
    { id: '1', type: 'image', src: 'https://picsum.photos/300/300?random=1', thumbnail: 'https://picsum.photos/300/300?random=1', name: 'Travel 1' },
    { id: '2', type: 'image', src: 'https://picsum.photos/300/300?random=2', thumbnail: 'https://picsum.photos/300/300?random=2', name: 'Food' },
    { id: '3', type: 'image', src: 'https://picsum.photos/300/300?random=3', thumbnail: 'https://picsum.photos/300/300?random=3', name: 'Nature' },
];

export const MOCK_IMAGES = [
    { id: 's1', src: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&w=300&q=80', name: 'Mountain' },
    { id: 's2', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80', name: 'Forest' },
    { id: 's3', src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c7dd1?auto=format&fit=crop&w=300&q=80', name: 'River' },
];

export const MOCK_VIDEOS = [
    { id: 'v1', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', name: 'Big Buck Bunny', duration: '00:09:56' },
    { id: 'v2', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', name: 'Elephant Dream', duration: '00:10:53' },
    { id: 'v3', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg', name: 'For Bigger Blazes', duration: '00:00:15' },
];

export const MOCK_AUDIO = [
    { id: 'a1', src: 'https://actions.google.com/sounds/v1/science_fiction/scifi_drone_low.ogg', name: 'Sci-Fi Drone', duration: '0:23', category: 'Cinematic' },
    { id: 'a2', src: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg', name: 'Ocean Waves', duration: '0:45', category: 'Nature' },
    { id: 'a3', src: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', name: 'Heavy Rain', duration: '0:30', category: 'Nature' },
    { id: 'a4', src: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg', name: 'Digital Alarm', duration: '0:06', category: 'Effects' },
];

export const MOCK_PROJECTS: Project[] = [
    { id: 'p1', name: 'Summer Vacation Reel', lastModified: '2 mins ago', thumbnail: 'https://picsum.photos/100/100?random=10' },
    { id: 'p2', name: 'Q3 Marketing Promo', lastModified: 'Yesterday', thumbnail: 'https://picsum.photos/100/100?random=11' },
];
