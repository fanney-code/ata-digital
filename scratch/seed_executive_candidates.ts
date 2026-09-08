import { supabase } from '../lib/supabase/client';
import {
  fetchInstitutions,
  fetchDepartments,
  fetchPrograms,
  fetchStudents,
  createStudent,
  updateStudent,
  createRegistration,
  fetchRegistrations,
  updateRegistrationStatus,
} from '../lib/api/supabase-service';

async function seedExecutiveCandidates() {
  console.log('--- Starting Executive Dashboard Candidate Seeding ---');

  const [institutions, existingStudents, existingRegs] = await Promise.all([
    fetchInstitutions(),
    fetchStudents(),
    fetchRegistrations(),
  ]);

  const saiacs = institutions.find(i => i.code === 'SAIACS' || i.name.toLowerCase().includes('saiacs')) || institutions[0];
  const faith = institutions.find(i => i.code === 'FTS' || i.name.toLowerCase().includes('faith theological')) || institutions[0];
  let aizawl = institutions.find(i => i.code === 'ATC-MIZ' || i.name.toLowerCase().includes('aizawl theological college')) || institutions[0];
  const cotr = institutions.find(i => i.code === 'COTR-TS' || i.name.toLowerCase().includes('church on the rock')) || institutions[0];
  const ubs = institutions.find(i => i.code === 'UBS' || i.name.toLowerCase().includes('union biblical')) || institutions[0];

  async function getOrCreateProg(instId: string, deptName: string, progName: string, progCode: string) {
    let depts = await fetchDepartments(instId);
    let dept = depts.find(d => d.name.toLowerCase().includes(deptName.toLowerCase())) || depts[0];
    if (!dept) {
      const { data: newD } = await supabase.from('departments').insert([{
        institution_id: instId,
        name: deptName,
        code: deptName.slice(0, 4).toUpperCase(),
      }]).select().single();
      dept = newD;
    }
    let progs = await fetchPrograms(dept.id);
    let prog = progs.find(p => p.name.toLowerCase().includes(progName.toLowerCase())) || progs[0];
    if (!prog) {
      const { data: newP } = await supabase.from('programs').insert([{
        department_id: dept.id,
        name: progName,
        code: progCode,
        level: progCode.includes('PHD') ? 'DOCTORAL' : progCode.includes('MTH') ? 'MASTERS' : 'BACHELORS',
        duration_years: 3
      }]).select().single();
      prog = newP;
    }
    return { dept, prog };
  }

  const saiacsProgMTh = await getOrCreateProg(saiacs.id, 'Theology', 'Master of Theology (M.Th) Christian Ethics', 'MTH-CE');
  const faithProgPhD = await getOrCreateProg(faith.id, 'Missiology', 'Ph.D Intercultural Studies', 'PHD-IS');
  const aizawlProgBTh = await getOrCreateProg(aizawl.id, 'Biblical', 'Bachelor of Theology (B.Th)', 'BTH');
  const saiacsProgMThBib = await getOrCreateProg(saiacs.id, 'Biblical', 'M.Th Biblical Studies', 'MTH-BS');
  const cotrProg = await getOrCreateProg(cotr.id, 'Theology', 'Master of Divinity (M.Div)', 'MDIV');
  const ubsProg = await getOrCreateProg(ubs.id, 'Theology', 'Bachelor of Divinity (B.D)', 'BD');

  const candidateSpecs = [
    {
      firstName: 'Ananya',
      lastName: 'Sengupta',
      email: 'ananya.sengupta@saiacs.org',
      phone: '+91 98450 12894',
      state: 'Karnataka',
      city: 'Bangalore',
      district: 'Bangalore Urban',
      pincode: '560077',
      address: 'SAIACS Box 7705, Kothanur',
      gender: 'FEMALE',
      aadhar_number: '556677889901',
      regNum: 'ATA-2026-06472',
      inst: saiacs,
      dept: saiacsProgMTh.dept,
      prog: saiacsProgMTh.prog,
      status: 'RESUBMITTED' as const,
      notes: 'Registrar note: Revised M.Div transcript seal uploaded from Senate of Serampore with verification QR code intact.',
    },
    {
      firstName: 'Rev. Dr. Paul K.',
      lastName: 'Thang',
      email: 'paul.thang@faithseminary.edu',
      phone: '+91 94471 28911',
      state: 'Kerala',
      city: 'Manakkala',
      district: 'Pathanamthitta',
      pincode: '691551',
      address: 'Faith Theological Seminary Campus',
      gender: 'MALE',
      aadhar_number: '556677889902',
      regNum: 'ATA-2026-06479',
      inst: faith,
      dept: faithProgPhD.dept,
      prog: faithProgPhD.prog,
      status: 'SUBMITTED' as const,
      notes: 'Curriculum Intake: Initial candidate intake dossier with 5 peer-reviewed publications and letters of episcopal recommendation.',
    },
    {
      firstName: 'Joshua R.',
      lastName: 'Sailo',
      email: 'joshua.sailo@atc.edu.in',
      phone: '+91 98623 91024',
      state: 'Mizoram',
      city: 'Aizawl',
      district: 'Aizawl',
      pincode: '796001',
      address: 'Durtlang, ATC Campus',
      gender: 'MALE',
      aadhar_number: '556677889903',
      regNum: 'ATA-2026-06922',
      inst: aizawl,
      dept: aizawlProgBTh.dept,
      prog: aizawlProgBTh.prog,
      status: 'RESUBMITTED' as const,
      notes: 'Registrar action: Biometric Aadhaar ID verified and high-res matriculation diploma re-attached.',
    },
    {
      firstName: 'Deborah',
      lastName: 'Lalthanzami',
      email: 'deborah.l@saiacs.org',
      phone: '+91 98451 99283',
      state: 'Karnataka',
      city: 'Bangalore',
      district: 'Bangalore Urban',
      pincode: '560077',
      address: 'SAIACS Box 7705, Kothanur',
      gender: 'FEMALE',
      aadhar_number: '556677889904',
      regNum: 'ATA-2026-01844',
      inst: saiacs,
      dept: saiacsProgMThBib.dept,
      prog: saiacsProgMThBib.prog,
      status: 'UNDER_REVIEW' as const,
      notes: 'Equivalence check: Equivalence certificate for foreign degree under bilateral treaty review board.',
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@cotr.ac.in',
      phone: '+91 98480 34512',
      state: 'Andhra Pradesh',
      city: 'Visakhapatnam',
      district: 'Visakhapatnam',
      pincode: '530048',
      address: 'COTR Campus, Bakkannapalem',
      gender: 'FEMALE',
      aadhar_number: '556677889905',
      regNum: 'ATA-2026-0641',
      inst: cotr,
      dept: cotrProg.dept,
      prog: cotrProg.prog,
      status: 'CORRECTION_REQUIRED' as const,
      notes: 'Deficiency: Transcript seal from MCC missing page 2 coursework credits.',
    },
    {
      firstName: 'Samuel K.',
      lastName: 'Marak',
      email: 'samuel.marak@ubs.ac.in',
      phone: '+91 98230 44910',
      state: 'Maharashtra',
      city: 'Pune',
      district: 'Pune',
      pincode: '411037',
      address: 'UBS Campus, Bibvewadi',
      gender: 'MALE',
      aadhar_number: '556677889906',
      regNum: 'ATA-2026-0912',
      inst: ubs,
      dept: ubsProg.dept,
      prog: ubsProg.prog,
      status: 'CORRECTION_REQUIRED' as const,
      notes: 'Deficiency: Endorsement letter lacking authorized presbytery countersignature.',
    },
  ];

  for (const spec of candidateSpecs) {
    let stu = existingStudents.find(s => s.email?.toLowerCase() === spec.email.toLowerCase() || (s.first_name === spec.firstName && s.last_name === spec.lastName));
    if (!stu) {
      stu = await createStudent({
        first_name: spec.firstName,
        last_name: spec.lastName,
        email: spec.email,
        phone: spec.phone,
        state: spec.state,
        city: spec.city,
        district: spec.district,
        pincode: spec.pincode,
        address: spec.address,
        gender: spec.gender as any,
        date_of_birth: '1995-05-15',
        aadhar_number: spec.aadhar_number,
        national_id: spec.aadhar_number,
        country: 'India',
      });
      console.log(`Created student: ${stu.first_name} ${stu.last_name} (${stu.id})`);
    } else {
      console.log(`Student already exists: ${stu.first_name} ${stu.last_name}`);
      if (!stu.state) {
        stu = await updateStudent(stu.id, { state: spec.state, address: spec.address, city: spec.city });
        console.log(`Updated existing student ${stu.first_name} with state ${spec.state}`);
      }
    }

    let reg = existingRegs.find(r => r.registration_number === spec.regNum);
    if (!reg) {
      reg = await createRegistration({
        registration_number: spec.regNum,
        student_id: stu.id,
        institution_id: spec.inst.id,
        department_id: spec.dept.id,
        program_id: spec.prog.id,
        academic_year: '2026-2027',
        status: spec.status,
        notes: spec.notes,
        registration_type: 'INITIAL_REGISTRATION',
      });
      console.log(`Created registration: ${spec.regNum} with status ${spec.status}`);
    } else {
      console.log(`Registration ${spec.regNum} exists with status ${reg.status}`);
      if (reg.status !== spec.status || reg.notes !== spec.notes) {
        await updateRegistrationStatus(reg.id, spec.status, spec.notes);
        console.log(`Updated registration ${spec.regNum} to ${spec.status}`);
      }
    }
  }

  console.log('--- Executive Candidates Seeding Complete ---');
}

seedExecutiveCandidates().catch(console.error);
