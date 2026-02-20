import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeName } from './themes';

// --- Shared types ---

export interface MaterialItem {
    id: string;
    type: 'text' | 'url' | 'file';
    name: string;
    content: string;
    importance: number;
}

export interface TitleItem {
    id: string;
    title: string;
    category: string;
    score: number;
}

export interface ProjectWorkspaceSnapshot {
    materials: MaterialItem[];
    style: {
        selectedPreset: string | null;
        customStyleText: string;
        emotionLevel: number;
        professionalLevel: number;
        colloquialLevel: number;
    };
    requirements: {
        targetWordCount: number;
        audience: string;
        purpose: string;
        customRequirement: string;
    };
    milestoneTab: AppTab;
    outline: string;
    content: string;
    titles: TitleItem[];
    selectedTitleId: string | null;
}

type AppTab = 'materials' | 'style' | 'requirements' | 'outline' | 'content' | 'title';

const WORKFLOW_TAB_ORDER: AppTab[] = [
    'materials',
    'style',
    'requirements',
    'outline',
    'content',
    'title',
];

function isAppTab(value: unknown): value is AppTab {
    return typeof value === 'string' && WORKFLOW_TAB_ORDER.includes(value as AppTab);
}

function getLaterTab(a: AppTab, b: AppTab): AppTab {
    const aIndex = WORKFLOW_TAB_ORDER.indexOf(a);
    const bIndex = WORKFLOW_TAB_ORDER.indexOf(b);
    return bIndex > aIndex ? b : a;
}

function getDefaultWorkspace(): ProjectWorkspaceSnapshot {
    return {
        materials: [],
        style: {
            selectedPreset: null,
            customStyleText: '',
            emotionLevel: 5,
            professionalLevel: 5,
            colloquialLevel: 5,
        },
        requirements: {
            targetWordCount: 1200,
            audience: '对该主题感兴趣的普通读者',
            purpose: '帮助读者快速理解核心观点，并提供可执行建议',
            customRequirement: '',
        },
        milestoneTab: 'materials',
        outline: '',
        content: '',
        titles: [],
        selectedTitleId: null,
    };
}

