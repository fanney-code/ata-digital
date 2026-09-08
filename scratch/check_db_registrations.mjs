import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env manually
const envContent = readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Connecting to Supabase:', supabaseUrl);
  const { data: regs, error: rErr } = await supabase
    .from('registrations')
    .select('id, registration_number, academic_year, status, student:students(id, first_name, last_name, permanent_uid), program:programs(id, name, code), institution:institutions(id, name, code)')
    .order('created_at', { ascending: true });

  if (rErr) {
    console.error('Registration Error:', rErr);
    return;
  }
  console.log(`Found ${regs?.length} registrations:`);
  for (const r of regs || []) {
    console.log(`ID: ${r.id} | RegNum: ${r.registration_number} | Year: ${r.academic_year} | Status: ${r.status} | Student: ${r.student?.first_name} ${r.student?.last_name} (${r.student?.permanent_uid}) | Inst: ${r.institution?.code} | Prog: ${r.program?.code}`);
  }

  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, first_name, last_name, permanent_uid')
    .order('created_at', { ascending: true });

  if (sErr) {
    console.error('Student Error:', sErr);
    return;
  }
  console.log(`\nFound ${students?.length} students:`);
  for (const s of students || []) {
    console.log(`ID: ${s.id} | UID: ${s.permanent_uid} | Name: ${s.first_name} ${s.last_name}`);
  }
}

check().catch(console.error);
