'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * Localization Content
 */
const MESSAGES = {
    tr: [
        "🧠 Yapay zeka site yapınızı analiz ediyor...",
        "🔍 Meta etiketleri ve başlık yapısı inceleniyor...",
        "⚙️ Teknik SEO hataları tespit ediliyor...",
        "📊 Performans ve hız metrikleri ölçülüyor...",
        "🛠 İndeksleme ve yönlendirmeler kontrol ediliyor...",
        "🚀 Detaylı rapor oluşturuluyor...",
    ],
    en: [
        "🧠 AI is analyzing your site structure...",
        "🔍 Checking meta tags and heading structure...",
        "⚙️ Detecting technical SEO issues...",
        "📊 Measuring performance and speed metrics...",
        "🛠 Verifying indexing and redirects...",
        "🚀 Generating detailed report...",
    ],
};

interface SeoLoadingStatusProps {
    variant?: 'compact' | 'card';
    lang?: 'tr' | 'en';
}

/**
 * SeoLoadingStatus Component (v2 - Dark Premium)
 * 
 * Upgraded with:
 * - Dark Glassmorphism Theme
 * - Compact & Card variants
 * - Multi-language support (TR/EN)
 * - Safe timer management
 */
export const SeoLoadingStatus: React.FC<SeoLoadingStatusProps> = ({
    variant = 'compact',
    lang = 'tr'
}) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Safe Timer Storage
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const activeMessages = MESSAGES[lang] || MESSAGES.tr;

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            // 1. Start Fade Out
            setIsVisible(false);

            // 2. Change message and Fade In after transition
            timeoutRef.current = setTimeout(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % activeMessages.length);
                setIsVisible(true);
            }, 600);

        }, 2800);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [activeMessages.length]);

    // VARIANT: COMPACT (Inline for buttons/small areas)
    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-3 px-1 transition-all duration-500">
                {/* Compact Spinner */}
                <div className="relative flex-shrink-0">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-800 border-t-blue-400 animate-spin"></div>
                </div>

                {/* Rolling Message */}
                <div className="overflow-hidden h-6 min-w-[160px] flex items-center">
                    <span className={`text-sm font-medium tracking-tight whitespace-nowrap transition-all duration-700 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                        }`}>
                        {activeMessages[currentMessageIndex]}
                    </span>
                </div>

                {/* Mini Progress */}
                <div className="flex gap-1">
                    {activeMessages.map((_, idx) => (
                        <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentMessageIndex ? 'w-3 bg-blue-500' : 'w-1 bg-white/10'
                            }`} />
                    ))}
                </div>
            </div>
        );
    }

    // VARIANT: CARD (Large feature mode)
    return (
        <div className="flex flex-col items-center justify-center p-10 bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md mx-auto relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-600/20 blur-[80px] rounded-full"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-600/20 blur-[80px] rounded-full"></div>

            {/* Premium Dark Spinner */}
            <div className="relative mb-8 z-10">
                <div className="w-16 h-16 rounded-full border-[3px] border-slate-800 border-t-blue-400 animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 rounded-full border-[3px] border-indigo-500/10 animate-pulse scale-125"></div>
            </div>

            {/* Message Area */}
            <div className="h-16 flex items-center justify-center text-center z-10 px-4">
                <p className={`text-lg font-bold tracking-tight transition-all duration-700 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-indigo-200 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 blur-sm'
                    }`}>
                    {activeMessages[currentMessageIndex]}
                </p>
            </div>

            {/* Progress Footer */}
            <div className="mt-8 w-full px-4 z-10">
                <div className="flex items-center justify-center gap-1.5 mb-4">
                    {activeMessages.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-700 ${idx === currentMessageIndex ? 'w-8 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'w-1.5 bg-white/10'
                            }`} />
                    ))}
                </div>
                <div className="flex justify-between items-center opacity-60">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-200">
                        AI ANALYSIS MODE
                    </span>
                    <span className="text-[10px] font-bold text-white bg-white/5 py-1 px-2.5 rounded-full">
                        {currentMessageIndex + 1} / {activeMessages.length}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SeoLoadingStatus;
