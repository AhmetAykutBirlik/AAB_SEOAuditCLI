const axios = require('axios');

async function test(url) {
    try {
        console.log(`Testing with URL: ${url}`);
        const res = await axios.post('http://localhost:3000/api/audit', {
            url: url,
            turnstileToken: 'mock-token',
            lang: 'tr'
        });
        console.log(`Response for ${url}:`, res.data.site, res.data.score);
    } catch (e) {
        console.error(`Error for ${url}:`, e.response ? e.response.data : e.message);
    }
}

async function runTests() {
    await test('https://google.com');
    await test('https://example.com');
}

runTests();
