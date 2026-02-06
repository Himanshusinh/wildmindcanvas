import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Palette, Baseline } from 'lucide-react';

interface RichTextToolbarProps {
    fontFamily: string;
    fontSize: number;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    fill: string;
    align: string;
    backgroundColor?: string;
    onChange: (updates: any) => void;
    position: { x: number; y: number };
}

const FONT_FAMILIES = [
    { label: 'Inter', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Poppins', value: 'Poppins' },
    { label: 'Playfair Display', value: 'Playfair Display' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
];

const COLORS = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
    'transparent'
];

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
    fontFamily,
    fontSize,
    fontWeight = 'normal',
    fontStyle = 'normal',
    textDecoration = 'none',
    fill,
    align,
    backgroundColor = 'transparent',
    onChange,
    position,
}) => {
    const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);

    // Smart placement state
    const [fontPlacement, setFontPlacement] = useState<'top' | 'bottom'>('top');
    const [colorPlacement, setColorPlacement] = useState<'top' | 'bottom'>('top');
    const [bgPlacement, setBgPlacement] = useState<'top' | 'bottom'>('top');

    const toolbarRef = useRef<HTMLDivElement>(null);

    const preventBlur = (e: React.MouseEvent) => {
        // Prevent the editor from losing focus when clicking on the toolbar
        e.preventDefault();
    };

    const handleToggleFont = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isFontDropdownOpen && toolbarRef.current) {
            const rect = toolbarRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // Dropdown height is ~256px (max-h-64)
            setFontPlacement(spaceBelow < 260 ? 'top' : 'bottom');
        }
        setIsFontDropdownOpen(!isFontDropdownOpen);
        setIsColorPickerOpen(false);
        setIsBgPickerOpen(false);
    };

    const handleToggleColor = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isColorPickerOpen && toolbarRef.current) {
            const rect = toolbarRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // Color picker height is ~140px
            setColorPlacement(spaceBelow < 150 ? 'top' : 'bottom');
        }
        setIsColorPickerOpen(!isColorPickerOpen);
        setIsFontDropdownOpen(false);
        setIsBgPickerOpen(false);
    };

    const handleToggleBg = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isBgPickerOpen && toolbarRef.current) {
            const rect = toolbarRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setBgPlacement(spaceBelow < 150 ? 'top' : 'bottom');
        }
        setIsBgPickerOpen(!isBgPickerOpen);
        setIsFontDropdownOpen(false);
        setIsColorPickerOpen(false);
    };

    return (
        <div
            ref={toolbarRef}
            className="absolute z-[15000] flex items-center gap-1 p-1 bg-zinc-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 select-none animate-in fade-in zoom-in duration-200"
            style={{
                left: position.x,
                top: position.y - 12,
                transform: 'translate(-50%, -100%)',
                minWidth: 'max-content',
                maxWidth: '90vw',
                pointerEvents: 'auto',
                fontSize: '12px'
            }}
            onMouseDown={preventBlur}
            onWheel={(e) => e.stopPropagation()}
        >
            {/* Font Family Dropdown */}
            <div className="relative">
                <button
                    onMouseDown={preventBlur}
                    onClick={handleToggleFont}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white transition-all duration-200 cursor-pointer"
                >
                    <span className="text-[11px] font-medium w-20 text-left truncate" style={{ fontFamily }}>
                        {FONT_FAMILIES.find(f => f.value === fontFamily)?.label || fontFamily}
                    </span>
                    <Type size={12} className="opacity-50 pointer-events-none" />
                </button>
                {isFontDropdownOpen && (
                    <div
                        className={`absolute left-0 w-48 max-h-64 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-1 z-50 pointer-events-auto ${fontPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                            }`}
                        onMouseDown={preventBlur}
                        onWheel={(e) => e.stopPropagation()}
                    >
                        {FONT_FAMILIES.map(font => (
                            <button
                                key={font.value}
                                onMouseDown={preventBlur}
                                onClick={() => {
                                    onChange({ fontFamily: font.value });
                                    setIsFontDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${fontFamily === font.value ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-300'}`}
                                style={{ fontFamily: font.value }}
                            >
                                {font.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="w-px h-6 bg-white/10 mx-1"></div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-1 px-1">
                <button
                    onMouseDown={preventBlur}
                    onClick={() => {
                        onChange({ fontSize: Math.max(8, fontSize - 2) });
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                    <span className="text-lg leading-none pointer-events-none">-</span>
                </button>
                <div className="w-8 text-center text-[11px] font-medium text-white">
                    {fontSize}
                </div>
                <button
                    onMouseDown={preventBlur}
                    onClick={() => {
                        onChange({ fontSize: Math.min(200, fontSize + 2) });
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                    <span className="text-lg leading-none pointer-events-none">+</span>
                </button>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1"></div>

            {/* Formatting Tools */}
            <div className="flex items-center gap-0.5">
                <button
                    onMouseDown={preventBlur}
                    onClick={() => {
                        onChange({ fontWeight: fontWeight === 'bold' ? 'normal' : 'bold' });
                    }}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${fontWeight === 'bold' ? 'bg-blue-500/20 text-blue-400' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    title="Bold"
                >
                    <Bold size={14} className="pointer-events-none" />
                </button>
                <button
                    onMouseDown={preventBlur}
                    onClick={() => {
                        onChange({ fontStyle: fontStyle === 'italic' ? 'normal' : 'italic' });
                    }}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${fontStyle === 'italic' ? 'bg-blue-500/20 text-blue-400' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    title="Italic"
                >
                    <Italic size={14} className="pointer-events-none" />
                </button>
                <button
                    onMouseDown={preventBlur}
                    onClick={() => {
                        onChange({ textDecoration: textDecoration === 'underline' ? 'none' : 'underline' });
                    }}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${textDecoration === 'underline' ? 'bg-blue-500/20 text-blue-400' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    title="Underline"
                >
                    <Underline size={14} className="pointer-events-none" />
                </button>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1"></div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
                {[
                    { icon: AlignLeft, value: 'left', label: 'Left' },
                    { icon: AlignCenter, value: 'center', label: 'Center' },
                    { icon: AlignRight, value: 'right', label: 'Right' }
                ].map(({ icon: Icon, value, label }) => (
                    <button
                        key={value}
                        onMouseDown={preventBlur}
                        onClick={() => onChange({ align: value })}
                        className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${align === value ? 'bg-blue-500/20 text-blue-400' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                        title={`Align ${label}`}
                    >
                        <Icon size={14} className="pointer-events-none" />
                    </button>
                ))}
            </div>

            <div className="w-px h-6 bg-white/10 mx-1"></div>

            {/* Text Color */}
            <div className="relative">
                <button
                    onMouseDown={preventBlur}
                    onClick={handleToggleColor}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
                    title="Text Color"
                >
                    <Palette size={14} className="pointer-events-none" />
                    <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: fill === 'transparent' ? '#fff' : fill }}></div>
                </button>
                {isColorPickerOpen && (
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl grid grid-cols-4 gap-3 z-50 pointer-events-auto min-w-[160px] ${colorPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                            }`}
                        onMouseDown={preventBlur}
                        onWheel={(e) => e.stopPropagation()}
                    >
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onMouseDown={preventBlur}
                                onClick={() => {
                                    onChange({ fill: c });
                                    setIsColorPickerOpen(false);
                                }}
                                className="w-8 h-8 rounded-full border border-white/10 hover:scale-110 transition-transform flex items-center justify-center overflow-hidden cursor-pointer"
                                style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}
                            >
                                {c === 'transparent' && <div className="w-full h-px bg-red-500 rotate-45 pointer-events-none"></div>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Background Color */}
            <div className="relative">
                <button
                    onMouseDown={preventBlur}
                    onClick={handleToggleBg}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
                    title="Background Color"
                >
                    <Baseline size={14} className="pointer-events-none" />
                    <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: backgroundColor || 'transparent', border: backgroundColor === 'transparent' ? '1px solid rgba(255,255,255,0.2)' : 'none' }}></div>
                </button>
                {isBgPickerOpen && (
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl grid grid-cols-4 gap-3 z-50 pointer-events-auto min-w-[160px] ${bgPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                            }`}
                        onMouseDown={preventBlur}
                        onWheel={(e) => e.stopPropagation()}
                    >
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onMouseDown={preventBlur}
                                onClick={() => {
                                    onChange({ backgroundColor: c });
                                    setIsBgPickerOpen(false);
                                }}
                                className="w-8 h-8 rounded-full border border-white/10 hover:scale-110 transition-transform flex items-center justify-center overflow-hidden cursor-pointer"
                                style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}
                            >
                                {c === 'transparent' && <div className="w-full h-px bg-red-500 rotate-45 pointer-events-none"></div>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
