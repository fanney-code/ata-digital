import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  checkIsMobileDevice,
  isCaptureEligible,
} from '../lib/utils/useIsMobileDevice';
import { ManageRegisterView } from '../components/registration/ManageRegisterView';
import { RegistrationDetailView } from '../components/registration/RegistrationDetailView';
import { Registration, UserRole } from '../lib/types';

// Mock registration record for component-level DOM testing
const mockRegistration: Registration = {
  id: 'reg-test-001',
  registration_number: 'REG-2026-TEST',
  registration_type: 'INITIAL_REGISTRATION',
  academic_year: '2025-2026',
  status: 'SUBMITTED',
  student_id: 'std-test-001',
  institution_id: 'inst-001',
  department_id: 'dept-001',
  program_id: 'prog-001',
  student: {
    id: 'std-test-001',
    permanent_uid: 'STU-2026-00001',
    first_name: 'Sarah',
    last_name: 'Connor',
    email: 'sarah.connor@example.org',
    phone: '+91 9876543210',
  },
  institution: {
    id: 'inst-001',
    name: 'New India Bible Seminary',
    code: 'NIBS',
  },
  department: {
    id: 'dept-001',
    institution_id: 'inst-001',
    name: 'Theology',
    code: 'TH',
  },
  program: {
    id: 'prog-001',
    department_id: 'dept-001',
    name: 'Master of Divinity',
    code: 'MDIV',
  },
  created_at: '2026-01-15T10:00:00Z',
  submitted_at: '2026-01-15T11:00:00Z',
};

test('1. Mobile Device & Tablet Classification Unit Tests', async (t) => {
  await t.test('Mobile Phones evaluate to isMobile = true', () => {
    // iPhone
    const iPhoneUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    assert.strictEqual(checkIsMobileDevice(iPhoneUA), true, 'iPhone should be detected as mobile');

    // Android Phone (contains "Android" AND "Mobile")
    const androidPhoneUA =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';
    assert.strictEqual(checkIsMobileDevice(androidPhoneUA), true, 'Android phone should be detected as mobile');

    // Chromium Client Hints API explicitly mobile
    assert.strictEqual(
      checkIsMobileDevice(undefined, { mobile: true }),
      true,
      'Client hints mobile: true must return true'
    );
  });

  await t.test('Desktops and Laptops evaluate to isMobile = false (even if resized)', () => {
    // Windows Desktop / Laptop
    const windowsUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    assert.strictEqual(checkIsMobileDevice(windowsUA), false, 'Windows PC must be non-mobile');

    // macOS Desktop / MacBook
    const macUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    assert.strictEqual(checkIsMobileDevice(macUA), false, 'MacBook / Mac PC must be non-mobile');

    // Linux Desktop
    const linuxUA =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    assert.strictEqual(checkIsMobileDevice(linuxUA), false, 'Linux workstation must be non-mobile');

    // Chromium Client Hints desktop
    assert.strictEqual(
      checkIsMobileDevice(undefined, { mobile: false }),
      false,
      'Client hints mobile: false must return false'
    );
  });

  await t.test('Tablets and iPads evaluate to isMobile = false under the mobile handheld policy', () => {
    // iPad Safari
    const iPadUA =
      'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    assert.strictEqual(checkIsMobileDevice(iPadUA), false, 'iPad must be excluded from mobile phone capture');

    // Android Tablet (contains "Android" but lacks "Mobile")
    const androidTabletUA =
      'Mozilla/5.0 (Linux; Android 14; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    assert.strictEqual(
      checkIsMobileDevice(androidTabletUA),
      false,
      'Android tablet without Mobile token must be non-mobile'
    );
  });
});

test('2. Authorization & Device Eligibility Matrix Unit Tests', async (t) => {
  await t.test('Strict Role x Device combination verification', () => {
    // Only REGISTRAR on mobile is eligible
    assert.strictEqual(isCaptureEligible('REGISTRAR', true), true, 'Registrar + Mobile must be eligible');
    assert.strictEqual(isCaptureEligible('REGISTRAR', false), false, 'Registrar + Desktop must NOT be eligible');

    // Admin must never be eligible
    assert.strictEqual(isCaptureEligible('ADMINISTRATOR', true), false, 'Admin + Mobile must NOT be eligible');
    assert.strictEqual(isCaptureEligible('ADMINISTRATOR', false), false, 'Admin + Desktop must NOT be eligible');

    // Universal must never be eligible
    assert.strictEqual(isCaptureEligible('UNIVERSAL', true), false, 'Universal + Mobile must NOT be eligible');
    assert.strictEqual(isCaptureEligible('UNIVERSAL', false), false, 'Universal + Desktop must NOT be eligible');

    // Null/undefined roles
    assert.strictEqual(isCaptureEligible(null, true), false, 'Null + Mobile must NOT be eligible');
    assert.strictEqual(isCaptureEligible(undefined, true), false, 'Undefined + Mobile must NOT be eligible');
  });
});

