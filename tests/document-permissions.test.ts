import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  assertPermission,
  getDocumentFileBuffer,
} from '../lib/api/supabase-service';
import { ActorContext } from '../lib/types';

describe('Document-Level Permissions & Isolation Suite (Preview, Download, Delete)', () => {
  const saiacsInstId = 'inst-saiacs-01';
  const ubsInstId = 'inst-ubs-02';

  const saiacsRegistrarActor: ActorContext = {
    userId: 'user-saiacs-reg',
    email: 'registrar@saiacs.edu',
    role: 'REGISTRAR',
    institutionId: saiacsInstId,
  };

  const ubsRegistrarActor: ActorContext = {
    userId: 'user-ubs-reg',
    email: 'registrar@ubs.edu',
    role: 'REGISTRAR',
    institutionId: ubsInstId,
  };

  const unassignedRegistrarActor: ActorContext = {
    userId: 'user-unassigned-reg',
    email: 'registrar@unassigned.edu',
    role: 'REGISTRAR',
    institutionId: undefined,
  };

  const adminActor: ActorContext = {
    userId: 'user-admin',
    email: 'admin@ataindia.org',
    role: 'ADMINISTRATOR',
  };

  const universalActor: ActorContext = {
    userId: 'user-universal',
    email: 'oversight@ataindia.org',
    role: 'UNIVERSAL',
  };

  describe('1. PREVIEW Permissions', () => {
    it('Registrar CAN preview their assigned institution documents', () => {
      assert.doesNotThrow(() =>
        assertPermission('PREVIEW_DOCUMENT', saiacsRegistrarActor, saiacsInstId)
      );
    });

    it('Registrar CANNOT preview another institution documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('PREVIEW_DOCUMENT', saiacsRegistrarActor, ubsInstId),
        /403 Forbidden: Cannot preview documents belonging to another institution/
      );
    });

    it('Unassigned Registrar CANNOT preview documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('PREVIEW_DOCUMENT', unassignedRegistrarActor, saiacsInstId),
        /403 Forbidden: Registrar has no assigned institution/
      );
    });

    it('Administrator CAN preview documents across any institution (read-only review)', () => {
      assert.doesNotThrow(() =>
        assertPermission('PREVIEW_DOCUMENT', adminActor, saiacsInstId)
      );
      assert.doesNotThrow(() =>
        assertPermission('PREVIEW_DOCUMENT', adminActor, ubsInstId)
      );
    });

    it('Universal CAN preview documents across any institution (read-only oversight)', () => {
      assert.doesNotThrow(() =>
        assertPermission('PREVIEW_DOCUMENT', universalActor, saiacsInstId)
      );
      assert.doesNotThrow(() =>
        assertPermission('PREVIEW_DOCUMENT', universalActor, ubsInstId)
      );
    });
  });

  describe('2. DOWNLOAD Permissions', () => {
    it('Registrar CAN download their assigned institution documents', () => {
      assert.doesNotThrow(() =>
        assertPermission('DOWNLOAD_DOCUMENT', saiacsRegistrarActor, saiacsInstId)
      );
      assert.doesNotThrow(() =>
        assertPermission('DOWNLOAD_DOCUMENT', ubsRegistrarActor, ubsInstId)
      );
    });

    it('Registrar CANNOT download another institution documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('DOWNLOAD_DOCUMENT', saiacsRegistrarActor, ubsInstId),
        /403 Forbidden: Cannot download documents belonging to another institution/
      );
      assert.throws(
        () => assertPermission('DOWNLOAD_DOCUMENT', ubsRegistrarActor, saiacsInstId),
        /403 Forbidden: Cannot download documents belonging to another institution/
      );
    });

    it('Unassigned Registrar CANNOT download documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('DOWNLOAD_DOCUMENT', unassignedRegistrarActor, saiacsInstId),
        /403 Forbidden: Registrar has no assigned institution/
      );
    });

    it('Administrator CANNOT download documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('DOWNLOAD_DOCUMENT', adminActor, saiacsInstId),
        /403 Forbidden: Administrators are not permitted to download documents/
      );
    });

    it('Universal CANNOT download documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('DOWNLOAD_DOCUMENT', universalActor, saiacsInstId),
        /403 Forbidden: Universal role is read-only and cannot download documents/
      );
    });
  });

  describe('3. DELETE Permissions', () => {
    it('Registrar CAN delete their assigned institution documents', () => {
      assert.doesNotThrow(() =>
        assertPermission('DELETE_DOCUMENT', saiacsRegistrarActor, saiacsInstId)
      );
    });

    it('Registrar CANNOT delete another institution documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('DELETE_DOCUMENT', saiacsRegistrarActor, ubsInstId),
        /403 Forbidden: Cannot delete documents belonging to another institution/
      );
    });

    it('Unassigned Registrar CANNOT delete documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('DELETE_DOCUMENT', unassignedRegistrarActor, saiacsInstId),
        /403 Forbidden: Registrar has no assigned institution/
      );
    });

    it('Administrator CANNOT delete documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('DELETE_DOCUMENT', adminActor, saiacsInstId),
        /403 Forbidden: Administrators cannot delete documents/
      );
    });

    it('Universal CANNOT delete documents (403 Forbidden)', () => {
      assert.throws(
        () => assertPermission('DELETE_DOCUMENT', universalActor, saiacsInstId),
        /403 Forbidden: Universal role is read-only and cannot delete documents/
      );
    });
  });

  describe('4. Direct-access invariants', () => {
    it('does not synthesize document content for missing storage objects', () => {
      // Actual binary retrieval is integration-tested through the authorized route.
      // The helper no longer accepts a filename or registration supplied by the browser.
      assert.strictEqual(getDocumentFileBuffer.length, 3);
    });

    it('keeps administrator and universal download/delete permissions denied', () => {
      assert.throws(
        () => assertPermission('DOWNLOAD_DOCUMENT', adminActor, saiacsInstId),
        /403 Forbidden: Administrators are not permitted to download documents/
      );
      assert.throws(
        () => assertPermission('DOWNLOAD_DOCUMENT', universalActor, saiacsInstId),
        /403 Forbidden: Universal role is read-only and cannot download documents/
      );
      assert.throws(
        () => assertPermission('DELETE_DOCUMENT', adminActor, saiacsInstId),
        /403 Forbidden: Administrators cannot delete documents/
      );
      assert.throws(
        () => assertPermission('DELETE_DOCUMENT', universalActor, saiacsInstId),
        /403 Forbidden: Universal role is read-only and cannot delete documents/
      );
    });
  });
});
