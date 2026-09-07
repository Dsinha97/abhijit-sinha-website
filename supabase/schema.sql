-- ===========================================================================
-- Schema snapshot — public schema of Supabase project cebfypcoyqiegwuahmun
-- Captured 2026-09-06 from the live database (read-only).
-- ===========================================================================
--
-- WHAT THIS IS
--
-- A committed, reviewable copy of the database objects that enforce this
-- site's security: the Row Level Security policies, is_admin(), the compliance
-- trigger on posts, and the retention jobs. The site is static with no adapter,
-- so RLS is not one layer of the admin panel's protection — it is the whole of
-- it (see CLAUDE.md, "Admin dashboard & data layer"). Until this file existed
-- that boundary lived only in the Supabase dashboard: no diff, no review
-- trail, and no way to notice a policy being dropped or widened.
--
-- WHAT THIS IS NOT
--
-- *** NOT A MIGRATION. DO NOT RUN THIS FILE AGAINST ANY DATABASE. ***
--
-- It deliberately lives outside supabase/migrations/ so that `supabase db
-- push` will never pick it up. It is a reference for reading and diffing.
-- The live database remains the source of truth; this file follows it.
--
-- Contains no data. No leads, no analytics rows, and in particular none of the
-- addresses in admin_allowlist.
--
-- HOW TO CHECK FOR DRIFT
--
-- Re-run the queries in docs/wiki/data-model.md against the live project and
-- compare. Any difference is either a change someone made in the dashboard and
-- did not record here, or something that should not have changed at all.
--
-- Note: supabase/ is excluded from tsconfig.json (CLAUDE.md) — these are Deno
-- and SQL files, and `npm run build` runs `astro check` first.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- Admin identities. A Supabase account grants nothing on its own; membership
-- here is what is_admin() checks, and every policy below is built on it.
create table public.admin_allowlist (
  email       text not null,
  role        text not null default 'editor',
  created_at  timestamptz not null default now(),
  constraint admin_allowlist_pkey primary key (email),
  constraint admin_allowlist_role_check check (role = any (array['owner','editor']))
);

-- First-party, cookieless analytics. Stores no IP, no user-agent and no
-- location; session_hash is salted server-side and rotates daily. The CHECK
-- constraints are the real input validation for the `track` edge function —
-- they are enforced whatever the function sends.
create table public.analytics_events (
  id            bigserial not null,
  occurred_at   timestamptz not null default now(),
  event_type    text not null,
  path          text not null,
  ref_host      text,
  device        text not null,
  link_kind     text,
  link_label    text,
  link_href     text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  session_hash  text not null,
  constraint analytics_events_pkey primary key (id),
  constraint analytics_events_event_type_check check (event_type = any (array['pageview','click'])),
  constraint analytics_events_device_check     check (device = any (array['mobile','tablet','desktop'])),
  constraint analytics_events_link_kind_check  check (link_kind = any (array['cta','nav','outbound','whatsapp','tel','mailto','video','resource'])),
  constraint analytics_events_path_check       check (path ~ '^/' and length(path) <= 200),
  constraint analytics_events_session_hash_check check (length(session_hash) = 16),
  constraint analytics_events_ref_host_check     check (length(ref_host) <= 100),
  constraint analytics_events_link_label_check   check (length(link_label) <= 60),
  constraint analytics_events_link_href_check    check (length(link_href) <= 300),
  constraint analytics_events_utm_source_check   check (length(utm_source) <= 60),
  constraint analytics_events_utm_medium_check   check (length(utm_medium) <= 60),
  constraint analytics_events_utm_campaign_check check (length(utm_campaign) <= 60)
);

-- Single-row table (the `check (id)` on a boolean primary key is what pins it
-- to one row). Holds the rotating salt for session_hash. Has RLS enabled and
-- *no policies at all*, which is deliberate: nothing but the service_role key
-- may read it. A readable salt would make session hashes reversible.
create table public.analytics_salt (
  id          boolean not null default true,
  salt        text not null,
  rotated_at  timestamptz not null default now(),
  constraint analytics_salt_pkey primary key (id),
  constraint analytics_salt_id_check check (id)
);

