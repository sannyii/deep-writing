import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PATCH /api/projects/[id] — 更新项目信息
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Ensure the project belongs to the current user
    const project = await prisma.project.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!project) {
        return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    const updated = await prisma.project.update({
        where: { id },
        data: {
            ...(body.title !== undefined && { title: body.title }),
        },
        select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
        },
    });

    return NextResponse.json(updated);
}
