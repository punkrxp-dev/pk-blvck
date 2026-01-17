
const URL = process.argv[2] || 'https://pk-blvck-three.vercel.app/api/mcp/ingest';

async function testIngest() {
    console.log(`🚀 Testing ingestion at: ${URL}`);

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: `test-${Date.now()}@punkblvck.com`,
                message: 'Validating production deployment fix via script (Agent Test)',
                source: 'prod_test_script'
            })
        });

        console.log(`Status: ${res.status} ${res.statusText}`);

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            console.log('✅ Response JSON:', JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.log('⚠️ Response Text (Possible HTML/Error):', text.substring(0, 500));
        }

    } catch (err) {
        console.error('❌ Connection Failed:', err);
    }
}

testIngest();
