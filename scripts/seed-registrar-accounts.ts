import { upsertProfile, fetchProfiles } from '../lib/api/supabase-service';
import { INITIAL_INSTITUTIONS } from '../lib/api/mock-fallback';

export const DEMO_REGISTRARS = [
  {
    email: 'm.thomas@saiacs.org',
    fullName: 'Rev. M. Thomas',
    institutionCode: 'SAIACS',
    institutionName: 'South Asia Institute of Advanced Christian Studies',
    institutionId: '32de4338-962a-4b12-ba2d-4e2dc2dcb7da',
  },
  {
    email: 'ashishc@ubs.ac.in',
    fullName: 'Dr. Ashish Christopher',
    institutionCode: 'UBS',
    institutionName: 'Union Biblical Seminary',
    institutionId: '8dcc7eac-69df-4cd1-b687-65fe76f14b97',
  },
  {
    email: 'registrar@abseminary.edu.ph',
    fullName: 'Dr. Maria Elena Santos',
    institutionCode: 'ABS',
    institutionName: 'Allahabad Bible Seminary',
    institutionId: '50a48f4a-7142-4462-97ab-bc06aaf0036b',
  },
];

export async function seedDemoRegistrars(): Promise<void> {
  console.log('Seeding 3 demo Registrar accounts with authoritative institution assignments...');

  for (const demo of DEMO_REGISTRARS) {
    const inst = INITIAL_INSTITUTIONS.find(
      (i) => i.code === demo.institutionCode || i.id === demo.institutionId
    );
    const targetInstitutionId = inst ? inst.id : demo.institutionId;

    const profile = await upsertProfile(
      demo.email,
      demo.fullName,
      'REGISTRAR',
      targetInstitutionId
    );

    console.log(
      `✓ Provisioned Registrar: ${profile.full_name} (${profile.email}) -> Institution: ${demo.institutionCode} (${targetInstitutionId})`
    );
  }

  const profiles = await fetchProfiles();
  console.log(`Total profiles in database: ${profiles.length}`);
}

// Run if directly executed
if (typeof require !== 'undefined' && require.main === module) {
  seedDemoRegistrars()
    .then(() => {
      console.log('Demo registrar provisioning complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to provision demo registrars:', err);
      process.exit(1);
    });
}
