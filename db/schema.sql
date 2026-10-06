create type product_type as enum ('module', 'practicum', 'product_course', 'management_course');
create type edge_type as enum ('primary', 'optional', 'installed_base');
create type map_status as enum ('draft', 'published', 'archived');

create table products (
  id text primary key,
  title text not null,
  short_title text not null,
  product_type product_type not null,
  domain_tags text[] not null default '{}',
  audience_tags text[] not null default '{}',
  goal_tags text[] not null default '{}',
  short_outcome text not null,
  description text not null,
  duration_value integer not null,
  duration_unit text not null,
  access_model text not null,
  owner text not null,
  status text not null,
  public_visible boolean not null default true,
  exclusive_result_flag boolean not null default false,
  conflict_risk_level text not null,
  related_pt_products text[] not null default '{}',
  locale text not null default 'ru'
);

create table maps (
  id text primary key,
  name text not null,
  locale text not null default 'ru',
  status map_status not null default 'draft',
  version integer not null default 1,
  published_at timestamptz,
  published_version_id text
);

create table lanes (
  id text primary key,
  map_id text not null references maps(id) on delete cascade,
  title text not null,
  "order" integer not null,
  height integer not null,
  color_token text not null
);

create table map_versions (
  id text primary key,
  map_id text not null references maps(id) on delete cascade,
  version integer not null,
  status map_status not null,
  snapshot_json jsonb not null,
  created_by text not null,
  created_at timestamptz not null default now()
);
