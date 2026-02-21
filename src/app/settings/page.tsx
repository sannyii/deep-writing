'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { User, CreditCard, ChevronLeft, LogOut, Check } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { themes } from '@/lib/themes';

export default function SettingsPage() {
    const t = useTranslations();
    const { data: session } = useSession();
    const { theme, setTheme } = useAppStore();
    const [activeTab, setActiveTab] = useState<'basic' | 'pricing'>('basic');

    const userName = session?.user?.name || session?.user?.email?.split('@')[0] || t('settings.profile.notLoggedIn');
    const userEmail = session?.user?.email || '';
    const initial = userName.charAt(0).toUpperCase();

    // Define allowed theme IDs
    type ThemeId = 'warm_paper' | 'ink' | 'bamboo' | 'minimal';
    const themeOptions: { id: ThemeId; name: string }[] = [
        { id: 'warm_paper', name: t('settings.themes.warm_paper') },
        { id: 'ink', name: t('settings.themes.ink') },
        { id: 'bamboo', name: t('settings.themes.bamboo') },
        { id: 'minimal', name: t('settings.themes.minimal') },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text)] flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-6xl py-8 px-6 flex items-center gap-4">
                <Link
                    href="/write"
                    className="p-2 rounded-xl transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <ChevronLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
            </div>

            <div className="w-full max-w-6xl px-6 flex flex-col md:flex-row gap-8 pb-12">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left font-medium ${activeTab === 'basic'
                            ? 'bg-[var(--color-surface-hover)] text-[var(--color-text)]'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                            }`}
                    >
                        <User size={18} />
                        {t('settings.tabs.basic')}
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left font-medium ${activeTab === 'pricing'
                            ? 'bg-[var(--color-surface-hover)] text-[var(--color-text)]'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                            }`}
                    >
                        <CreditCard size={18} />
                        {t('settings.tabs.pricing')}
                    </button>

                    <div className="h-px bg-[var(--color-border)] my-2"></div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left font-medium text-red-500 hover:bg-red-500/10"
                    >
                        <LogOut size={18} />
                        {t('nav.logout')}
                    </button>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 glass-panel rounded-2xl p-6 md:p-8 min-h-[500px]">
                    {activeTab === 'basic' && (
                        <div className="space-y-10 animate-fade-in">
                            {/* Profile Section */}
                            <section>
                                <h2 className="text-xl font-bold mb-6">{t('settings.profile.title')}</h2>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm"
                                        style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                                        {initial}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('settings.profile.name')}</p>
                                            <p className="text-lg font-semibold">{userName}</p>
                                        </div>
                                        {userEmail && (
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">{t('settings.profile.email')}</p>
                                                <p className="text-md">{userEmail}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-[var(--color-border)]"></div>

                            {/* Preferences Section: Theme */}
                            <section>
                                <h2 className="text-xl font-bold mb-6">{t('settings.theme')}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {themeOptions.map((tItem) => {
                                        const isSelected = theme === tItem.id;
                                        return (
                                            <button
                                                key={tItem.id}
                                                onClick={() => setTheme(tItem.id)}
                                                className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${isSelected
                                                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                                                    : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)] bg-[var(--color-surface)]'
                                                    }`}
                                            >
                                                <div
                                                    className="w-12 h-12 rounded-full shadow-inner"
                                                    style={{
                                                        background: themes[tItem.id as keyof typeof themes].bg,
                                                        border: '1px solid var(--color-border)'
                                                    }}
                                                ></div>
                                                <span className={`text-sm font-medium ${isSelected ? 'text-[var(--color-accent)]' : ''}`}>
                                                    {tItem.name}
                                                </span>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 text-[var(--color-accent)]">
                                                        <Check size={16} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <div className="h-px bg-[var(--color-border)]"></div>

                            {/* Preferences Section: Language */}
                            <section>
                                <h2 className="text-xl font-bold mb-6">{t('settings.language')}</h2>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            document.cookie = `NEXT_LOCALE=zh; path=/; max-age=31536000`;
                                            window.location.reload();
                                        }}
                                        className="px-6 py-2.5 rounded-xl border-2 border-[var(--color-border)] hover:border-[var(--color-text-muted)] bg-[var(--color-surface)] font-medium transition-all"
                                    >
                                        中文 (简体)
                                    </button>
                                    <button
                                        onClick={() => {
                                            document.cookie = `NEXT_LOCALE=en; path=/; max-age=31536000`;
                                            window.location.reload();
                                        }}
                                        className="px-6 py-2.5 rounded-xl border-2 border-[var(--color-border)] hover:border-[var(--color-text-muted)] bg-[var(--color-surface)] font-medium transition-all"
                                    >
                                        English
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'pricing' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{t('settings.pricing.title')}</h2>
                                <p className="text-[var(--color-text-secondary)]">{t('settings.pricing.description')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-stretch">
                                {/* Free Plan */}
                                <div className="md:col-span-2 flex flex-col p-8 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] relative shadow-md">
                                    <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2">
                                        <span className="text-xs font-bold px-3 py-1 rounded-full text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm">Beta</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
                                        {t('settings.pricing.tiers.free')}
                                    </h3>
                                    <div className="flex items-baseline gap-1 mb-6 flex-shrink-0">
                                        <span className="text-4xl font-extrabold whitespace-nowrap">¥0</span>
                                        <span className="text-md font-normal text-[var(--color-text-secondary)] whitespace-nowrap">/ 永久</span>
                                    </div>
                                    <p className="text-md text-[var(--color-text-secondary)] mb-8 flex-grow leading-relaxed">
                                        {t('settings.pricing.features.free')}
                                    </p>
                                    <button className="w-full mt-auto py-3 rounded-xl font-medium text-white transition-opacity hover:opacity-90 cursor-default flex-shrink-0"
                                        style={{ background: 'var(--color-accent)' }}>
                                        {t('settings.pricing.currentPlan')}
                                    </button>
                                </div>

                                {/* QR Codes Section */}
                                <div className="md:col-span-3 flex flex-col p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                                    <h3 className="text-xl font-bold mb-8 flex-shrink-0">{t('settings.pricing.qr.title')}</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12 flex-grow items-start">

                                        {/* Official Account */}
                                        <div className="flex flex-col items-center justify-start text-center gap-4">
                                            <div className="w-36 h-36 lg:w-40 lg:h-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex items-center justify-center shadow-inner overflow-hidden relative group p-2 flex-shrink-0">
                                                <img
                                                    src="/images/wechat-official-qr.jpg"
                                                    alt="公众号二维码"
                                                    className="w-full h-full object-contain mix-blend-multiply"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">{t('settings.pricing.qr.official')}</h4>
                                                <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-[160px] mx-auto leading-relaxed">
                                                    {t('settings.pricing.qr.officialDesc')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Personal WeChat */}
                                        <div className="flex flex-col items-center justify-start text-center gap-4">
                                            <div className="w-36 h-36 lg:w-40 lg:h-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex items-center justify-center shadow-inner overflow-hidden relative group p-2 flex-shrink-0">
                                                <img
                                                    src="/images/wechat-personal-qr.png"
                                                    alt="个人微信"
                                                    className="w-full h-full object-contain mix-blend-multiply"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">{t('settings.pricing.qr.personal')}</h4>
                                                <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-[160px] mx-auto leading-relaxed">
                                                    {t('settings.pricing.qr.personalDesc')}
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
