import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  assertPermission,
  getDocumentFileBuffer,
  deleteDocumentAttachment,
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

  describe('4. Document File Generation & Direct Method Invariants', () => {
    it('getDocumentFileBuffer generates valid PDF with application/pdf header', async () => {
      const result = await getDocumentFileBuffer(
        'doc-101',
        '',
        'PREVIEW_DOCUMENT',
        adminActor,
        'transcript.pdf'
      );
      assert.strictEqual(result.contentType, 'application/pdf');
      assert.ok(result.buffer.length > 50, 'Buffer should contain PDF bytes');
      assert.strictEqual(result.fileName, 'transcript.pdf');
    });

    it('getDocumentFileBuffer generates valid image for jpg/png extensions', async () => {
      const result = await getDocumentFileBuffer(
        'doc-102',
        '',
        'PREVIEW_DOCUMENT',
        universalActor,
        'national_id.jpg'
      );
      assert.ok(result.contentType.includes('image'), 'Should return image content type');
      assert.ok(result.buffer.length > 50, 'Buffer should contain image bytes');
    });

    it('getDocumentFileBuffer blocks Administrator and Universal from DOWNLOAD_DOCUMENT', async () => {
      await assert.rejects(
        () => getDocumentFileBuffer('doc-103', '', 'DOWNLOAD_DOCUMENT', adminActor),
        /403 Forbidden: Administrators are not permitted to download documents/
      );
      await assert.rejects(
        () => getDocumentFileBuffer('doc-103', '', 'DOWNLOAD_DOCUMENT', universalActor),
        /403 Forbidden: Universal role is read-only and cannot download documents/
      );
    });

    it('deleteDocumentAttachment blocks Administrator and Universal from deletion', async () => {
      await assert.rejects(
        () => deleteDocumentAttachment('doc-104', '', adminActor),
        /403 Forbidden: Administrators cannot delete documents/
      );
      await assert.rejects(
        () => deleteDocumentAttachment('doc-104', '', universalActor),
        /403 Forbidden: Universal role is read-only and cannot delete documents/
      );
    });
  });
});
