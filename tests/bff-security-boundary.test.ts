import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  assertPermission,
  fetchRegistrations,
  fetchRegistrationById,
  fetchStudents,
  fetchStudentById,
  createRegistration,
  updateRegistrationDraft,
  updateRegistrationStatus,
  updateRegistrationAndStudent,
  deleteRegistration,
  uploadDocumentAttachment,
  batchImportStudentRegistrations,
  createStudent,
} from '../lib/api/supabase-service';
import {
  fallbackStore,
  INITIAL_INSTITUTIONS,
  INITIAL_DEPARTMENTS,
  INITIAL_PROGRAMS,
} from '../lib/api/mock-fallback';
import { ActorContext, Registration, Student } from '../lib/types';

describe('BFF Security Boundary & Invariant Verification Suite', () => {
  const saiacsInst = INITIAL_INSTITUTIONS.find((i) => i.code === 'SAIACS')!;
  const ubsInst = INITIAL_INSTITUTIONS.find((i) => i.code === 'UBS')!;
  const absInst = INITIAL_INSTITUTIONS.find((i) => i.code === 'ABS')!;

  const saiacsDept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === saiacsInst.id) || INITIAL_DEPARTMENTS[0];
  const saiacsProg = INITIAL_PROGRAMS.find((p) => p.department_id === saiacsDept.id) || INITIAL_PROGRAMS[0];

  const ubsDept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === ubsInst.id) || INITIAL_DEPARTMENTS[0];
  const ubsProg = INITIAL_PROGRAMS.find((p) => p.department_id === ubsDept.id) || INITIAL_PROGRAMS[0];

  // Actors derived strictly from server session
  const saiacsRegistrarActor: ActorContext = {
    role: 'REGISTRAR',
    institutionId: saiacsInst.id,
    userId: 'user-saiacs-reg',
    email: 'registrar@saiacs.edu',
  };

  const ubsRegistrarActor: ActorContext = {
    role: 'REGISTRAR',
    institutionId: ubsInst.id,
    userId: 'user-ubs-reg',
    email: 'registrar@ubs.edu',
  };

  const unassignedRegistrarActor: ActorContext = {
    role: 'REGISTRAR',
    institutionId: undefined, // Unassigned
    userId: 'user-unassigned-reg',
    email: 'new-registrar@ataportal.edu',
  };

  const adminActor: ActorContext = {
    role: 'ADMINISTRATOR',
    userId: 'user-admin',
    email: 'admin@ataportal.edu',
  };

  const universalActor: ActorContext = {
    role: 'UNIVERSAL',
    userId: 'user-universal',
    email: 'universal@ataportal.edu',
  };

  // Seed sample records
  const saiacsStudent = fallbackStore.createStudent(
    {
      first_name: 'Abraham',
      last_name: 'Kurien',
      email: 'abraham.kurien@example.com',
      date_of_birth: '1998-05-12',
      gender: 'MALE',
      phone: '9876543210',
      state: 'Karnataka',
      country: 'India',
      city: 'Bengaluru',
      address: 'SAIACS Enclave',
      pincode: '560077',
      national_id: '998877665544',
    },
    2026
  );

  const saiacsReg = fallbackStore.createRegistration({
    student_id: saiacsStudent.id,
    institution_id: saiacsInst.id,
    department_id: saiacsDept.id,
    program_id: saiacsProg.id,
    academic_year: '2026-2027',
    registration_type: 'INITIAL_REGISTRATION',
    status: 'SUBMITTED',
  });

  const ubsStudent = fallbackStore.createStudent(
    {
      first_name: 'Priyanka',
      last_name: 'Deshmukh',
      email: 'priyanka.d@example.com',
      date_of_birth: '1999-08-22',
      gender: 'FEMALE',
      phone: '9876543211',
      state: 'Maharashtra',
      country: 'India',
      city: 'Pune',
      address: 'Bibwewadi',
      pincode: '411037',
      national_id: '887766554433',
    },
    2026
  );

  const ubsReg = fallbackStore.createRegistration({
    student_id: ubsStudent.id,
    institution_id: ubsInst.id,
    department_id: ubsDept.id,
    program_id: ubsProg.id,
    academic_year: '2026-2027',
    registration_type: 'INITIAL_REGISTRATION',
    status: 'SUBMITTED',
  });

  describe('1. Registrar Institution Isolation Enforcements', () => {
    it('Registrar can fetch only registrations from assigned institution', () => {
      const regs = fallbackStore.getRegistrations(saiacsRegistrarActor);
      assert.ok(regs.length > 0, 'Should return registrations');
      assert.ok(regs.every((r) => r.institution_id === saiacsInst.id), 'All registrations must belong to SAIACS');
      assert.ok(!regs.some((r) => r.id === ubsReg.id), 'Must not include UBS registrations');
    });

    it('Registrar cannot fetch another institution registration by direct ID', () => {
      assert.throws(
        () => {
          fallbackStore.getRegistrationById(ubsReg.id, saiacsRegistrarActor);
        },
        /403 Forbidden.*Access denied to other institutions' registrations/,
        'Should reject with 403 Forbidden'
      );
    });

    it('Registrar cannot update status of another institution registration', () => {
      assert.throws(
        () => {
          assertPermission('UPDATE_STATUS', saiacsRegistrarActor, ubsInst.id, { status: 'APPROVED' });
        },
        /403 Forbidden.*Cannot alter status of registration belonging to another institution/,
        'Should reject status change of another institution'
      );
    });

    it('Registrar cannot delete another institution registration', () => {
      assert.throws(
        () => {
          assertPermission('DELETE_REGISTRATION', saiacsRegistrarActor, ubsInst.id);
        },
        /403 Forbidden.*Cannot delete registration belonging to another institution/,
        'Should reject deletion of another institution'
      );
    });

    it('Registrar cannot create registration for another institution', () => {
      assert.throws(
        () => {
          assertPermission('CREATE_REGISTRATION', saiacsRegistrarActor, ubsInst.id);
        },
        /403 Forbidden.*Registrars can only create registrations for their assigned institution/,
        'Should reject registration creation for non-assigned institution'
      );
    });

    it('Registrar cannot edit registration across institutions', () => {
      assert.throws(
        () => {
          assertPermission('EDIT_REGISTRATION', saiacsRegistrarActor, ubsInst.id);
        },
        /403 Forbidden.*Cannot modify registration belonging to another institution/,
        'Should reject cross-institution registration edit'
      );
    });

    it('Registrar cannot upload document to another institution', () => {
      assert.throws(
        () => {
          assertPermission('UPLOAD_DOCUMENT', saiacsRegistrarActor, ubsInst.id);
        },
        /403 Forbidden.*Cannot upload documents for another institution/,
        'Should reject cross-institution document upload'
      );
    });
  });

  describe('2. Unassigned Registrar Fail-Closed Behavior', () => {
    it('Unassigned Registrar receives empty registrations list', () => {
      const regs = fallbackStore.getRegistrations(unassignedRegistrarActor);
      assert.deepStrictEqual(regs, [], 'Must return empty array');
    });

    it('Unassigned Registrar receives empty students list', () => {
      const students = fallbackStore.getStudents(unassignedRegistrarActor);
      assert.deepStrictEqual(students, [], 'Must return empty array');
    });

    it('Unassigned Registrar cannot create registrations', () => {
      assert.throws(
        () => {
          assertPermission('CREATE_REGISTRATION', unassignedRegistrarActor, saiacsInst.id);
        },
        /403 Forbidden: Registrar has no assigned institution/,
        'Must fail closed when unassigned'
      );
    });

    it('Unassigned Registrar cannot import batches', () => {
      assert.throws(
        () => {
          assertPermission('IMPORT_BATCH', unassignedRegistrarActor);
        },
        /403 Forbidden: Registrar has no assigned institution/,
        'Must fail closed when unassigned'
      );
    });
  });

  describe('3. Administrator Cross-Institution Access & Invariants', () => {
    it('Administrator can view registrations across all institutions', async () => {
      const regs = await fetchRegistrations(undefined, adminActor);
      const hasSaiacs = regs.some((r) => r.institution_id === saiacsInst.id);
      const hasUbs = regs.some((r) => r.institution_id === ubsInst.id);
      assert.ok(hasSaiacs, 'Admin must see SAIACS registrations');
      assert.ok(hasUbs, 'Admin must see UBS registrations');
    });

    it('Administrator can approve registrations across institutions', async () => {
      assert.doesNotThrow(() => {
        assertPermission('UPDATE_STATUS', adminActor, saiacsInst.id, { status: 'APPROVED' });
      });
      assert.doesNotThrow(() => {
        assertPermission('UPDATE_STATUS', adminActor, ubsInst.id, { status: 'APPROVED' });
      });
    });

    it('Administrator cannot create registrations (operational restriction)', async () => {
      assert.throws(
        () => {
          assertPermission('CREATE_REGISTRATION', adminActor, saiacsInst.id);
        },
        /403 Forbidden/,
        'Admin must not create registrations'
      );
    });

    it('Administrator cannot upload documents (operational restriction)', async () => {
      assert.throws(
        () => {
          assertPermission('UPLOAD_DOCUMENT', adminActor, saiacsInst.id);
        },
        /403 Forbidden/,
        'Admin must not upload documents'
      );
    });

    it('Administrator cannot delete registrations', async () => {
      assert.throws(
        () => {
          assertPermission('DELETE_REGISTRATION', adminActor, saiacsInst.id);
        },
        /403 Forbidden/,
        'Admin must not delete registrations'
      );
    });
  });

  describe('4. Universal Role Read-Only Enforcement', () => {
    it('Universal can read registrations across all institutions', async () => {
      const regs = await fetchRegistrations(undefined, universalActor);
      assert.ok(regs.length > 0, 'Universal can read registrations');
    });

    it('Universal cannot create registrations', () => {
      assert.throws(
        () => {
          assertPermission('CREATE_REGISTRATION', universalActor, saiacsInst.id);
        },
        /403 Forbidden/,
        'Universal cannot create registrations'
      );
    });

    it('Universal cannot edit registrations', () => {
      assert.throws(
        () => {
          assertPermission('EDIT_REGISTRATION', universalActor, saiacsInst.id);
        },
        /403 Forbidden/,
        'Universal cannot edit registrations'
      );
    });

    it('Universal cannot update registration status', () => {
      assert.throws(
        () => {
          assertPermission('UPDATE_STATUS', universalActor, saiacsInst.id, { status: 'APPROVED' });
        },
        /403 Forbidden/,
        'Universal cannot update status'
      );
    });

    it('Universal cannot delete registrations', () => {
      assert.throws(
        () => {
          assertPermission('DELETE_REGISTRATION', universalActor, saiacsInst.id);
        },
        /403 Forbidden/,
        'Universal cannot delete registrations'
      );
    });

    it('Universal cannot upload documents', () => {
      assert.throws(
        () => {
          assertPermission('UPLOAD_DOCUMENT', universalActor, saiacsInst.id);
        },
        /403 Forbidden/,
        'Universal cannot upload documents'
      );
    });

    it('Universal cannot import batches', () => {
      assert.throws(
        () => {
          assertPermission('IMPORT_BATCH', universalActor);
        },
        /403 Forbidden/,
        'Universal cannot import batches'
      );
    });
  });
});
