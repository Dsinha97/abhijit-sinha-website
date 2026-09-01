/**
 * The visitor's privacy choice, shared by the notice and the tracker.
 *
 * This is the single piece of browser storage any public page writes, and it
 * exists only to remember a preference the visitor expressed. Storing that is
 * what makes the opt-out durable instead of a per-page-load gesture, and it is
 * the category of storage every consent regime treats as strictly necessary.
 *
 * Every access is wrapped: localStorage throws outright in some privacy modes
 * rather than returning null, and a visitor with storage disabled must still be
 * able to read the site.
 */

export const CHOICE_KEY = 'as-privacy-choice';

export type PrivacyChoice = 'acknowledged' | 'opted-out';

export function readChoice(): PrivacyChoice | null {
  try {
    const value = window.localStorage.getItem(CHOICE_KEY);
    return value === 'acknowledged' || value === 'opted-out' ? value : null;
  } catch {
    // Storage unavailable. Treated as "no choice recorded": the notice shows
    // again next visit, which is the honest behaviour when the choice cannot
    // be remembered.
    return null;
  }
}

export function writeChoice(choice: PrivacyChoice): void {
  try {
    window.localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // The choice still applies for this page view; it just will not persist.
  }
}

/** True when the visitor has asked not to be counted. */
export function hasOptedOut(): boolean {
  return readChoice() === 'opted-out';
}
