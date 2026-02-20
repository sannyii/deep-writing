'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, SkipForward, RefreshCw } from 'lucide-react';
import { useCompletion } from '@ai-sdk/react';
import { useAppStore } from '@/lib/store';
import { presetStyles } from './StylePanel';
import { useEffect } from 'react';
import { GenerationLoadingCard } from '@/components/GenerationLoadingCard';

function buildStylePrompt(state: {
    selectedPreset: string | null;
    customStyleText: string;
    emotionLevel: number;
    professionalLevel: number;
    colloquialLevel: number;
}) {
    const parts: string[] = [];
    if (state.selectedPreset) {
        const preset = presetStyles.find((p) => p.id === state.selectedPreset);
        if (preset) parts.push(`写作风格：${preset.name} — ${preset.desc}`);
    }
    if (state.customStyleText) {
        parts.push(`自定义风格参考：\n${state.customStyleText}`);
    }
    parts.push(`情感浓度：${state.emotionLevel}/10`);
    parts.push(`专业深度：${state.professionalLevel}/10`);
    parts.push(`口语化程度：${state.colloquialLevel}/10`);
    return parts.join('\n');
}

function buildRequirementsPrompt(state: {
    targetWordCount: number;
    audience: string;
    purpose: string;
    customRequirement: string;
}) {
    const parts = [
        `目标字数：约 ${state.targetWordCount} 字`,
        `目标读者：${state.audience}`,
        `写作目标：${state.purpose}`,
    ];
    if (state.customRequirement.trim()) {
        parts.push(`补充要求：\n${state.customRequirement}`);
    }
    return parts.join('\n');
}

export function OutlinePanel() {
    const t = useTranslations('outline');
    const {
        materials, outline, setOutline,
        selectedPreset, customStyleText,
        emotionLevel, professionalLevel, colloquialLevel,
        targetWordCount, audience, purpose, customRequirement,
    } = useAppStore();

    const { completion, isLoading, complete } = useCompletion({
        api: '/api/ai/outline',
        streamProtocol: 'text',
    });

    // Sync streamed completion into store
    useEffect(() => {
        if (completion) {
            setOutline(completion);
        }
    }, [completion, setOutline]);

    const handleGenerate = () => {
        const stylePrompt = buildStylePrompt({
            selectedPreset, customStyleText,
            emotionLevel, professionalLevel, colloquialLevel,
        });
        const requirementsPrompt = buildRequirementsPrompt({
            targetWordCount, audience, purpose, customRequirement,
        });
        complete('', {
            body: {
                materials: materials.map((m) => ({
                    name: m.name,
                    content: m.content,
                    importance: m.importance,
                })),
                style: stylePrompt,
                requirements: requirementsPrompt,
            },
        });
    };

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

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="btn-primary text-sm"
                >
                    {isLoading ? (
                        <RefreshCw size={14} className="animate-spin" />
                    ) : (
                        <Sparkles size={14} />
                    )}
                    {isLoading ? '生成中...' : outline ? t('regenerate') : t('generate')}
                </button>
                {outline && !isLoading && (
                    <button onClick={handleGenerate} className="btn-secondary text-sm">
                        <RefreshCw size={14} />
                        {t('regenerate')}
                    </button>
                )}
                <button className="btn-secondary text-sm">
                    <SkipForward size={14} />
                    {t('skip')}
                </button>
            </div>

            {materials.length === 0 && (
                <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                    提示：先在「素材聚合」步骤添加素材，大纲生成效果更好
                </div>
            )}

            {isLoading && (
                <GenerationLoadingCard
                    text="AI 正在生成大纲..."
                    subtext="大纲会实时写入下方编辑区，你可以随时接管编辑"
                />
            )}

            {/* Outline Editor */}
            <div className="card">
                <textarea
                    value={outline}
                    onChange={(e) => setOutline(e.target.value)}
                    placeholder={t('placeholder')}
                    className="w-full min-h-[400px] p-6 bg-transparent border-none outline-none resize-y text-sm leading-relaxed"
                    style={{
                        color: 'var(--color-text)',
                        fontFamily: "'Noto Sans SC', sans-serif",
                    }}
                />
            </div>
        </div>
    );
}
