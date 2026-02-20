'use client';

import { useEffect, ReactNode } from 'react';
import { useAppStore } from '@/lib/store';
import { themes } from '@/lib/themes';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const theme = useAppStore((s) => s.theme);

    useEffect(() => {
        const t = themes[theme];
        const root = document.documentElement;
        root.style.setProperty('--color-bg', t.bg);
        root.style.setProperty('--color-bg-secondary', t.bgSecondary);
        root.style.setProperty('--color-bg-tertiary', t.bgTertiary);
        root.style.setProperty('--color-surface', t.surface);
        root.style.setProperty('--color-surface-hover', t.surfaceHover);
        root.style.setProperty('--color-accent', t.accent);
        root.style.setProperty('--color-accent-hover', t.accentHover);
        root.style.setProperty('--color-accent-light', t.accentLight);
        root.style.setProperty('--color-text', t.text);
        root.style.setProperty('--color-text-secondary', t.textSecondary);
        root.style.setProperty('--color-text-muted', t.textMuted);
        root.style.setProperty('--color-border', t.border);
        root.style.setProperty('--color-border-light', t.borderLight);
        root.style.setProperty('--color-shadow', t.shadow);
        root.style.setProperty('--color-editor-bg', t.editorBg);
        root.style.setProperty('--color-sidebar-bg', t.sidebarBg);
        root.style.setProperty('--color-header-bg', t.headerBg);
    }, [theme]);

    return <>{children}</>;
}
