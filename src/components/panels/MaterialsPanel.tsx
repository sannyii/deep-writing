'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, FileText, Link, Upload, Trash2, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function MaterialsPanel() {
    const t = useTranslations('materials');
    const { materials, addMaterial, removeMaterial, setMaterialImportance } = useAppStore();
    const [showInput, setShowInput] = useState(false);
    const [inputType, setInputType] = useState<'text' | 'url'>('text');
    const [inputName, setInputName] = useState('');
    const [inputContent, setInputContent] = useState('');

    const handleAdd = () => {
        if (!inputContent.trim()) return;
        addMaterial({
            type: inputType,
            name: inputName || `素材 ${materials.length + 1}`,
            content: inputContent,
            importance: 3,
        });
        setInputContent('');
        setInputName('');
        setShowInput(false);
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
                    onClick={() => { setInputType('text'); setShowInput(true); }}
                    className="btn-secondary text-sm"
                >
                    <FileText size={14} />
                    {t('addText')}
                </button>
                <button
                    onClick={() => { setInputType('url'); setShowInput(true); }}
                    className="btn-secondary text-sm"
                >
                    <Link size={14} />
                    {t('addUrl')}
                </button>
                <button className="btn-secondary text-sm">
                    <Upload size={14} />
                    {t('addFile')}
                </button>
            </div>

            {/* Input Area */}
            {showInput && (
                <div className="card p-4 mb-4 fade-in">
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('nameLabel')}
                        </label>
                        <input
                            type="text"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            placeholder={inputType === 'url' ? '参考链接' : '素材名称'}
                            className="input-field text-sm"
                        />
                    </div>
                    <div className="mb-3">
                        <textarea
                            value={inputContent}
                            onChange={(e) => setInputContent(e.target.value)}
                            placeholder={inputType === 'url' ? 'https://...' : t('placeholder')}
                            className="input-field text-sm"
                            rows={inputType === 'url' ? 2 : 8}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="btn-primary text-sm">
                            <Plus size={14} />
                            添加
                        </button>
                        <button onClick={() => setShowInput(false)} className="btn-secondary text-sm">
                            取消
                        </button>
                    </div>
                </div>
            )}

            {/* Material List */}
            {materials.length === 0 && !showInput ? (
                <div
                    className="card p-12 text-center"
                    style={{ border: '2px dashed var(--color-border)' }}
                >
                    <FileText size={48} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>{t('empty')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {materials.map((m) => (
                        <div key={m.id} className="card p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {m.type === 'url' ? <Link size={14} /> : <FileText size={14} />}
                                    <span className="font-medium text-sm">{m.name}</span>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                                    >
                                        {m.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative group flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setMaterialImportance(m.id, s)}
                                                className="p-0.5"
                                            >
                                                <Star
                                                    size={12}
                                                    fill={s <= m.importance ? 'var(--color-accent)' : 'none'}
                                                    color={s <= m.importance ? 'var(--color-accent)' : 'var(--color-text-muted)'}
                                                />
                                            </button>
                                        ))}
                                        <div
                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                                            style={{
                                                background: 'var(--color-text)',
                                                color: 'var(--color-bg)',
                                                boxShadow: '0 2px 8px var(--color-shadow)',
                                            }}
                                        >
                                            重要程度：星级越高，AI 写作时越优先参考此素材
                                            <div
                                                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                                                style={{
                                                    borderLeft: '5px solid transparent',
                                                    borderRight: '5px solid transparent',
                                                    borderTop: '5px solid var(--color-text)',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeMaterial(m.id)}
                                        className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
                                {m.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