test('3. Actual UI Component-Level Rendering Tests: ManageRegisterView', async (t) => {
  const renderView = (role: UserRole, isMobile: boolean) => {
    globalThis.__TEST_IS_MOBILE__ = isMobile;
    return renderToStaticMarkup(
      React.createElement(ManageRegisterView, {
        registrations: [mockRegistration],
        currentRole: role,
        onSelectRegistration: () => {},
        onNewRegistration: () => {},
      })
    );
  };

  await t.test('Case 1: Registrar + Mobile -> Capture button is rendered in DOM', () => {
    const html = renderView('REGISTRAR', true);
    assert.ok(
      html.includes('<span>Capture</span>'),
      'Capture button text must be rendered in DOM for Registrar on mobile'
    );
    assert.ok(
      html.includes('Open live phone camera stream for candidate document capture'),
      'Capture button tooltip must be rendered in DOM for Registrar on mobile'
    );
  });

  await t.test('Case 2: Registrar + Desktop -> Capture button is COMPLETELY OMITTED from DOM', () => {
    const html = renderView('REGISTRAR', false);
    assert.ok(
      !html.includes('<span>Capture</span>'),
      'Capture button text must NOT be present in DOM for Registrar on desktop'
    );
    assert.ok(
      !html.includes('Open live phone camera stream for candidate document capture'),
      'Capture button tooltip must NOT be present in DOM for Registrar on desktop'
    );
  });

  await t.test('Case 3: Administrator + Mobile -> Capture button is COMPLETELY OMITTED from DOM', () => {
    const html = renderView('ADMINISTRATOR', true);
    assert.ok(
      !html.includes('<span>Capture</span>'),
      'Capture button text must NOT be present in DOM for Administrator on mobile'
    );
  });

  await t.test('Case 4: Administrator + Desktop -> Capture button is COMPLETELY OMITTED from DOM', () => {
    const html = renderView('ADMINISTRATOR', false);
    assert.ok(
      !html.includes('<span>Capture</span>'),
      'Capture button text must NOT be present in DOM for Administrator on desktop'
    );
  });

  await t.test('Case 5: Universal + Mobile -> Capture button is COMPLETELY OMITTED from DOM', () => {
    const html = renderView('UNIVERSAL', true);
    assert.ok(
      !html.includes('<span>Capture</span>'),
      'Capture button text must NOT be present in DOM for Universal on mobile'
    );
  });

  await t.test('Case 6: Universal + Desktop -> Capture button is COMPLETELY OMITTED from DOM', () => {
    const html = renderView('UNIVERSAL', false);
    assert.ok(
      !html.includes('<span>Capture</span>'),
      'Capture button text must NOT be present in DOM for Universal on desktop'
    );
  });

  await t.test('Safety Check: Camera modal component is never rendered statically for ineligible users', () => {
    const html = renderView('REGISTRAR', false);
    assert.ok(
      !html.includes('Controlled Camera Capture'),
      'MobileWebCameraCapture modal must NOT be rendered'
    );
  });
});

test('4. Actual UI Component-Level Rendering Tests: RegistrationDetailView', async (t) => {
  const renderDetail = (role: UserRole, isMobile: boolean) => {
    globalThis.__TEST_IS_MOBILE__ = isMobile;
    return renderToStaticMarkup(
      React.createElement(RegistrationDetailView, {
        registration: mockRegistration,
        currentRole: role,
        onBack: () => {},
        onUpdateStatus: async () => {},
      })
    );
  };

  await t.test('Case 1: Registrar + Mobile -> Capture Doc button is rendered in DOM', () => {
    const html = renderDetail('REGISTRAR', true);
    assert.ok(
      html.includes('<span>Capture Doc</span>'),
      'Capture Doc button text must be rendered in DOM for Registrar on mobile'
    );
    assert.ok(
      html.includes('Open live phone camera for document capture'),
      'Capture Doc button tooltip must be rendered in DOM for Registrar on mobile'
    );
  });

  await t.test('Case 2: Registrar + Desktop -> Capture Doc button is COMPLETELY OMITTED from DOM', () => {
    const html = renderDetail('REGISTRAR', false);
    assert.ok(
      !html.includes('<span>Capture Doc</span>'),
      'Capture Doc button text must NOT be present in DOM for Registrar on desktop'
    );
    assert.ok(
      !html.includes('Open live phone camera for document capture'),
      'Capture Doc tooltip must NOT be present in DOM for Registrar on desktop'
    );
  });

  await t.test('Case 3: Administrator + Mobile -> Capture Doc button is COMPLETELY OMITTED from DOM', () => {
    const html = renderDetail('ADMINISTRATOR', true);
    assert.ok(
      !html.includes('<span>Capture Doc</span>'),
      'Capture Doc button must NOT be present in DOM for Administrator on mobile'
    );
  });

  await t.test('Case 4: Administrator + Desktop -> Capture Doc button is COMPLETELY OMITTED from DOM', () => {
    const html = renderDetail('ADMINISTRATOR', false);
    assert.ok(
      !html.includes('<span>Capture Doc</span>'),
      'Capture Doc button must NOT be present in DOM for Administrator on desktop'
    );
  });

  await t.test('Case 5: Universal + Mobile -> Capture Doc button is COMPLETELY OMITTED from DOM', () => {
    const html = renderDetail('UNIVERSAL', true);
    assert.ok(
      !html.includes('<span>Capture Doc</span>'),
      'Capture Doc button must NOT be present in DOM for Universal on mobile'
    );
  });

  await t.test('Case 6: Universal + Desktop -> Capture Doc button is COMPLETELY OMITTED from DOM', () => {
    const html = renderDetail('UNIVERSAL', false);
    assert.ok(
      !html.includes('<span>Capture Doc</span>'),
      'Capture Doc button must NOT be present in DOM for Universal on desktop'
    );
  });

  await t.test('Safety Check: Camera modal component is never rendered statically for ineligible users', () => {
    const html = renderDetail('REGISTRAR', false);
    assert.ok(
      !html.includes('Controlled Camera Capture'),
      'MobileWebCameraCapture modal must NOT be rendered'
    );
  });
});
