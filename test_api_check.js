const fetch = require('node-fetch'); // or axios if installed and available, but native fetch in node 18+

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        turnstileToken: 'mock-token',
        lang: 'tr'
      })
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500)); // Print first 500 chars
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
