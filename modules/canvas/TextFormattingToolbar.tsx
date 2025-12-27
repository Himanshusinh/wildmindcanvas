import React from 'react';
import { CanvasTextState } from '@/modules/canvas-overlays/types';
import { Bold, Italic, Underline, Palette, Type } from 'lucide-react';

interface TextFormattingToolbarProps {
    selectedTextState: CanvasTextState;
    onChange: (id: string, updates: Partial<CanvasTextState>) => void;
    position: { x: number; y: number };
}

const FONT_ASSETS = [
    { label: 'Inter', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Palatino', value: 'Palatino' },
    { label: 'Garamond', value: 'Garamond' },
    { label: 'Bookman', value: 'Bookman' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS' },
    { label: 'Arial Black', value: 'Arial Black' },
    { label: 'Impact', value: 'Impact' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Open Sans', value: 'Open Sans' },
    { label: 'Lato', value: 'Lato' },
    { label: 'Poppins', value: 'Poppins' },
    { label: 'Playfair Display', value: 'Playfair Display' },
    { label: 'Merriweather', value: 'Merriweather' },
];

const COLORS = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
];

export const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({
    selectedTextState,
    onChange,
    position,
}) => {
    // Stop propagation to prevent canvas click from deselecting
    const handlePointerDown = (e: React.PointerEvent | React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    // State for font dropdown
    const [isFontDropdownOpen, setIsFontDropdownOpen] = React.useState(false);

    const applyStyle = (command: string, value?: string) => {
        // Since toolbar is outside `iframe` or shadowRoot, `document` refers to main page.
        const selection = window.getSelection();

        // Check if selection is within our editing div? 
        // We can't easily check 'editing div' reference here easily without context, 
        // but checking if selection is NOT collapsed is a good proxy for "user selected something to edit".
        // Also check if focusNode is editable or inside contentEditable
        let isInsideEditable = false;
        if (selection && selection.anchorNode) {
            const castedNode = selection.anchorNode as Node;
            const element = castedNode.nodeType === Node.ELEMENT_NODE ? castedNode as Element : castedNode.parentElement;
            if (element && element.closest('[contenteditable="true"]')) {
                isInsideEditable = true;
            }
        }

        if (isInsideEditable && selection && !selection.isCollapsed) {
            // Rich Text Mode (Partial Selection)
            document.execCommand('styleWithCSS', false, 'true');
            document.execCommand(command, false, value);
        } else {
            // Whole Node text update (Fallback)
            if (command === 'bold') {
                const newWeight = selectedTextState.fontWeight === 'bold' ? 'normal' : 'bold';
                onChange(selectedTextState.id, { fontWeight: newWeight });
            } else if (command === 'italic') {
                const newStyle = selectedTextState.fontStyle === 'italic' ? 'normal' : 'italic';
                onChange(selectedTextState.id, { fontStyle: newStyle });
            } else if (command === 'underline') {
                const newDecor = selectedTextState.textDecoration === 'underline' ? 'none' : 'underline';
                onChange(selectedTextState.id, { textDecoration: newDecor });
            } else if (command === 'foreColor') {
                onChange(selectedTextState.id, { color: value });
            } else if (command === 'fontName') {
                onChange(selectedTextState.id, { fontFamily: value });
            }
        }
    };

    const toggleBold = () => applyStyle('bold');
    const toggleItalic = () => applyStyle('italic');
    const toggleUnderline = () => applyStyle('underline');
    const changeColor = (color: string) => applyStyle('foreColor', color);
    const changeFont = (fontName: string) => {
        applyStyle('fontName', fontName);
        setIsFontDropdownOpen(false);
    };

    return (
        <div
            id="text-formatting-toolbar"
            className="absolute z-50 flex items-center gap-2 p-2 bg-zinc-900/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10"
            style={{
                left: position.x,
                top: position.y - 60, // Position above the text
                transform: 'translate(-50%, -100%)', // Center horizontally, put upwards
                touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onMouseDown={handlePointerDown}
        >
            {/* Font Family Custom Dropdown */}
            <div className="relative group">
                <button
                    onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                    className="flex items-center justify-between w-32 bg-zinc-800 text-white text-xs border border-white/10 rounded px-2 py-1 outline-none hover:bg-zinc-700 transition-colors truncate"
                    title="Font Family"
                >
                    <span className="truncate" style={{ fontFamily: selectedTextState.fontFamily || 'Inter' }}>
                        {FONT_ASSETS.find(f => f.value === selectedTextState.fontFamily)?.label || selectedTextState.fontFamily || 'Inter'}
                    </span>
                    <span className="ml-1 opacity-50">▼</span>
                </button>

                {isFontDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-zinc-900 border border-white/10 rounded-lg shadow-xl py-1 grid grid-cols-1 gap-0.5 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                        {FONT_ASSETS.map(font => (
                            <button
                                key={font.value}
                                onClick={() => changeFont(font.value)}
                                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 transition-colors truncate"
                                style={{ fontFamily: font.value }}
                            >
                                {font.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="w-px h-4 bg-white/20 mx-1"></div>

            {/* Style Toggles */}
            <button
                onClick={toggleBold}
                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${selectedTextState.fontWeight === 'bold' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-300'}`}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={toggleItalic}
                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${selectedTextState.fontStyle === 'italic' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-300'}`}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={toggleUnderline}
                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${selectedTextState.textDecoration === 'underline' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-300'}`}
                title="Underline"
            >
                <Underline size={16} />
            </button>

            <div className="w-px h-4 bg-white/20 mx-1"></div>

            {/* Color Picker */}
            <div className="relative group/color">
                <button
                    className="p-1.5 rounded hover:bg-white/10 transition-colors text-zinc-300"
                    title="Text Color"
                >
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: selectedTextState.color }}></div>
                </button>

                {/* Popover for colors */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl grid grid-cols-4 gap-1 opacity-0 invisible group-hover/color:opacity-100 group-hover/color:visible transition-all duration-200 w-32">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => changeColor(c)}
                            className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform"
                            style={{ backgroundColor: c }}
                            title={c}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
