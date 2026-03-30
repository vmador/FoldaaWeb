
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConfig() {
    const { data, error } = await supabase
        .from('project_integrations')
        .select('config, integration_types(name)')
        .eq('is_enabled', true);

    if (error) {
        console.error('Error fetching integrations:', error);
        return;
    }

    const os = data.find(i => i.integration_types.name === 'onesignal');
    if (os) {
        console.log('OneSignal Config Found:', JSON.stringify(os.config, null, 2));
    } else {
        console.log('No active OneSignal integration found.');
    }
}

checkConfig();
