'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, RefreshCw, Copy, Download } from 'lucide-react';
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

export function ContentPanel() {
    const t = useTranslations('content');
    const {
        materials, outline, content, setContent,
        selectedPreset, customStyleText,
        emotionLevel, professionalLevel, colloquialLevel,
        targetWordCount, audience, purpose, customRequirement,
    } = useAppStore();

    const { completion, isLoading, complete } = useCompletion({
        api: '/api/ai/content',
        streamProtocol: 'text',
    });

    useEffect(() => {
        if (completion) {
            setContent(completion);
        }
    }, [completion, setContent]);

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
                outline,
            },
        });
    };

    const wordCount = content.replace(/\s/g, '').length;

    return (
        <div className="fade-in workspace-panel">
            <div className="mb-3">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                    {t('title')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('description')}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
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
                        {isLoading ? '生成中...' : content ? t('regenerate') : t('generate')}
                    </button>
                    {content && !isLoading && (
                        <>
                            <button
                                onClick={() => navigator.clipboard.writeText(content)}
                                className="btn-secondary text-sm"
                            >
                                <Copy size={14} />
                                复制
                            </button>
                            <button className="btn-secondary text-sm">
                                <Download size={14} />
                                导出
                            </button>
                        </>
                    )}
                </div>
                {content && (
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {t('wordCount')}：{wordCount}
                    </span>
                )}
            </div>

            {!outline && (
                <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                    提示：先在「智能大纲」步骤生成大纲，正文生成效果更好
                </div>
            )}

            {isLoading && (
                <GenerationLoadingCard
                    text="AI 正在生成正文..."
                    subtext="正文会实时流式写入下方编辑区"
                />
            )}

            {/* Editor */}
            <div className="card">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('placeholder')}
                    className="editor-area w-full border-none outline-none resize-y"
                    style={{
                        fontFamily: "'Noto Sans SC', sans-serif",
                        minHeight: '500px',
                    }}
                />
            </div>
        </div>
    );
}
