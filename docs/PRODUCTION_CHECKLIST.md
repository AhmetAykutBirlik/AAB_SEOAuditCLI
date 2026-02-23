# Production Preflight Checklist (TR/EN) - v4.1.0 Hardened

## 🇹🇷 Türkçe (TR)
"No AAB SEO Audit CLI" projesinin zayıf sunucu (low-resource) ve yüksek güvenlik (hardened) ayarlarıyla yayına alım listesi.

### 1. Ortam Değişkenleri (.env)
- [ ] `NODE_ENV=production`: Mutlaka set edilmeli.
- [ ] `LOG_TO_DISK=false`: Disk yükünü sıfırlamak için kapalı olmalı (varsayılan).
- [ ] `MAX_CONCURRENT_AUDITS=2`: Zayıf sunucular için 1 veya 2 önerilir.
- [ ] `TURNSTILE_SECRET_KEY`: Canlı anahtar şart! (Mock devre dışı bırakıldı).
- [ ] `TRUST_PROXY=true`: Cloudflare/cPanel arkasındaysanız aktif edilmeli.
- [ ] `ALLOWED_ORIGINS`: Virgülle ayrılmış domain listesi.

### 2. Güvenlik
- [ ] **SSRF:** Localhost/Private IP blokları test edildi mi? (Yapıldı)
- [ ] **Turnstile:** Replay protection (in-memory) aktif mi? (Yapıldı)
- [ ] **Rate Limiting:** Audit limiti 10dk/5 istek olarak sıkılaştırıldı mı? (Yapıldı)

### 3. Loglama & Gizlilik
- [ ] IP Maskeleme aktif mi? (Yapıldı)
- [ ] E-posta Maskeleme aktif mi? (Yapıldı)

---

## 🇺🇸 English (EN)
Production deployment checklist for "No AAB SEO Audit CLI" optimized for low-resource servers and high security.

### 1. Environment Variables (.env)
- [ ] `NODE_ENV=production`: Must be set.
- [ ] `LOG_TO_DISK=false`: Must be disabled to save disk I/O (default).
- [ ] `MAX_CONCURRENT_AUDITS=2`: Recommended 1 or 2 for weak servers.
- [ ] `TURNSTILE_SECRET_KEY`: Live key mandatory! (Mock is disabled).
- [ ] `TRUST_PROXY=true`: Enable if behind Cloudflare/cPanel.
- [ ] `ALLOWED_ORIGINS`: Comma-separated list of allowed domains.

### 2. Security
- [ ] **SSRF:** Private IP/Localhost blocks tested? (Done)
- [ ] **Turnstile:** Replay protection (in-memory) active? (Done)
- [ ] **Rate Limiting:** Audit limit tightened to 5 requests per 10 mins? (Done)

### 3. Logging & Privacy
- [ ] IP Masking active? (Done)
- [ ] Email Masking active? (Done)
