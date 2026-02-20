import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: '请填写邮箱和密码' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: '密码至少6位' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: '邮箱格式不正确' },
                { status: 400 }
            );
        }

        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json(
                { error: '该邮箱已注册' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: email.split('@')[0],
                email,
                password: hashedPassword,
            },
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
        });
    } catch {
        return NextResponse.json(
            { error: '注册失败，请重试' },
            { status: 500 }
        );
    }
}
