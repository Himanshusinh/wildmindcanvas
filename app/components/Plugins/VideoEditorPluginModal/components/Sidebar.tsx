import React from 'react';
import { MousePointer2, Type, Upload, Image as ImageIcon, Video, Music, LayoutTemplate } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'tools', icon: <MousePointer2 size={20} />, label: 'Tools' }, // New Tools Tab
        { id: 'text', icon: <Type size={20} />, label: 'Text' },
        { id: 'uploads', icon: <Upload size={20} />, label: 'Uploads' },
        { id: 'images', icon: <ImageIcon size={20} />, label: 'Photos' },
        { id: 'videos', icon: <Video size={20} />, label: 'Videos' },
        { id: 'audio', icon: <Music size={20} />, label: 'Audio' },
        { id: 'projects', icon: <LayoutTemplate size={20} />, label: 'Projects' },
    ];

    return (
        <div className="w-[72px] bg-gray-900 flex flex-col items-center py-4 gap-4 z-30 shrink-0">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 transition-all duration-200 ${activeTab === tab.id
                        ? 'bg-gray-800 text-white shadow-md transform scale-105'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                        }`}
                >
                    {tab.icon}
                    <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default Sidebar;
