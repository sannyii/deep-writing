'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, FileText, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

interface Project {
    id: string;
    title: string;
    status: string;
    updatedAt: string;
}

export function Sidebar() {
    const t = useTranslations();
    const {
        sidebarOpen, toggleSidebar,
        currentProjectId, setCurrentProject,
        setCurrentProjectTitle,
        loadProjectWorkspace,
        projectsVersion,
        setCreatingProject, setActiveTab,
    } = useAppStore();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects, projectsVersion]);

    useEffect(() => {
        if (loading) return;

        if (projects.length === 0) {
            if (currentProjectId) {
                setCurrentProject(null);
                setCurrentProjectTitle('未命名项目');
            }
            return;
        }

        const exists = currentProjectId
            ? projects.some((item) => item.id === currentProjectId)
            : false;
        if (exists) return;

        const firstProject = projects[0];
        setCurrentProject(firstProject.id);
        setCurrentProjectTitle(firstProject.title);
        setActiveTab('materials');
        void loadProjectWorkspace(firstProject.id);
    }, [
        loading,
        projects,
        currentProjectId,
        setCurrentProject,
        setCurrentProjectTitle,
        setActiveTab,
        loadProjectWorkspace,
    ]);

    const handleNewProject = async () => {
        setCreatingProject(true);
        setActiveTab('materials');
        setCurrentProjectTitle('未命名项目');

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const project = await res.json();
                await fetchProjects();
                setCurrentProject(project.id);
                setCurrentProjectTitle(project.title);
                await loadProjectWorkspace(project.id);
            }
        } catch {
            // ignore
        } finally {
            // The creating screen auto-dismisses via its own timer,
            // but ensure it clears if API is faster
            setTimeout(() => setCreatingProject(false), 1800);
        }
    };

    const filteredProjects = searchQuery
        ? projects.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : projects;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return '刚刚';
        if (diffMin < 60) return `${diffMin}分钟前`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}小时前`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 30) return `${diffDay}天前`;
        return d.toLocaleDateString('zh-CN');
    };

    if (!sidebarOpen) {
        return (
            <div
                style={{ background: 'var(--color-sidebar-bg)', borderRight: '1px solid var(--color-border-light)' }}
                className="w-12 flex flex-col items-center pt-4 shrink-0"
            >
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        );
    }

    return (
        <div
            style={{ background: 'var(--color-sidebar-bg)', borderRight: '1px solid var(--color-border-light)' }}
            className="w-64 flex flex-col shrink-0 h-full"
        >
            {/* Logo + Collapse */}
            <div className="flex items-center justify-between p-4 pb-2">
                <Link
                    href="/"
                    className="flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{ textDecoration: 'none' }}
                >
                    <span className="text-xl">✍️</span>
                    <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                        灵境智写
                    </span>
                </Link>
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    <ChevronLeft size={16} />
                </button>
            </div>

            {/* New Project Button */}
            <div className="px-3 py-2">
                <button
                    onClick={handleNewProject}
                    className="btn-primary w-full"
                >
                    <Plus size={18} />
                    {t('nav.newProject')}
                </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2">
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--color-text-muted)' }}
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索项目..."
                        className="input-field pl-8 text-sm"
                        style={{ padding: '0.5rem 0.75rem 0.5rem 2rem' }}
                    />
                </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
                <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {t('nav.projects')}
                </p>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            {searchQuery ? '没有匹配的项目' : '还没有项目，点击上方按钮创建'}
                        </p>
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <button
                            key={project.id}
                            onClick={async () => {
                                setCurrentProject(project.id);
                                setCurrentProjectTitle(project.title);
                                setActiveTab('materials');
                                await loadProjectWorkspace(project.id);
                            }}
                            className={`sidebar-item w-full text-left ${currentProjectId === project.id ? 'active' : ''}`}
                        >
                            <FileText size={16} />
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm">{project.title}</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    {formatDate(project.updatedAt)}
                                </p>
                            </div>
                            {project.status === 'generating' && (
                                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse-soft" />
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
