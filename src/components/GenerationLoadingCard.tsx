'use client';

import { Loader2 } from 'lucide-react';

interface GenerationLoadingCardProps {
    text: string;
    subtext?: string;
}

export function GenerationLoadingCard({ text, subtext }: GenerationLoadingCardProps) {
    return (
        <div className="card p-3 mb-4 fade-in">
            <div className="flex items-center gap-2">
                <Loader2
                    size={14}
                    className="animate-spin shrink-0"
                    style={{ color: 'var(--color-accent)' }}
                />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {text}
                </p>
            </div>
            {subtext && (
                <p className="text-xs mt-1 pl-6" style={{ color: 'var(--color-text-muted)' }}>
                    {subtext}
                </p>
            )}
            <div className="progress-bar mt-2">
                <div className="progress-bar-indeterminate" />
            </div>
        </div>
    );
}
