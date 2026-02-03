export interface SmartToken {
    text: string;
    category: string;
    options: string[];
    startIndex: number;
    endIndex: number;
}

/**
 * Re-anchors tokens to the text if the text has changed slightly,
 * or simply returns them if they still match.
 */
export function anchorSmartTokens(text: string, tokens: SmartToken[]): SmartToken[] {
    if (!text || !tokens || tokens.length === 0) return [];

    const result: SmartToken[] = [];
    // Sort tokens by length (descending) to match longest phrases first (prevents partial matches)
    const sortedTokens = [...tokens]
        .filter(t => t && typeof t.text === 'string' && t.text.trim().length > 0)
        .sort((a, b) => b.text.length - a.text.length);

    console.log(`[anchorSmartTokens] Attempting to anchor ${sortedTokens.length} tokens into text of length ${text.length}`);

    for (const token of sortedTokens) {
        const tokenText = token.text.trim();
        // Escape special regex characters in token text and replace spaces with \s+
        const escapedText = tokenText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = escapedText.replace(/\s+/g, '\\s+');
        const regex = new RegExp(pattern, 'gi');

        let match;
        while ((match = regex.exec(text)) !== null) {
            const index = match.index;
            const end = index + match[0].length;

            // Comprehensive overlap check
            const isOverlap = result.some(item =>
                (index >= item.startIndex && index < item.endIndex) ||
                (end > item.startIndex && end <= item.endIndex) ||
                (item.startIndex >= index && item.startIndex < end)
            );

            if (!isOverlap) {
                result.push({
                    ...token,
                    text: match[0], // Use exact text from the source
                    startIndex: index,
                    endIndex: end
                });
                console.log(`[anchorSmartTokens] ✅ Anchored: "${match[0]}" at ${index}-${end}`);
                break; // One match per unique token definition
            }
        }
    }
    return result.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Simple utility to check if a range overlaps with existing tokens
 */
export function isOverlapping(tokens: SmartToken[], start: number, end: number): boolean {
    return tokens.some(t => {
        return (start >= t.startIndex && start < t.endIndex) ||
            (end > t.startIndex && end <= t.endIndex) ||
            (t.startIndex >= start && t.startIndex < end);
    });
}
