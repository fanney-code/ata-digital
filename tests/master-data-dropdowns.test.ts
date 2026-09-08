import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchInstitutions,
  fetchDepartments,
  fetchPrograms,
  fetchProgramsForInstitution,
} from '../lib/api/supabase-service';

test('Authoritative Institutions & Programs Verification Suite', async (t) => {
  const institutions = await fetchInstitutions();
  const allPrograms = await fetchPrograms();

  await t.test('All 29 requested institutions (plus legacy) exist and have valid codes', () => {
    assert.ok(institutions.length >= 31, `Expected at least 31 institutions, got ${institutions.length}`);

    const expectedInstitutions = [
      { code: 'NIBS', name: 'New India Bible Seminary' },
      { code: 'SAIACS', name: 'South Asia Institute of Advanced Christian Studies' },
      { code: 'MTSC', name: 'Madras Theological Seminary & College' },
      { code: 'CLGD', name: 'Centre for Global Leadership Development' },
      { code: 'AGST-NEI', name: 'Asia Graduate School of Theology-North East India' },
      { code: 'IBTS', name: 'India Baptist Theological Seminary' },
      { code: 'UBS', name: 'Union Biblical Seminary' },
      { code: 'CI', name: 'Caleb Institute' },
      { code: 'NTC', name: 'New Theological College' },
      { code: 'NLC', name: 'New Life College' },
      { code: 'HBIC', name: 'Hindustan Bible Institute & College' },
      { code: 'ETS', name: 'Evangelical Theological Seminary' },
      { code: 'IPC-TS', name: 'IPC Theological Seminary' },
      { code: 'COTR-TS', name: 'Church On The Rock Theological Seminary' },
      { code: 'FIGS', name: 'Filadelfia Institute of Global Studies' },
      { code: 'AGAPE', name: 'AGAPE College' },
      { code: 'MAGBC', name: 'Madras AG Bible College' },
      { code: 'HBC', name: 'Harvest Bible College' },
      { code: 'MTTC', name: 'Mt. Terogvu Theological College' },
      { code: 'GBC', name: 'Grace Bible College' },
      { code: 'NBC', name: 'Nagaland Bible College' },
      { code: 'DTC', name: 'Doulos Theological College' },
      { code: 'NEST', name: 'Native Evangelical School of Theology' },
      { code: 'JLI', name: 'John’s Leadership Institute' },
      { code: 'VTS', name: 'Vision Theological Seminary' },
      { code: 'LTCI', name: 'Life Transforming College International' },
      { code: 'RTC', name: 'Restoration Theological College' },
      { code: 'SIBBC', name: 'South India Baptist Bible College & Seminary' },
      { code: 'ATA', name: 'Asia Theological Association India XML master data' },
    ];

    for (const exp of expectedInstitutions) {
      const found = institutions.find((i) => i.code === exp.code);
      assert.ok(found, `Institution with code ${exp.code} must exist`);
      assert.ok(
        found.name.includes(exp.name) || exp.name.includes(found.name),
        `Institution name mismatch for ${exp.code}: expected to include ${exp.name}, got ${found.name}`
      );
      // Code format rule: uppercase, no period
      assert.strictEqual(found.code, found.code.toUpperCase());
      assert.strictEqual(found.code.includes('.'), false);
    }
  });

  await t.test('Every institution has its specific authoritative programs', async () => {
    // Test a sample of institutions and their specific program codes
    const testCases: Record<string, string[]> = {
      NIBS: ['BTH', 'MDIV', 'DIPTH', 'MTH-PTC', 'MTH-PT'],
      SAIACS: [
        'CTH', 'DIPTH', 'DMIN', 'DMIN-OL', 'PHD', 'IMTH', 'MA-OL',
        'MATS-A', 'MATS-A-OL', 'MA', 'MATS', 'MDIV', 'MDIV-OL', 'MTH',
        'PGD', 'PGD-OL',
      ],
      MTSC: ['BMIN', 'BTH', 'DIPTH', 'DMIN', 'MDIV', 'MTH-MM'],
      CLGD: ['BTH', 'DIPTH', 'DMIN', 'MA', 'MA-OL', 'MDIV', 'MDIV-OL', 'PGD', 'PGD-OL'],
      'AGST-NEI': ['MTH-CE', 'MTH-CH', 'MTH-CT', 'MTH-PT'],
      IBTS: ['DMIN', 'MDIV', 'MTH-HC', 'MTH-PC'],
      UBS: ['BTH', 'MDIV', 'MTH'],
      CI: ['BTH', 'MDIV-M', 'MDIV-NT', 'MDIV-OT', 'MTH-MIS', 'MTH-NT'],
      NTC: ['BTH', 'CTH', 'MDIV', 'MTH-CT', 'MTH-MS', 'MTH-NT', 'MTH-OT'],
      NLC: ['BTH', 'DMIN', 'MDIV', 'MTH-NT'],
      HBIC: ['BTH', 'DMIN', 'MBS', 'MDIV', 'MTH-MIS', 'MTH-NT', 'MTH-OT', 'MTH-PT', 'PHD-ICS', 'PHD-NT'],
      ETS: ['DMIN', 'MACS-OL', 'MBS', 'IMTH', 'PGDBS', 'PHD-THEO'],
      'IPC-TS': ['BTH-RES', 'MATS-OL', 'MDIV-OL', 'MDIV-RDL'],
      'COTR-TS': ['BTH', 'MA-OL', 'MDIV', 'MDIV-OL', 'MTH-HC', 'MTH-MIS'],
      FIGS: ['BTH', 'CTH-HI', 'DIPTH-HE', 'MDIV', 'MDIV-OL'],
      AGAPE: ['BTH', 'DIPTH'],
      MAGBC: ['BTH', 'DIPTH', 'MACS'],
      HBC: ['BTH', 'DIPTH', 'MDIV'],
      MTTC: ['BTH', 'DIPTH', 'MDIV'],
      GBC: ['BTH', 'DIPTH', 'MDIV'],
      NBC: ['BTH', 'DIPTH', 'MDIV'],
      DTC: ['BTH', 'DIPTH'],
      NEST: ['BTH', 'DIPTH', 'MDIV'],
      JLI: ['BTH', 'DIPTH'],
      VTS: ['BTH', 'MDIV'],
      LTCI: ['BTH', 'MDIV'],
      RTC: ['MDIV'],
      SIBBC: ['BTH', 'DIPTH', 'MA', 'MDIV'],
      ATA: ['BTH', 'MDIV', 'MTH', 'DMIN', 'PHD'],
    };

    for (const [instCode, expectedProgCodes] of Object.entries(testCases)) {
      const inst = institutions.find((i) => i.code === instCode);
      assert.ok(inst, `Institution ${instCode} must exist`);

      const progs = await fetchProgramsForInstitution(inst.id);
      assert.ok(progs.length >= expectedProgCodes.length, `Institution ${instCode} should have at least ${expectedProgCodes.length} programs, got ${progs.length}`);

      const actualProgCodes = progs.map((p) => p.code);
      for (const expectedCode of expectedProgCodes) {
        assert.ok(
          actualProgCodes.includes(expectedCode),
          `Institution ${instCode} is missing program code ${expectedCode}. Found: ${actualProgCodes.join(', ')}`
        );
      }
    }
  });

  await t.test('All program and institution codes strictly follow formatting rules', () => {
    for (const inst of institutions) {
      assert.strictEqual(inst.code, inst.code.toUpperCase(), `Institution code ${inst.code} must be uppercase`);
      assert.strictEqual(inst.code.includes('.'), false, `Institution code ${inst.code} must not contain periods`);
    }

    for (const prog of allPrograms) {
      assert.strictEqual(prog.code, prog.code.toUpperCase(), `Program code ${prog.code} must be uppercase`);
      assert.strictEqual(prog.code.includes('.'), false, `Program code ${prog.code} must not contain periods`);
    }
  });

  await t.test('All 202 institutions and 127 programs are reflected in wizard constants', async () => {
    const {
      INSTITUTION_NAMES,
      PROGRAM_NAMES,
      PREVIOUS_PROGRAMS_BY_CATEGORY,
    } = await import('../components/registration/NewRegistrationWizard');

    assert.ok(INSTITUTION_NAMES.length >= 202, `Expected at least 202 institutions, got ${INSTITUTION_NAMES.length}`);
    assert.ok(PROGRAM_NAMES.length >= 127, `Expected at least 127 programs, got ${PROGRAM_NAMES.length}`);
    assert.ok(institutions.length >= 202, `Database must have at least 202 institutions, got ${institutions.length}`);

    // Verify critical categories in PREVIOUS_PROGRAMS_BY_CATEGORY
    const requiredCategories = [
      'Certificate',
      'Diploma',
      'Bachelor',
      'Master of Arts',
      'Master of Biblical Studies',
      'Master of Divinity',
      'Master of Theology',
      'Postgraduate',
      'Doctoral',
    ];

    for (const cat of requiredCategories) {
      assert.ok(
        PREVIOUS_PROGRAMS_BY_CATEGORY[cat] && PREVIOUS_PROGRAMS_BY_CATEGORY[cat].length > 0,
        `Category ${cat} must contain programs`
      );
    }
  });

  await t.test('Allahabad Bible Seminary (ABS) and other institutions return full 127+ program list for the Program dropdown', async () => {
    const abs = institutions.find((i) => i.code === 'ABS');
    assert.ok(abs, 'ABS institution must exist');

    const absProgs = await fetchProgramsForInstitution(abs.id);
    assert.ok(absProgs.length >= 127, `ABS must offer at least 127 programs in the dropdown, got ${absProgs.length}`);

    // Verify key programs requested by the user
    const sampleExpected = [
      'Bachelor of Theology',
      'Diploma in Theology',
      'Certificate in Theology',
      'Certificate in Ministry',
      'Master of Divinity',
      'Master of Divinity (Online)',
      'Master of Theology',
      'Master of Theology in Pastoral Theology & Counseling',
      'Doctor of Ministry',
      'Doctor of Philosophy (PhD)',
      'PhD in Intercultural Studies',
      'PhD in New Testament',
      'MA in Christian Studies',
      'Master of Biblical Studies',
    ];

    for (const progName of sampleExpected) {
      assert.ok(
        absProgs.some((p) => p.name === progName || p.name.includes(progName)),
        `ABS program dropdown must include "${progName}"`
      );
    }
  });
});
