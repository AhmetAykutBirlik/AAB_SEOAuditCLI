# Manual QA Test Plan (TR/EN) - Hardened Version

## 🇹🇷 Türkçe (TR)
v4.1.0 Hardened sürümü için eklenen kritik test senaryoları.

### Test Senaryosu 5: Concurrency (Eşzamanlılık) Limiti
1. `MAX_CONCURRENT_AUDITS=1` yapın.
2. İki farklı sekmede aynı anda analiz başlatın.
3. **Beklenen:** İkinci sekme "Şu an yoğunluk var" veya rate-limit hatası (503) almalı.

### Test Senaryosu 6: Turnstile Replay Koruması
1. Başarılı bir analizden sonra aynı Turnstile token'ı ile API'ye manuel (Postman vb.) istek atın.
2. **Beklenen:** Sunucu isteği reddetmeli (Token Replay protection).

### Test Senaryosu 7: iFrame Widget Testi
1. `/widget.html?lang=tr` sayfasını açın.
2. Bir URL girin ve "Analiz Et" deyin.
3. **Beklenen:** Sayfa ana araca yönlenmeli ve URL alanı otomatik dolmalı.

---

## 🇺🇸 English (EN)
Critical test scenarios for v4.1.0 Hardened release.

### Test Case 5: Concurrency Limit
1. Set `MAX_CONCURRENT_AUDITS=1`.
2. Start an audit in two different tabs simultaneously.
3. **Expected:** The second tab should receive a "Busy" or rate-limit error (503).

### Test Case 6: Turnstile Replay Protection
1. After a successful audit, manually resubmit the same Turnstile token via API (e.g., Postman).
2. **Expected:** Server must reject the request (Token Replay protection).

### Test Case 7: iFrame Widget Test
1. Open `/widget.html?lang=en`.
2. Enter a URL and click "Audit Now".
3. **Expected:** The page should redirect to the main tool, and the URL field should be pre-filled.
