import React from 'react';

export const CriticalStyles = () => {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
      :root {
        --bg-primary: #ffffff;
        --bg-secondary: #f9fafb;
        --bg-tertiary: #f3f4f6;
        --bg-hover: #f9fafb;
        --bg-active: #f3f4f6;
        --text-primary: #111827;
        --text-secondary: #6b7280;
        --text-tertiary: #9ca3af;
        --border-color: rgba(0, 0, 0, 0.1);
        --border-hover: rgba(0, 0, 0, 0.15);
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
        --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
        --accent-color: #3b82f6;
        --accent-hover: #2563eb;
        --accent-light: rgba(59, 130, 246, 0.1);
        --selection-blue: #4C83FF;
      }

      .dark {
        --bg-primary: #121212;
        --bg-secondary: #121212;
        --bg-tertiary: #1a1a1a;
        --bg-hover: #1a1a1a;
        --bg-active: #2a2a2a;
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
        --text-tertiary: #999999;
        --border-color: rgba(255, 255, 255, 0.15);
        --border-hover: rgba(255, 255, 255, 0.25);
        --shadow-sm: 0 1px 2px rgba(255, 255, 255, 0.5);
        --shadow-md: 0 4px 6px rgba(255, 255, 255, 0.6);
        --shadow-lg: 0 10px 15px rgba(255, 255, 255, 0.7);
        --accent-color: #60a5fa;
        --accent-hover: #3b82f6;
        --accent-light: rgba(96, 165, 250, 0.2);
        --dot-color: rgba(255, 255, 255, 0.3);
      }

      html, body {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, sans-serif;
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      main {
        background-color: var(--bg-primary);
        transition: background-color 0.3s ease;
      }
    `}} />
  );
};
