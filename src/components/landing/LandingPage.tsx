'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { PenTool, Sparkles, Feather, Palette, List, Zap, Shield, ArrowRight, Quote, FileText, CheckCircle2, ChevronDown, Check, Type as TypeIcon } from 'lucide-react';
import { WritingCanvas } from '@/components/landing/WritingCanvas';

function usePenScratchSound() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initedRef = useRef(false);

    useEffect(() => {
        // Initialize immediately on mount to prevent lag on first movement
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // White noise buffer — lighter, crisper base for pen scratch
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        // Cut low frequencies — remove the heavy rumble
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2800;
        hp.Q.value = 0.3;

        // Mid-high band: light scratch texture (3000-5500 Hz)
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 4200;
        bp.Q.value = 0.8;

        // Airy top layer: delicate paper crinkle (6000-9000 Hz)
        const bpHigh = ctx.createBiquadFilter();
        bpHigh.type = 'bandpass';
        bpHigh.frequency.value = 7500;
        bpHigh.Q.value = 1.0;

        const highGain = ctx.createGain();
        highGain.gain.value = 0.35;

        // Master gain — starts silent
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gainRef.current = gain;

        // Main scratch path
        noise.connect(hp);
        hp.connect(bp);
        bp.connect(gain);

        // Airy crinkle path
        noise.connect(bpHigh);
        bpHigh.connect(highGain);
        highGain.connect(gain);

        gain.connect(ctx.destination);
        noise.start();

        initedRef.current = true;

        return () => {
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
            ctx.close();
        };
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!initedRef.current) return;

        const ctx = audioCtxRef.current;
        const gain = gainRef.current;
        if (!ctx || !gain) return;

        // Browsers block audio unless there's a user gesture, but we attempt to resume
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => { });
        }

        const dx = e.clientX - lastPosRef.current.x;
        const dy = e.clientY - lastPosRef.current.y;
        const speed = Math.sqrt(dx * dx + dy * dy);
        lastPosRef.current = { x: e.clientX, y: e.clientY };

        // Increased sensitivity: speed / 15 instead of 30, max volume 0.7
        const vol = Math.min(speed / 15, 1) * 0.7;

        // Instantaneous response: 0.03s ramp instead of 0.08s
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.03);

        // Fade out smoothly when mouse stops
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = setTimeout(() => {
            if (gain && ctx) {
                gain.gain.cancelScheduledValues(ctx.currentTime);
                // Faster fade out to feel more responsive when stopping
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
            }
        }, 40);
    }, []);

    const unlockAudio = useCallback(() => {
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => { });
        }
    }, []);

    return { onMouseMove, unlockAudio };
}

const features = [
    {
        icon: '📄',
        title: '素材聚合',
        titleEn: 'Materials',
        desc: '粘贴文本、URL、上传文件——AI为你提取关键信息',
        delay: 0,
    },
    {
        icon: '🎨',
        title: '风格定义',
        titleEn: 'Style',
        desc: '8种预设风格，或上传范文让AI学习你的语感',
        delay: 100,
    },
    {
        icon: '📋',
        title: '智能大纲',
        titleEn: 'Outline',
        desc: '一键生成文章骨架，自由调整章节结构',
        delay: 200,
    },
    {
        icon: '✍️',
        title: '正文创作',
        titleEn: 'Content',
        desc: '基于素材、风格和大纲，AI为你流式生成全文',
        delay: 300,
    },
    {
        icon: '💡',
        title: '标题灵感',
        titleEn: 'Title',
        desc: '10+候选标题，分类评分，点击即选',
        delay: 400,
    },
];