-- Append-only audit of every content change, written by the log_content_change
-- trigger. Admins can read it; nobody has an update or delete policy.
create table public.content_audit (
  id          bigserial not null,
  table_name  text not null,
  record_key  text not null,
  before      jsonb,
  after       jsonb,
  changed_by  uuid,
  changed_at  timestamptz not null default now(),
  constraint content_audit_pkey primary key (id)
);

-- One row per Vercel deploy hook fired from the admin Publish button.
create table public.deploy_log (
  id            bigserial not null,
  triggered_at  timestamptz not null default now(),
  triggered_by  uuid,
  ok            boolean not null default true,
  note          text,
  constraint deploy_log_pkey primary key (id),
  constraint deploy_log_triggered_by_fkey foreign key (triggered_by) references auth.users(id)
);

-- Enquiry submissions. Note the columns that are NOT here: no folio number, no
-- PAN, no bank details. That is a deliberate DPDP decision, not an oversight —
-- see CLAUDE.md and docs/wiki/contact-channels.md before adding any.
create table public.leads (
  id                serial not null,
  created_at        timestamptz not null default now(),
  form_name         text not null,
  source_page       text,
  name              text not null,
  email             text not null,
  mobile            text not null,
  investment_goal   text,
  mode              text,
  service_category  text,
  message           text,
  status            text not null default 'new',
  admin_notes       text,
  updated_at        timestamptz not null default now(),
  constraint leads_pkey primary key (id),
  constraint leads_status_check check (status = any (array['new','contacted','closed']))
);

-- Knowledge Corner articles.
create table public.posts (
  id                 serial not null,
  slug               text not null,
  title              text not null,
  excerpt            text,
  body_markdown      text not null default '',
  published          boolean not null default false,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  seo_description    text,
  tags               text[] not null default '{}',
  sort_order         integer not null default 0,
  compliance_ack     boolean not null default false,
  compliance_ack_at  timestamptz,
  compliance_ack_by  uuid,
  constraint posts_pkey primary key (id),
  constraint posts_slug_key unique (slug),
  constraint posts_compliance_ack_by_fkey foreign key (compliance_ack_by) references auth.users(id),
  -- Publishing requires a ticked acknowledgement. Enforced here rather than in
  -- the admin UI so it holds however the row is written.
  constraint posts_publish_requires_ack check (published = false or compliance_ack = true),
  constraint posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 3 and 80),
  -- Slugs that would collide with real routes under /knowledge-corner.
  constraint posts_slug_not_reserved check (slug <> all (array['videos','articles','index','admin']))
);

create table public.resource_links (
  id            serial not null,
  title         text not null,
  url           text not null,
  source_name   text not null,
  note          text,
  published     boolean not null default false,
  published_at  timestamptz,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint resource_links_pkey primary key (id),
  constraint resource_links_url_check check (url ~ '^https://'),
  constraint resource_links_title_check check (length(title) between 3 and 160),
  constraint resource_links_source_name_check check (length(source_name) between 2 and 60),
  constraint resource_links_note_check check (length(note) <= 300)
);

-- Admin-editable site copy. The compliance-locked identifiers (ARN, EUIN,
-- NISM, phone, email, principal place of business) are deliberately NOT here —
-- they stay hardcoded in src/data/site.ts, because editability is attack
-- surface on a statutory value.
create table public.site_content (
  key         text not null,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  constraint site_content_pkey primary key (key),
  constraint site_content_updated_by_fkey foreign key (updated_by) references auth.users(id)
);

create table public.videos (
  id            serial not null,
  title         text not null,
  description   text,
  provider      text not null default 'youtube',
  video_url     text not null,
  published     boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz,
  constraint videos_pkey primary key (id),
  constraint videos_provider_check check (provider = any (array['youtube','vimeo'])),
  constraint videos_youtube_url check (
    provider <> 'youtube'
    or video_url ~ '^https://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[A-Za-z0-9_-]{6,20}'
  )
  -- No thumbnail column, deliberately: posters are fetched at build time so no
  -- third-party request fires before a visitor clicks. See CLAUDE.md.
);


