const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN || '8459395293:AAHVr0Rjg3BGrmut-IA-K5b5bIbN4faOPGc';

console.log('1. Lutfen Telegram botunuza gidin: t.me/webfine_audit_bot');
console.log('2. "Start" butonuna basin veya bir mesaj yazin.');
console.log('3. Bekleniyor...');

const url = `https://api.telegram.org/bot${token}/getUpdates`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.ok && json.result.length > 0) {
                // Get the last message's chat ID
                const lastMsg = json.result[json.result.length - 1];
                const chatId = lastMsg.message.chat.id;
                const user = lastMsg.message.from.first_name;

                console.log('\n--- BAŞARILI! ---');
                console.log(`Son mesaj gönderen: ${user}`);
                console.log(`TELEGRAM_CHAT_ID: ${chatId}`);
                console.log('-----------------');
                console.log(`Lütfen bu ID'yi kopyalayın ve bana verin.`);
            } else {
                console.log('\nHenüz mesaj bulunamadı.');
                console.log('Lütfen bota bir mesaj atın ve bu scripti tekrar çalıştırın.');
            }
        } catch (e) {
            console.error('Hata:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('İstek hatası:', err.message);
});
