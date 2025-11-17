"use client";

import { useEffect, useState } from 'react';

interface UserData {
  uid: string;
  email: string;
  username: string;
  photoURL?: string;
  displayName?: string;
  provider: string;
  credits?: number;
  plan?: string;
  metadata?: {
    accountStatus: string;
    roles: string[];
  };
}

export function useProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('isPublicGenerations');
      return stored ? stored === 'true' : false;
    } catch { return false; }
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const userResponse = await fetch(`${apiBase}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        }).catch((error) => {
          clearTimeout(timeoutId);
          throw error;
        });
        clearTimeout(timeoutId);
        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const user = userResult?.data?.user || userResult?.user || userResult?.data;
          if (user) {
            setUserData(user);
            try {
              const stored = localStorage.getItem('isPublicGenerations');
              const server = (user as any)?.isPublic;
              const next = (stored != null) ? (stored === 'true') : (server !== undefined ? Boolean(server) : false);
              setIsPublic(next);
            } catch {}
          }
        }

        try {
          const creditsResponse = await fetch(`${apiBase}/api/credits/me`, { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
          if (creditsResponse.ok) {
            const creditsResult = await creditsResponse.json();
            const creditsPayload = creditsResult?.data || creditsResult;
            const balance = Number(creditsPayload?.creditBalance || creditsPayload?.balance || creditsPayload?.credits);
            if (!Number.isNaN(balance)) setCreditBalance(balance);
          }
        } catch (e) {
          console.error('Error fetching credits:', e);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
      await fetch(`${apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/';
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`;
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`;
        document.cookie = `app_session=; ${expired}; SameSite=Lax`;
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`;
      } catch {}
      const isProd = typeof window !== 'undefined' && (window.location.hostname === 'wildmindai.com' || window.location.hostname === 'www.wildmindai.com' || window.location.hostname === 'studio.wildmindai.com');
      const mainProjectUrl = isProd ? 'https://wildmindai.com/view/Landingpage?toast=LOGOUT_SUCCESS' : 'http://localhost:3000/view/Landingpage?toast=LOGOUT_SUCCESS';
      window.location.replace(mainProjectUrl);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUpgradePlan = () => {
    const isProd = typeof window !== 'undefined' && (window.location.hostname === 'wildmindai.com' || window.location.hostname === 'www.wildmindai.com' || window.location.hostname === 'studio.wildmindai.com');
    const pricingUrl = isProd ? 'https://wildmindai.com/view/pricing' : 'http://localhost:3000/view/pricing';
    window.open(pricingUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePurchaseCredits = () => {
    const isProd = typeof window !== 'undefined' && (window.location.hostname === 'wildmindai.com' || window.location.hostname === 'www.wildmindai.com' || window.location.hostname === 'studio.wildmindai.com');
    const pricingUrl = isProd ? 'https://wildmindai.com/view/pricing' : 'http://localhost:3000/view/pricing';
    window.open(pricingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAccountSettings = () => {
    const isProd = typeof window !== 'undefined' && (window.location.hostname === 'wildmindai.com' || window.location.hostname === 'www.wildmindai.com' || window.location.hostname === 'studio.wildmindai.com');
    const accountUrl = isProd ? 'https://wildmindai.com/view/account-management' : 'http://localhost:3000/view/account-management';
    window.open(accountUrl, '_blank', 'noopener,noreferrer');
  };

  return {
    userData,
    loading,
    avatarFailed,
    setAvatarFailed,
    creditBalance,
    isPublic,
    setIsPublic,
    handleLogout,
    handleUpgradePlan,
    handlePurchaseCredits,
    handleAccountSettings,
  };
}

export default useProfile;
