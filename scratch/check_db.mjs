import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLocations() {
    const { data: locations } = await supabase.from('locations').select('id, locality_name, median_income_inr').limit(2);
    console.log('DB Locations:', locations);

    // Let's dramatically change one
    if (locations && locations.length > 0) {
        const target = locations[0];
        console.log(`Changing ${target.locality_name} income from ${target.median_income_inr} to 999999`);
        await supabase.from('locations').update({ median_income_inr: 999999 }).eq('id', target.id);
        
        const { data: updated } = await supabase.from('locations').select('id, locality_name, median_income_inr').eq('id', target.id).single();
        console.log('Updated row:', updated);
    }
}
checkLocations().catch(console.error);
