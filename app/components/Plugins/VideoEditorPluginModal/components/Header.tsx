import React, { useState, useRef, useEffect } from 'react';
import {
    Undo, Redo, ZoomIn, ZoomOut, Monitor, Smartphone, Tablet,
    Maximize, Minimize, Download, Share2, Settings, ChevronDown,
    Menu, Save, FolderOpen, FilePlus, Trash2, Copy, Check
} from 'lucide-react';
import { CanvasDimension } from '../types';

interface HeaderProps {
    projectName: string;
    setProjectName: (name: string) => void;
    dimension: CanvasDimension;
    setDimension: (dim: CanvasDimension) => void;
    scalePercent: number;
    setScalePercent: (scale: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onSave: () => void;
    onLoad: () => void; // Placeholder for load
    onNew: () => void;
    onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({
    projectName, setProjectName, dimension, setDimension,
    scalePercent, setScalePercent, onUndo, onRedo, canUndo, canRedo,
    onSave, onLoad, onNew, onExport
}) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [showResizeMenu, setShowResizeMenu] = useState(false);
    const fileMenuRef = useRef<HTMLDivElement>(null);
    const resizeMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
                setShowFileMenu(false);
            }
            if (resizeMenuRef.current && !resizeMenuRef.current.contains(event.target as Node)) {
                setShowResizeMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const PRESET_DIMENSIONS = [
        { name: 'YouTube (16:9)', width: 1920, height: 1080, icon: <Monitor size={14} /> },
        { name: 'Instagram Story (9:16)', width: 1080, height: 1920, icon: <Smartphone size={14} /> },
        { name: 'Instagram Post (1:1)', width: 1080, height: 1080, icon: <Smartphone size={14} /> },
        { name: 'TikTok (9:16)', width: 1080, height: 1920, icon: <Smartphone size={14} /> },
        { name: 'Twitter (16:9)', width: 1280, height: 720, icon: <Monitor size={14} /> },
    ];

    return (
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 relative shadow-sm">
            {/* Left: File Menu & Project Name */}
            <div className="flex items-center gap-4">
                <div className="relative" ref={fileMenuRef}>
                    <button
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors flex items-center gap-1"
                    >
                        <Menu size={20} />
                        <span className="text-xs font-bold">File</span>
                    </button>

                    {showFileMenu && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button onClick={() => { onNew(); setShowFileMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-3 transition-colors">
                                <FilePlus size={16} /> New Project
                            </button>
                            <button onClick={() => { onLoad(); setShowFileMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-3 transition-colors">
                                <FolderOpen size={16} /> Open Project
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button onClick={() => { onSave(); setShowFileMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-3 transition-colors">
                                <Save size={16} /> Save
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-3 transition-colors">
                                <Copy size={16} /> Make a copy
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                                <Trash2 size={16} /> Move to Trash
                            </button>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-200"></div>

                {isEditingName ? (
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                        autoFocus
                        className="text-sm font-bold text-gray-800 border-b-2 border-violet-500 outline-none px-1 py-0.5 bg-transparent"
                    />
                ) : (
                    <div
                        onClick={() => setIsEditingName(true)}
                        className="text-sm font-bold text-gray-800 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-2 group"
                    >
                        {projectName}
                        <span className="opacity-0 group-hover:opacity-100 text-gray-400"><Settings size={12} /></span>
                    </div>
                )}
            </div>

            {/* Center: Canvas Controls (Resize, Undo/Redo) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="relative" ref={resizeMenuRef}>
                    <button
                        onClick={() => setShowResizeMenu(!showResizeMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold text-gray-700 transition-colors"
                    >
                        {dimension.width} x {dimension.height}
                        <ChevronDown size={12} />
                    </button>

                    {showResizeMenu && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resize Canvas</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={dimension.width}
                                        onChange={(e) => setDimension({ ...dimension, width: Number(e.target.value), name: 'Custom' })}
                                        className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-center focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                                    />
                                    <span className="text-gray-400">x</span>
                                    <input
                                        type="number"
                                        value={dimension.height}
                                        onChange={(e) => setDimension({ ...dimension, height: Number(e.target.value), name: 'Custom' })}
                                        className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-center focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="py-1">
                                {PRESET_DIMENSIONS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => { setDimension({ width: preset.width, height: preset.height, name: preset.name }); setShowResizeMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center justify-between group transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 group-hover:text-violet-500">{preset.icon}</span>
                                            <span>{preset.name}</span>
                                        </div>
                                        {(dimension.width === preset.width && dimension.height === preset.height) && <Check size={12} className="text-violet-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                <div className="flex items-center bg-gray-100 rounded-full p-0.5">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-1.5 rounded-full transition-colors ${canUndo ? 'hover:bg-white text-gray-700 shadow-sm' : 'text-gray-300 cursor-not-allowed'}`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={14} />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-1.5 rounded-full transition-colors ${canRedo ? 'hover:bg-white text-gray-700 shadow-sm' : 'text-gray-300 cursor-not-allowed'}`}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={14} />
                    </button>
                </div>
            </div>

            {/* Right: Zoom & Export */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                    <button onClick={() => setScalePercent(Math.max(0.1, scalePercent - 0.1))} className="p-1 hover:bg-white hover:shadow-sm rounded text-gray-500 transition-all"><ZoomOut size={14} /></button>
                    <span className="text-xs font-bold text-gray-600 w-8 text-center">{Math.round(scalePercent * 100)}%</span>
                    <button onClick={() => setScalePercent(Math.min(3, scalePercent + 0.1))} className="p-1 hover:bg-white hover:shadow-sm rounded text-gray-500 transition-all"><ZoomIn size={14} /></button>
                </div>

                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
                >
                    <Download size={14} />
                    Export
                </button>
            </div>
        </div>
    );
};

export default Header;
