import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/projects — 获取当前用户的项目列表
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
        },
    });

    return NextResponse.json(projects);
}

// POST /api/projects — 新建项目
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title || '未命名项目';

    const project = await prisma.project.create({
        data: {
            userId: session.user.id,
            title,
        },
        select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
        },
    });

    return NextResponse.json(project);
}
