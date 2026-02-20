export const locales = {
    tr: {
        turnstile_failed: "Doğrulama başarısız. Lütfen tekrar deneyin.",
        rate_limited: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
        invalid_url: "Geçersiz URL. http/https ile başlayan bir adres girin.",
        blocked_ssrf: "Bu URL güvenlik nedeniyle engellendi.",
        audit_started: "Denetim başlatıldı.",
        audit_done: "Denetim tamamlandı.",
        server_error: "Sunucu hatası oluştu.",
        method_not_allowed: "Yöntem izin verilmiyor.",
        lead_saved: "Bilgileriniz kaydedildi. Detaylı rapor hazır.",
        popup_title: "Detaylı SEO Raporunuz Hazır",
        popup_desc: "Yapay zeka destekli analiz tamamlandı. Raporun bir kopyasını e-posta adresinize gönderebiliriz (opsiyonel).",
        popup_primary: "Detaylı Raporu Aç",
        popup_secondary: "E-posta girmeden devam et",
        hero_title: "Web Sitenizin Gerçek Gücünü Keşfedin",
        hero_subtitle: "Yapay zeka destekli altyapımız ile saniyeler içinde kapsamlı SEO analizi yapın.",
        btn_analyze: "Ücretsiz Analiz Et",
        score_label: "GENEL SKOR",
        pages_label: "Taranan Sayfa",
        speed_label: "Ort. Hız",
        issues_label: "İyileştirme Önerisi",
        details_label: "Sayfa Detayları",
        support_title: "Profesyonel Destek",
        support_desc: "Bu sorunları sizin için çözebiliriz.",
        support_btn: "Teklif Al"
    },
    en: {
        turnstile_failed: "Verification failed. Please try again.",
        rate_limited: "Too many requests. Please try again later.",
        invalid_url: "Invalid URL. Provide an http/https URL.",
        blocked_ssrf: "This URL was blocked for security reasons.",
        audit_started: "Audit started.",
        audit_done: "Audit completed.",
        server_error: "Internal server error.",
        method_not_allowed: "Method not allowed.",
        lead_saved: "Your lead info saved. Full report is ready.",
        popup_title: "Your Detailed SEO Report is Ready",
        popup_desc: "AI-powered analysis completed. You may receive a copy via email (optional).",
        popup_primary: "Open Full Report",
        popup_secondary: "Continue without email",
        hero_title: "Discover the True Power of Your Website",
        hero_subtitle: "Perform comprehensive SEO analysis in seconds with our AI-powered infrastructure.",
        btn_analyze: "Analyze for Free",
        score_label: "OVERALL SCORE",
        pages_label: "Pages Audited",
        speed_label: "Avg. Speed",
        issues_label: "Improvements",
        details_label: "Page Details",
        support_title: "Professional Support",
        support_desc: "We can fix these issues for you.",
        support_btn: "Get a Quote"
    },
};

export type Locale = keyof typeof locales;

export function getMessage(lang: string, key: keyof typeof locales['en']): string {
    const locale = (lang === 'tr' || lang === 'en') ? lang : 'en';
    return locales[locale][key] || locales['en'][key];
}
