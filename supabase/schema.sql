-- GAJ Wedding Invitation Platform — Supabase schema
-- Run in the Supabase SQL editor. Local JSON storage works without this.

create extension if not exists "pgcrypto";

create table if not exists wedding_settings (
  id text primary key default 'default',
  partner_one text not null,
  partner_two text not null,
  wedding_date date not null,
  wedding_time text,
  wedding_location text,
  announcement text,
  theme_configuration jsonb default '{}'::jsonb,
  hero_image text,
  rsvp_deadline date,
  contact_information jsonb default '{}'::jsonb,
  venue_name text,
  venue_address text,
  maps_url text,
  updated_at timestamptz default now()
);

create table if not exists wedding_events (
  id text primary key,
  event_name text not null,
  event_date date,
  start_time text,
  end_time text,
  venue_name text,
  venue_address text,
  description text,
  dress_code text,
  maps_url text,
  image_url text,
  display_order int default 0
);

create table if not exists gallery_images (
  id text primary key,
  image_url text not null,
  caption text,
  display_order int default 0,
  created_at timestamptz default now()
);

create table if not exists guests (
  id text primary key,
  invitation_token text unique not null,
  guest_name text not null,
  email text,
  phone text,
  maximum_attendees int not null default 2,
  invitation_status text not null default 'active' check (invitation_status in ('active', 'revoked')),
  household_label text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists rsvp_responses (
  id text primary key,
  guest_id text references guests(id) on delete cascade,
  invitation_token text,
  guest_name text,
  email text,
  phone text,
  attendance_status text not null check (attendance_status in ('accepted', 'declined')),
  attendee_count int not null default 0,
  attendee_names text,
  dietary_preferences text,
  message text,
  submitted_at timestamptz default now(),
  unique (guest_id)
);

create index if not exists guests_token_idx on guests(invitation_token);
create index if not exists rsvp_guest_idx on rsvp_responses(guest_id);

alter table wedding_settings enable row level security;
alter table wedding_events enable row level security;
alter table gallery_images enable row level security;
alter table guests enable row level security;
alter table rsvp_responses enable row level security;

-- Public can read published wedding content (events/gallery/settings)
create policy "Public read settings" on wedding_settings
  for select using (true);

create policy "Public read events" on wedding_events
  for select using (true);

create policy "Public read gallery" on gallery_images
  for select using (true);

-- Guests and RSVPs are not publicly readable via anon key.
-- All writes go through Next.js API routes using the service role key.
