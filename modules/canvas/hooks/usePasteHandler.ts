import { useEffect, useCallback } from 'react';

interface UsePasteHandlerProps {
    onPasteFiles: (files: File[]) => void;
    enabled?: boolean;
}

export const usePasteHandler = ({ onPasteFiles, enabled = true }: UsePasteHandlerProps) => {
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (!enabled) return;

        // Check if user is typing in an input or textarea
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (isInput) return;

        console.log('[PasteHandler] Paste event detected');

        const files: File[] = [];

        // 1. Try getting files from clipboardData.files (Standard property)
        if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
            console.log(`[PasteHandler] Found ${e.clipboardData.files.length} files in clipboardData.files`);
            for (let i = 0; i < e.clipboardData.files.length; i++) {
                const file = e.clipboardData.files[i];
                // Only accept image and video types, or allow all and let upload handler filter?
                // User detected "image and video", but let's pass all files to the handler which likely filters or processes them.
                // But to be safe, let's filter relevant mime types if needed, or better yet, pass them all.
                files.push(file);
            }
        }
        // 2. Fallback: Try getting files from clipboardData.items (DataTransferItem)
        else if (e.clipboardData?.items) {
            const items = e.clipboardData.items;
            console.log(`[PasteHandler] Found ${items.length} items in clipboardData.items`);
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log(`[PasteHandler] Item kind: ${item.kind}, type: ${item.type}`);
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }
        }

        if (files.length > 0) {
            console.log(`[PasteHandler] Processing ${files.length} files`);
            e.preventDefault();
            // Filter for images and videos to prevent random file uploads if strictly needed, 
            // but usually the upload handler handles validity.
            // Filtering here just in case to match "image and video only" request more strictly if desired,
            // but let's let the uploader handle it to support 3D models etc.
            onPasteFiles(files);
        } else {
            console.log('[PasteHandler] No files found in paste event');
        }
    }, [onPasteFiles, enabled]);

    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);
};
