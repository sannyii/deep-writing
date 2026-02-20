'use client';

import { useTranslations } from 'next-intl';
import { FileText, Palette, SlidersHorizontal, List, PenTool, Type } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const tabs = [
    { key: 'materials' as const, icon: FileText },
    { key: 'style' as const, icon: Palette },
    { key: 'requirements' as const, icon: SlidersHorizontal },
    { key: 'outline' as const, icon: List },
    { key: 'content' as const, icon: PenTool },
    { key: 'title' as const, icon: Type },
];

export function WorkflowTabs() {
    const t = useTranslations('workflow');
    const { activeTab, setActiveTab } = useAppStore();
    const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);

    return (
        <div
            className="flex items-center justify-center px-6 py-3 shrink-0"
            style={{ borderBottom: '1px solid var(--color-border-light)' }}
        >
            <div className="flex items-center">
                {tabs.map((tab, i) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    const isPast = i < activeIndex;

                    return (
                        <div key={tab.key} className="flex items-center">
                            <button
                                onClick={() => setActiveTab(tab.key)}
                                className="flex items-center gap-2 transition-all"
                                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                            >
                                {/* Step number circle */}
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0"
                                    style={{
                                        background: isActive
                                            ? 'var(--color-accent)'
                                            : isPast
                                                ? 'var(--color-accent-light)'
                                                : 'var(--color-bg-secondary)',
                                        color: isActive
                                            ? 'white'
                                            : isPast
                                                ? 'var(--color-accent)'
                                                : 'var(--color-text-muted)',
                                        boxShadow: isActive ? '0 2px 8px var(--color-shadow)' : 'none',
                                    }}
                                >
                                    {isPast ? <Icon size={13} /> : i + 1}
                                </div>
                                {/* Label */}
                                <span
                                    className="text-sm font-medium whitespace-nowrap"
                                    style={{
                                        color: isActive
                                            ? 'var(--color-text)'
                                            : isPast
                                                ? 'var(--color-accent)'
                                                : 'var(--color-text-muted)',
                                    }}
                                >
                                    {t(tab.key)}
                                </span>
                            </button>

                            {/* Connector line */}
                            {i < tabs.length - 1 && (
                                <div
                                    className="mx-3"
                                    style={{
                                        width: '32px',
                                        height: '2px',
                                        borderRadius: '1px',
                                        background: i < activeIndex
                                            ? 'var(--color-accent)'
                                            : 'var(--color-border)',
                                        transition: 'background 0.2s',
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
