-- ============================================================
-- Nodelogic404 - Initial Schema Migration
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'professional', 'admin')),
  organization_id uuid,
  preferences jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create index idx_profiles_organization_id on public.profiles(organization_id);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table public.organizations (
  id        uuid primary key default uuid_generate_v4(),
  name      text not null,
  slug      text not null unique,
  owner_id  uuid not null references auth.users(id) on delete restrict,
  plan      text not null default 'free' check (plan in ('free', 'pro', 'team', 'enterprise')),
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

create policy "Members can view organization"
  on public.organizations for select
  using (
    owner_id = auth.uid()
    or id in (
      select organization_id from public.profiles where id = auth.uid() and organization_id is not null
    )
  );

create policy "Owners can update organization"
  on public.organizations for update
  using (owner_id = auth.uid());

create policy "Users can create organization"
  on public.organizations for insert
  with check (owner_id = auth.uid());

create index idx_organizations_slug on public.organizations(slug);
create index idx_organizations_owner_id on public.organizations(owner_id);

-- Add foreign key from profiles to organizations
alter table public.profiles
  add constraint fk_profiles_organization
  foreign key (organization_id) references public.organizations(id) on delete set null;

-- ============================================================
-- DIGITAL TWINS
-- ============================================================
create table public.digital_twins (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  type        text not null check (type in (
    'collaboration_workflow', 'team_dynamics', 'decision_process',
    'communication_pattern', 'project_flow'
  )),
  config      jsonb not null default '{}',
  state       jsonb not null default '{}',
  metadata    jsonb not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.digital_twins enable row level security;

create policy "Users can view own digital twins"
  on public.digital_twins for select
  using (
    user_id = auth.uid()
    or id in (
      select resource_id from public.collaborators
      where collaborator_id = auth.uid() and resource_type = 'digital_twin'
    )
  );

create policy "Users can create own digital twins"
  on public.digital_twins for insert
  with check (user_id = auth.uid());

create policy "Users can update own digital twins"
  on public.digital_twins for update
  using (
    user_id = auth.uid()
    or id in (
      select resource_id from public.collaborators
      where collaborator_id = auth.uid() and resource_type = 'digital_twin'
      and permission in ('editor', 'admin')
    )
  );

create policy "Users can delete own digital twins"
  on public.digital_twins for delete
  using (
    user_id = auth.uid()
    or id in (
      select resource_id from public.collaborators
      where collaborator_id = auth.uid() and resource_type = 'digital_twin'
      and permission = 'admin'
    )
  );

create index idx_digital_twins_user_id on public.digital_twins(user_id);
create index idx_digital_twins_type on public.digital_twins(type);
create index idx_digital_twins_is_active on public.digital_twins(is_active);

-- ============================================================
-- SIMULATIONS
-- ============================================================
create table public.simulations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  digital_twin_id uuid references public.digital_twins(id) on delete set null,
  name            text not null,
  description     text,
  type            text not null check (type in (
    'scenario_test', 'what_if', 'stress_test', 'optimization', 'collaboration_drill'
  )),
  parameters      jsonb not null default '{}',
  status          text not null default 'draft' check (status in ('draft', 'running', 'completed', 'failed', 'cancelled')),
  progress        integer not null default 0 check (progress >= 0 and progress <= 100),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.simulations enable row level security;

create policy "Users can view own simulations"
  on public.simulations for select
  using (
    user_id = auth.uid()
    or id in (
      select resource_id from public.collaborators
      where collaborator_id = auth.uid() and resource_type = 'simulation'
    )
  );

create policy "Users can create own simulations"
  on public.simulations for insert
  with check (user_id = auth.uid());

create policy "Users can update own simulations"
  on public.simulations for update
  using (
    user_id = auth.uid()
    or id in (
      select resource_id from public.collaborators
      where collaborator_id = auth.uid() and resource_type = 'simulation'
      and permission in ('editor', 'admin')
    )
  );

create policy "Users can delete own simulations"
  on public.simulations for delete
  using (
    user_id = auth.uid()
    or id in (
      select resource_id from public.collaborators
      where collaborator_id = auth.uid() and resource_type = 'simulation'
      and permission = 'admin'
    )
  );

create index idx_simulations_user_id on public.simulations(user_id);
create index idx_simulations_digital_twin_id on public.simulations(digital_twin_id);
create index idx_simulations_status on public.simulations(status);
create index idx_simulations_type on public.simulations(type);

-- ============================================================
-- SIMULATION RESULTS
-- ============================================================
create table public.simulation_results (
  id                uuid primary key default uuid_generate_v4(),
  simulation_id     uuid not null references public.simulations(id) on delete cascade,
  version           integer not null default 1,
  output            jsonb not null default '{}',
  insights          jsonb not null default '[]',
  confidence_score  numeric(3,2) check (confidence_score >= 0 and confidence_score <= 1),
  execution_time_ms integer,
  executed_at       timestamptz not null default now()
);

alter table public.simulation_results enable row level security;

create policy "Users can view results of own simulations"
  on public.simulation_results for select
  using (
    simulation_id in (
      select id from public.simulations where user_id = auth.uid()
      union
      select resource_id from public.collaborators
      where collaborator_id = auth.uid() and resource_type = 'simulation'
    )
  );

create policy "System can insert simulation results"
  on public.simulation_results for insert
  with check (
    simulation_id in (
      select id from public.simulations where user_id = auth.uid()
    )
  );

create policy "Users can delete results of own simulations"
  on public.simulation_results for delete
  using (
    simulation_id in (
      select id from public.simulations where user_id = auth.uid()
    )
  );

create index idx_simulation_results_simulation_id on public.simulation_results(simulation_id);
create index idx_simulation_results_executed_at on public.simulation_results(executed_at);

-- ============================================================
-- TWIN HISTORY
-- ============================================================
create table public.twin_history (
  id        uuid primary key default uuid_generate_v4(),
  twin_id   uuid not null references public.digital_twins(id) on delete cascade,
  state     jsonb not null,
  diff      jsonb not null default '{}',
  snapshot  jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.twin_history enable row level security;

create policy "Users can view history of own twins"
  on public.twin_history for select
  using (
    twin_id in (
      select id from public.digital_twins where user_id = auth.uid()
    )
  );

create policy "Users can insert history for own twins"
  on public.twin_history for insert
  with check (
    twin_id in (
      select id from public.digital_twins where user_id = auth.uid()
    )
  );

create policy "Users can delete history of own twins"
  on public.twin_history for delete
  using (
    twin_id in (
      select id from public.digital_twins where user_id = auth.uid()
    )
  );

create index idx_twin_history_twin_id on public.twin_history(twin_id);
create index idx_twin_history_created_at on public.twin_history(created_at);

-- ============================================================
-- COLLABORATORS
-- ============================================================
create table public.collaborators (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  collaborator_id uuid not null references auth.users(id) on delete cascade,
  permission      text not null default 'viewer' check (permission in ('viewer', 'editor', 'admin')),
  resource_type   text not null check (resource_type in ('simulation', 'digital_twin', 'organization')),
  resource_id     uuid not null,
  invited_at      timestamptz not null default now(),
  accepted_at     timestamptz,
  unique (collaborator_id, resource_type, resource_id)
);

alter table public.collaborators enable row level security;

create policy "Owners can view own collaborator entries"
  on public.collaborators for select
  using (
    owner_id = auth.uid()
    or collaborator_id = auth.uid()
  );

create policy "Owners can add collaborators"
  on public.collaborators for insert
  with check (owner_id = auth.uid());

create policy "Owners can update collaborators"
  on public.collaborators for update
  using (owner_id = auth.uid());

create policy "Owners can remove collaborators"
  on public.collaborators for delete
  using (
    owner_id = auth.uid()
    or collaborator_id = auth.uid()
  );

create index idx_collaborators_owner_id on public.collaborators(owner_id);
create index idx_collaborators_collaborator_id on public.collaborators(collaborator_id);
create index idx_collaborators_resource on public.collaborators(resource_type, resource_id);

-- ============================================================
-- USAGE METRICS
-- ============================================================
create table public.usage_metrics (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.usage_metrics enable row level security;

create policy "Users can view own usage metrics"
  on public.usage_metrics for select
  using (user_id = auth.uid());

create policy "System can insert usage metrics"
  on public.usage_metrics for insert
  with check (user_id = auth.uid());

create index idx_usage_metrics_user_id on public.usage_metrics(user_id);
create index idx_usage_metrics_event_type on public.usage_metrics(event_type);
create index idx_usage_metrics_created_at on public.usage_metrics(created_at);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  stripe_price_id          text,
  status                   text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at                timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (user_id = auth.uid());

create policy "Users can insert own subscription"
  on public.subscriptions for insert
  with check (user_id = auth.uid());

create policy "Users can update own subscription"
  on public.subscriptions for update
  using (user_id = auth.uid());

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_customer_id on public.subscriptions(stripe_customer_id);
create index idx_subscriptions_stripe_subscription_id on public.subscriptions(stripe_subscription_id);
create index idx_subscriptions_status on public.subscriptions(status);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_digital_twins
  before update on public.digital_twins
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_simulations
  before update on public.simulations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- ============================================================
-- PROFILE CREATION TRIGGER ON AUTH.USER INSERT
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  );

  insert into public.subscriptions (user_id, status)
  values (new.id, 'active');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CANCELLED STATUS CHECK
-- ============================================================
-- Note: "cancelled" (double-l) is intentionally not in the check constraint above.
-- If the app uses "cancelled", update the constraint. The webhook uses "canceled" (single-l).
-- To add it, run:
-- alter table public.subscriptions
--   drop constraint if exists subscriptions_status_check;
-- alter table public.subscriptions
--   add constraint subscriptions_status_check
--   check (status in ('active', 'canceled', 'canceled', 'past_due', 'trialing', 'paused'));
