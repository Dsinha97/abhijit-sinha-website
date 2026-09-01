/**
 * Knowledge Corner editor: articles, videos and curated links.
 *
 * The compliance flow is the important part. Publishing an article requires
 * both a clean lint and a ticked acknowledgement, and the Publish control stays
 * disabled until both hold. That is convenience, not enforcement — the
 * authoritative checks are the posts_publish_requires_ack CHECK constraint and
 * the assert_post_compliance() trigger. When the database rejects a write, its
 * message is surfaced verbatim rather than replaced with "save failed", because
 * the message names the offending phrase.
 */

import { getSupabase } from '../../lib/supabase-client';
import { $, el, fmtDate, relativeTime, toast } from './dom';
import { lintPost } from '../../lib/compliance-lint';
import { renderMarkdown } from '../../lib/markdown';
import { youtubeId } from '../../lib/youtube';

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  seo_description: string | null;
  tags: string[];
  published: boolean;
  published_at: string | null;
  compliance_ack: boolean;
};

type Video = {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  published: boolean;
  sort_order: number;
};

type Link = {
  id: number;
  title: string;
  url: string;
  source_name: string;
  note: string | null;
  published: boolean;
  sort_order: number;
};

const supabase = getSupabase();

let posts: Post[] = [];
let videos: Video[] = [];
let links: Link[] = [];
let editingPost: Post | null = null;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function err(e: { message: string } | null): boolean {
  if (!e) return false;
  // Verbatim: a compliance rejection names the phrase that has to change.
  toast(e.message, 'error');
  return true;
}

function pill(published: boolean): HTMLElement {
  return el(
    'span',
    {
      class: `shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        published
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-slate-200 bg-slate-100 text-slate-600'
      }`,
    },
    published ? 'Published' : 'Draft',
  );
}

async function confirmDelete(what: string, label: string): Promise<boolean> {
  return window.confirm(`Delete this ${what}?\n\n"${label}"\n\nThis cannot be undone.`);
}

// ---------------------------------------------------------------- articles

function renderPostList(): void {
  const host = $('post-list');
  if (!host) return;

  if (posts.length === 0) {
    host.replaceChildren(
      el('p', { class: 'text-sm text-slate-500' }, 'No articles yet. Create the first one below.'),
    );
    return;
  }

  host.replaceChildren(
    ...posts.map((p) =>
      el(
        'li',
        { class: 'flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3' },
        el(
          'span',
          { class: 'min-w-0 flex-1' },
          el('span', { class: 'block truncate font-medium text-slate-900' }, p.title),
          el(
            'span',
            { class: 'block truncate text-xs text-slate-500' },
            `/${p.slug}${p.published_at ? ` · ${fmtDate(p.published_at)}` : ''}`,
          ),
        ),
        pill(p.published),
        (() => {
          const edit = el(
            'button',
            {
              type: 'button',
              class:
                'min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50',
            },
            'Edit',
          );
          edit.addEventListener('click', () => openPost(p));
          return edit;
        })(),
        (() => {
          const del = el(
            'button',
            {
              type: 'button',
              class:
                'min-h-[44px] rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50',
            },
            'Delete',
          );
          del.addEventListener('click', async () => {
            if (!(await confirmDelete('article', p.title))) return;
            const { error } = await supabase!.from('posts').delete().eq('id', p.id);
            if (err(error)) return;
            toast('Article deleted.');
            await loadAll();
          });
          return del;
        })(),
      ),
    ),
  );
}

function postFields() {
  return {
    title: $<HTMLInputElement>('post-title'),
    slug: $<HTMLInputElement>('post-slug'),
    excerpt: $<HTMLTextAreaElement>('post-excerpt'),
    seo: $<HTMLInputElement>('post-seo'),
    tags: $<HTMLInputElement>('post-tags'),
    body: $<HTMLTextAreaElement>('post-body'),
    ack: $<HTMLInputElement>('post-ack'),
  };
}

