import React, { useState } from 'react';
import { X, ArrowRight, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { Transition, TransitionType } from '../types';

interface TransitionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (transition: Transition) => void;
    onApplyToAll: (transition: Transition) => void;
    selectedTransition?: Transition | null;
    onPreview: (transition: Transition | null) => void;
}

const TransitionPanel: React.FC<TransitionPanelProps> = ({
    isOpen, onClose, onSelect, onApplyToAll, selectedTransition, onPreview
}) => {
    const [duration, setDuration] = useState(0.5);
    const [direction, setDirection] = useState<'left' | 'right' | 'up' | 'down'>('left');

    const TRANSITIONS: { id: TransitionType, name: string, category: string }[] = [
        { id: 'none', name: 'None', category: 'Basic' },
        { id: 'dissolve', name: 'Dissolve', category: 'Basic' },
        { id: 'dip-to-black', name: 'Dip to Black', category: 'Basic' },
        { id: 'dip-to-white', name: 'Dip to White', category: 'Basic' },
        { id: 'zoom-in', name: 'Zoom In', category: 'Motion' },
        { id: 'zoom-out', name: 'Zoom Out', category: 'Motion' },
        { id: 'slide', name: 'Slide', category: 'Motion' },
        { id: 'push', name: 'Push', category: 'Motion' },
        { id: 'whip', name: 'Whip', category: 'Motion' },
        { id: 'wipe', name: 'Wipe', category: 'Shape' },
        { id: 'iris-round', name: 'Iris Round', category: 'Shape' },
        { id: 'iris-box', name: 'Iris Box', category: 'Shape' },
        { id: 'clock-wipe', name: 'Clock Wipe', category: 'Shape' },
    ];

    const categories = Array.from(new Set(TRANSITIONS.map(t => t.category)));

    const handleSelect = (type: TransitionType) => {
        const newTransition: Transition = {
            type,
            duration,
            direction: ['slide', 'push', 'wipe'].includes(type) ? direction : undefined
        };
        onSelect(newTransition);
    };

    return (
        <div className={`bg-white h-full border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative z-20 ${isOpen ? 'w-80' : 'w-0 opacity-0'}`}>
            <div className="w-80 h-full flex flex-col">
                <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0 bg-white z-10">
                    <span className="font-bold text-gray-800 text-lg tracking-tight">Transitions</span>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    {/* Settings for Selected Transition */}
                    {selectedTransition && selectedTransition.type !== 'none' && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-700 uppercase">Settings</span>
                                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{TRANSITIONS.find(t => t.id === selectedTransition.type)?.name}</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-xs text-gray-500">Duration</label>
                                        <span className="text-xs font-bold text-gray-700">{duration}s</span>
                                    </div>
                                    <input
                                        type="range" min="0.1" max="2.0" step="0.1"
                                        value={duration}
                                        onChange={(e) => {
                                            setDuration(Number(e.target.value));
                                            handleSelect(selectedTransition.type);
                                        }}
                                        className="w-full accent-violet-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {['slide', 'push', 'wipe'].includes(selectedTransition.type) && (
                                    <div>
                                        <label className="text-xs text-gray-500 mb-2 block">Direction</label>
                                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                                            {['left', 'right', 'up', 'down'].map((dir) => (
                                                <button
                                                    key={dir}
                                                    onClick={() => {
                                                        setDirection(dir as any);
                                                        const newT = { ...selectedTransition, direction: dir as any };
                                                        onSelect(newT);
                                                    }}
                                                    className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-all ${direction === dir ? 'bg-violet-50 text-violet-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    {dir === 'left' && <ArrowRight size={14} className="rotate-180" />}
                                                    {dir === 'right' && <ArrowRight size={14} />}
                                                    {dir === 'up' && <ArrowUp size={14} />}
                                                    {dir === 'down' && <ArrowDown size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => onApplyToAll(selectedTransition)}
                                    className="w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-violet-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check size={14} /> Apply to all pages
                                </button>
                            </div>
                        </div>
                    )}

                    {categories.map(category => (
                        <div key={category} className="mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{category}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {TRANSITIONS.filter(t => t.category === category).map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleSelect(t.id)}
                                        onMouseEnter={() => onPreview({ type: t.id, duration: 1.0 })}
                                        onMouseLeave={() => onPreview(null)}
                                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedTransition?.type === t.id
                                            ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-200'
                                            : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedTransition?.type === t.id ? 'bg-violet-200 text-violet-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {/* Icon placeholder - could be dynamic based on type */}
                                            <div className="w-4 h-4 bg-current rounded-sm opacity-50"></div>
                                        </div>
                                        <span className={`text-[10px] font-bold ${selectedTransition?.type === t.id ? 'text-violet-700' : 'text-gray-600'}`}>{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TransitionPanel;
