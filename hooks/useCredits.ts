import { useState, useEffect, useCallback } from 'react';
import { fetchCredits } from '../lib/api';

export function useCredits() {
    const [credits, setCredits] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const getCredits = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchCredits();
            if (data && typeof data.creditBalance === 'number') {
                setCredits(data.creditBalance);
            }
        } catch (e) {
            console.error('Failed to fetch credits', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getCredits();
    }, [getCredits]);

    // Listen for custom event to refresh credits (e.g. after generation)
    useEffect(() => {
        const handleRefresh = () => getCredits();
        window.addEventListener('refresh-credits', handleRefresh);
        return () => window.removeEventListener('refresh-credits', handleRefresh);
    }, [getCredits]);

    return { credits, loading, refetch: getCredits };
}
