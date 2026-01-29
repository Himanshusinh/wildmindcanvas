/**
 * Utility functions to parse and format chat messages
 */

export interface ParsedMessage {
    text: string;
    options: Option[];
    hasBulletPoints: boolean;
    hasNumberedList: boolean;
}

export interface Option {
    label: string; // e.g., "A", "B", "C"
    text: string; // The option text
    fullText: string; // Full option line including label
}

/**
 * Detects options in the format:
 * - A) Option text
 * - B) Option text
 * - A. Option text
 * - B. Option text
 * - Option A: text
 * - Option B: text
 */
export function parseMessage(content: string): ParsedMessage {
    // First, remove markdown code blocks if present
    let cleanedContent = content.replace(/```[\s\S]*?```/g, '');
    
    const lines = cleanedContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const options: Option[] = [];
    let hasBulletPoints = false;
    let hasNumberedList = false;
    
    // Patterns to detect options (more specific to avoid false positives)
    const optionPatterns = [
        /^([A-Z])\)\s+(.+)$/i, // A) Option text
        /^([A-Z])\.\s+(.+)$/i, // A. Option text
        /^Option\s+([A-Z]):\s+(.+)$/i, // Option A: text
        /^([A-Z]):\s+(.+)$/i, // A: text (if at start of line and followed by text)
    ];
    
    // Patterns for bullet points
    const bulletPatterns = [
        /^[•\-\*]\s+(.+)$/, // •, -, or *
        /^[\u2022\u2023\u25E6\u2043]\s+(.+)$/, // Various bullet characters
    ];
    
    // Patterns for numbered lists
    const numberedPattern = /^\d+[\.\)]\s+(.+)$/; // 1. or 1)
    
    const processedLines: string[] = [];
    const optionIndices = new Set<number>(); // Track which line indices are options
    
    // First pass: identify options
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for options
        for (const pattern of optionPatterns) {
            const match = line.match(pattern);
            if (match) {
                const label = match[1].toUpperCase();
                const text = match[2].trim();
                
                // Check if this is actually an option (not just a single letter followed by punctuation)
                // Also check if the text is substantial (more than 2 chars)
                if (text.length > 2 && !line.match(/^[A-Z][\.\)]\s*$/)) {
                    // Check if we have consecutive options (A, B, C, D pattern)
                    // Look ahead to see if next line is also an option
                    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
                    const prevLine = i > 0 ? lines[i - 1] : '';
                    
                    // Check if previous or next line is also an option
                    const hasAdjacentOption = 
                        (prevLine && optionPatterns.some(p => p.test(prevLine))) ||
                        (nextLine && optionPatterns.some(p => p.test(nextLine)));
                    
                    // Only add if we have at least 2 options or this looks like part of a list
                    if (hasAdjacentOption || options.length > 0) {
                        options.push({
                            label,
                            text,
                            fullText: line
                        });
                        optionIndices.add(i);
                    }
                }
            }
        }
    }
    
    // Second pass: process all lines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip option lines (they'll be rendered as buttons)
        if (optionIndices.has(i)) {
            continue;
        }
        
        let matched = false;
        
        // Check for bullet points
        for (const pattern of bulletPatterns) {
            if (pattern.test(line)) {
                hasBulletPoints = true;
                processedLines.push(line);
                matched = true;
                break;
            }
        }
        
        if (matched) continue;
        
        // Check for numbered lists
        if (numberedPattern.test(line)) {
            hasNumberedList = true;
            processedLines.push(line);
            matched = true;
        }
        
        if (!matched) {
            processedLines.push(line);
        }
    }
    
    return {
        text: processedLines.join('\n'),
        options: options.length >= 2 ? options : [], // Only treat as options if 2+ found
        hasBulletPoints,
        hasNumberedList
    };
}

/**
 * Formats text with proper line breaks and spacing
 */
export function formatText(text: string): string[] {
    // Split by double newlines first (paragraphs)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const result: string[] = [];
    
    for (const paragraph of paragraphs) {
        const lines = paragraph.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        result.push(...lines);
    }
    
    return result;
}

/**
 * Checks if a message contains options that should be rendered as buttons
 */
export function hasSelectableOptions(content: string): boolean {
    const parsed = parseMessage(content);
    return parsed.options.length >= 2;
}