const testimonials = [
    { text: '用了灵境智写之后，写一篇深度技术分析从3天缩短到2小时。', author: '— 某科技媒体编辑' },
    { text: '风格模仿功能太神了，AI写出来的东西比我自己写的还像我。', author: '— 自媒体博主' },
    { text: '素材管理+大纲生成，让我终于告别了面对空白页面的恐惧。', author: '— 内容创作者' },
];

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [typedText, setTypedText] = useState('');
    const fullText = '让文字，自然流淌';
    const { onMouseMove, unlockAudio } = usePenScratchSound();

    useEffect(() => {
        setMounted(true);

        // Typewriter effect for hero
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i <= fullText.length) {
                setTypedText(fullText.slice(0, i));
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, 120);

        // Auto-rotate testimonials
        const testimonialInterval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 4000);

        return () => {
            clearInterval(typeInterval);
            clearInterval(testimonialInterval);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div
            className="landing-page"
            onMouseMove={onMouseMove}
            onPointerDown={unlockAudio}
            onTouchStart={unlockAudio}
            style={{
                cursor: 'url(/pen-cursor.svg) 4 28, default',
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Particle Canvas Background */}
            <WritingCanvas />

            {/* Navigation */}
            <nav
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    padding: '1.25rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(253, 246, 227, 0.7)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(232, 213, 181, 0.3)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Feather size={22} style={{ color: '#D4A853' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3D2E1C', letterSpacing: '-0.02em' }}>
                        灵境智写
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <a href="#features" style={{ fontSize: '0.875rem', color: '#7C6A53', textDecoration: 'none', transition: 'color 0.2s' }}>功能</a>
                    <a href="#workflow" style={{ fontSize: '0.875rem', color: '#7C6A53', textDecoration: 'none' }}>工作流</a>
                    <a href="#testimonials" style={{ fontSize: '0.875rem', color: '#7C6A53', textDecoration: 'none' }}>口碑</a>
                    <a
                        href="/auth"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.5rem 1.25rem',
                            background: '#D4A853',
                            color: 'white',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 2px 12px rgba(212, 168, 83, 0.3)',
                            transition: 'all 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        开始创作 <ArrowRight size={14} />
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <section
                style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '6rem 2rem 4rem',
                    textAlign: 'center',
                }}
            >
                {/* Decorative elements */}
                <div
                    style={{
                        position: 'absolute',
                        top: '15%',
                        left: '8%',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(212, 168, 83, 0.08) 0%, transparent 70%)',
                        animation: 'float 8s ease-in-out infinite',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '10%',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(212, 168, 83, 0.06) 0%, transparent 70%)',
                        animation: 'float 10s ease-in-out infinite reverse',
                    }}
                />

                {/* Badge */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        background: 'rgba(212, 168, 83, 0.1)',
                        border: '1px solid rgba(212, 168, 83, 0.2)',
                        marginBottom: '2rem',
                        animation: 'fadeSlideUp 0.8s ease-out',
                    }}
                >
                    <Sparkles size={14} style={{ color: '#D4A853' }} />
                    <span style={{ fontSize: '0.8rem', color: '#8B6914', fontWeight: 500 }}>
                        AI驱动 · 风格可控 · 全流程辅助
                    </span>
                </div>

                {/* Main heading with typewriter */}
                <h1
                    style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                        fontWeight: 700,
                        color: '#3D2E1C',
                        lineHeight: 1.15,
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.03em',
                        animation: 'fadeSlideUp 0.8s ease-out 0.2s both',
                    }}
                >
                    {typedText}
                    <span
                        style={{
                            display: 'inline-block',
                            width: '3px',
                            height: '1em',
                            background: '#D4A853',
                            marginLeft: '4px',
                            animation: 'blink 1s step-end infinite',
                            verticalAlign: 'text-bottom',
                        }}
                    />
                </h1>

                <p
                    style={{
                        fontSize: 'clamp(1rem, 2vw, 1.35rem)',
                        color: '#7C6A53',
                        maxWidth: '600px',
                        lineHeight: 1.7,
                        marginBottom: '3rem',
                        animation: 'fadeSlideUp 0.8s ease-out 0.5s both',
                        fontWeight: 400,
                    }}
                >
                    从<em style={{ color: '#D4A853', fontStyle: 'normal', fontWeight: 600 }}>素材</em>到
                    <em style={{ color: '#D4A853', fontStyle: 'normal', fontWeight: 600 }}>成文</em>，
                    五步流水线，一支AI妙笔<br />
                    你负责想法，灵境智写帮你落笔成章
                </p>

                {/* CTA Buttons */}
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        animation: 'fadeSlideUp 0.8s ease-out 0.7s both',
                    }}
                >
                    <a
                        href="/auth"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.875rem 2rem',
                            background: 'linear-gradient(135deg, #D4A853 0%, #C49540 100%)',
                            color: 'white',
                            borderRadius: '1rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 4px 20px rgba(212, 168, 83, 0.35)',
                            transition: 'all 0.3s',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <PenTool size={18} />
                        立即体验
                    </a>
                    <a
                        href="#workflow"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.875rem 2rem',
                            background: 'rgba(255, 255, 255, 0.7)',
                            color: '#3D2E1C',
                            borderRadius: '1rem',
                            fontSize: '1rem',
                            fontWeight: 500,
                            textDecoration: 'none',
                            border: '1px solid rgba(232, 213, 181, 0.5)',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                        }}
                    >
                        了解更多
                        <ArrowRight size={16} />
                    </a>
                </div>

                {/* Scroll hint */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        animation: 'bounce 2s infinite',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#A89880', letterSpacing: '0.1em' }}>SCROLL</span>
                        <div style={{ width: '1px', height: '24px', background: 'linear-gradient(to bottom, #A89880, transparent)' }} />
                    </div>
                </div>
            </section>

            {/* Workflow Pipeline Section */}
            <section
                id="workflow"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '6rem 2rem',
                    textAlign: 'center',
                }}
            >
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#3D2E1C', marginBottom: '0.75rem' }}>
                    五步成文，如行云流水
                </h2>
                <p style={{ color: '#7C6A53', marginBottom: '3rem', fontSize: '1.05rem' }}>
                    每一步都有AI护航，但方向盘始终在你手中
                </p>

                {/* Pipeline Flow */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'nowrap', maxWidth: '1100px', margin: '0 auto' }}>
                    {features.map((f, i) => (
                        <div key={f.titleEn} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.75)',
                                    backdropFilter: 'blur(15px)',
                                    border: '1px solid rgba(232, 213, 181, 0.4)',
                                    borderRadius: '1.25rem',
                                    padding: '1.5rem 1rem',
                                    width: '150px',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(139, 109, 58, 0.06)',
                                }}
                                className="feature-card"
                            >
                                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>{f.icon}</span>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#3D2E1C', marginBottom: '0.25rem' }}>{f.title}</h3>
                                <p style={{ fontSize: '0.75rem', color: '#A89880', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{f.titleEn}</p>
                                <p style={{ fontSize: '0.8rem', color: '#7C6A53', lineHeight: 1.5 }}>{f.desc}</p>
                            </div>
                            {i < features.length - 1 && (
                                <div style={{ color: '#D4A853', fontSize: '1.25rem', fontWeight: 300 }}>→</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials Section */}
            <section
                id="testimonials"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '5rem 2rem',
                    textAlign: 'center',
                }}
            >
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#3D2E1C', marginBottom: '2.5rem' }}>
                    他们都在用 灵境智写
                </h2>
                <div
                    style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(15px)',
                        borderRadius: '1.5rem',
                        padding: '2.5rem',
                        border: '1px solid rgba(232, 213, 181, 0.3)',
                        boxShadow: '0 8px 40px rgba(139, 109, 58, 0.06)',
                        minHeight: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        transition: 'opacity 0.5s ease',
                    }}
                >
                    <p style={{ fontSize: '1.125rem', color: '#3D2E1C', lineHeight: 1.8, fontStyle: 'italic', marginBottom: '1rem' }}>
                        &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                    </p>
                    <p style={{ color: '#A89880', fontSize: '0.875rem' }}>
                        {testimonials[activeTestimonial].author}
                    </p>
                </div>
                {/* Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTestimonial(i)}
                            style={{
                                width: i === activeTestimonial ? '24px' : '8px',
                                height: '8px',
                                borderRadius: '4px',
                                background: i === activeTestimonial ? '#D4A853' : 'rgba(212, 168, 83, 0.3)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}
                        />
                    ))}
                </div>
            </section>

            {/* Content Categories Section */}
            <section
                id="features"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '5rem 2rem',
                    textAlign: 'center',
                }}
            >
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#3D2E1C', marginBottom: '0.5rem' }}>
                    什么都能写
                </h2>
                <p style={{ color: '#7C6A53', marginBottom: '3rem', fontSize: '1.05rem' }}>
                    从自媒体到学术论文，覆盖你的全部写作场景
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    maxWidth: '960px',
                    margin: '0 auto',
                }}>
                    {[
                        { icon: '📱', name: '公众号文章', desc: '深度报道、热点分析、品牌故事' },
                        { icon: '📕', name: '小红书笔记', desc: '种草测评、生活分享、攻略合集' },
                        { icon: '💬', name: '知乎回答', desc: '专业解析、经验分享、长文输出' },
                        { icon: '🐦', name: '社交媒体', desc: '微博、Twitter、短文案创作' },
                        { icon: '📰', name: '新闻稿件', desc: '行业快讯、深度调研、人物专访' },
                        { icon: '📊', name: '行业报告', desc: '市场分析、竞品研究、趋势洞察' },
                        { icon: '🎓', name: '学术论文', desc: '文献综述、论点论证、摘要撰写' },
                        { icon: '📋', name: '公文写作', desc: '通知公告、工作总结、会议纪要' },
                        { icon: '📢', name: '营销文案', desc: '广告创意、品牌传播、活动策划' },
                        { icon: '📧', name: '商务邮件', desc: '客户沟通、商务洽谈、项目汇报' },
                        { icon: '📖', name: '故事创作', desc: '短篇小说、品牌故事、剧本大纲' },
                        { icon: '🌐', name: 'SEO内容', desc: '关键词优化、落地页、产品描述' },
                    ].map((item) => (
                        <div
                            key={item.name}
                            className="feature-card"
                            style={{
                                background: 'rgba(255, 255, 255, 0.65)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(232, 213, 181, 0.35)',
                                borderRadius: '1rem',
                                padding: '1.25rem 1rem',
                                textAlign: 'center',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                boxShadow: '0 2px 12px rgba(139, 109, 58, 0.04)',
                            }}
                        >
                            <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }}>{item.icon}</span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#3D2E1C', marginBottom: '0.25rem' }}>{item.name}</h3>
                            <p style={{ fontSize: '0.75rem', color: '#A89880', lineHeight: 1.5 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA Section */}
            <section
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '5rem 2rem 4rem',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        maxWidth: '700px',
                        margin: '0 auto',
                        background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.1) 0%, rgba(212, 168, 83, 0.05) 100%)',
                        borderRadius: '2rem',
                        padding: '3.5rem 2rem',
                        border: '1px solid rgba(212, 168, 83, 0.2)',
                    }}
                >
                    <Feather size={36} style={{ color: '#D4A853', marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3D2E1C', marginBottom: '0.75rem' }}>
                        下一篇佳作，从这里开始
                    </h2>
                    <p style={{ color: '#7C6A53', marginBottom: '2rem', fontSize: '1rem' }}>
                        无需注册，立即体验AI写作的魅力
                    </p>
                    <Link
                        href="/auth"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.5rem 1.25rem',
                            background: '#D4A853',
                            color: 'white',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 2px 12px rgba(212, 168, 83, 0.3)',
                            transition: 'all 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 168, 83, 0.4)';
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(212, 168, 83, 0.3)';
                        }}
                    >
                        开始创作 <ArrowRight size={14} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer
                style={{
                    position: 'relative',
                    zIndex: 10,
                    padding: '2rem',
                    textAlign: 'center',
                    borderTop: '1px solid rgba(232, 213, 181, 0.3)',
                }}
            >
                <p style={{ color: '#A89880', fontSize: '0.8rem' }}>
                    © 2026 灵境智写 · AI驱动的智能写作平台 · Made with ✍️ & ❤️
                </p>
            </footer>

            <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-8px); }
          60% { transform: translateX(-50%) translateY(-4px); }
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(139, 109, 58, 0.12) !important;
          border-color: rgba(212, 168, 83, 0.5) !important;
        }
      `}</style>
        </div>
    );
}
