-- Build 23 review fixes: allow reports on every kind of user content.
-- Adds property_listing, poem, music and story to reports.content_type
-- (creator profiles are reported as 'profile', which already exists).
-- Safe to re-run. Paste into Supabase → SQL Editor → Run.

alter table public.reports drop constraint if exists reports_content_type_check;
alter table public.reports add constraint reports_content_type_check
  check (content_type in ('post','comment','profile','event','job','property_listing','poem','music','story'));
