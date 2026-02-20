'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { WorkflowTabs } from '@/components/WorkflowTabs';
import { MaterialsPanel } from '@/components/panels/MaterialsPanel';
import { StylePanel } from '@/components/panels/StylePanel';
import { RequirementsPanel } from '@/components/panels/RequirementsPanel';
import { OutlinePanel } from '@/components/panels/OutlinePanel';
import { ContentPanel } from '@/components/panels/ContentPanel';
import { TitlePanel } from '@/components/panels/TitlePanel';
import { Feather, ArrowRight, Loader2 } from 'lucide-react';

const panelMap = {
    materials: MaterialsPanel,
    style: StylePanel,
    requirements: RequirementsPanel,
    outline: OutlinePanel,
    content: ContentPanel,
    title: TitlePanel,
};

function CreatingProjectScreen() {
    const [step, setStep] = useState(0);

    const steps = [
        '正在初始化项目空间...',
        '准备写作工具...',
        '一切就绪，开始创作吧!',
    ];

    useEffect(() => {
        const t1 = setTimeout(() => setStep(1), 600);
        const t2 = setTimeout(() => setStep(2), 1200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center fade-in">
                {/* Animated feather icon */}
                <div
                    className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                        background: 'var(--color-accent-light)',
                        animation: 'featherWrite 1.5s ease-in-out infinite',
                    }}
                >
                    <Feather size={32} style={{ color: 'var(--color-accent)' }} />
                </div>

                <h2
                    className="text-xl font-bold mb-2"
                    style={{ color: 'var(--color-text)' }}
                >
                    新建项目
                </h2>

                {/* Step indicators */}
                <div className="space-y-2 mt-4">
                    {steps.map((text, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-center gap-2 transition-all"
                            style={{
                                opacity: i <= step ? 1 : 0,
                                transform: i <= step ? 'translateY(0)' : 'translateY(8px)',
                                transition: 'opacity 0.3s, transform 0.3s',
                            }}
                        >
                            {i < step ? (
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                                    style={{ background: 'var(--color-accent)', color: 'white' }}
                                >
                                    &#10003;
                                </span>
                            ) : i === step ? (
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center"
                                    style={{ border: '2px solid var(--color-accent)' }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: 'var(--color-accent)', animation: 'pulse-soft 1s ease-in-out infinite' }}
                                    />
                                </span>
                            ) : (
                                <span
                                    className="w-5 h-5 rounded-full"
                                    style={{ border: '2px solid var(--color-border)' }}
                                />
                            )}
                            <span
                                className="text-sm"
                                style={{
                                    color: i <= step ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                                    fontWeight: i === step ? 600 : 400,
                                }}
                            >
                                {text}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="mt-6 w-48 mx-auto">
                    <div className="progress-bar">
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${((step + 1) / steps.length) * 100}%`,
                                transition: 'width 0.5s ease',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

const tabOrder: Array<'materials' | 'style' | 'requirements' | 'outline' | 'content' | 'title'> = [
    'materials', 'style', 'requirements', 'outline', 'content', 'title',
];

const tabLabels: Record<string, string> = {
    materials: '素材',
    style: '风格',
    requirements: '要求',
    outline: '大纲',
    content: '正文',
    title: '标题',
};

function NextStepButton() {
    const {
        activeTab, setActiveTab,
        setMilestoneTab,
        materials, selectedPreset, customStyleText,
        targetWordCount, audience, purpose,
        outline, content, selectedTitleId,
    } = useAppStore();

    const currentIndex = tabOrder.indexOf(activeTab);
    const isLastStep = currentIndex === tabOrder.length - 1;

    // Determine if current step has content
    const canProceed = (() => {
        switch (activeTab) {
            case 'materials': return materials.length > 0;
            case 'style': return selectedPreset !== null || customStyleText.trim().length > 0;
            case 'requirements': return targetWordCount > 0 && audience.trim().length > 0 && purpose.trim().length > 0;
            case 'outline': return outline.trim().length > 0;
            case 'content': return content.trim().length > 0;
            case 'title': return selectedTitleId !== null;
        }
    })();

    if (isLastStep) return null;

    const nextTab = tabOrder[currentIndex + 1];

    return (
        <div className="flex flex-col items-end">
            <button
                onClick={() => {
                    if (!canProceed) return;
                    setMilestoneTab(nextTab);
                    setActiveTab(nextTab);
                }}
                disabled={!canProceed}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                    background: canProceed
                        ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))'
                        : 'var(--color-bg-tertiary)',
                    color: canProceed ? 'white' : 'var(--color-text-muted)',
                    cursor: canProceed ? 'pointer' : 'not-allowed',
                    boxShadow: canProceed ? '0 4px 16px var(--color-shadow)' : 'none',
                    border: 'none',
                    opacity: canProceed ? 1 : 0.7,
                }}
            >
                下一步: {tabLabels[nextTab]}
                <ArrowRight size={16} />
            </button>
        </div>
    );
}

export default function WritePage() {
    const {
        activeTab,
        creatingProject,
        currentProjectId,
        workspaceLoading,
        workspaceDirty,
        workspaceReadyProjectId,
        workspaceRevision,
        loadProjectWorkspace,
        saveProjectWorkspace,
    } = useAppStore();
    const ActivePanel = panelMap[activeTab];

    useEffect(() => {
        if (!currentProjectId) return;
        if (workspaceLoading) return;
        if (workspaceReadyProjectId === currentProjectId) return;
        void loadProjectWorkspace(currentProjectId);
    }, [
        currentProjectId,
        workspaceLoading,
        workspaceReadyProjectId,
        loadProjectWorkspace,
    ]);

    useEffect(() => {
        if (!currentProjectId) return;
        if (workspaceLoading) return;
        if (!workspaceDirty) return;
        if (workspaceReadyProjectId !== currentProjectId) return;

        const timer = setTimeout(() => {
            void saveProjectWorkspace();
        }, 800);

        return () => clearTimeout(timer);
    }, [
        currentProjectId,
        workspaceLoading,
        workspaceDirty,
        workspaceReadyProjectId,
        workspaceRevision,
        saveProjectWorkspace,
    ]);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {creatingProject ? (
                    <CreatingProjectScreen />
                ) : (
                    <>
                        <Header />
                        <WorkflowTabs />
                        <div className="flex-1 overflow-y-auto relative">
                            {!currentProjectId ? (
                                <div className="h-full flex items-center justify-center px-6">
                                    <div className="text-center fade-in">
                                        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                                            请选择一个项目
                                        </h2>
                                        <p style={{ color: 'var(--color-text-muted)' }}>
                                            在左侧创建或点击项目后，右侧会加载对应工作台
                                        </p>
                                    </div>
                                </div>
                            ) : workspaceLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span className="text-sm">正在切换项目工作台...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="max-w-4xl mx-auto pb-10 relative">
                                        <div className="absolute top-3 right-6 z-10">
                                            <NextStepButton />
                                        </div>
                                        <ActivePanel />
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
