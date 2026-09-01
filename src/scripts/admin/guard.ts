/**
 * Auth gate for every /admin page.
 *
 * This is UX, not security. It decides which of the four shell states to show
 * and dispatches `admin:ready` once a signed-in allowlisted user is confirmed.
 * The actual protection is Postgres RLS: a non-allowlisted account gets zero
 * rows from every table regardless of what this file does.
 */

import { getSupabase } from '../../lib/supabase-client';
import { $, show, toast } from './dom';

const boot = $('admin-boot');
const login = $('admin-login');
const shell = $('admin-shell');
const denied = $('admin-denied');

function state(which: 'boot' | 'login' | 'shell' | 'denied'): void {
  show(boot, which === 'boot', 'flex');
  show(login, which === 'login', 'flex');
  show(shell, which === 'shell', 'block');
  show(denied, which === 'denied', 'flex');
}

const supabase = getSupabase();

async function init(): Promise<void> {
  if (!supabase) {
    state('login');
    const msg = $('login-msg');
    if (msg) {
      msg.textContent =
        'Supabase is not configured for this build (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY are missing).';
      msg.className = 'mt-3 text-sm text-red-600';
    }
    return;
  }

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session) {
    state('login');
    return;
  }

  // A Supabase account alone grants nothing — membership of admin_allowlist is
  // what authorises, and is_admin() is the same function every RLS policy uses.
  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || !isAdmin) {
    state('denied');
    return;
  }

  const emailNode = $('admin-email');
  if (emailNode && session.user.email) {
    emailNode.textContent = session.user.email;
    emailNode.classList.remove('hidden');
  }

  state('shell');
  document.dispatchEvent(new CustomEvent('admin:ready', { detail: { session } }));
}

// --- login form ---
$('login-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) return;

  const input = $<HTMLInputElement>('login-email');
  const msg = $('login-msg');
  const email = (input?.value ?? '').trim().toLowerCase();
  if (!email || !msg) return;

  msg.textContent = 'Sending…';
  msg.className = 'mt-3 text-sm text-slate-600';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: new URL(
        `${import.meta.env.BASE_URL.replace(/\/+$/, '')}/admin`,
        location.origin,
      ).toString(),
      // Only existing allowlisted accounts should ever sign in here.
      shouldCreateUser: false,
    },
  });

  if (error) {
    msg.textContent = error.message;
    msg.className = 'mt-3 text-sm text-red-600';
    return;
  }

  msg.textContent = 'Check your inbox for the sign-in link. It expires shortly.';
  msg.className = 'mt-3 text-sm text-green-700';
});

async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
  location.reload();
}

$('sign-out')?.addEventListener('click', signOut);
$('denied-sign-out')?.addEventListener('click', signOut);

init().catch((err) => {
  state('login');
  toast(err instanceof Error ? err.message : 'Sign-in check failed.', 'error');
});

export {};
