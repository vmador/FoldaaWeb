require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD;

async function test() {
    console.log('Testing RPC with:');
    console.log('URL:', NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Role Key starts with:', SERVICE_ROLE_KEY?.substring(0, 5));
    console.log('Encryption Password starts with:', ENCRYPTION_PASSWORD?.substring(0, 5));

    if (!NEXT_PUBLIC_SUPABASE_URL || !SERVICE_ROLE_KEY || !ENCRYPTION_PASSWORD) {
        console.error('Missing environment variables!');
        process.exit(1);
    }

    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await supabase.rpc('encrypt_service_key', {
        p_service_key: 'ls_test_key_abc_123',
        p_encryption_password: ENCRYPTION_PASSWORD
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success. Encrypted result type:', typeof data);
        console.log('Result:', data);
    }
}

test();
