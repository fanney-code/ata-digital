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

async function migrate() {
  console.log('--- Starting Standard ID Migration on Supabase ---');

  // 1. Update Students: Pad 4-digit sequences to 5 digits: STU-YYYY-XXXXX
  const studentUpdates = [
    { id: 'd0100000-0000-0000-0000-000000000001', oldUid: 'STU-2021-0314', newUid: 'STU-2021-00314' },
    { id: 'd0100000-0000-0000-0000-000000000002', oldUid: 'STU-2022-0894', newUid: 'STU-2022-00894' },
    { id: 'd0100000-0000-0000-0000-000000000003', oldUid: 'STU-2020-0419', newUid: 'STU-2020-00419' },
    { id: 'd0100000-0000-0000-0000-000000000004', oldUid: 'STU-2023-1182', newUid: 'STU-2023-01182' },
    { id: 'd0100000-0000-0000-0000-000000000005', oldUid: 'STU-2024-0612', newUid: 'STU-2024-00612' },
  ];

  for (const s of studentUpdates) {
    const { error } = await supabase
      .from('students')
      .update({ permanent_uid: s.newUid })
      .eq('id', s.id);
    if (error) {
      console.error(`Error updating student ${s.id} (${s.oldUid} -> ${s.newUid}):`, error);
    } else {
      console.log(`✓ Student ${s.oldUid} updated to ${s.newUid}`);
    }
  }

  // 2. Update Registrations: Format to [INSTITUTION_CODE]/[PROGRAM_CODE]/[YEAR]/[SEQUENCE]
  const regUpdates = [
    // Samuel K. Marak: UBS, BA-CML, 2026, seq 1
    { id: '957edb6d-327b-4fb1-b926-3eb756030756', oldReg: 'ATA-2026-0912', newReg: 'UBS/BA-CML/2026/1' },
    // Priya Sharma: COTR-TS, BA-CML, 2026, seq 1
    { id: 'e1fe9e46-7529-4383-8f65-0d8375779e5e', oldReg: 'ATA-2026-0641', newReg: 'COTR-TS/BA-CML/2026/1' },
    // Ananya Sengupta: SAIACS, BA-CML, 2026, seq 1
    { id: '9d527bc3-3682-4e27-905c-eea7dbc4eee6', oldReg: 'ATA-2026-06472', newReg: 'SAIACS/BA-CML/2026/1' },
    // Deborah Lalthanzami: SAIACS, BA-CML, 2026, seq 2
    { id: '5846b274-a7d5-4dbf-8e5d-53a109a2c34c', oldReg: 'ATA-2026-01844', newReg: 'SAIACS/BA-CML/2026/2' },
    // Joshua R. Sailo: ACPL, BA-CML, 2026, seq 1
    { id: 'f9c58348-ef9a-4b85-a55a-69bbf8d28f8e', oldReg: 'ATA-2026-06922', newReg: 'ACPL/BA-CML/2026/1' },
    // Rev. Dr. Paul K. Thang: FTS, BA-CML, 2026, seq 1
    { id: '82d9c21a-a0b3-45de-a14f-27958cf478e3', oldReg: 'ATA-2026-06479', newReg: 'FTS/BA-CML/2026/1' },
    // Rev. David Immanuel Sangma: 3 milestones
    { id: 'e0100000-0000-0000-0000-000000000001', oldReg: 'ATA-2024-06109', newReg: 'SAIACS/BA/2026/1' },
    { id: 'e0100000-0000-0000-0000-000000000002', oldReg: 'ATA-2023-08812', newReg: 'SAIACS/BA-CM/2023/1' },
    { id: 'e0100000-0000-0000-0000-000000000003', oldReg: 'ATA-2020-00441', newReg: 'UBS/BA/2020/1' },
  ];

  for (const r of regUpdates) {
    const { error } = await supabase
      .from('registrations')
      .update({ registration_number: r.newReg })
      .eq('id', r.id);
    if (error) {
      console.error(`Error updating registration ${r.id} (${r.oldReg} -> ${r.newReg}):`, error);
    } else {
      console.log(`✓ Registration ${r.oldReg} updated to ${r.newReg}`);
    }
  }

  // 3. Verify all registrations
  console.log('\n--- Verifying Updated Registrations ---');
  const { data: allRegs } = await supabase
    .from('registrations')
    .select('id, registration_number, academic_year, status, student:students(first_name, last_name, permanent_uid), program:programs(code), institution:institutions(code)')
    .order('created_at', { ascending: true });

  let nonStandardCount = 0;
  for (const r of allRegs || []) {
    const isStandardReg = /^[A-Z0-9-]+\/[A-Z0-9-]+\/\d{4}\/\d+$/.test(r.registration_number);
    const stuUid = r.student?.permanent_uid;
    const isStandardUid = /^STU-\d{4}-\d{5}$/.test(stuUid || '');
    if (!isStandardReg || !isStandardUid) {
      nonStandardCount++;
      console.warn(`⚠️ NON-STANDARD RECORD: Reg: ${r.registration_number} (valid: ${isStandardReg}) | UID: ${stuUid} (valid: ${isStandardUid})`);
    } else {
      console.log(`  ✓ OK: Reg ${r.registration_number.padEnd(25)} | Student: ${(r.student?.first_name + ' ' + r.student?.last_name).padEnd(28)} | UID: ${stuUid}`);
    }
  }

  if (nonStandardCount === 0) {
    console.log('\n🎉 ALL REGISTRATIONS AND STUDENTS MEET THE 2 STANDARD ID FORMATS PERFECTLY!');
  } else {
    console.error(`\n❌ Warning: ${nonStandardCount} records do not match format.`);
  }
}

migrate().catch(console.error);
