'use client';

import { useState, useEffect, useRef } from 'react';

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

export const Profile: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  // Fetch user data and credits
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
        
        // Fetch user data with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const userResponse = await fetch(`${apiBase}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }).catch((error) => {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            console.error('Profile fetch timeout - API Gateway may be unreachable');
          } else if (error.message === 'Failed to fetch') {
            console.error('Failed to fetch profile - check API Gateway URL:', apiBase);
            console.error('Make sure NEXT_PUBLIC_API_BASE_URL is set correctly in .env.local');
          }
          throw error;
        });
        
        clearTimeout(timeoutId);

        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const user = userResult?.data?.user || userResult?.user || userResult?.data;
          if (user) {
            setUserData(user);
            
            // Set isPublic from user data or localStorage
            try {
              const stored = localStorage.getItem('isPublicGenerations');
              const server = (user as any)?.isPublic;
              const next = (stored != null) ? (stored === 'true') : (server !== undefined ? Boolean(server) : false);
              setIsPublic(next);
            } catch {}
          }
        } else {
          console.error('Failed to fetch user data:', userResponse.status, userResponse.statusText);
        }

        // Fetch credits
        try {
          const creditsResponse = await fetch(`${apiBase}/api/credits/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (creditsResponse.ok) {
            const creditsResult = await creditsResponse.json();
            const creditsPayload = creditsResult?.data || creditsResult;
            const balance = Number(creditsPayload?.creditBalance || creditsPayload?.balance || creditsPayload?.credits);
            if (!Number.isNaN(balance)) {
              setCreditBalance(balance);
            }
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
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
      
      // Call logout API
      await fetch(`${apiBase}/api/auth/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });

      // Clear cookies
      const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/';
      try {
        document.cookie = `app_session=; ${expired}; SameSite=None; Secure`;
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`;
        document.cookie = `app_session=; ${expired}; SameSite=Lax`;
        document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`;
      } catch {}

      // Redirect to main project
      const isProd = typeof window !== 'undefined' && 
        (window.location.hostname === 'wildmindai.com' || 
         window.location.hostname === 'www.wildmindai.com' ||
         window.location.hostname === 'studio.wildmindai.com');
      
      const mainProjectUrl = isProd 
        ? 'https://wildmindai.com/view/Landingpage?toast=LOGOUT_SUCCESS'
        : 'http://localhost:3000/view/Landingpage?toast=LOGOUT_SUCCESS';
      
      window.location.replace(mainProjectUrl);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUpgradePlan = () => {
    const isProd = typeof window !== 'undefined' && 
      (window.location.hostname === 'wildmindai.com' || 
       window.location.hostname === 'www.wildmindai.com' ||
       window.location.hostname === 'studio.wildmindai.com');
    
    const pricingUrl = isProd 
      ? 'https://wildmindai.com/view/pricing'
      : 'http://localhost:3000/view/pricing';
    
    window.open(pricingUrl, '_blank', 'noopener,noreferrer');
    setShowDropdown(false);
  };

  const handlePurchaseCredits = () => {
    const isProd = typeof window !== 'undefined' && 
      (window.location.hostname === 'wildmindai.com' || 
       window.location.hostname === 'www.wildmindai.com' ||
       window.location.hostname === 'studio.wildmindai.com');
    
    const pricingUrl = isProd 
      ? 'https://wildmindai.com/view/pricing'
      : 'http://localhost:3000/view/pricing';
    
    window.open(pricingUrl, '_blank', 'noopener,noreferrer');
    setShowDropdown(false);
  };

  const handleAccountSettings = () => {
    const isProd = typeof window !== 'undefined' && 
      (window.location.hostname === 'wildmindai.com' || 
       window.location.hostname === 'www.wildmindai.com' ||
       window.location.hostname === 'studio.wildmindai.com');
    
    const accountUrl = isProd 
      ? 'https://wildmindai.com/view/account-management'
      : 'http://localhost:3000/view/account-management';
    
    window.open(accountUrl, '_blank', 'noopener,noreferrer');
    setShowDropdown(false);
  };

  // Always render the button, even if data is loading
  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 10001, // Same as Header and ToolbarPanel
      }}
    >
      {/* Profile Button */}
      <button
        onClick={() => {
          console.log('Profile clicked, current state:', showDropdown);
          setShowDropdown(!showDropdown);
        }}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        {(!loading && userData?.photoURL && !avatarFailed) ? (
          <img
            src={userData.photoURL}
            alt="profile"
            referrerPolicy="no-referrer"
            onError={() => setAvatarFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: '#4b5563' }}
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" />
          </svg>
        )}
      </button>

      {/* Profile Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '320px',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px' }}>
            {/* User Info Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {(!loading && userData?.photoURL && !avatarFailed) ? (
                  <img
                    src={userData.photoURL}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span style={{ color: 'white', fontWeight: '600', fontSize: '18px' }}>
                    {loading ? '...' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '16px' }}>
                  {loading ? 'Loading...' : (userData?.username || 'User')}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  {loading ? 'Loading...' : (userData?.email || 'user@example.com')}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* User Info */}
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: '#1f2937', fontSize: '14px' }}>Status</span>
                  <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
                    {userData?.metadata?.accountStatus || 'Active'}
                  </span>
                </div>
              </div>

              {/* Active Plan */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ color: '#1f2937', fontSize: '14px' }}>Active Plan</span>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  {userData?.plan || 'Free'}
                </span>
              </div>

              {/* Upgrade Plan */}
              <button
                onClick={handleUpgradePlan}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1f2937',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Upgrade Plan
              </button>

              {/* Purchase Credits */}
              <button
                onClick={handlePurchaseCredits}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1f2937',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Purchase Additional Credits
              </button>

              {/* Make generations public toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ color: '#1f2937', fontSize: '14px' }}>Make generations public</span>
                <button
                  type="button"
                  onClick={async () => {
                    const next = !isPublic;
                    setIsPublic(next);
                    try {
                      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
                      await fetch(`${apiBase}/api/auth/me`, {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ isPublic: next }),
                      });
                    } catch (error) {
                      console.error('Error updating isPublic:', error);
                    }
                    try {
                      localStorage.setItem('isPublicGenerations', String(next));
                    } catch {}
                  }}
                  style={{
                    width: '40px',
                    height: '20px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: isPublic ? '#3b82f6' : 'rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: '16px',
                      height: '16px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: isPublic ? '22px' : '2px',
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </button>
              </div>

              {/* Account Settings */}
              <button
                onClick={handleAccountSettings}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1f2937',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Account Settings
              </button>

              {/* Divider */}
              <div
                style={{
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                  margin: '8px 0',
                }}
              />

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
