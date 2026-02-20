import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

type MilestoneTab = 'materials' | 'style' | 'requirements' | 'outline' | 'content' | 'title';

type WorkspacePayload = {
    materials: Array<{
        id?: string;
        type?: string;
        name?: string;
        content?: string;
        importance?: number;
    }>;
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
    milestoneTab: MilestoneTab;
    outline: string;
    content: string;
    titles: Array<{
        id?: string;
        title?: string;
        category?: string;
        score?: number;
    }>;
    selectedTitleId: string | null;
};

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
}

function isMilestoneTab(value: unknown): value is MilestoneTab {
    return value === 'materials'
        || value === 'style'
        || value === 'requirements'
        || value === 'outline'
        || value === 'content'
        || value === 'title';
}

type StyleFeatures = {
    selectedPreset: string | null;
    requirements: {
        targetWordCount: number;
        audience: string;
        purpose: string;
        customRequirement: string;
    };
    milestoneTab: MilestoneTab;
    hasMilestone: boolean;
};

function getDefaultRequirements() {
    return {
        targetWordCount: 1200,
        audience: '对该主题感兴趣的普通读者',
        purpose: '帮助读者快速理解核心观点，并提供可执行建议',
        customRequirement: '',
    };
}

function readStyleFeatures(extractedFeatures: string | null): StyleFeatures {
    const defaults: StyleFeatures = {
        selectedPreset: null,
        requirements: getDefaultRequirements(),
        milestoneTab: 'materials',
        hasMilestone: false,
    };

    if (!extractedFeatures) return defaults;
    try {
        const parsed = JSON.parse(extractedFeatures) as {
            selectedPreset?: unknown;
            requirements?: {
                targetWordCount?: unknown;
                audience?: unknown;
                purpose?: unknown;
                customRequirement?: unknown;
            };
            milestoneTab?: unknown;
        };

        return {
            selectedPreset: typeof parsed.selectedPreset === 'string'
                ? parsed.selectedPreset
                : null,
            requirements: {
                targetWordCount: clampNumber(parsed.requirements?.targetWordCount, 300, 5000, 1200),
                audience: typeof parsed.requirements?.audience === 'string' && parsed.requirements.audience.trim().length > 0
                    ? parsed.requirements.audience
                    : defaults.requirements.audience,
                purpose: typeof parsed.requirements?.purpose === 'string' && parsed.requirements.purpose.trim().length > 0
                    ? parsed.requirements.purpose
                    : defaults.requirements.purpose,
                customRequirement: typeof parsed.requirements?.customRequirement === 'string'
                    ? parsed.requirements.customRequirement
                    : '',
            },
            milestoneTab: isMilestoneTab(parsed.milestoneTab)
                ? parsed.milestoneTab
                : defaults.milestoneTab,
            hasMilestone: isMilestoneTab(parsed.milestoneTab),
        };
    } catch {
        return defaults;
    }
}

function normalizeWorkspacePayload(input: unknown): WorkspacePayload {
    const raw = (input ?? {}) as Record<string, unknown>;
    const styleRaw = (raw.style ?? {}) as Record<string, unknown>;
    const reqRaw = (raw.requirements ?? {}) as Record<string, unknown>;

    const materials = Array.isArray(raw.materials)
        ? raw.materials.map((item) => {
            const m = (item ?? {}) as Record<string, unknown>;
            const type = m.type === 'url' || m.type === 'file' ? m.type : 'text';
            const name = typeof m.name === 'string' && m.name.trim().length > 0 ? m.name.trim() : '素材';
            return {
                id: typeof m.id === 'string' ? m.id : undefined,
                type,
                name,
                content: typeof m.content === 'string' ? m.content : '',
                importance: clampNumber(m.importance, 1, 5, 3),
            };
        })
        : [];

    const titles = Array.isArray(raw.titles)
        ? raw.titles
            .map((item) => {
                const t = (item ?? {}) as Record<string, unknown>;
                const title = typeof t.title === 'string' ? t.title.trim() : '';
                return {
                    id: typeof t.id === 'string' ? t.id : undefined,
                    title,
                    category: typeof t.category === 'string' ? t.category : 'emotion',
                    score: typeof t.score === 'number' && !Number.isNaN(t.score) ? t.score : 8,
                };
            })
            .filter((item) => item.title.length > 0)
        : [];

    return {
        materials,
        style: {
            selectedPreset: typeof styleRaw.selectedPreset === 'string'
                ? styleRaw.selectedPreset
                : null,
            customStyleText: typeof styleRaw.customStyleText === 'string'
                ? styleRaw.customStyleText
                : '',
            emotionLevel: clampNumber(styleRaw.emotionLevel, 1, 10, 5),
            professionalLevel: clampNumber(styleRaw.professionalLevel, 1, 10, 5),
            colloquialLevel: clampNumber(styleRaw.colloquialLevel, 1, 10, 5),
        },
        requirements: {
            targetWordCount: clampNumber(reqRaw.targetWordCount, 300, 5000, 1200),
            audience: typeof reqRaw.audience === 'string' && reqRaw.audience.trim().length > 0
                ? reqRaw.audience
                : '对该主题感兴趣的普通读者',
            purpose: typeof reqRaw.purpose === 'string' && reqRaw.purpose.trim().length > 0
                ? reqRaw.purpose
                : '帮助读者快速理解核心观点，并提供可执行建议',
            customRequirement: typeof reqRaw.customRequirement === 'string'
                ? reqRaw.customRequirement
                : '',
        },
        milestoneTab: isMilestoneTab(raw.milestoneTab)
            ? raw.milestoneTab
            : 'materials',
        outline: typeof raw.outline === 'string' ? raw.outline : '',
        content: typeof raw.content === 'string' ? raw.content : '',
        titles,
        selectedTitleId: typeof raw.selectedTitleId === 'string' ? raw.selectedTitleId : null,
    };
}

