import React, { useState } from 'react';
import Turnstile from 'react-turnstile';

const API_BASE = process.env.NEXT_PUBLIC_SEO_AUDIT_API_BASE || 'https://api.webfine.com.tr';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export default function SeoAuditWidget() {
    const [url, setUrl] = useState('');
    const [lang, setLang] = useState<'tr' | 'en'>('tr');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError(lang === 'tr' ? 'Lütfen doğrulamayı tamamlayın.' : 'Please complete verification.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`${API_BASE}/audit`, {
                method: 'POST', // Corrected method
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, token, lang }),
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || 'Error');
            }
            setResult(data.data);
            // Reset logic would go here if needed
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 max-w-md mx-auto font-sans">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {lang === 'tr' ? 'Ücretsiz SEO Analizi' : 'Free SEO Audit'}
                </h3>
                <button
                    type="button"
                    onClick={() => setLang(prev => prev === 'tr' ? 'en' : 'tr')}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    {lang.toUpperCase()}
                </button>
            </div>

            <form onSubmit={handleAudit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {lang === 'tr' ? 'Web Sitesi URL' : 'Website URL'}
                    </label>
                    <input
                        type="url"
                        required
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    />
                </div>

                <div className="flex justify-center my-4">
                    <Turnstile
                        sitekey={SITE_KEY}
                        onVerify={(token) => setToken(token)}
                        onError={() => setError('Turnstile Error')}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    {loading
                        ? (lang === 'tr' ? 'Analiz Ediliyor...' : 'Auditing...')
                        : (lang === 'tr' ? 'Analiz Et' : 'Audit Now')}
                </button>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded animate-fade-in">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded animate-fade-in">
                        <h4 className="font-bold text-green-800 mb-2">
                            {lang === 'tr' ? 'Sonuçlar' : 'Results'}
                        </h4>
                        <div className="text-sm space-y-1 text-green-900">
                            <p><strong>URL:</strong> {url}</p>
                            <p><strong>Score:</strong> {result.summary?.averageScore}/100</p>
                            <p><strong>Pages:</strong> {result.summary?.totalPages}</p>
                            <p className="text-xs text-green-700 mt-2 italic">
                                {lang === 'tr' ? 'Detaylı rapor yöneticilerimize iletildi.' : 'Detailed report sent to admins.'}
                            </p>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
