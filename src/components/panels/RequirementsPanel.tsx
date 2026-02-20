'use client';

import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';

const wordCountPresets = [800, 1200, 1800, 2500];

export function RequirementsPanel() {
    const t = useTranslations('requirements');
    const {
        targetWordCount,
        audience,
        purpose,
        customRequirement,
        setTargetWordCount,
        setAudience,
        setPurpose,
        setCustomRequirement,
    } = useAppStore();

    return (
        <div className="fade-in workspace-panel">
            <div className="mb-4">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                    {t('title')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('description')}
                </p>
            </div>

            <div className="card p-4 mb-4">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('baseConfig')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                            {t('wordCount')}
                        </label>
                        <input
                            type="number"
                            min={300}
                            max={5000}
                            value={targetWordCount}
                            onChange={(e) => setTargetWordCount(Number(e.target.value))}
                            className="input-field text-sm"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                            {wordCountPresets.map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setTargetWordCount(value)}
                                    className="px-2.5 py-1 rounded-full text-xs transition-all"
                                    style={{
                                        background: targetWordCount === value ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)',
                                        color: targetWordCount === value ? 'var(--color-accent-hover)' : 'var(--color-text-secondary)',
                                        border: targetWordCount === value
                                            ? '1px solid var(--color-accent)'
                                            : '1px solid var(--color-border)',
                                    }}
                                >
                                    {value} 字
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                            {t('audience')}
                        </label>
                        <input
                            type="text"
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            placeholder={t('audiencePlaceholder')}
                            className="input-field text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                            {t('purpose')}
                        </label>
                        <textarea
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder={t('purposePlaceholder')}
                            className="input-field text-sm"
                            rows={3}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                </div>
            </div>

            <div className="card p-4">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('custom')}
                </h3>
                <textarea
                    value={customRequirement}
                    onChange={(e) => setCustomRequirement(e.target.value)}
                    placeholder={t('customPlaceholder')}
                    className="input-field text-sm"
                    rows={5}
                    style={{ resize: 'vertical' }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    {t('customTips')}
                </p>
            </div>
        </div>
    );
}
