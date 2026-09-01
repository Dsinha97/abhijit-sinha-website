/**
 * Enquiry inbox.
 *
 * Every field rendered here originated in a public form with no authentication,
 * so all of it is attacker-controlled. It is built with createElement and
 * textContent throughout — there is no innerHTML path for lead data anywhere in
 * this file, deliberately.
 */

import { getSupabase } from '../../lib/supabase-client';
import { $, el, fmtDateTime, toast, waNumber } from './dom';
import { downloadCsv } from './csv';

type Lead = {
  id: number;
  created_at: string;
  form_name: string;
  source_page: string | null;
  name: string;
  email: string;
  mobile: string;
  investment_goal: string | null;
  mode: string | null;
  service_category: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'closed';
  admin_notes: string | null;
  updated_at: string;
};

const STATUSES = ['new', 'contacted', 'closed'] as const;

const STATUS_CLASS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-800 border-blue-200',
  contacted: 'bg-amber-50 text-amber-800 border-amber-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

let leads: Lead[] = [];
let filter: 'all' | 'new' | 'contacted' | 'closed' = 'all';
let expanded: number | null = null;

const supabase = getSupabase();

function visible(): Lead[] {
  return filter === 'all' ? leads : leads.filter((l) => l.status === filter);
}

function field(label: string, value: string | null | undefined): HTMLElement | null {
  if (!value) return null;
  return el(
    'div',
    {},
    el('dt', { class: 'text-xs font-medium uppercase tracking-wide text-slate-500' }, label),
    el('dd', { class: 'mt-0.5 text-sm text-slate-800 whitespace-pre-wrap break-words' }, value),
  );
}

function detailPanel(lead: Lead): HTMLElement {
  const wa = waNumber(lead.mobile);

  const actions = el('div', { class: 'flex flex-wrap gap-2' });
  actions.append(
    el(
      'a',
      {
        href: `mailto:${lead.email}?subject=${encodeURIComponent(`Re: your enquiry (${lead.form_name})`)}`,
        class:
          'inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50',
      },
      'Email',
    ),
    el(
      'a',
      {
        href: `tel:${lead.mobile.replace(/[^\d+]/g, '')}`,
        class:
          'inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50',
      },
      'Call',
    ),
  );
  if (wa) {
    actions.append(
      el(
        'a',
        {
          href: `https://wa.me/${wa}`,
          target: '_blank',
          rel: 'noopener noreferrer',
          class:
            'inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50',
        },
        'WhatsApp',
      ),
    );
  }

  const notes = el('textarea', {
    class:
      'mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
    rows: '3',
    placeholder: 'Internal notes — not visible to the enquirer.',
  }) as HTMLTextAreaElement;
  notes.value = lead.admin_notes ?? '';

  const saveNotes = el(
    'button',
    {
      type: 'button',
      class:
        'mt-2 min-h-[44px] rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800',
    },
    'Save notes',
  );
  saveNotes.addEventListener('click', async () => {
    const { error } = await supabase!
      .from('leads')
      .update({ admin_notes: notes.value })
      .eq('id', lead.id);
    if (error) return toast(error.message, 'error');
    lead.admin_notes = notes.value;
    toast('Notes saved.');
  });

  const dl = el('dl', { class: 'grid grid-cols-1 gap-4 sm:grid-cols-2' });
  for (const node of [
    field('Email', lead.email),
    field('Mobile', lead.mobile),
    field('Investment goal', lead.investment_goal),
    field('Mode', lead.mode),
    field('Service category', lead.service_category),
    field('Submitted from', lead.source_page),
    field('Form', lead.form_name),
    field('Received', fmtDateTime(lead.created_at)),
  ]) {
    if (node) dl.append(node);
  }

  const panel = el('div', { class: 'border-t border-slate-200 bg-slate-50 p-4 space-y-4' }, dl);

  if (lead.message) {
    panel.append(
      el(
        'div',
        {},
        el('dt', { class: 'text-xs font-medium uppercase tracking-wide text-slate-500' }, 'Message'),
        el(
          'dd',
          {
            class:
              'mt-1 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 whitespace-pre-wrap break-words',
          },
          lead.message,
        ),
      ),
    );
  }

  panel.append(
    actions,
    el(
      'div',
      {},
      el('label', { class: 'text-xs font-medium uppercase tracking-wide text-slate-500' }, 'Notes'),
      notes,
      saveNotes,
    ),
  );

  return panel;
}

