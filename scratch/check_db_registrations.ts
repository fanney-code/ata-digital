import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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
    console.log(`ID: ${r.id} | RegNum: ${r.registration_number} | Year: ${r.academic_year} | Status: ${r.status} | Student: ${(r.student as any)?.first_name} ${(r.student as any)?.last_name} (${(r.student as any)?.permanent_uid}) | Inst: ${(r.institution as any)?.code} | Prog: ${(r.program as any)?.code}`);
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
