'use client';

import { useEffect, useRef, useCallback } from 'react';

interface StrokePoint {
    x: number;
    y: number;
    time: number;
}

interface Stroke {
    points: StrokePoint[];
    birth: number;
}

export function WritingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokes = useRef<Stroke[]>([]);
    const currentStroke = useRef<Stroke | null>(null);
    const mouse = useRef({ x: 0, y: 0, moving: false, stopped: false, stopTime: 0 });
    const animFrame = useRef<number>(0);
    const audioCtx = useRef<AudioContext | null>(null);
    const lastSoundTime = useRef(0);
    const isAudioInit = useRef(false);
    const glowPhase = useRef(0);
    const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const playWritingSound = useCallback(() => {
        if (!audioCtx.current || !isAudioInit.current) return;
        const now = audioCtx.current.currentTime;
        if (now - lastSoundTime.current < 0.08) return;
        lastSoundTime.current = now;

        try {
            const bufferSize = audioCtx.current.sampleRate * 0.06;
            const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                const t = i / bufferSize;
                const envelope = Math.pow(1 - t, 3) * t * 8;
                const noise = (Math.random() * 2 - 1) * 0.08;
                data[i] = noise * envelope;
            }

            const source = audioCtx.current.createBufferSource();
            source.buffer = buffer;

            const filter = audioCtx.current.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3200 + Math.random() * 1200;
            filter.Q.value = 0.8;

            const gain = audioCtx.current.createGain();
            gain.gain.value = 0.015 + Math.random() * 0.008;

            source.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.current.destination);
            source.start(now);
            source.stop(now + 0.06);
        } catch {
            // Silently fail
        }
    }, []);

    const initAudio = useCallback(() => {
        if (isAudioInit.current) return;
        try {
            audioCtx.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            isAudioInit.current = true;
        } catch {
            // Audio not supported
        }
    }, []);

    // Draw a smooth curve through points using quadratic bezier
    const drawStrokePath = useCallback((ctx: CanvasRenderingContext2D, points: StrokePoint[], alpha: number, shrinkToX?: number, shrinkToY?: number, shrinkProgress?: number) => {
        if (points.length < 2) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `hsla(38, 50%, 52%, 1)`;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();

        // Apply convergence if shrinking
        const getPoint = (p: StrokePoint) => {
            if (shrinkToX !== undefined && shrinkToY !== undefined && shrinkProgress !== undefined) {
                const ease = shrinkProgress * shrinkProgress;
                return {
                    x: p.x + (shrinkToX - p.x) * ease,
                    y: p.y + (shrinkToY - p.y) * ease,
                };
            }
            return { x: p.x, y: p.y };
        };

        const p0 = getPoint(points[0]);
        ctx.moveTo(p0.x, p0.y);

        if (points.length === 2) {
            const p1 = getPoint(points[1]);
            ctx.lineTo(p1.x, p1.y);
        } else {
            // Smooth curve through midpoints
            for (let i = 0; i < points.length - 1; i++) {
                const curr = getPoint(points[i]);
                const next = getPoint(points[i + 1]);
                const midX = (curr.x + next.x) / 2;
                const midY = (curr.y + next.y) / 2;

                if (i === 0) {
                    ctx.lineTo(midX, midY);
                } else {
                    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
                }
            }
            // Last point
            const last = getPoint(points[points.length - 1]);
            const secondLast = getPoint(points[points.length - 2]);
            ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
        }

        ctx.stroke();
        ctx.restore();
    }, []);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const now = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { x, y, stopped, stopTime } = mouse.current;

        // Time since mouse stopped
        const timeSinceStopped = stopped ? (now - stopTime) / 1000 : 0;
        const converging = stopped && timeSinceStopped > 0.3;
        const convergeProgress = converging ? Math.min((timeSinceStopped - 0.3) / 0.8, 1) : 0;

        // Draw completed strokes (fading out)
        const strokeLifespan = converging ? 1.0 : 1.8; // seconds
        strokes.current = strokes.current.filter((stroke) => {
            const age = (now - stroke.birth) / 1000;
            if (age > strokeLifespan) return false;

            const fadeAlpha = 0.15 * Math.pow(1 - age / strokeLifespan, 1.5);
            if (fadeAlpha < 0.003) return false;

            drawStrokePath(
                ctx,
                stroke.points,
                fadeAlpha,
                converging ? x : undefined,
                converging ? y : undefined,
                converging ? convergeProgress : undefined,
            );
            return true;
        });

        // Draw current active stroke
        if (currentStroke.current && currentStroke.current.points.length >= 2) {
            drawStrokePath(ctx, currentStroke.current.points, 0.16);
        }

        // Pen tip glow when stopped and strokes are mostly gone
        if (stopped && timeSinceStopped > 0.8) {
            glowPhase.current += 0.03;
            const glowIntensity = Math.min((timeSinceStopped - 0.8) / 0.5, 1);
            const pulse = 0.5 + 0.5 * Math.sin(glowPhase.current);
            const glowAlpha = glowIntensity * (0.04 + pulse * 0.035);
            const glowRadius = 15 + pulse * 8;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
            gradient.addColorStop(0, `hsla(40, 65%, 60%, ${glowAlpha})`);
            gradient.addColorStop(0.5, `hsla(38, 55%, 55%, ${glowAlpha * 0.4})`);
            gradient.addColorStop(1, `hsla(38, 50%, 50%, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright point
            const innerAlpha = glowIntensity * (0.1 + pulse * 0.06);
            ctx.save();
            ctx.globalAlpha = innerAlpha;
            ctx.fillStyle = `hsla(42, 70%, 72%, 1)`;
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            glowPhase.current = 0;
        }

        animFrame.current = requestAnimationFrame(animate);
    }, [drawStrokePath]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        const handleMouseMove = (e: MouseEvent) => {
            const now = performance.now();
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
            mouse.current.moving = true;
            mouse.current.stopped = false;

            // Start a new stroke or continue current one
            if (!currentStroke.current) {
                currentStroke.current = {
                    points: [{ x: e.clientX, y: e.clientY, time: now }],
                    birth: now,
                };
            } else {
                const lastPt = currentStroke.current.points[currentStroke.current.points.length - 1];
                const dx = e.clientX - lastPt.x;
                const dy = e.clientY - lastPt.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Only add point if moved enough (smoothing)
                if (dist > 3) {
                    currentStroke.current.points.push({ x: e.clientX, y: e.clientY, time: now });
                    playWritingSound();

                    // Keep strokes manageable — split long continuous strokes
                    if (currentStroke.current.points.length > 60) {
                        const finishedStroke = { ...currentStroke.current, birth: now };
                        strokes.current.push(finishedStroke);
                        // Start new stroke from last few points for continuity
                        const overlap = currentStroke.current.points.slice(-3);
                        currentStroke.current = { points: overlap, birth: now };
                    }
                }
            }

            // Reset idle timer
            if (idleTimer.current) clearTimeout(idleTimer.current);
            idleTimer.current = setTimeout(() => {
                // Mouse stopped — finalize current stroke
                if (currentStroke.current && currentStroke.current.points.length >= 2) {
                    strokes.current.push({ ...currentStroke.current, birth: performance.now() });
                }
                currentStroke.current = null;
                mouse.current.stopped = true;
                mouse.current.stopTime = performance.now();
            }, 120);

            initAudio();
        };

        const handleClick = () => {
            initAudio();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        animFrame.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            cancelAnimationFrame(animFrame.current);
            if (idleTimer.current) clearTimeout(idleTimer.current);
            if (audioCtx.current) {
                audioCtx.current.close();
            }
        };
    }, [animate, initAudio, playWritingSound]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    );
}
