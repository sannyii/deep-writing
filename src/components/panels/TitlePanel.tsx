'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, RefreshCw, Check, Trophy } from 'lucide-react';
import { useAppStore, TitleItem } from '@/lib/store';
import { GenerationLoadingCard } from '@/components/GenerationLoadingCard';

const categoryIcons: Record<string, string> = {
    numeric: '🔢',
    emotion: '🔥',
    suspense: '❓',
    contrast: '⚡',
    breaking: '💥',
};

export function TitlePanel() {
    const t = useTranslations('titleGen');
    const { content, titles, selectedTitleId, setTitles, setSelectedTitle } = useAppStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!content) return;
        setIsGenerating(true);
        setError('');

        try {
            const res = await fetch('/api/ai/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No reader');

            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });
            }

            // Find the JSON array in the raw text stream response
            const match = fullText.match(/\[[\s\S]*\]/);
            if (!match) throw new Error('AI 未返回有效的标题列表');

            const parsed = JSON.parse(match[0]) as { title: string; category: string; score: number }[];
            const titleItems: TitleItem[] = parsed.map((t, i) => ({
                id: (i + 1).toString(),
                title: t.title,
                category: t.category || 'emotion',
                score: t.score || 8,
            }));
            setTitles(titleItems);
        } catch (e) {
            setError(e instanceof Error ? e.message : '生成失败，请重试');
        } finally {
            setIsGenerating(false);
        }
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

            {/* Generate Button */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !content}
                    className="btn-primary text-sm"
                >
                    {isGenerating ? (
                        <RefreshCw size={14} className="animate-spin" />
                    ) : (
                        <Sparkles size={14} />
                    )}
                    {isGenerating ? '生成中...' : titles.length ? t('regenerate') : t('generate')}
                </button>
            </div>

            {error && (
                <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            {!content && (
                <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                    提示：先在「正文创作」步骤生成正文，才能生成标题
                </div>
            )}

            {isGenerating && (
                <GenerationLoadingCard
                    text="AI 正在生成标题..."
                    subtext="正在分析正文结构并产出多风格候选标题"
                />
            )}

            {/* Title List */}
            {titles.length > 0 && (
                <div className="space-y-3">
                    {[...titles]
                        .sort((a, b) => b.score - a.score)
                        .map((item, i) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedTitle(item.id)}
                                className="card w-full text-left p-4 transition-all"
                                style={{
                                    borderColor: selectedTitleId === item.id ? 'var(--color-accent)' : undefined,
                                    boxShadow: selectedTitleId === item.id ? '0 0 0 2px var(--color-accent-light)' : undefined,
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                                        style={{
                                            background: i === 0 ? 'var(--color-accent)' : 'var(--color-accent-light)',
                                            color: i === 0 ? 'white' : 'var(--color-accent)',
                                        }}
                                    >
                                        {i === 0 ? <Trophy size={14} /> : i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                                            {item.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-xs">
                                                {categoryIcons[item.category] || '📌'} {t(`categories.${item.category}`)}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--color-accent)' }}>
                                                评分 {item.score}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedTitleId === item.id && (
                                        <span
                                            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                                            style={{ background: 'var(--color-accent)', color: 'white' }}
                                        >
                                            <Check size={12} />
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                </div>
            )}

            {titles.length === 0 && !isGenerating && (
                <div
                    className="card p-12 text-center"
                    style={{ border: '2px dashed var(--color-border)' }}
                >
                    <TypeIcon size={48} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>先完成正文，再来生成标题</p>
                </div>
            )}
        </div>
    );
}

function TypeIcon(props: { size: number; className?: string; style?: React.CSSProperties }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={props.size}
            height={props.size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={props.className}
            style={props.style}
        >
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" x2="15" y1="20" y2="20" />
            <line x1="12" x2="12" y1="4" y2="20" />
        </svg>
    );
}