function openPost(post: Post | null): void {
  editingPost = post;
  const f = postFields();

  if (f.title) f.title.value = post?.title ?? '';
  if (f.slug) f.slug.value = post?.slug ?? '';
  if (f.excerpt) f.excerpt.value = post?.excerpt ?? '';
  if (f.seo) f.seo.value = post?.seo_description ?? '';
  if (f.tags) f.tags.value = (post?.tags ?? []).join(', ');
  if (f.body) f.body.value = post?.body_markdown ?? '';
  if (f.ack) f.ack.checked = post?.compliance_ack ?? false;

  const heading = $('post-editor-title');
  if (heading) heading.textContent = post ? `Editing: ${post.title}` : 'New article';

  const cancel = $('post-cancel');
  cancel?.classList.toggle('hidden', !post);

  refreshPreview();
  $('post-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function refreshPreview(): void {
  const f = postFields();
  const title = f.title?.value ?? '';
  const excerpt = f.excerpt?.value ?? '';
  const body = f.body?.value ?? '';

  const preview = $('post-preview');
  if (preview) {
    // Same renderer as the build, so the preview is what ships.
    preview.innerHTML = renderMarkdown(body) || '<p class="text-slate-400">Nothing to preview.</p>';
  }

  const hits = lintPost(title, excerpt, body);
  const lintHost = $('post-lint');
  const publishBtn = $<HTMLButtonElement>('post-publish');
  const ack = f.ack?.checked ?? false;

  if (lintHost) {
    if (hits.length === 0) {
      lintHost.replaceChildren(
        el('p', { class: 'text-sm text-green-700' }, 'No prohibited phrasing detected.'),
      );
    } else {
      const unique = [...new Set(hits.map((h) => h.match))];
      lintHost.replaceChildren(
        el(
          'div',
          { class: 'rounded-lg border border-red-200 bg-red-50 p-3' },
          el(
            'p',
            { class: 'text-sm font-semibold text-red-800' },
            `${unique.length} prohibited phrase${unique.length === 1 ? '' : 's'} found — publishing is blocked.`,
          ),
          el(
            'ul',
            { class: 'mt-1.5 list-disc pl-5 text-sm text-red-700' },
            ...unique.map((m) => el('li', {}, `"${m}"`)),
          ),
          el(
            'p',
            { class: 'mt-2 text-xs text-red-700' },
            'This site is distribution-only. Copy must not read as personalised advice, a return guarantee, or a specific buy recommendation.',
          ),
        ),
      );
    }
  }

  if (publishBtn) {
    const blocked = hits.length > 0 || !ack;
    publishBtn.disabled = blocked;
    publishBtn.title = blocked
      ? hits.length > 0
        ? 'Remove the prohibited phrasing first.'
        : 'Tick the compliance confirmation first.'
      : '';
  }
}

async function savePost(publish: boolean): Promise<void> {
  const f = postFields();
  const title = (f.title?.value ?? '').trim();
  const slug = slugify(f.slug?.value || title);

  if (!title) return toast('A title is required.', 'error');
  if (slug.length < 3) return toast('Slug must be at least 3 characters.', 'error');

  const payload = {
    slug,
    title,
    excerpt: (f.excerpt?.value ?? '').trim() || null,
    seo_description: (f.seo?.value ?? '').trim() || null,
    tags: (f.tags?.value ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    body_markdown: f.body?.value ?? '',
    published: publish,
    compliance_ack: f.ack?.checked ?? false,
    compliance_ack_at: f.ack?.checked ? new Date().toISOString() : null,
  };

  const q = editingPost
    ? supabase!.from('posts').update(payload).eq('id', editingPost.id)
    : supabase!.from('posts').insert(payload);

  const { error } = await q;
  if (err(error)) return;

  toast(publish ? 'Article published.' : 'Draft saved.');
  editingPost = null;
  openPost(null);
  await loadAll();
}

// ------------------------------------------------------------------ videos

function renderVideoList(): void {
  const host = $('video-list');
  if (!host) return;

  if (videos.length === 0) {
    host.replaceChildren(el('p', { class: 'text-sm text-slate-500' }, 'No videos yet.'));
    return;
  }

  host.replaceChildren(
    ...videos.map((v) =>
      el(
        'li',
        { class: 'flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3' },
        el(
          'span',
          { class: 'min-w-0 flex-1' },
          el('span', { class: 'block truncate font-medium text-slate-900' }, v.title),
          el('span', { class: 'block truncate text-xs text-slate-500' }, v.video_url),
        ),
        pill(v.published),
        (() => {
          const t = el(
            'button',
            {
              type: 'button',
              class:
                'min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50',
            },
            v.published ? 'Unpublish' : 'Publish',
          );
          t.addEventListener('click', async () => {
            const { error } = await supabase!
              .from('videos')
              .update({ published: !v.published })
              .eq('id', v.id);
            if (err(error)) return;
            await loadAll();
          });
          return t;
        })(),
        (() => {
          const del = el(
            'button',
            {
              type: 'button',
              class:
                'min-h-[44px] rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50',
            },
            'Delete',
          );
          del.addEventListener('click', async () => {
            if (!(await confirmDelete('video', v.title))) return;
            const { error } = await supabase!.from('videos').delete().eq('id', v.id);
            if (err(error)) return;
            toast('Video deleted.');
            await loadAll();
          });
          return del;
        })(),
      ),
    ),
  );
}

// ------------------------------------------------------------------- links

function renderLinkList(): void {
  const host = $('link-list');
  if (!host) return;

  if (links.length === 0) {
    host.replaceChildren(el('p', { class: 'text-sm text-slate-500' }, 'No reading links yet.'));
    return;
  }

  host.replaceChildren(
    ...links.map((l) =>
      el(
        'li',
        { class: 'flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3' },
        el(
          'span',
          { class: 'min-w-0 flex-1' },
          el('span', { class: 'block truncate font-medium text-slate-900' }, l.title),
          el('span', { class: 'block truncate text-xs text-slate-500' }, `${l.source_name} · ${l.url}`),
        ),
        pill(l.published),
        (() => {
          const t = el(
            'button',
            {
              type: 'button',
              class:
                'min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50',
            },
            l.published ? 'Unpublish' : 'Publish',
          );
          t.addEventListener('click', async () => {
            const { error } = await supabase!
              .from('resource_links')
              .update({ published: !l.published })
              .eq('id', l.id);
            if (err(error)) return;
            await loadAll();
          });
          return t;
        })(),
        (() => {
          const del = el(
            'button',
            {
              type: 'button',
              class:
                'min-h-[44px] rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50',
            },
            'Delete',
          );
          del.addEventListener('click', async () => {
            if (!(await confirmDelete('link', l.title))) return;
            const { error } = await supabase!.from('resource_links').delete().eq('id', l.id);
            if (err(error)) return;
            toast('Link deleted.');
            await loadAll();
          });
          return del;
        })(),
      ),
    ),
  );
}

// -------------------------------------------------------------------- load

async function loadAll(): Promise<void> {
  if (!supabase) return;
  const [p, v, l] = await Promise.all([
    supabase.from('posts').select('*').order('published_at', { ascending: false, nullsFirst: true }),
    supabase.from('videos').select('*').order('sort_order'),
    supabase.from('resource_links').select('*').order('sort_order'),
  ]);
  if (err(p.error) || err(v.error) || err(l.error)) return;

  posts = (p.data ?? []) as Post[];
  videos = (v.data ?? []) as Video[];
  links = (l.data ?? []) as Link[];

  renderPostList();
  renderVideoList();
  renderLinkList();
}

// ------------------------------------------------------------------- wiring

document.addEventListener('admin:ready', () => {
  const f = postFields();

  // Slug follows the title until the author types their own.
  let slugTouched = false;
  f.slug?.addEventListener('input', () => {
    slugTouched = true;
  });
  f.title?.addEventListener('input', () => {
    if (!slugTouched && f.slug) f.slug.value = slugify(f.title!.value);
    refreshPreview();
  });

  for (const node of [f.excerpt, f.body, f.ack]) {
    node?.addEventListener('input', refreshPreview);
    node?.addEventListener('change', refreshPreview);
  }

  $('post-save-draft')?.addEventListener('click', () => void savePost(false));
  $('post-publish')?.addEventListener('click', () => void savePost(true));
  $('post-cancel')?.addEventListener('click', () => openPost(null));

  $('video-add')?.addEventListener('click', async () => {
    const title = $<HTMLInputElement>('video-title');
    const url = $<HTMLInputElement>('video-url');
    const desc = $<HTMLInputElement>('video-desc');
    if (!title?.value.trim()) return toast('A video title is required.', 'error');
    if (!youtubeId(url?.value ?? '')) {
      return toast(
        'Enter a YouTube watch URL, e.g. https://www.youtube.com/watch?v=XXXXXXXXXXX',
        'error',
      );
    }
    const { error } = await supabase!.from('videos').insert({
      title: title.value.trim(),
      description: desc?.value.trim() || null,
      video_url: url!.value.trim(),
      provider: 'youtube',
      published: false,
    });
    if (err(error)) return;
    title.value = '';
    url!.value = '';
    if (desc) desc.value = '';
    toast('Video added as a draft.');
    await loadAll();
  });

  $('link-add')?.addEventListener('click', async () => {
    const title = $<HTMLInputElement>('link-title');
    const url = $<HTMLInputElement>('link-url');
    const source = $<HTMLInputElement>('link-source');
    const note = $<HTMLInputElement>('link-note');
    if (!title?.value.trim()) return toast('A link title is required.', 'error');
    if (!/^https:\/\//i.test(url?.value ?? '')) {
      return toast('Link URL must start with https://', 'error');
    }
    if (!source?.value.trim()) return toast('A source name is required.', 'error');

    const { error } = await supabase!.from('resource_links').insert({
      title: title.value.trim(),
      url: url!.value.trim(),
      source_name: source.value.trim(),
      note: note?.value.trim() || null,
      published: false,
    });
    if (err(error)) return;
    title.value = '';
    url!.value = '';
    source.value = '';
    if (note) note.value = '';
    toast('Link added as a draft.');
    await loadAll();
  });

  // --- publish to site ---
  $('publish-site')?.addEventListener('click', async () => {
    const btn = $<HTMLButtonElement>('publish-site');
    const status = $('publish-status');
    if (!btn || !supabase) return;

    btn.disabled = true;
    if (status) status.textContent = 'Triggering build…';

    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;

    try {
      const res = await fetch(
        `${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/publish-site`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (status) status.textContent = json.message || json.error || '';
      if (!json.ok) toast(json.error ?? 'Publish failed.', 'error');
      else toast(json.skipped ? 'Already building.' : 'Build triggered.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Publish request failed.';
      if (status) status.textContent = msg;
      toast(msg, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  void (async () => {
    await loadAll();
    const { data } = await supabase!
      .from('deploy_log')
      .select('triggered_at')
      .order('triggered_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const last = $('last-publish');
    if (last) last.textContent = `Last published: ${relativeTime(data?.triggered_at as string)}`;
  })();

  refreshPreview();
});

export {};