function row(lead: Lead): HTMLElement {
  const isOpen = expanded === lead.id;

  const summary = el(
    'button',
    {
      type: 'button',
      class: 'flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50',
      'aria-expanded': String(isOpen),
    },
    el(
      'span',
      { class: 'min-w-0 flex-1' },
      el('span', { class: 'block font-medium text-slate-900 truncate' }, lead.name),
      el(
        'span',
        { class: 'mt-0.5 block text-xs text-slate-500 truncate' },
        `${lead.email} · ${fmtDateTime(lead.created_at)}`,
      ),
    ),
    el(
      'span',
      {
        class: `shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
          STATUS_CLASS[lead.status] ?? STATUS_CLASS.closed
        }`,
      },
      lead.status,
    ),
  );
  summary.addEventListener('click', () => {
    expanded = isOpen ? null : lead.id;
    render();
  });

  const select = el('select', {
    class: 'min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 text-sm',
    'aria-label': `Status for ${lead.name}`,
  }) as HTMLSelectElement;
  for (const s of STATUSES) {
    const opt = el('option', { value: s }, s) as HTMLOptionElement;
    if (s === lead.status) opt.selected = true;
    select.append(opt);
  }
  select.addEventListener('change', async () => {
    const next = select.value as Lead['status'];
    const { error } = await supabase!.from('leads').update({ status: next }).eq('id', lead.id);
    if (error) {
      select.value = lead.status;
      return toast(error.message, 'error');
    }
    lead.status = next;
    toast(`Marked ${next}.`);
    render();
  });

  const card = el(
    'li',
    { class: 'overflow-hidden rounded-xl border border-slate-200 bg-white' },
    el('div', { class: 'flex items-center gap-2 pr-4' }, summary, select),
  );

  if (isOpen) card.append(detailPanel(lead));
  return card;
}

function render(): void {
  const list = $('leads-list');
  const empty = $('leads-empty');
  const count = $('leads-count');
  if (!list || !empty || !count) return;

  const rows = visible();
  count.textContent = `${rows.length} of ${leads.length}`;
  list.replaceChildren(...rows.map(row));
  empty.classList.toggle('hidden', rows.length > 0);

  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-filter]')) {
    const on = btn.dataset.filter === filter;
    btn.className = `min-h-[44px] rounded-lg border px-3 text-sm font-medium transition ${
      on
        ? 'border-slate-900 bg-slate-900 text-white'
        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
    }`;
  }
}

async function load(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    toast(error.message, 'error');
    return;
  }
  leads = (data ?? []) as Lead[];
  render();
}

document.addEventListener('admin:ready', () => {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-filter]')) {
    btn.addEventListener('click', () => {
      filter = (btn.dataset.filter ?? 'all') as typeof filter;
      expanded = null;
      render();
    });
  }

  $('export-csv')?.addEventListener('click', () => {
    const rows = visible().map((l) => [
      l.id,
      l.created_at,
      l.form_name,
      l.name,
      l.email,
      l.mobile,
      l.investment_goal ?? '',
      l.mode ?? '',
      l.service_category ?? '',
      l.message ?? '',
      l.status,
      l.admin_notes ?? '',
      l.source_page ?? '',
    ]);
    downloadCsv(
      `enquiries-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'ID', 'Received', 'Form', 'Name', 'Email', 'Mobile', 'Investment goal',
        'Mode', 'Service category', 'Message', 'Status', 'Notes', 'Source page',
      ],
      rows,
    );
  });

  void load();
});

export {};