-- ---------------------------------------------------------------------------
-- INDEXES (non-constraint)
-- ---------------------------------------------------------------------------

create index analytics_occurred_idx     on public.analytics_events using btree (occurred_at desc);
create index analytics_path_time_idx    on public.analytics_events using btree (path, occurred_at desc);
create index analytics_session_time_idx on public.analytics_events using btree (session_hash, occurred_at desc);
create index analytics_type_time_idx    on public.analytics_events using btree (event_type, occurred_at desc);
create index content_audit_changed_at_idx on public.content_audit using btree (changed_at desc);
create index deploy_log_time_idx        on public.deploy_log using btree (triggered_at desc);
create index leads_created_at_idx       on public.leads using btree (created_at desc);
create index leads_status_idx           on public.leads using btree (status);
create index posts_published_idx        on public.posts using btree (published, published_at desc);
create index resource_links_published_idx on public.resource_links using btree (published, sort_order, created_at desc);
create index videos_published_idx       on public.videos using btree (published, sort_order, created_at desc);


-- ---------------------------------------------------------------------------
-- FUNCTIONS
--
-- Every one is SECURITY DEFINER with an explicit search_path. Both halves
-- matter: DEFINER because they must read tables the caller cannot, and the
-- pinned search_path because a DEFINER function without one can be hijacked by
-- a caller-controlled schema. The Supabase linter flags any that lack it.
-- ---------------------------------------------------------------------------

-- The keystone. Every policy below reduces to this: does the email on the
-- caller's JWT appear in admin_allowlist? Case-insensitive on both sides.
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path to 'public', 'pg_catalog'
as $function$
  select exists (
    select 1
    from public.admin_allowlist a
    where lower(a.email) = lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', ''))
  );
$function$;

-- Compliance gate on publishing. The banned-phrase list here is the Postgres
-- half of a pair — src/lib/compliance-lint.ts is the other. CHANGE BOTH
-- TOGETHER; the UI lint is a courtesy, this is the enforcement.
create or replace function public.assert_post_compliance()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  hay   text;
  bad   text;
  banned text[] := array[
    'guaranteed return', 'assured return', 'risk[- ]free', 'no risk',
    'sure[- ]shot', 'multibagger', 'double your money', 'doubling your money',
    'you should invest', 'i recommend', 'we recommend', 'i advise',
    'best fund to buy', 'will definitely', 'cannot lose', 'can''t lose',
    'safe as a fixed deposit', 'safer than a fixed deposit'
  ];
begin
  if new.published then
    hay := lower(coalesce(new.title, '') || ' ' ||
                 coalesce(new.excerpt, '') || ' ' ||
                 coalesce(new.body_markdown, ''));
    foreach bad in array banned loop
      if hay ~ bad then
        raise exception
          'Compliance block: this article matches the prohibited pattern "%". Rewrite that passage before publishing.', bad
          using errcode = 'check_violation';
      end if;
    end loop;
    if new.published_at is null then
      new.published_at := now();
    end if;
  end if;
  return new;
end
$function$;

create or replace function public.log_content_change()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  j_new   jsonb;
  j_old   jsonb;
  rec_key text;
begin
  if tg_op <> 'DELETE' then j_new := to_jsonb(new); end if;
  if tg_op <> 'INSERT' then j_old := to_jsonb(old); end if;

  rec_key := coalesce(
    j_new ->> 'key', j_new ->> 'slug', j_new ->> 'id',
    j_old ->> 'key', j_old ->> 'slug', j_old ->> 'id',
    '(unknown)'
  );

  insert into public.content_audit (table_name, record_key, before, after, changed_by)
  values (tg_table_name, rec_key, j_old, j_new, auth.uid());

  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

create or replace function public.stamp_published_at()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.published and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end
$function$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Retention. 13 months for analytics is the figure disclosed in Privacy Policy
-- §5.2; 24 months for closed leads is §5.1. Changing either number here
-- without editing the Privacy Policy makes the published disclosure false.
create or replace function public.purge_analytics()
returns void
language sql
security definer
set search_path to 'public'
as $function$
  delete from public.analytics_events where occurred_at < now() - interval '13 months';
