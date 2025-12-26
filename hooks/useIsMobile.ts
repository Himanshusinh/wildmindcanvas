'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device is mobile (screen width < 768px)
 * Returns true for mobile devices, false for tablets and desktops
 */
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Check on mount
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    return isMobile;
}