function toWorkspaceFields(workspace: ProjectWorkspaceSnapshot) {
    return {
        materials: workspace.materials,
        selectedPreset: workspace.style.selectedPreset,
        customStyleText: workspace.style.customStyleText,
        emotionLevel: workspace.style.emotionLevel,
        professionalLevel: workspace.style.professionalLevel,
        colloquialLevel: workspace.style.colloquialLevel,
        targetWordCount: workspace.requirements.targetWordCount,
        audience: workspace.requirements.audience,
        purpose: workspace.requirements.purpose,
        customRequirement: workspace.requirements.customRequirement,
        milestoneTab: workspace.milestoneTab,
        outline: workspace.outline,
        content: workspace.content,
        titles: workspace.titles,
        selectedTitleId: workspace.selectedTitleId,
    };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeWorkspace(input: unknown): ProjectWorkspaceSnapshot {
    const raw = (input ?? {}) as Record<string, unknown>;
    const style = (raw.style ?? {}) as Record<string, unknown>;
    const requirements = (raw.requirements ?? {}) as Record<string, unknown>;

    const materials = Array.isArray(raw.materials)
        ? raw.materials.map((item, index) => {
            const m = (item ?? {}) as Record<string, unknown>;
            const type = m.type === 'url' || m.type === 'file' ? m.type : 'text';
            const name = typeof m.name === 'string' && m.name.trim().length > 0
                ? m.name.trim()
                : `素材 ${index + 1}`;
            return {
                id: typeof m.id === 'string' && m.id.length > 0 ? m.id : `material-${index + 1}`,
                type,
                name,
                content: typeof m.content === 'string' ? m.content : '',
                importance: clampNumber(m.importance, 1, 5, 3),
            } satisfies MaterialItem;
        })
        : [];

    const titles = Array.isArray(raw.titles)
        ? raw.titles.map((item, index) => {
            const t = (item ?? {}) as Record<string, unknown>;
            return {
                id: typeof t.id === 'string' && t.id.length > 0 ? t.id : `title-${index + 1}`,
                title: typeof t.title === 'string' ? t.title : '',
                category: typeof t.category === 'string' ? t.category : 'emotion',
                score: typeof t.score === 'number' && !Number.isNaN(t.score) ? t.score : 8,
            } satisfies TitleItem;
        }).filter((item) => item.title.trim().length > 0)
        : [];

    const selectedTitleId = typeof raw.selectedTitleId === 'string' ? raw.selectedTitleId : null;
    const outline = typeof raw.outline === 'string' ? raw.outline : '';
    const content = typeof raw.content === 'string' ? raw.content : '';

    const milestoneTab = isAppTab(raw.milestoneTab)
        ? raw.milestoneTab
        : (content.trim().length > 0
            ? 'content'
            : outline.trim().length > 0
                ? 'outline'
                : 'materials');

    return {
        materials,
        style: {
            selectedPreset: typeof style.selectedPreset === 'string' ? style.selectedPreset : null,
            customStyleText: typeof style.customStyleText === 'string' ? style.customStyleText : '',
            emotionLevel: clampNumber(style.emotionLevel, 1, 10, 5),
            professionalLevel: clampNumber(style.professionalLevel, 1, 10, 5),
            colloquialLevel: clampNumber(style.colloquialLevel, 1, 10, 5),
        },
        requirements: {
            targetWordCount: clampNumber(requirements.targetWordCount, 300, 5000, 1200),
            audience: typeof requirements.audience === 'string' && requirements.audience.trim().length > 0
                ? requirements.audience
                : '对该主题感兴趣的普通读者',
            purpose: typeof requirements.purpose === 'string' && requirements.purpose.trim().length > 0
                ? requirements.purpose
                : '帮助读者快速理解核心观点，并提供可执行建议',
            customRequirement: typeof requirements.customRequirement === 'string'
                ? requirements.customRequirement
                : '',
        },
        milestoneTab,
        outline,
        content,
        titles,
        selectedTitleId: selectedTitleId && titles.some((item) => item.id === selectedTitleId)
            ? selectedTitleId
            : null,
    };
}

// --- Store ---

interface AppState {
    // UI state
    theme: ThemeName;
    locale: 'zh' | 'en';
    sidebarOpen: boolean;
    currentProjectId: string | null;
    currentProjectTitle: string;
    projectsVersion: number;
    creatingProject: boolean;
    activeTab: AppTab;
    workspaceLoading: boolean;
    workspaceSaving: boolean;
    workspaceDirty: boolean;
    workspaceReadyProjectId: string | null;
    workspaceRevision: number;
    milestoneTab: AppTab;

    // Materials
    materials: MaterialItem[];
    addMaterial: (item: Omit<MaterialItem, 'id'>) => void;
    removeMaterial: (id: string) => void;
    setMaterialImportance: (id: string, importance: number) => void;

    // Style
    selectedPreset: string | null;
    customStyleText: string;
    emotionLevel: number;
    professionalLevel: number;
    colloquialLevel: number;
    targetWordCount: number;
    audience: string;
    purpose: string;
    customRequirement: string;
    setSelectedPreset: (id: string | null) => void;
    setCustomStyleText: (text: string) => void;
    setEmotionLevel: (v: number) => void;
    setProfessionalLevel: (v: number) => void;
    setColloquialLevel: (v: number) => void;
    setTargetWordCount: (v: number) => void;
    setAudience: (text: string) => void;
    setPurpose: (text: string) => void;
    setCustomRequirement: (text: string) => void;

    // Outline
    outline: string;
    setOutline: (text: string) => void;

    // Content
    content: string;
    setContent: (text: string) => void;

    // Titles
    titles: TitleItem[];
    selectedTitleId: string | null;
    setTitles: (titles: TitleItem[]) => void;
    setSelectedTitle: (id: string | null) => void;

    // UI actions
    setTheme: (theme: ThemeName) => void;
    setLocale: (locale: 'zh' | 'en') => void;
    toggleSidebar: () => void;
    setCurrentProject: (id: string | null) => void;
    setCurrentProjectTitle: (title: string) => void;
    clearWorkspace: () => void;
    loadProjectWorkspace: (projectId: string) => Promise<void>;
    saveProjectWorkspace: () => Promise<boolean>;
    bumpProjectsVersion: () => void;
    setCreatingProject: (v: boolean) => void;
    setActiveTab: (tab: AppTab) => void;
    setMilestoneTab: (tab: AppTab) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // UI state
            theme: 'warm_paper',
            locale: 'zh',
            sidebarOpen: true,
            currentProjectId: null,
            currentProjectTitle: '未命名项目',
            projectsVersion: 0,
            creatingProject: false,
            activeTab: 'materials',
            workspaceLoading: false,
            workspaceSaving: false,
            workspaceDirty: false,
            workspaceReadyProjectId: null,
            workspaceRevision: 0,
            milestoneTab: 'materials',

            // Materials
            materials: [],
            addMaterial: (item) =>
                set((s) => ({
                    materials: [...s.materials, { ...item, id: Date.now().toString() }],
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            removeMaterial: (id) =>
                set((s) => ({
                    materials: s.materials.filter((m) => m.id !== id),
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setMaterialImportance: (id, importance) =>
                set((s) => ({
                    materials: s.materials.map((m) =>
                        m.id === id ? { ...m, importance } : m
                    ),
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),

            // Style
            selectedPreset: null,
            customStyleText: '',
            emotionLevel: 5,
            professionalLevel: 5,
            colloquialLevel: 5,
            targetWordCount: 1200,
            audience: '对该主题感兴趣的普通读者',
            purpose: '帮助读者快速理解核心观点，并提供可执行建议',
            customRequirement: '',
            setSelectedPreset: (id) =>
                set((s) => ({
                    selectedPreset: id,
                    customStyleText: '',
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setCustomStyleText: (text) =>
                set((s) => ({
                    customStyleText: text,
                    selectedPreset: null,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setEmotionLevel: (v) =>
                set((s) => ({
                    emotionLevel: v,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setProfessionalLevel: (v) =>
                set((s) => ({
                    professionalLevel: v,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setColloquialLevel: (v) =>
                set((s) => ({
                    colloquialLevel: v,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setTargetWordCount: (v) =>
                set((s) => ({
                    targetWordCount: Math.max(300, Math.min(5000, Math.round(v || 0))),
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setAudience: (text) =>
                set((s) => ({
                    audience: text,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setPurpose: (text) =>
                set((s) => ({
                    purpose: text,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setCustomRequirement: (text) =>
                set((s) => ({
                    customRequirement: text,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),

            // Outline
            outline: '',
            setOutline: (text) =>
                set((s) => ({
                    outline: text,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),

            // Content
            content: '',
            setContent: (text) =>
                set((s) => ({
                    content: text,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),

            // Titles
            titles: [],
            selectedTitleId: null,
            setTitles: (titles) =>
                set((s) => ({
                    titles,
                    selectedTitleId: titles.some((item) => item.id === s.selectedTitleId)
                        ? s.selectedTitleId
                        : null,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),
            setSelectedTitle: (id) =>
                set((s) => ({
                    selectedTitleId: id,
                    workspaceDirty: true,
                    workspaceRevision: s.workspaceRevision + 1,
                })),

            // UI actions
            setTheme: (theme) => set({ theme }),
            setLocale: (locale) => set({ locale }),
            toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
            setCurrentProject: (id) =>
                set((s) => {
                    if (s.currentProjectId === id) {
                        return { currentProjectId: id };
                    }
                    const workspace = getDefaultWorkspace();
                    return {
                        currentProjectId: id,
                        activeTab: 'materials',
                        ...toWorkspaceFields(workspace),
                        workspaceLoading: id !== null,
                        workspaceSaving: false,
                        workspaceDirty: false,
                        workspaceReadyProjectId: null,
                        workspaceRevision: s.workspaceRevision + 1,
                    };
                }),
            setCurrentProjectTitle: (title) => set({ currentProjectTitle: title }),
            clearWorkspace: () =>
                set((s) => {
                    const workspace = getDefaultWorkspace();
                    return {
                        ...toWorkspaceFields(workspace),
                        workspaceLoading: false,
                        workspaceSaving: false,
                        workspaceDirty: false,
                        workspaceReadyProjectId: null,
                        workspaceRevision: s.workspaceRevision + 1,
                    };
                }),
            loadProjectWorkspace: async (projectId) => {
                set((s) => (
                    s.currentProjectId === projectId
                        ? { workspaceLoading: true, workspaceReadyProjectId: null }
                        : {}
                ));

                try {
                    const res = await fetch(`/api/projects/${projectId}/workspace`, {
                        method: 'GET',
                        cache: 'no-store',
                    });
                    if (!res.ok) {
                        throw new Error(`Load failed: ${res.status}`);
                    }

                    const data = await res.json() as {
                        project?: { title?: string };
                        workspace?: unknown;
                    };
                    const workspace = normalizeWorkspace(data.workspace);

                    set((s) => {
                        if (s.currentProjectId !== projectId) {
                            return {};
                        }

                        return {
                            ...toWorkspaceFields(workspace),
                            activeTab: workspace.milestoneTab,
                            currentProjectTitle: typeof data.project?.title === 'string'
                                ? data.project.title
                                : s.currentProjectTitle,
                            workspaceLoading: false,
                            workspaceDirty: false,
                            workspaceReadyProjectId: projectId,
                        };
                    });
                } catch {
                    set((s) => (
                        s.currentProjectId === projectId
                            ? {
                                workspaceLoading: false,
                                workspaceReadyProjectId: projectId,
                            }
                            : {}
                    ));
                }
            },
            saveProjectWorkspace: async () => {
                const state = get();
                const projectId = state.currentProjectId;
                if (!projectId || state.workspaceLoading) {
                    return false;
                }

                const payload = {
                    workspace: {
                        materials: state.materials,
                        style: {
                            selectedPreset: state.selectedPreset,
                            customStyleText: state.customStyleText,
                            emotionLevel: state.emotionLevel,
                            professionalLevel: state.professionalLevel,
                            colloquialLevel: state.colloquialLevel,
                        },
                        requirements: {
                            targetWordCount: state.targetWordCount,
                            audience: state.audience,
                            purpose: state.purpose,
                            customRequirement: state.customRequirement,
                        },
                        milestoneTab: state.milestoneTab,
                        outline: state.outline,
                        content: state.content,
                        titles: state.titles,
                        selectedTitleId: state.selectedTitleId,
                    },
                };

                set({ workspaceSaving: true });

                try {
                    const res = await fetch(`/api/projects/${projectId}/workspace`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    if (!res.ok) {
                        throw new Error(`Save failed: ${res.status}`);
                    }

                    set((s) => (
                        s.currentProjectId === projectId
                            ? {
                                workspaceSaving: false,
                                workspaceDirty: false,
                                workspaceReadyProjectId: projectId,
                            }
                            : { workspaceSaving: false }
                    ));
                    return true;
                } catch {
                    set({ workspaceSaving: false });
                    return false;
                }
            },
            bumpProjectsVersion: () => set((s) => ({ projectsVersion: s.projectsVersion + 1 })),
            setCreatingProject: (v) => set({ creatingProject: v }),
            setActiveTab: (tab) => set({ activeTab: tab }),
            setMilestoneTab: (tab) =>
                set((s) => {
                    const nextMilestone = getLaterTab(s.milestoneTab, tab);
                    if (nextMilestone === s.milestoneTab) {
                        return { milestoneTab: s.milestoneTab };
                    }
                    return {
                        milestoneTab: nextMilestone,
                        workspaceDirty: true,
                        workspaceRevision: s.workspaceRevision + 1,
                    };
                }),
        }),
        {
            name: 'deepwriting-store',
            partialize: (state) => ({
                theme: state.theme,
                locale: state.locale,
                sidebarOpen: state.sidebarOpen,
                currentProjectId: state.currentProjectId,
                currentProjectTitle: state.currentProjectTitle,
                activeTab: state.activeTab,
            }),
        }
    )
);
