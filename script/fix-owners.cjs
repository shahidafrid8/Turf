const https = require('https');

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcXBxcGl4cHJ6aG9kcnFqbGx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU1MDA4NCwiZXhwIjoyMDg3MTI2MDg0fQ.GY01msdVkkNbrbzpchun2EGmIMbBBuUhf7wPLnwgjow';

// List all users
function listUsers() {
    return new Promise((resolve, reject) => {
        const req = https.get('https://neqpqpixprzhodrqjllw.supabase.co/auth/v1/admin/users?per_page=50', {
            headers: { apikey: key, Authorization: `Bearer ${key}` }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
    });
}

// Update user metadata
function updateUser(id, metadata) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ user_metadata: metadata });
        const req = https.request(`https://neqpqpixprzhodrqjllw.supabase.co/auth/v1/admin/users/${id}`, {
            method: 'PUT',
            headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Content-Length': body.length }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    const result = await listUsers();
    console.log('=== ALL USERS ===');
    for (const u of result.users) {
        console.log(`ID: ${u.id}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Metadata: ${JSON.stringify(u.user_metadata)}`);
        console.log('');
    }

    // Find honey and set her as owner pending
    const honey = result.users.find(u => u.email === 'honeytemp7@gmail.com');
    if (honey) {
        console.log('=== UPDATING HONEY ===');
        const updated = await updateUser(honey.id, { full_name: 'Honey', role: 'owner', ownerStatus: 'pending' });
        console.log('Updated metadata:', JSON.stringify(updated.user_metadata));
    }

    // Verify
    console.log('\n=== VERIFYING ===');
    const result2 = await listUsers();
    const owners = result2.users.filter(u => u.user_metadata?.role === 'owner');
    console.log('Owners found:', owners.length);
    owners.forEach(u => console.log(`  ${u.email} | role=${u.user_metadata?.role} | status=${u.user_metadata?.ownerStatus}`));
}

main().catch(e => { console.error(e); process.exit(1); });
