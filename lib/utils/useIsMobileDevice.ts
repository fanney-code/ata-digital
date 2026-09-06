'use client';

import { useSyncExternalStore } from 'react';
import { UserRole } from '@/lib/types';

/**
 * Interface for Chromium Client Hints NavigatorUAData.
 */
interface NavigatorUAData {
  mobile?: boolean;
}

declare global {
  var __TEST_IS_MOBILE__: boolean | undefined;
}

/**
 * Authoritative mobile phone detection regex.
 * Specifically identifies handheld mobile phone devices while excluding:
 * - Desktop/laptop workstations and PCs (Windows, macOS, Linux)
 * - Tablets (iPads, Android tablets without the "Mobile" identifier)
 *
 * Viewport width breakpoints (e.g. window.innerWidth < 768) are intentionally NOT used,
 * ensuring desktop browsers resized to narrow widths remain ineligible.
 */
const MOBILE_PHONE_REGEX = /Android.+Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i;
const TABLET_EXCLUSION_REGEX = /iPad|Tablet/i;

/**
 * Pure evaluation function to determine if a device is a mobile phone.
 * Supports passing mock userAgent and userAgentData for deterministic unit testing.
 *
 * @param userAgent - Optional user agent string (defaults to navigator.userAgent in browser)
 * @param userAgentData - Optional NavigatorUAData (defaults to navigator.userAgentData)
 */
export function checkIsMobileDevice(
  userAgent?: string,
  userAgentData?: NavigatorUAData
): boolean {
  // Use Client Hints API if explicitly available (Chromium mobile / desktop)
  const uad =
    userAgentData !== undefined
      ? userAgentData
      : typeof navigator !== 'undefined' && 'userAgentData' in navigator
      ? ((navigator as unknown as { userAgentData?: NavigatorUAData }).userAgentData)
      : undefined;

  const ua =
    userAgent !== undefined
      ? userAgent
      : typeof navigator !== 'undefined'
      ? navigator.userAgent
      : '';

  if (!ua && !uad) {
    return false;
  }

  // Explicit tablet exclusion
  if (ua && TABLET_EXCLUSION_REGEX.test(ua)) {
    return false;
  }

  // If Client Hints mobile flag is available, it is an authoritative signal on Chromium
  if (uad && typeof uad.mobile === 'boolean') {
    return uad.mobile;
  }

  // User-Agent regex check for handheld mobile phones
  return MOBILE_PHONE_REGEX.test(ua);
}

/**
 * Evaluates whether the user satisfies both the authorization role boundary (REGISTRAR)
 * and the client-side mobile phone device eligibility constraint.
 *
 * @param role - The authenticated user's authoritative role
 * @param isMobile - Whether the device is confirmed to be a mobile phone
 */
export function isCaptureEligible(
  role: UserRole | string | null | undefined,
  isMobile: boolean
): boolean {
  return role === 'REGISTRAR' && Boolean(isMobile);
}

const emptySubscribe = () => () => {};

const getClientSnapshot = (): boolean => {
  if (typeof globalThis.__TEST_IS_MOBILE__ === 'boolean') {
    return globalThis.__TEST_IS_MOBILE__;
  }
  return checkIsMobileDevice();
};

const getServerSnapshot = (): boolean => {
  if (typeof globalThis.__TEST_IS_MOBILE__ === 'boolean') {
    return globalThis.__TEST_IS_MOBILE__;
  }
  return false;
};

/**
 * SSR-safe React hook for client-side mobile phone detection.
 *
 * Uses useSyncExternalStore to guarantee:
 * 1. Zero React 19 hydration mismatch warnings (getServerSnapshot returns false).
 * 2. Instant synchronization upon client mount without cascading re-renders.
 * 3. Deterministic injection during component-level test execution via globalThis.__TEST_IS_MOBILE__.
 */
export function useIsMobileDevice(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}
