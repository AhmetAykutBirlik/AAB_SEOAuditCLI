import React, { useState, useEffect } from 'react';
import Turnstile, { useTurnstile } from 'react-turnstile';
import SeoLoadingStatus from '../../src/components/SeoLoadingStatus';
// import { motion, AnimatePresence } from 'framer-motion'; // Removed purely for portability, but added class-based animations in CSS would be ideal.
// Using standard CSS transitions/animations for simplicity in this specific file if framer-motion isn't guaranteed.

// --- Configuration ---
const API_BASE = process.env.NEXT_PUBLIC_SEO_AUDIT_API_BASE || 'https://api.webfine.com.tr';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

// --- Icons (Lucide React equivalent SVG) ---
const Icons = {
    Check: () => <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
    Alert: () => <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    Globe: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
    Zap: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
};

// --- Components ---

function RadialProgress({ score }: { score: number }) {
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 90 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500';

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="transform -rotate-90 w-32 h-32">
                <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`${color} transition-all duration-1000 ease-out`}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-bold ${color}`}>{Math.round(score)}</span>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Score</span>
            </div>
        </div>
    );
}

// --- Email Gate Modal ---
interface EmailGateProps {
    isOpen: boolean;
    lang: 'tr' | 'en';
    onSuccess: (email: string) => Promise<void>;
}

function EmailGate({ isOpen, lang, onSuccess }: EmailGateProps) {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await onSuccess(email);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-10 animate-scale-in">
                <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-6">
                        <Icons.Zap />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                        {lang === 'tr' ? 'Detaylı SEO Raporunuz Hazır' : 'Detailed SEO Report Ready'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        {lang === 'tr'
                            ? 'Hızlı ön analiz tamamlandı. Detaylı teknik raporu görüntülemek için e-posta adresinizi girin.'
                            : 'Quick preliminary analysis completed. Enter your email to view the detailed technical report.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="eposta@adresiniz.com"
                                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                        </div>
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                        <button
                            type="submit"
                            disabled={submitting || !email.includes('@') || email.length < 5}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? (lang === 'tr' ? 'Doğrulanıyor...' : 'Verifying...')
                                : (lang === 'tr' ? '🚀 Detaylı Raporu Aç' : '🚀 Unlock Detailed Report')}
                        </button>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tight font-medium">
                            {lang === 'tr' ? 'Ücretsiz analiz • Spam yok • WebFine güvencesi' : 'Free Analysis • No Spam • Powered by WebFine'}
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

// --- Main Page Component ---

export default function SeoAuditPage() {
    const [url, setUrl] = useState('');
    const [lang, setLang] = useState<'tr' | 'en'>('tr');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isLeadCaptured, setIsLeadCaptured] = useState(false);
    const [isGateOpen, setIsGateOpen] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    // const turnstile = useTurnstile(); // Uncomment on real project

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();

        // URL Validation
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            setError(lang === 'tr' ? 'URL http:// veya https:// ile başlamalıdır.' : 'URL must start with http:// or https://');
            return;
        }

        if (!token) {
            setError(lang === 'tr' ? 'Lütfen güvenliği doğrulayın.' : 'Please verify you are human.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`${API_BASE}/api/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, turnstileToken: token, lang }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Audit failed');

            setResult(data);
            setIsGateOpen(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLeadCapture = async (email: string) => {
        try {
            // v4.1 No-Session: Send full stats in body
            const res = await fetch(`${API_BASE}/api/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    lang,
                    site: result.site,
                    score: result.score,
                    errors: result.summary.errors,
                    warnings: result.summary.warnings,
                    pagesAudited: result.pagesAudited,
                    durationMs: result.durationMs,
                    healthLevel: result.healthLevel
                }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Lead capture failed');

            setIsLeadCaptured(true);
            setIsGateOpen(false);
        } catch (err: any) {
            throw err;
        }
    };

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 ${isGateOpen ? 'overflow-hidden' : ''}`}>

            <div className={isGateOpen ? 'blur-md pointer-events-none' : ''}>
                {/* Navbar Placeholder */}
                <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            WEBFINE
                        </div>
                        <button
                            onClick={() => setLang(l => l === 'tr' ? 'en' : 'tr')}
                            className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase"
                        >
                            {lang}
                        </button>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-32">
                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up">
                            <span className="block text-gray-900 dark:text-white">
                                {lang === 'tr' ? 'Web Sitenizin' : 'Unlock Your Website\'s'}
                            </span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                {lang === 'tr' ? 'Gerçek Gücünü Keşfedin' : 'Full Potential'}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
                            {lang === 'tr'
                                ? 'Yapay zeka destekli altyapımız ile saniyeler içinde kapsamlı SEO ve performans analizi yapın.'
                                : 'Analyze your SEO and performance in seconds with our AI-powered infrastructure.'}
                        </p>

                        {/* Audit Form Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-blue-900/10 dark:shadow-blue-900/20 p-2 md:p-4 max-w-2xl mx-auto border border-gray-100 dark:border-gray-800 animate-fade-in-up animation-delay-400">
                            <form onSubmit={handleAudit} className="flex flex-col gap-4 p-4 md:p-6">
                                <div className="relative group">
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        required
                                        disabled={loading}
                                        className="w-full bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg disabled:opacity-50"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Icons.Globe />
                                    </div>
                                </div>

                                {/* Turnstile Container - Centered */}
                                <div className="flex justify-center min-h-[65px]">
                                    <Turnstile sitekey={SITE_KEY} onVerify={setToken} theme="auto" />
                                </div>

                                <div className="mt-2">
                                    {error && (
                                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm flex items-center gap-2">
                                            <Icons.Alert /> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !token}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transform active:scale-98 transition-all disabled:opacity-100 flex items-center justify-center gap-2 text-lg min-h-[74px]"
                                    >
                                        {loading ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <SeoLoadingStatus variant="compact" lang={lang} />
                                                <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest leading-none">
                                                    {lang === 'tr' ? 'Hızlı Ön Analiz (8 Sayfa)' : 'Quick Audit (8 Pages)'}
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <Icons.Zap />
                                                {lang === 'tr' ? 'Ücretsiz Analiz Et' : 'Analyze for Free'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </section>

                {/* Results Section */}
                {result && (
                    <section className="max-w-5xl mx-auto px-4 pb-24 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Total Score */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                                <h3 className="text-lg font-medium text-gray-500 mb-4 uppercase tracking-wider">
                                    {lang === 'tr' ? 'Genel Skor' : 'Overall Score'}
                                </h3>
                                <RadialProgress score={result.score} />
                                {result.healthLevel && (
                                    <div className={`mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${result.healthLevel === 'Critical' ? 'bg-rose-100 text-rose-600' : result.healthLevel === 'Needs Optimization' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {result.healthLevel}
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 flex flex-col justify-center border border-blue-100 dark:border-blue-900/20">
                                    <span className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">{result.pagesAudited}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{lang === 'tr' ? 'Taranan Sayfa' : 'Pages Scanned'}</span>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-6 flex flex-col justify-center border border-emerald-100 dark:border-emerald-900/20">
                                    <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                                        0.2s
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{lang === 'tr' ? 'Ort. Yanıt Süresi' : 'Avg. Response Time'}</span>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-6 flex flex-col justify-center border border-amber-100 dark:border-amber-900/20">
                                    <span className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                                        {result.summary?.errors + result.summary?.warnings || 0}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{lang === 'tr' ? 'İyileştirme Önerisi' : 'Improvements Needed'}</span>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-6 flex flex-col justify-center border border-purple-100 dark:border-purple-900/20">
                                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">Tech Check</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Stack Detection</span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Rows (Lock with isLeadCaptured) */}
                        {isLeadCaptured ? (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
                                    <h3 className="font-bold text-lg">{lang === 'tr' ? 'Sayfa Detayları' : 'Page Details'}</h3>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {result.report.map((page: any, idx: number) => (
                                        <div key={idx} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium truncate block">
                                                        {page.url}
                                                    </a>
                                                    <div className="flex gap-3 mt-2 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            Meta Check
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className={`text-2xl font-bold ${page.score >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {page.score}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 font-bold uppercase tracking-widest">
                                {lang === 'tr' ? 'Tam Rapor Paylaşıldığında Burada Görünecek' : 'Full Report Will Appear Here After Unlock'}
                            </div>
                        )}
                    </section>
                )}

                {/* Feature Grid */}
                {!result && !loading && (
                    <section className="max-w-7xl mx-auto px-4 pb-20">
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: '🚀',
                                    title: { tr: 'Hız Analizi', en: 'Speed Analysis' },
                                    desc: { tr: 'Sitenizin açılış hızını ve Core Web Vitals metriklerini ölçer.', en: 'Measures your site load speed and Core Web Vitals metrics.' }
                                },
                                {
                                    icon: '🛡️',
                                    title: { tr: 'Güvenlik Kontrolü', en: 'Security Check' },
                                    desc: { tr: 'SSL sertifikası, karışık içerik (mixed content) ve güvenlik açıklarını tarar.', en: 'Scans for SSL certificates, mixed content, and vulnerabilities.' }
                                },
                                {
                                    icon: '🔍',
                                    title: { tr: 'SEO Uyumluluğu', en: 'SEO Compatibility' },
                                    desc: { tr: 'Meta etiketleri, başlık yapıları ve içerik hiyerarşisini denetler.', en: 'Audits meta tags, heading structures, and content hierarchy.' }
                                }
                            ].map((feature, i) => (
                                <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                                    <div className="text-4xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-bold mb-2">{lang === 'tr' ? feature.title.tr : feature.title.en}</h3>
                                    <p className="text-gray-500 dark:text-gray-400">{lang === 'tr' ? feature.desc.tr : feature.desc.en}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="border-t border-gray-200 dark:border-gray-800 py-12 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} WebFine. {lang === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}</p>
                </footer>
            </div>

            <EmailGate isOpen={isGateOpen} lang={lang} onSuccess={handleLeadCapture} />
        </div>
    );
}
