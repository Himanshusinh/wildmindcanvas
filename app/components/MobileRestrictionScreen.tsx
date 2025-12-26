'use client';

import { useState, useEffect } from 'react';
import { Monitor, Tablet } from 'lucide-react';

export function MobileRestrictionScreen() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-6"
            style={{
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            }}
        >
            <div
                className="max-w-md w-full rounded-2xl p-8 text-center shadow-2xl"
                style={{
                    background: isDark
                        ? 'rgba(30, 41, 59, 0.8)'
                        : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: isDark
                        ? '1px solid rgba(148, 163, 184, 0.2)'
                        : '1px solid rgba(148, 163, 184, 0.3)',
                }}
            >
                {/* Icon */}
                <div className="flex justify-center gap-4 mb-6">
                    <div
                        className="p-4 rounded-full"
                        style={{
                            background: isDark
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(59, 130, 246, 0.1)',
                        }}
                    >
                        <Monitor
                            size={40}
                            style={{
                                color: isDark ? '#60a5fa' : '#3b82f6',
                            }}
                        />
                    </div>
                    <div
                        className="p-4 rounded-full"
                        style={{
                            background: isDark
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(59, 130, 246, 0.1)',
                        }}
                    >
                        <Tablet
                            size={40}
                            style={{
                                color: isDark ? '#60a5fa' : '#3b82f6',
                            }}
                        />
                    </div>
                </div>

                {/* Title */}
                <h1
                    className="text-2xl font-bold mb-4"
                    style={{
                        color: isDark ? '#f1f5f9' : '#0f172a',
                    }}
                >
                    Desktop or Tablet Required
                </h1>

                {/* Description */}
                <p
                    className="text-base mb-6 leading-relaxed"
                    style={{
                        color: isDark ? '#cbd5e1' : '#475569',
                    }}
                >
                    The Canvas experience is optimized for larger screens. Please access this application on a desktop computer or tablet for the best creative experience.
                </p>



                {/* Footer Note */}
                <p
                    className="text-xs"
                    style={{
                        color: isDark ? '#94a3b8' : '#64748b',
                    }}
                >
                    Thank you for your understanding. We're working to bring you the best canvas experience possible.
                </p>
            </div>
        </div>
    );
}
