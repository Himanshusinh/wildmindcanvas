import React, { useState, useRef, useEffect } from 'react';
import {
    X, Plus, ChevronLeft, Sliders, Type, Image as ImageIcon,
    Palette, Sparkles, Wand2, PlayCircle, Eraser,
    AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
    ArrowUp, Move, Zap, Maximize, Minimize
} from 'lucide-react';
import { TimelineItem, Adjustments, DEFAULT_ADJUSTMENTS, FILTERS, FONTS, FONT_COMBINATIONS } from '../types';

interface EditPanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItemId: string | null;
    tracks: any[]; // Using any[] to avoid circular dependency issues if types are complex, but ideally Track[]
    onUpdate: (item: TimelineItem) => void;
    setInteractionMode: (mode: 'none' | 'crop' | 'erase') => void;
    eraserSettings: { size: number; type: 'erase' | 'restore'; showOriginal: boolean };
    setEraserSettings: (settings: any) => void;
}

const EditPanel: React.FC<EditPanelProps> = ({
    isOpen, onClose, selectedItemId, tracks, onUpdate,
    setInteractionMode, eraserSettings, setEraserSettings
}) => {
    const [view, setView] = useState<'main' | 'adjust' | 'eraser' | 'color' | 'animate' | 'text-effects' | 'font'>('main');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeColorProp, setActiveColorProp] = useState<'color' | 'background' | 'border'>('color');

    const itemToRender = tracks.find(t => t.items.some((i: TimelineItem) => i.id === selectedItemId))?.items.find((i: TimelineItem) => i.id === selectedItemId);

    // Reset view when selection changes
    useEffect(() => {
        if (selectedItemId) {
            setView('main');
        }
    }, [selectedItemId]);

    if (!itemToRender) return null;

    const adjustments = itemToRender.adjustments || DEFAULT_ADJUSTMENTS;

    // --- Constants ---
    const PAGE_ANIMATIONS = [
        { id: 'rise', name: 'Rise', icon: <ArrowUp size={16} /> },
        { id: 'pan', name: 'Pan', icon: <Move size={16} /> },
        { id: 'fade', name: 'Fade', icon: <Zap size={16} /> },
        { id: 'pop', name: 'Pop', icon: <Sparkles size={16} /> },
        { id: 'scrapbook', name: 'Scrapbook', icon: <Sparkles size={16} /> },
        { id: 'neon', name: 'Neon', icon: <Sparkles size={16} /> },
        { id: 'stomp', name: 'Stomp', icon: <Sparkles size={16} /> },
        { id: 'tumble', name: 'Tumble', icon: <Sparkles size={16} /> },
    ];

    const PHOTO_ANIMATIONS = [
        { id: 'zoom', name: 'Zoom', icon: <Maximize size={16} /> },
        { id: 'breath', name: 'Breath', icon: <Minimize size={16} /> },
        { id: 'flow', name: 'Photo Flow', icon: <Sparkles size={16} /> },
        { id: 'rise', name: 'Photo Rise', icon: <Sparkles size={16} /> },
    ];

    const DEFAULT_DOCUMENT_COLORS = [
        '#000000', '#FFFFFF', '#FF5757', '#FFBD59', '#FFFF57', '#8C52FF', '#5CE1E6', '#7ED957',
        '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937'
    ];

    const GRADIENT_COLORS = [
        'linear-gradient(135deg, #FF5757 0%, #8C52FF 100%)',
        'linear-gradient(135deg, #5CE1E6 0%, #8C52FF 100%)',
        'linear-gradient(135deg, #FFBD59 0%, #FF5757 100%)',
        'linear-gradient(135deg, #7ED957 0%, #5CE1E6 100%)',
        'linear-gradient(135deg, #FFFFFF 0%, #000000 100%)',
        'linear-gradient(to right, #ff7e5f, #feb47b)',
        'linear-gradient(to right, #6a11cb, #2575fc)',
        'linear-gradient(to right, #00c6ff, #0072ff)'
    ];

    const TEXT_EFFECTS = [
        { id: 'none', name: 'None', preview: 'Aa' },
        { id: 'shadow', name: 'Shadow', preview: 'Aa', style: { textShadow: '2px 2px 4px rgba(0,0,0,0.5)' } },
        { id: 'outline', name: 'Outline', preview: 'Aa', style: { WebkitTextStroke: '1px black', color: 'transparent' } },
        { id: 'neon', name: 'Neon', preview: 'Aa', style: { textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #ff00de' } },
        { id: 'glitch', name: 'Glitch', preview: 'Aa', style: { textShadow: '2px 0 red, -2px 0 blue' } },
    ];

    const handleAdjustmentChange = (key: keyof Adjustments, value: number) => {
        onUpdate({
            ...itemToRender,
            adjustments: { ...adjustments, [key]: value }
        });
    };

    // --- Helpers ---
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHsv = (r: number, g: number, b: number) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) h = 0;
        else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, v: v * 100 };
    };

    const hsvToRgb = (h: number, s: number, v: number) => {
        let r = 0, g = 0, b = 0;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    // --- Sub-Renderers ---

    const renderColorPickerPopup = () => (
        <div className="absolute top-16 left-4 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-64 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-gray-700">Custom Color</h4>
                <button onClick={() => setShowColorPicker(false)}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            {/* Simple HSL Sliders for prototype */}
            <div className="space-y-3">
                <div>
                    <div className="h-32 rounded-lg mb-3 relative cursor-crosshair" style={{ background: 'linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, transparent)', backgroundColor: 'red' }}>
                        {/* Saturation/Value Area */}
                    </div>
                    <input type="range" className="w-full h-3 rounded-full appearance-none cursor-pointer mb-2" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />
                    <input type="range" className="w-full h-3 rounded-full appearance-none cursor-pointer opacity-50" />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded border border-gray-200 flex items-center px-2 text-xs font-mono text-gray-600">#FF5757</div>
                    <div className="w-8 h-8 rounded border border-gray-200" style={{ background: '#FF5757' }}></div>
                </div>
            </div>
        </div>
    );

    const handleOpenPicker = (e: React.MouseEvent, color: string, prop: 'color' | 'background' | 'border') => {
        e.stopPropagation();
        setActiveColorProp(prop);
        setShowColorPicker(true);
    };

    const selectPresetColor = (color: string) => {
        if (activeColorProp === 'color') onUpdate({ ...itemToRender, color });
        else if (activeColorProp === 'background') onUpdate({ ...itemToRender, backgroundColor: color });
        else if (activeColorProp === 'border') onUpdate({ ...itemToRender, border: { ...itemToRender.border, color } });
    };

    const renderFontView = () => (
        <div className="animate-in slide-in-from-right duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-2 border-b border-gray-100 mb-4 -mx-1 px-1 pt-0">
                <button onClick={() => setView('main')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium mb-3">
                    <ChevronLeft size={12} /> Back
                </button>
                <div className="relative">
                    <input type="text" placeholder="Search fonts" className="w-full bg-gray-100 border-none rounded-lg py-2 px-3 text-xs font-medium focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
            </div>
            <div className="space-y-1">
                {FONTS.map(font => (
                    <button
                        key={font.name}
                        onClick={() => onUpdate({ ...itemToRender, fontFamily: font.family })}
                        className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group ${itemToRender.fontFamily === font.family ? 'bg-violet-50 text-violet-700' : 'text-gray-700'}`}
                    >
                        <span style={{ fontFamily: font.family }} className="text-sm">{font.name}</span>
                        {itemToRender.fontFamily === font.family && <div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderTextEffectsView = () => (
        <div className="animate-in slide-in-from-right duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-2 border-b border-gray-100 mb-4 -mx-1 px-1 pt-0">
                <button onClick={() => setView('main')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium mb-3">
                    <ChevronLeft size={12} /> Back
                </button>
                <h3 className="text-xs font-bold text-gray-800">Style</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {TEXT_EFFECTS.map(effect => (
                    <button
                        key={effect.id}
                        onClick={() => onUpdate({ ...itemToRender, textEffect: effect.id === 'none' ? undefined : { type: effect.id, ...effect } })}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-2 hover:border-violet-300 transition-all ${itemToRender.textEffect?.type === effect.id || (!itemToRender.textEffect && effect.id === 'none') ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-200' : 'border-gray-200 bg-white'}`}
                    >
                        <span className="text-xl font-bold text-gray-800" style={effect.style as any}>{effect.preview}</span>
                        <span className="text-[10px] font-medium text-gray-500">{effect.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderMainAdjust = () => (
        <div className="space-y-6">
            {/* Text Specific Controls */}
            {itemToRender.type === 'text' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('font')} className="flex-1 text-left px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 flex items-center justify-between bg-white">
                            <span className="truncate">{FONTS.find(f => f.family === itemToRender.fontFamily)?.name || 'Inter'}</span>
                            <ChevronLeft size={12} className="-rotate-90 text-gray-400" />
                        </button>
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                            <button onClick={() => onUpdate({ ...itemToRender, fontSize: Math.max(1, (itemToRender.fontSize || 20) - 1) })} className="px-2 py-2 hover:bg-gray-50 text-gray-600 border-r border-gray-100">-</button>
                            <input
                                type="number"
                                value={itemToRender.fontSize}
                                onChange={(e) => onUpdate({ ...itemToRender, fontSize: Number(e.target.value) })}
                                className="w-10 text-center text-sm font-medium outline-none"
                            />
                            <button onClick={() => onUpdate({ ...itemToRender, fontSize: (itemToRender.fontSize || 20) + 1 })} className="px-2 py-2 hover:bg-gray-50 text-gray-600 border-l border-gray-100">+</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-1 bg-gray-100 rounded-lg">
                        <button onClick={() => handleOpenPicker({ stopPropagation: () => { } } as any, itemToRender.color, 'color')} className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-white rounded-md transition-all">
                            <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ background: itemToRender.color }}></div>
                            <span className="text-xs font-bold text-gray-600">Color</span>
                        </button>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onUpdate({ ...itemToRender, fontWeight: itemToRender.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded hover:bg-white transition-all ${itemToRender.fontWeight === 'bold' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}><Bold size={14} /></button>
                            <button onClick={() => onUpdate({ ...itemToRender, fontStyle: itemToRender.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 rounded hover:bg-white transition-all ${itemToRender.fontStyle === 'italic' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}><Italic size={14} /></button>
                            <button onClick={() => onUpdate({ ...itemToRender, textDecoration: itemToRender.textDecoration === 'underline' ? 'none' : 'underline' })} className={`p-1.5 rounded hover:bg-white transition-all ${itemToRender.textDecoration === 'underline' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}><Underline size={14} /></button>
                        </div>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onUpdate({ ...itemToRender, textAlign: 'left' })} className={`p-1.5 rounded hover:bg-white transition-all ${itemToRender.textAlign === 'left' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}><AlignLeft size={14} /></button>
                            <button onClick={() => onUpdate({ ...itemToRender, textAlign: 'center' })} className={`p-1.5 rounded hover:bg-white transition-all ${itemToRender.textAlign === 'center' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}><AlignCenter size={14} /></button>
                            <button onClick={() => onUpdate({ ...itemToRender, textAlign: 'right' })} className={`p-1.5 rounded hover:bg-white transition-all ${itemToRender.textAlign === 'right' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}><AlignRight size={14} /></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Common Tools Grid */}
            <div className="grid grid-cols-4 gap-2">
                {itemToRender.type === 'text' && (
                    <button
                        onClick={() => setView('text-effects')}
                        className="p-2 bg-white border border-gray-100 rounded-lg flex flex-col items-center gap-2 hover:border-violet-300 hover:shadow-sm transition-all group text-center h-full"
                    >
                        <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Wand2 size={16} className="text-gray-600 group-hover:text-violet-600" />
                        </div>
                        <div className="min-w-0 w-full">
                            <p className="text-xs font-bold text-gray-800 truncate">Text Effects</p>
                            <p className="text-[9px] text-gray-500 truncate">Shadows, outline</p>
                        </div>
                    </button>
                )}

                <button
                    onClick={() => setView('animate')}
                    className="p-2 bg-white border border-gray-100 rounded-lg flex flex-col items-center gap-2 hover:border-violet-300 hover:shadow-sm transition-all group text-center h-full"
                >
                    <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <PlayCircle size={16} className="text-gray-600 group-hover:text-violet-600" />
                    </div>
                    <div className="min-w-0 w-full">
                        <p className="text-xs font-bold text-gray-800 truncate">Animate</p>
                        <p className="text-[9px] text-gray-500 truncate">Motion effects</p>
                    </div>
                </button>

                <button
                    onClick={() => setView('adjust')}
                    className="p-2 bg-white border border-gray-100 rounded-lg flex flex-col items-center gap-2 hover:border-violet-300 hover:shadow-sm transition-all group text-center h-full"
                >
                    <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Sliders size={16} className="text-gray-600 group-hover:text-violet-600" />
                    </div>
                    <div className="min-w-0 w-full">
                        <p className="text-xs font-bold text-gray-800 truncate">Adjustments</p>
                        <p className="text-[9px] text-gray-500 truncate">Light, color & more</p>
                    </div>
                </button>

                {itemToRender?.type !== 'text' && (
                    <button
                        onClick={() => setInteractionMode('erase')}
                        className="p-2 bg-white border border-gray-100 rounded-lg flex flex-col items-center gap-2 hover:border-violet-300 hover:shadow-sm transition-all group text-center h-full"
                    >
                        <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Eraser size={16} className="text-gray-600 group-hover:text-violet-600" />
                        </div>
                        <div className="min-w-0 w-full">
                            <p className="text-xs font-bold text-gray-800 truncate">Eraser</p>
                            <p className="text-[9px] text-gray-500 truncate">Remove objects</p>
                        </div>
                    </button>
                )}
            </div>
        </div >
    );

    const renderAnimateView = () => (
        <div className="animate-in slide-in-from-right duration-200 min-h-full pb-20">
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-2 border-b border-gray-100 mb-4 -mx-1 px-1 pt-0">
                <button onClick={() => setView('main')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium mb-3">
                    <ChevronLeft size={12} /> Back
                </button>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['enter', 'exit', 'both'].map((t) => (
                        <button
                            key={t}
                            onClick={() => itemToRender?.animation && onUpdate({ ...itemToRender, animation: { ...itemToRender.animation, timing: t as any } })}
                            disabled={!itemToRender?.animation}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md capitalize transition-all ${itemToRender?.animation?.timing === t || (!itemToRender?.animation?.timing && t === 'both')
                                ? 'bg-white shadow text-violet-700'
                                : 'text-gray-400 hover:text-gray-600'
                                } ${!itemToRender?.animation ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Popular Animation</h3>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {PAGE_ANIMATIONS.map((anim) => (
                        <button
                            key={anim.id}
                            onClick={() => onUpdate({ ...itemToRender, animation: { type: anim.id, category: 'page', timing: itemToRender?.animation?.timing || 'both' } })}
                            className={`flex flex-col items-center p-2 rounded-lg border transition-all group ${itemToRender?.animation?.type === anim.id ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-200' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-base mb-1.5 ${itemToRender?.animation?.type === anim.id ? 'bg-violet-200 text-violet-700' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>
                                {anim.icon}
                            </div>
                            <span className={`text-[9px] font-bold ${itemToRender?.animation?.type === anim.id ? 'text-violet-700' : 'text-gray-600'}`}>{anim.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Normal Animation</h3>
                </div>
                {itemToRender?.animation && (
                    <div className="mb-4 p-2 bg-violet-50 rounded-lg flex items-center justify-between border border-violet-100">
                        <span className="text-[10px] font-bold text-violet-700">Current: {itemToRender.animation.type.replace('-', ' ')}</span>
                        <button
                            onClick={() => onUpdate({ ...itemToRender, animation: undefined })}
                            className="text-[9px] text-red-500 hover:bg-red-50 px-2 py-1 rounded border border-red-100 bg-white"
                        >
                            Remove
                        </button>
                    </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                    {PHOTO_ANIMATIONS.map((anim) => (
                        <button
                            key={anim.id}
                            onClick={() => onUpdate({ ...itemToRender, animation: { type: anim.id, category: 'photo', timing: itemToRender?.animation?.timing || 'both' } })}
                            className={`flex flex-col items-center p-2 rounded-lg border transition-all group ${itemToRender?.animation?.type === anim.id ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-200' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-base mb-1.5 ${itemToRender?.animation?.type === anim.id ? 'bg-violet-200 text-violet-700' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>
                                {anim.icon}
                            </div>
                            <span className={`text-[9px] font-bold ${itemToRender?.animation?.type === anim.id ? 'text-violet-700' : 'text-gray-600'}`}>{anim.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderColorView = () => (
        <div className="animate-in slide-in-from-right duration-200 pb-24 relative min-h-full">
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-40 pb-3 border-b border-gray-100 mb-3 -mx-1 px-1 pt-0">
                <button onClick={() => setView('main')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium mb-2">
                    <ChevronLeft size={12} /> Back to effects
                </button>
            </div>

            {showColorPicker && renderColorPickerPopup()}

            <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2 mb-2">
                    Colors
                </h3>
                <div className="grid grid-cols-5 gap-2 relative">
                    <button
                        onClick={(e) => handleOpenPicker(e, '#ffffff', 'background')}
                        className="w-full aspect-square rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors relative group"
                    >
                        <div className="w-full h-full rounded-lg p-0.5 bg-gradient-to-br from-red-400 via-green-400 to-blue-400">
                            <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                        </div>
                    </button>

                    {DEFAULT_DOCUMENT_COLORS.map((color) => (
                        <div key={color} className="relative group w-full aspect-square">
                            <button
                                onClick={() => selectPresetColor(color)}
                                className={`w-full h-full rounded-lg border border-gray-200 shadow-sm transition-transform ${itemToRender?.src === color ? 'ring-2 ring-violet-500 ring-offset-1' : ''}`}
                                style={{ background: color }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-px bg-gray-100 w-full my-3"></div>

            <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-800 mb-2">Gradients</h3>
                <div className="grid grid-cols-5 gap-2">
                    {GRADIENT_COLORS.map((color, idx) => (
                        <button
                            key={idx}
                            onClick={() => selectPresetColor(color)}
                            className={`w-full aspect-square rounded-lg border border-gray-200 shadow-sm hover:scale-110 transition-transform ${itemToRender?.src === color ? 'ring-2 ring-violet-500 ring-offset-1' : ''}`}
                            style={{ background: color }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    const renderEraserView = () => (
        <div className="animate-in slide-in-from-right duration-200 flex flex-col h-full pt-2">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-800">Eraser Settings</h3>
                <button onClick={() => setInteractionMode('none')} className="text-xs font-bold text-violet-600 hover:text-violet-700">Exit</button>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-600">Brush Size</label>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{eraserSettings.size}px</span>
                </div>
                <input
                    type="range" min="1" max="100"
                    value={eraserSettings.size}
                    onChange={(e) => setEraserSettings({ ...eraserSettings, size: Number(e.target.value) })}
                    className="w-full accent-violet-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <label className="text-xs text-gray-700 font-medium">Compare Original</label>
                <button
                    onClick={() => setEraserSettings({ ...eraserSettings, showOriginal: !eraserSettings.showOriginal })}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${eraserSettings.showOriginal ? 'bg-violet-600' : 'bg-gray-300'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${eraserSettings.showOriginal ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </button>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button
                    onClick={() => itemToRender && onUpdate({ ...itemToRender, maskImage: undefined })}
                    className="py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Reset
                </button>
                <button
                    onClick={() => setInteractionMode('none')}
                    className="py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                    Done
                </button>
            </div>
        </div>
    );

    const getHeaderTitle = () => {
        switch (view) {
            case 'main': return 'Effects & Styles';
            case 'adjust': return 'Adjustments';
            case 'color': return 'Colors';
            case 'animate': return 'Animate';
            case 'eraser': return 'Magic Eraser';
            case 'text-effects': return 'Text Effects';
            case 'font': return 'Font';
            default: return 'Edit';
        }
    };

    return (
        <div className={`bg-white h-full border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative z-20 ${isOpen ? 'w-80' : 'w-0 opacity-0'}`}>
            <div className="w-80 h-full flex flex-col overflow-x-hidden">
                {itemToRender && (
                    <>
                        {view !== 'eraser' && (
                            <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0 bg-white z-10">
                                <span className="font-bold text-gray-800 capitalize text-lg tracking-tight">{getHeaderTitle()}</span>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        <div className={`flex-1 overflow-y-auto custom-scrollbar relative ${view === 'eraser' ? 'p-5' : 'p-5'}`}>
                            {view === 'main' && (
                                <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                                    {renderMainAdjust()}
                                    {/* Hide Filters for Text */}
                                    {itemToRender.type !== 'text' && (
                                        <div className="mb-10">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Filters</h3>
                                                <button className="text-violet-600 text-[10px] font-bold hover:underline">See all</button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {FILTERS.map(f => (
                                                    <div key={f.id} className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => onUpdate({ ...itemToRender, filter: f.id, filterIntensity: 50 })}>
                                                        <div className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${itemToRender.filter === f.id ? 'border-violet-600 ring-2 ring-violet-100' : 'border-transparent hover:border-gray-200'}`}>
                                                            <img src={itemToRender.thumbnail || itemToRender.src} className="w-full h-full object-cover" style={{ filter: f.style }} />
                                                            {itemToRender.filter === f.id && (
                                                                <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                                                                    <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[9px] font-bold truncate w-full text-center ${itemToRender.filter === f.id ? 'text-violet-600' : 'text-gray-400'}`}>{f.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {view === 'adjust' && (
                                <div className="animate-in slide-in-from-right duration-200">
                                    <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 border-b border-gray-100 mb-4 -mx-1 px-1 pt-0">
                                        <button onClick={() => setView('main')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium mb-3">
                                            <ChevronLeft size={12} /> Back
                                        </button>

                                        <div className="space-y-4 mb-4">
                                            <div className="flex items-center gap-2 text-gray-800 font-bold text-xs">
                                                <Palette size={14} /> White Balance
                                            </div>
                                            <div className="space-y-3 pl-1">
                                                <div className="space-y-1"><div className="flex justify-between"><span className="text-xs text-gray-600">Temp</span><span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{adjustments.temperature}</span></div><input type="range" min="-100" max="100" value={adjustments.temperature} onChange={(e) => handleAdjustmentChange('temperature', Number(e.target.value))} className="w-full accent-violet-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div>
                                                <div className="space-y-1"><div className="flex justify-between"><span className="text-xs text-gray-600">Tint</span><span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{adjustments.tint}</span></div><input type="range" min="-100" max="100" value={adjustments.tint} onChange={(e) => handleAdjustmentChange('tint', Number(e.target.value))} className="w-full accent-violet-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-4">
                                            <div className="flex items-center gap-2 text-gray-800 font-bold text-xs"><Sparkles size={14} /> Light</div>
                                            <div className="space-y-3 pl-1">
                                                {['brightness', 'contrast', 'highlights', 'shadows', 'whites', 'blacks'].map((key) => (
                                                    <div key={key} className="space-y-1"><div className="flex justify-between capitalize"><span className="text-xs text-gray-600">{key}</span><span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{adjustments[key as keyof Adjustments]}</span></div><input type="range" min="-100" max="100" value={adjustments[key as keyof Adjustments]} onChange={(e) => handleAdjustmentChange(key as keyof Adjustments, Number(e.target.value))} className="w-full accent-violet-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div>
                                                ))}
                                            </div>
                                        </div>

                                        <button onClick={() => onUpdate({ ...itemToRender, adjustments: DEFAULT_ADJUSTMENTS })} className="w-full py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            )}
                            {view === 'color' && renderColorView()}
                            {view === 'text-effects' && renderTextEffectsView()}
                            {view === 'eraser' && renderEraserView()}
                            {view === 'animate' && renderAnimateView()}
                            {view === 'font' && renderFontView()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditPanel;
