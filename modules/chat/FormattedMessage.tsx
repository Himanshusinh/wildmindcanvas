'use client';

import React from 'react';
import { parseMessage, Option, formatText } from './messageFormatter';
import { Check } from 'lucide-react';

interface FormattedMessageProps {
    content: string;
    onOptionSelect?: (option: Option) => void;
    selectedOption?: string | null;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({
    content,
    onOptionSelect,
    selectedOption
}) => {
    const parsed = parseMessage(content);
    const formattedLines = formatText(parsed.text);
    
    // Remove option lines from the main text since we'll render them as buttons
    const optionFullTexts = new Set(parsed.options.map(opt => opt.fullText.toLowerCase()));
    const mainTextLines = formattedLines.filter(line => {
        // Check if this line matches any option's full text
        return !optionFullTexts.has(line.toLowerCase());
    });
    
    // Render a line with proper formatting
    const renderLine = (line: string, index: number) => {
        // Remove markdown bold/italic but keep the text
        let cleanLine = line
            .replace(/\*\*(.+?)\*\*/g, '$1') // **bold**
            .replace(/\*(.+?)\*/g, '$1') // *italic*
            .replace(/__(.+?)__/g, '$1') // __bold__
            .replace(/_(.+?)_/g, '$1'); // _italic_
        
        // Check for bullet points
        const bulletMatch = cleanLine.match(/^[•\-\*]\s+(.+)$/);
        if (bulletMatch) {
            return (
                <div key={index} className="flex items-start gap-2 py-0.5">
                    <span className="text-blue-400/60 mt-1.5 flex-shrink-0">•</span>
                    <span className="flex-1">{bulletMatch[1]}</span>
                </div>
            );
        }
        
        // Check for numbered lists
        const numberedMatch = cleanLine.match(/^(\d+[\.\)])\s+(.+)$/);
        if (numberedMatch) {
            return (
                <div key={index} className="flex items-start gap-2 py-0.5">
                    <span className="text-blue-400/60 mt-1.5 flex-shrink-0 font-medium">{numberedMatch[1]}</span>
                    <span className="flex-1">{numberedMatch[2]}</span>
                </div>
            );
        }
        
        // Regular text line - split long paragraphs into sentences for better readability
        const sentences = cleanLine.split(/([.!?]\s+)/).filter(s => s.trim().length > 0);
        if (sentences.length > 1) {
            return (
                <div key={index} className="py-0.5 leading-relaxed space-y-1">
                    {sentences.map((sentence, sIdx) => (
                        <div key={sIdx}>{sentence}</div>
                    ))}
                </div>
            );
        }
        
        return (
            <div key={index} className="py-0.5 leading-relaxed">
                {cleanLine}
            </div>
        );
    };
    
    return (
        <div className="space-y-2">
            {/* Main message content */}
            <div className="space-y-1">
                {mainTextLines.map((line, index) => renderLine(line, index))}
            </div>
            
            {/* Options as buttons */}
            {parsed.options.length >= 2 && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    <div className="text-[10px] text-white/50 mb-2 font-medium uppercase tracking-wider">
                        Select an option:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {parsed.options.map((option) => {
                            const isSelected = selectedOption === option.label;
                            return (
                                <button
                                    key={option.label}
                                    onClick={() => onOptionSelect?.(option)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                                        isSelected
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold ${
                                            isSelected
                                                ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50'
                                                : 'bg-white/5 text-white/60 border border-white/10'
                                        }`}>
                                            {isSelected ? <Check size={14} /> : option.label}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium mb-0.5">
                                                Option {option.label}
                                            </div>
                                            <div className="text-xs text-white/60 leading-relaxed">
                                                {option.text}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