$function$;

create or replace function public.purge_old_leads()
returns void
language sql
security definer
set search_path to 'public'
as $function$
  delete from public.leads
  where status = 'closed' and updated_at < now() - interval '24 months';
$function$;

create or replace function public.run_retention_purges()
returns void
language sql
security definer
set search_path to 'public'
as $function$
  select public.purge_analytics();
  select public.purge_old_leads();
$function$;

-- Analytics reporting RPCs for /admin. Each re-checks is_admin() in its own
-- body and raises 42501 otherwise: a SECURITY DEFINER function bypasses RLS,
-- so without this an authenticated non-admin could call them directly and read
-- everything the policies exist to withhold.
create or replace function public.analytics_totals(p_from date, p_to date)
returns table(pageviews bigint, sessions bigint, clicks bigint, bounce_sessions bigint)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with ev as (
    select * from public.analytics_events
    where occurred_at >= p_from and occurred_at < (p_to + 1)
  ), per_session as (
    select session_hash,
           count(*) filter (where event_type = 'pageview') as pv,
           count(*) filter (where event_type = 'click')    as ck
    from ev group by session_hash
  )
  select (select count(*) from ev where event_type = 'pageview'),
         (select count(*) from per_session),
         (select count(*) from ev where event_type = 'click'),
         (select count(*) from per_session where pv <= 1 and ck = 0);
end $function$;

create or replace function public.analytics_daily(p_from date, p_to date)
returns table(day date, pageviews bigint, sessions bigint)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select (occurred_at at time zone 'Asia/Kolkata')::date,
         count(*) filter (where event_type = 'pageview'),
         count(distinct session_hash)
  from public.analytics_events
  where occurred_at >= p_from and occurred_at < (p_to + 1)
  group by 1 order by 1;
end $function$;

create or replace function public.analytics_top_pages(p_from date, p_to date, p_limit integer default 15)
returns table(path text, views bigint, sessions bigint)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select e.path, count(*), count(distinct e.session_hash)
  from public.analytics_events e
  where e.event_type = 'pageview'
    and e.occurred_at >= p_from and e.occurred_at < (p_to + 1)
  group by e.path order by 2 desc limit p_limit;
end $function$;

create or replace function public.analytics_top_clicks(p_from date, p_to date, p_limit integer default 15)
returns table(link_kind text, link_label text, link_href text, clicks bigint)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select e.link_kind, e.link_label, e.link_href, count(*)
  from public.analytics_events e
  where e.event_type = 'click'
    and e.occurred_at >= p_from and e.occurred_at < (p_to + 1)
  group by e.link_kind, e.link_label, e.link_href
  order by 4 desc limit p_limit;
end $function$;

create or replace function public.analytics_referrers(p_from date, p_to date, p_limit integer default 10)
returns table(ref_host text, sessions bigint)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select coalesce(e.ref_host, 'Direct / none'), count(distinct e.session_hash)
  from public.analytics_events e
  where e.occurred_at >= p_from and e.occurred_at < (p_to + 1)
  group by 1 order by 2 desc limit p_limit;
end $function$;

create or replace function public.analytics_devices(p_from date, p_to date)
returns table(device text, sessions bigint)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select e.device, count(distinct e.session_hash)
  from public.analytics_events e
  where e.occurred_at >= p_from and e.occurred_at < (p_to + 1)
  group by e.device order by 2 desc;
end $function$;


-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

create trigger leads_touch_updated_at before update on public.leads
  for each row execute function touch_updated_at();

create trigger posts_compliance_check before insert or update on public.posts
  for each row execute function assert_post_compliance();
create trigger posts_touch_updated_at before update on public.posts
  for each row execute function touch_updated_at();
create trigger posts_audit after insert or delete or update on public.posts
  for each row execute function log_content_change();

create trigger resource_links_stamp_published before insert or update on public.resource_links
  for each row execute function stamp_published_at();
create trigger resource_links_touch_updated_at before update on public.resource_links
  for each row execute function touch_updated_at();
create trigger resource_links_audit after insert or delete or update on public.resource_links
  for each row execute function log_content_change();

