'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Feather, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const switchMode = (m: 'login' | 'register') => {
        setMode(m);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                if (password !== confirmPassword) {
                    setError('两次输入的密码不一致');
                    setLoading(false);
                    return;
                }

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();
                if (!res.ok) {
                    setError(data.error);
                    setLoading(false);
                    return;
                }
            }

            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(mode === 'login' ? '邮箱或密码错误' : '注册成功但登录失败，请重试');
                setLoading(false);
                return;
            }

            router.push('/write');
        } catch {
            setError('网络错误，请重试');
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #FDF6E3 0%, #F5E6C8 50%, #FDF6E3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(232, 213, 181, 0.4)',
                    boxShadow: '0 8px 40px rgba(139, 109, 58, 0.08)',
                    padding: '2.5rem',
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '2rem',
                        textDecoration: 'none',
                    }}
                >
                    <Feather size={24} style={{ color: '#D4A853' }} />
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3D2E1C' }}>
                        灵境智写
                    </span>
                </Link>

                {/* Tab Switch */}
                <div
                    style={{
                        display: 'flex',
                        borderRadius: '0.75rem',
                        background: 'rgba(212, 168, 83, 0.1)',
                        padding: '4px',
                        marginBottom: '1.5rem',
                    }}
                >
                    {(['login', 'register'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => switchMode(m)}
                            style={{
                                flex: 1,
                                padding: '0.625rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                background: mode === m ? 'white' : 'transparent',
                                color: mode === m ? '#3D2E1C' : '#A89880',
                                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                            }}
                        >
                            {m === 'login' ? '登录' : '注册'}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#7C6A53', marginBottom: '0.375rem' }}>
                            邮箱
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#A89880' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(232, 213, 181, 0.5)',
                                    background: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    color: '#3D2E1C',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: mode === 'register' ? '1rem' : '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#7C6A53', marginBottom: '0.375rem' }}>
                            密码
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#A89880' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === 'register' ? '至少6位密码' : '输入密码'}
                                required
                                minLength={mode === 'register' ? 6 : undefined}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(232, 213, 181, 0.5)',
                                    background: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    color: '#3D2E1C',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#7C6A53', marginBottom: '0.375rem' }}>
                                确认密码
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: confirmPassword && password !== confirmPassword ? '#dc2626' : '#A89880' }} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="再次输入密码"
                                    required
                                    minLength={6}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                        borderRadius: '0.75rem',
                                        border: `1px solid ${confirmPassword && password !== confirmPassword ? 'rgba(220, 38, 38, 0.5)' : 'rgba(232, 213, 181, 0.5)'}`,
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        color: '#3D2E1C',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: '#dc2626' }}>
                                    两次输入的密码不一致
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                padding: '0.625rem 0.875rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(220, 38, 38, 0.08)',
                                color: '#dc2626',
                                fontSize: '0.8rem',
                                marginBottom: '1rem',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: loading
                                ? 'rgba(212, 168, 83, 0.5)'
                                : 'linear-gradient(135deg, #D4A853, #C49540)',
                            color: 'white',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 2px 12px rgba(212, 168, 83, 0.3)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
                        {!loading && <ArrowRight size={16} />}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#A89880' }}>
                    {mode === 'login' ? '还没有账号？' : '已有账号？'}
                    <button
                        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#D4A853',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            marginLeft: '0.25rem',
                        }}
                    >
                        {mode === 'login' ? '立即注册' : '去登录'}
                    </button>
                </p>
            </div>
        </div>
    );
}
