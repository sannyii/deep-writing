'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, LogOut, Pencil, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
    const t = useTranslations();
    const {
        currentProjectId, currentProjectTitle, setCurrentProjectTitle,
        workspaceLoading, workspaceSaving, workspaceDirty,
        bumpProjectsVersion,
    } = useAppStore();
    const { data: session } = useSession();

    const [editing, setEditing] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [draft, setDraft] = useState(currentProjectTitle);
    const inputRef = useRef<HTMLInputElement>(null);

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || '?';
    const initial = userName.charAt(0).toUpperCase();
    const isEditing = editing && editingProjectId === currentProjectId;
    const syncStatus = (() => {
        if (!currentProjectId) return null;
        if (workspaceLoading) return { text: '切换中', color: 'var(--color-text-muted)', loading: true };
        if (workspaceSaving) return { text: '保存中', color: 'var(--color-accent)', loading: true };
        if (workspaceDirty) return { text: '未保存', color: '#b45309', loading: false };
        return { text: '已保存', color: '#16a34a', loading: false };
    })();

    const startEditing = () => {
        setDraft(currentProjectTitle);
        setEditing(true);
        setEditingProjectId(currentProjectId);
        setTimeout(() => inputRef.current?.select(), 0);
    };

    const saveTitle = async () => {
        const targetProjectId = editingProjectId;
        const trimmed = draft.trim() || '未命名项目';
        setEditing(false);
        setEditingProjectId(null);

        if (!targetProjectId || targetProjectId !== currentProjectId) {
            return;
        }

        setCurrentProjectTitle(trimmed);

        if (targetProjectId) {
            await fetch(`/api/projects/${targetProjectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: trimmed }),
            });
            bumpProjectsVersion();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveTitle();
        } else if (e.key === 'Escape') {
            setDraft(currentProjectTitle);
            setEditing(false);
            setEditingProjectId(null);
        }
    };

    return (
        <header
            className="glass-panel flex items-center justify-between px-6 py-2.5 shrink-0"
        >
            {/* Left - Project Title (editable) */}
            <div className="flex items-center gap-2 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={handleKeyDown}
                            className="text-base font-semibold bg-transparent outline-none px-1.5 py-0.5 rounded-lg"
                            style={{
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-accent)',
                                boxShadow: '0 0 0 3px var(--color-accent-light)',
                                minWidth: '120px',
                                maxWidth: '320px',
                            }}
                            autoFocus
                        />
                        <button
                            onClick={saveTitle}
                            className="p-1 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
                            style={{ color: 'var(--color-accent)' }}
                        >
                            <Check size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={startEditing}
                        className="flex items-center gap-2 group px-1.5 py-0.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
                        style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                        <h1
                            className="text-base font-semibold truncate"
                            style={{ color: 'var(--color-text)', maxWidth: '320px' }}
                        >
                            {currentProjectTitle}
                        </h1>
                        <Pencil
                            size={13}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--color-text-muted)' }}
                        />
                    </button>
                )}
                <span
                    className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                >
                    草稿
                </span>
                {syncStatus && (
                    <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                        style={{
                            background: 'var(--color-bg-secondary)',
                            color: syncStatus.color,
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        {syncStatus.loading ? (
                            <Loader2 size={11} className="animate-spin" />
                        ) : (
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: syncStatus.color }}
                            />
                        )}
                        {syncStatus.text}
                    </span>
                )}
            </div>

            {/* Right - Controls */}
            <div className="flex items-center gap-2">
                <button
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <Settings size={16} />
                </button>

                {session?.user && (
                    <div className="flex items-center gap-2 ml-1">
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                        >
                            {initial}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {userName}
                        </span>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
                            style={{ color: 'var(--color-text-muted)' }}
                            title={t('nav.logout')}
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