create trigger videos_stamp_published before insert or update on public.videos
  for each row execute function stamp_published_at();
create trigger videos_touch_updated_at before update on public.videos
  for each row execute function touch_updated_at();
create trigger videos_audit after insert or delete or update on public.videos
  for each row execute function log_content_change();

create trigger site_content_audit after insert or delete or update on public.site_content
  for each row execute function log_content_change();


-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- This is the security boundary. Read the absences as carefully as the
-- policies: a table with RLS on and no policy for a command denies that
-- command to every role except service_role, which bypasses RLS entirely.
-- ---------------------------------------------------------------------------

alter table public.admin_allowlist  enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_salt   enable row level security;
alter table public.content_audit    enable row level security;
alter table public.deploy_log       enable row level security;
alter table public.leads            enable row level security;
alter table public.posts            enable row level security;
alter table public.resource_links   enable row level security;
alter table public.site_content     enable row level security;
alter table public.videos           enable row level security;

-- admin_allowlist: readable by admins, and by nobody else. No INSERT, UPDATE
-- or DELETE policy at all — the allowlist cannot be edited through the API by
-- anyone, including an admin. Adding yourself requires the dashboard.
create policy "admins read allowlist" on public.admin_allowlist
  for select to authenticated using (is_admin());

-- analytics_salt: RLS on, ZERO policies. Nothing reachable through the API can
-- read the salt. Intentional — see the table comment.

-- leads: NO INSERT POLICY. This is the single most important absence in the
-- file. Submissions reach this table only through the submit-lead edge
-- function's service_role key; the public anon key cannot write a lead, so the
-- form endpoint cannot be turned into an open insert.
create policy "admins read leads"   on public.leads for select to authenticated using (is_admin());
create policy "admins update leads" on public.leads for update to authenticated using (is_admin()) with check (is_admin());
create policy "admins delete leads" on public.leads for delete to authenticated using (is_admin());

-- analytics_events: same shape — admins read and delete, inserts arrive only
-- via the `track` function's service_role key.
create policy "admins read analytics"   on public.analytics_events for select to authenticated using (is_admin());
create policy "admins delete analytics" on public.analytics_events for delete to authenticated using (is_admin());

-- Append-only in practice: read policy only, no update or delete for anyone.
create policy "admins read audit"   on public.content_audit for select to authenticated using (is_admin());
create policy "admins read deploys" on public.deploy_log    for select to authenticated using (is_admin());

-- Content tables: the public sees published rows only; admins see and write
-- everything. The `published or is_admin()` form on the authenticated policy is
-- what lets an admin preview a draft while a signed-in non-admin cannot.
create policy "anon reads published posts"  on public.posts for select to anon using (published);
create policy "authenticated reads posts"   on public.posts for select to authenticated using (published or is_admin());
create policy "admins write posts"          on public.posts for all to authenticated using (is_admin()) with check (is_admin());

create policy "anon reads published videos" on public.videos for select to anon using (published);
create policy "authenticated reads videos"  on public.videos for select to authenticated using (published or is_admin());
create policy "admins write videos"         on public.videos for all to authenticated using (is_admin()) with check (is_admin());

create policy "anon reads published links"  on public.resource_links for select to anon using (published);
create policy "authenticated reads links"   on public.resource_links for select to authenticated using (published or is_admin());
create policy "admins write links"          on public.resource_links for all to authenticated using (is_admin()) with check (is_admin());

-- site_content is world-readable by design: it is site copy, fetched at build
-- time. Only admins may write it.
create policy "public reads site content" on public.site_content for select to anon, authenticated using (true);
create policy "admins write site content" on public.site_content for all to authenticated using (is_admin()) with check (is_admin());


-- ---------------------------------------------------------------------------
-- SCHEDULED JOBS (pg_cron)
-- ---------------------------------------------------------------------------
--
-- jobid 1, "retention-purges", active:
--   schedule: 0 3 * * *
--   command:  select public.run_retention_purges()
--
-- This job is what makes the retention periods in the Privacy Policy true
-- rather than aspirational. If it is ever disabled, the published disclosure
-- stops matching reality.
-- ---------------------------------------------------------------------------
