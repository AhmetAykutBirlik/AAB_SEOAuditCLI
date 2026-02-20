
import axios from 'axios';

async function test() {
    try {
        console.log('Testing /api/audit...');
        const res = await axios.post('http://localhost:3000/api/audit', {
            url: 'https://example.com',
            token: 'mock-token',
            lang: 'tr'
        });
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2).substring(0, 500));
    } catch (e) {
        if (axios.isAxiosError(e)) {
            console.error('Axios Error:', e.message);
            if (e.response) {
                console.error('Response Status:', e.response.status);
                console.error('Response Data:', JSON.stringify(e.response.data, null, 2));
            }
        } else {
            console.error('Unknown Error:', e);
        }
    }
}

test();
