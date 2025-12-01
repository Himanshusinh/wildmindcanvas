import React, { useState, useRef, useEffect } from 'react';
import {
    Menu, Undo2, Redo2, Cloud, Share2,
    ChevronDown, FileText, Download, Trash2,
    Copy, FolderOpen, Plus, Play, Minus, ChevronRight
} from 'lucide-react';
import { CanvasDimension, RESIZE_OPTIONS } from '../types';

interface HeaderProps {
    projectName: string;
    setProjectName: (name: string) => void;
    onToggleProjectMenu: () => void;
    currentDimension: CanvasDimension;
    onResize: (dim: CanvasDimension) => void;
    scalePercent: number;
    setScalePercent: (scale: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onCreateNew: (dim: CanvasDimension) => void;
    onOpenProject: () => void; // This opens the drawer (Open Recent)
    onSaveProject: () => void;
    onLoadProject: () => void;
    onMakeCopy: () => void;
    onMoveToTrash: () => void;
}

const NEW_PROJECT_OPTIONS: CanvasDimension[] = [
    { name: '16:9 (Widescreen)', width: 1920, height: 1080 },
    { name: '9:16 (Portrait)', width: 1080, height: 1920 },
    { name: '1:1 (Instagram)', width: 1080, height: 1080 },
    { name: '4:3 (Standard)', width: 1440, height: 1080 },
    { name: '4:5 (Vertical)', width: 1080, height: 1350 },
    { name: '21:9 (Cinema)', width: 2560, height: 1080 },
    { name: '3:4 (Business)', width: 1080, height: 1440 },
];

const Header: React.FC<HeaderProps> = ({
    projectName,
    setProjectName,
    onToggleProjectMenu,
    currentDimension,
    onResize,
    scalePercent,
    setScalePercent,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onCreateNew,
    onOpenProject,
    onSaveProject,
    onLoadProject,
    onMakeCopy,
    onMoveToTrash
}) => {
    const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
    const [isResizeMenuOpen, setIsResizeMenuOpen] = useState(false);
    const [isNewProjectSubmenuOpen, setIsNewProjectSubmenuOpen] = useState(false);
    const fileMenuRef = useRef<HTMLDivElement>(null);
    const resizeMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
                setIsFileMenuOpen(false);
                setIsNewProjectSubmenuOpen(false);
            }
            if (resizeMenuRef.current && !resizeMenuRef.current.contains(event.target as Node)) {
                setIsResizeMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-14 bg-[#18181b] text-gray-200 flex items-center justify-between px-4 select-none z-50 relative border-b border-gray-800">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleProjectMenu}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                    <Menu size={20} />
                </button>

                <div className="relative" ref={fileMenuRef}>
                    <button
                        className="px-3 py-1.5 hover:bg-white/10 rounded-lg font-medium text-sm flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
                        onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                    >
                        File <ChevronDown size={14} />
                    </button>

                    {isFileMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-[#27272a] text-gray-200 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-700 mb-2">
                                <p className="font-semibold text-sm truncate text-white">{projectName}</p>
                                <p className="text-xs text-gray-400">{currentDimension.width} x {currentDimension.height} px</p>
                            </div>
                            <div className="flex flex-col relative">
                                <div
                                    className="relative"
                                    onMouseEnter={() => setIsNewProjectSubmenuOpen(true)}
                                    onMouseLeave={() => setIsNewProjectSubmenuOpen(false)}
                                >
                                    <button
                                        className="w-full px-4 py-2 text-sm hover:bg-white/5 flex items-center justify-between text-left"
                                    >
                                        <div className="flex items-center gap-3"><Plus size={16} /> Create new project</div>
                                        <ChevronRight size={14} />
                                    </button>

                                    {isNewProjectSubmenuOpen && (
                                        <div className="absolute top-0 left-full ml-1 w-56 bg-[#27272a] text-gray-200 rounded-lg shadow-xl border border-gray-700 py-2 z-50 max-h-96 overflow-y-auto">
                                            {NEW_PROJECT_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.name}
                                                    className="w-full px-4 py-2 text-sm hover:bg-white/5 text-left flex justify-between items-center"
                                                    onClick={() => {
                                                        onCreateNew(opt);
                                                        setIsFileMenuOpen(false);
                                                        setIsNewProjectSubmenuOpen(false);
                                                    }}
                                                >
                                                    <span>{opt.name}</span>
                                                    <span className="text-xs text-gray-500 ml-2">{opt.width}x{opt.height}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="px-4 py-2 text-sm hover:bg-white/5 flex items-center gap-3 text-left"
                                    onClick={() => { onLoadProject(); setIsFileMenuOpen(false); }}
                                >
                                    <FolderOpen size={16} /> Open project
                                </button>
                                <button
                                    className="px-4 py-2 text-sm hover:bg-white/5 flex items-center gap-3 text-left"
                                    onClick={() => { onOpenProject(); setIsFileMenuOpen(false); }}
                                >
                                    <FolderOpen size={16} /> Open Recent
                                </button>
                                <button className="px-4 py-2 text-sm hover:bg-white/5 flex items-center gap-3 text-left">
                                    <FolderOpen size={16} /> Import files
                                </button>
                                <div className="h-px bg-gray-700 my-1"></div>
                                <button
                                    className="px-4 py-2 text-sm hover:bg-white/5 flex items-center gap-3 text-left"
                                    onClick={() => { onSaveProject(); setIsFileMenuOpen(false); }}
                                >
                                    <Cloud size={16} /> Save
                                </button>
                                <button
                                    className="px-4 py-2 text-sm hover:bg-white/5 flex items-center gap-3 text-left"
                                    onClick={() => { onMakeCopy(); setIsFileMenuOpen(false); }}
                                >
                                    <Copy size={16} /> Make a copy
                                </button>
                                <div className="h-px bg-gray-700 my-1"></div>
                                <button
                                    className="px-4 py-2 text-sm hover:bg-red-900/20 text-red-400 flex items-center gap-3 text-left"
                                    onClick={() => { onMoveToTrash(); setIsFileMenuOpen(false); }}
                                >
                                    <Trash2 size={16} /> Move to trash
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={resizeMenuRef}>
                    <button
                        onClick={() => setIsResizeMenuOpen(!isResizeMenuOpen)}
                        className="px-3 py-1.5 hover:bg-white/10 rounded-lg font-medium text-sm flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                    >
                        Resize
                    </button>

                    {isResizeMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-[#27272a] text-gray-200 rounded-lg shadow-xl border border-gray-700 py-2 z-50 max-h-96 overflow-y-auto">
                            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Suggested
                            </div>
                            {RESIZE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.name}
                                    onClick={() => {
                                        onResize(opt);
                                        setIsResizeMenuOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-sm hover:bg-white/5 flex justify-between items-center ${opt.name === currentDimension.name ? 'bg-violet-500/10 text-violet-400' : ''}`}
                                >
                                    <span>{opt.name}</span>
                                    <span className="text-xs text-gray-500">{opt.width} x {opt.height}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-700 mx-2 hidden md:block"></div>

                <div className="flex items-center gap-1 hidden md:flex">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <Undo2 size={18} />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <Redo2 size={18} />
                    </button>
                </div>
            </div>

            {/* Center Section - Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 max-w-xs hidden lg:block">
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-transparent border border-transparent hover:border-gray-700 focus:border-violet-500 rounded px-3 py-1.5 text-center text-sm font-medium focus:outline-none w-64 transition-all text-gray-300 placeholder-gray-600"
                />
            </div>

            {/* Right Section - Simplified */}
            <div className="flex items-center gap-3">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-[#27272a] rounded-lg p-1 border border-gray-700 mr-2">
                    <button
                        onClick={() => setScalePercent(Math.max(10, (scalePercent || 100) - 10))}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                    >
                        <Minus size={14} />
                    </button>

                    <span className="text-xs font-medium w-12 text-center text-gray-300">
                        {scalePercent === 0 ? 'Fit' : `${scalePercent}%`}
                    </span>

                    <button
                        onClick={() => setScalePercent(Math.min(200, (scalePercent || 100) + 10))}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                    >
                        <Plus size={14} />
                    </button>

                    <div className="w-px h-4 bg-gray-700 mx-1"></div>

                    <button
                        onClick={() => setScalePercent(0)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${scalePercent === 0 ? 'bg-violet-500/20 text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        Fit
                    </button>
                </div>

                <button className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    Export
                </button>
            </div>
        </header>
    );
};

export default Header;