async function assertProjectOwner(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true, title: true },
    });

    return project;
}

// GET /api/projects/[id]/workspace — 获取项目工作台完整数据
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findFirst({
        where: { id, userId: session.user.id },
        include: {
            materials: {
                orderBy: { createdAt: 'asc' },
            },
            style: true,
            outline: true,
            content: true,
            titles: {
                orderBy: { id: 'asc' },
            },
        },
    });

    if (!project) {
        return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    const selectedTitle = project.titles.find((item) => item.isSelected);
    const styleFeatures = readStyleFeatures(project.style?.extractedFeatures ?? null);
    const inferredLegacyMilestone: MilestoneTab = project.content?.body?.trim()
        ? 'content'
        : project.outline?.content?.trim()
            ? 'outline'
            : 'materials';
    const milestoneTab = styleFeatures.hasMilestone
        ? styleFeatures.milestoneTab
        : inferredLegacyMilestone;

    return NextResponse.json({
        project: {
            id: project.id,
            title: project.title,
            status: project.status,
            updatedAt: project.updatedAt,
        },
        workspace: {
            materials: project.materials.map((item) => ({
                id: item.id,
                type: item.type,
                name: item.name,
                content: item.extractedContent ?? item.rawContent ?? item.fileUrl ?? '',
                importance: item.importance,
            })),
            style: {
                selectedPreset: styleFeatures.selectedPreset,
                customStyleText: project.style?.sampleText ?? '',
                emotionLevel: project.style?.emotionLevel ?? 5,
                professionalLevel: project.style?.professionalLevel ?? 5,
                colloquialLevel: project.style?.colloquialLevel ?? 5,
            },
            requirements: styleFeatures.requirements,
            milestoneTab,
            outline: project.outline?.content ?? '',
            content: project.content?.body ?? '',
            titles: project.titles.map((item) => ({
                id: item.id,
                title: item.title,
                category: item.category ?? 'emotion',
                score: item.score ?? 8,
            })),
            selectedTitleId: selectedTitle?.id ?? null,
        },
    });
}

// PUT /api/projects/[id]/workspace — 保存项目工作台完整数据
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const project = await assertProjectOwner(id, session.user.id);

    if (!project) {
        return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const workspace = normalizeWorkspacePayload((body as { workspace?: unknown }).workspace);
    const wordCount = workspace.content.replace(/\s/g, '').length;
    const styleFeatures = JSON.stringify({
        selectedPreset: workspace.style.selectedPreset,
        requirements: workspace.requirements,
        milestoneTab: workspace.milestoneTab,
    });

    await prisma.$transaction(async (tx) => {
        await tx.material.deleteMany({
            where: { projectId: id },
        });

        if (workspace.materials.length > 0) {
            await tx.material.createMany({
                data: workspace.materials.map((item) => ({
                    projectId: id,
                    type: item.type ?? 'text',
                    name: item.name ?? '素材',
                    rawContent: item.content ?? '',
                    extractedContent: item.content ?? '',
                    importance: item.importance ?? 3,
                })),
            });
        }

        await tx.style.upsert({
            where: { projectId: id },
            create: {
                projectId: id,
                sampleText: workspace.style.customStyleText || null,
                extractedFeatures: styleFeatures,
                emotionLevel: workspace.style.emotionLevel,
                professionalLevel: workspace.style.professionalLevel,
                colloquialLevel: workspace.style.colloquialLevel,
            },
            update: {
                sampleText: workspace.style.customStyleText || null,
                extractedFeatures: styleFeatures,
                emotionLevel: workspace.style.emotionLevel,
                professionalLevel: workspace.style.professionalLevel,
                colloquialLevel: workspace.style.colloquialLevel,
            },
        });

        await tx.outline.upsert({
            where: { projectId: id },
            create: {
                projectId: id,
                content: workspace.outline || null,
                isAiGenerated: false,
            },
            update: {
                content: workspace.outline || null,
            },
        });

        await tx.content.upsert({
            where: { projectId: id },
            create: {
                projectId: id,
                body: workspace.content || null,
                wordCount,
                generatedAt: workspace.content ? new Date() : null,
            },
            update: {
                body: workspace.content || null,
                wordCount,
                generatedAt: workspace.content ? new Date() : null,
            },
        });

        await tx.titleOption.deleteMany({
            where: { projectId: id },
        });

        if (workspace.titles.length > 0) {
            await tx.titleOption.createMany({
                data: workspace.titles.map((item) => ({
                    projectId: id,
                    title: item.title ?? '',
                    category: item.category ?? 'emotion',
                    score: item.score ?? 8,
                    isSelected: item.id === workspace.selectedTitleId,
                })),
            });
        }

        await tx.project.update({
            where: { id },
            data: { title: project.title },
        });
    });

    return NextResponse.json({ ok: true });
}
