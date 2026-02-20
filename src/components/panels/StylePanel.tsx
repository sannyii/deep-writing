'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export const presetStyles = [
    { id: 'tech_blog', name: '技术博客风', nameEn: 'Tech Blog', icon: '💻', desc: '清晰直接、代码示例、实操性强' },
    { id: 'economist', name: '经济学人风', nameEn: 'The Economist', icon: '📊', desc: '严谨客观、数据驱动、全球视野' },
    { id: 'academic', name: '学术论文风', nameEn: 'Academic', icon: '🎓', desc: '引用严谨、逻辑缜密、措辞考究' },
    { id: 'storytelling', name: '故事叙事风', nameEn: 'Storytelling', icon: '📖', desc: '娓娓道来、场景感强、代入感十足' },
    { id: 'luxun', name: '鲁迅风', nameEn: 'Lu Xun Style', icon: '✒️', desc: '犀利讽刺、言简意赅、一针见血' },
    { id: 'jkrowling', name: 'JK罗琳风', nameEn: 'J.K. Rowling Style', icon: '🧙', desc: '想象力丰富、细节生动、引人入胜' },
    { id: 'shitiesheng', name: '史铁生风', nameEn: 'Shi Tiesheng Style', icon: '🌿', desc: '沉静内省、温暖深沉、哲理性强' },
];

export function StylePanel() {
    const t = useTranslations('style');
    const {
        selectedPreset, customStyleText,
        emotionLevel, professionalLevel, colloquialLevel,
        setSelectedPreset, setCustomStyleText,
        setEmotionLevel, setProfessionalLevel, setColloquialLevel,
    } = useAppStore();
    const [showCustom, setShowCustom] = useState(false);

    useEffect(() => {
        if (selectedPreset && !presetStyles.some((style) => style.id === selectedPreset)) {
            setSelectedPreset(null);
        }
    }, [selectedPreset, setSelectedPreset]);

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

            {/* Preset Styles Grid */}
            <div className="mb-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('presets')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {presetStyles.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => { setSelectedPreset(style.id); setShowCustom(false); }}
                            className="card p-3 text-left transition-all relative"
                            style={{
                                borderColor: selectedPreset === style.id ? 'var(--color-accent)' : undefined,
                                boxShadow: selectedPreset === style.id ? '0 0 0 2px var(--color-accent-light)' : undefined,
                            }}
                        >
                            <span className="text-xl leading-none">{style.icon}</span>
                            <p className="font-medium text-sm mt-2 leading-tight" style={{ color: 'var(--color-text)' }}>
                                {style.name}
                            </p>
                            <p
                                className="text-xs mt-1 leading-5"
                                style={{
                                    color: 'var(--color-text-muted)',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {style.desc}
                            </p>
                            {selectedPreset === style.id && (
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center absolute top-2.5 right-2.5"
                                    style={{ background: 'var(--color-accent)', color: 'white' }}
                                >
                                    <Check size={12} />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Style */}
            <div className="mb-6">
                <button
                    onClick={() => { setShowCustom(!showCustom); if (!showCustom) setSelectedPreset(null); }}
                    className="btn-secondary text-sm"
                    style={showCustom ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : {}}
                >
                    ✨ {t('custom')}
                </button>

                {showCustom && (
                    <div className="mt-3 fade-in">
                        <textarea
                            value={customStyleText}
                            onChange={(e) => setCustomStyleText(e.target.value)}
                            placeholder={t('samplePlaceholder')}
                            className="input-field text-sm"
                            rows={6}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                )}
            </div>

            {/* Style Parameters */}
            <div className="card p-4">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    风格微调
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{t('emotionLevel')}</span>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>{emotionLevel}/10</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={emotionLevel}
                            onChange={(e) => setEmotionLevel(Number(e.target.value))}
                            className="w-full accent-[var(--color-accent)]"
                        />
                        <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <span>冷静克制</span>
                            <span>激情澎湃</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{t('professionalLevel')}</span>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>{professionalLevel}/10</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={professionalLevel}
                            onChange={(e) => setProfessionalLevel(Number(e.target.value))}
                            className="w-full accent-[var(--color-accent)]"
                        />
                        <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <span>通俗易懂</span>
                            <span>专业深度</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{t('colloquialLevel')}</span>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>{colloquialLevel}/10</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={colloquialLevel}
                            onChange={(e) => setColloquialLevel(Number(e.target.value))}
                            className="w-full accent-[var(--color-accent)]"
                        />
                        <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <span>书面正式</span>
                            <span>口语随性</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
