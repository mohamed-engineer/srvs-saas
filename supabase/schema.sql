-- SRVS Accounting SaaS schema for a Supabase project.
-- Run once in Supabase SQL Editor. User-facing rows are protected by owner-based RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique,
  business_type text not null default 'نشاط تجاري' check (char_length(business_type) between 2 and 80),
  brand_color text not null default '#29b8e8' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  status text not null default 'pending_payment' check (status in ('pending_payment', 'active', 'suspended')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'annual', 'lifetime')),
  status text not null default 'pending' check (status in ('pending', 'active', 'past_due', 'canceled', 'expired')),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  provider text not null default 'kashier',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'annual', 'lifetime')),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  provider text not null default 'kashier',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded')),
  merchant_order_id text not null unique,
  kashier_session_id text unique,
  kashier_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_idx on public.workspaces(owner_id);
create index if not exists payment_orders_owner_created_idx on public.payment_orders(owner_id, created_at desc);

-- Tenant-scoped accounting records. API routes should write invoice, payment, stock,
-- and ledger changes in one database transaction before these tables hold live data.
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('manager', 'accountant', 'cashier', 'inventory', 'viewer')),
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.workspaces w where w.id = p_workspace_id and w.owner_id = (select auth.uid()))
    or exists (select 1 from public.workspace_members m where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid()));
$$;
revoke all on function public.is_workspace_member(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;

create or replace function public.can_manage_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.workspaces w where w.id = p_workspace_id and w.owner_id = (select auth.uid()))
    or exists (select 1 from public.workspace_members m where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid()) and m.role = 'manager');
$$;
revoke all on function public.can_manage_workspace(uuid) from public, anon;
grant execute on function public.can_manage_workspace(uuid) to authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  sku text,
  barcode text,
  category text not null default '',
  unit text not null default 'قطعة',
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  stock_quantity numeric(14,3) not null default 0,
  low_stock_threshold numeric(14,3) not null default 0 check (low_stock_threshold >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, sku),
  unique (workspace_id, barcode)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  opening_balance numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  opening_balance numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  number text not null,
  kind text not null check (kind in ('sale', 'purchase', 'sale_return', 'purchase_return')),
  status text not null default 'draft' check (status in ('draft', 'posted', 'void')),
  customer_id uuid,
  supplier_id uuid,
  related_invoice_id uuid,
  issue_date date not null default current_date,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  tax numeric(12,2) not null default 0 check (tax >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  payment_method text not null default 'cash',
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, number),
  foreign key (workspace_id, customer_id) references public.customers(workspace_id, id),
  foreign key (workspace_id, supplier_id) references public.suppliers(workspace_id, id),
  foreign key (workspace_id, related_invoice_id) references public.invoices(workspace_id, id)
);

create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null,
  product_id uuid,
  description text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  foreign key (workspace_id, invoice_id) references public.invoices(workspace_id, id) on delete cascade,
  foreign key (workspace_id, product_id) references public.products(workspace_id, id)
);

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'cash',
  reference text not null default '',
  paid_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  foreign key (workspace_id, invoice_id) references public.invoices(workspace_id, id) on delete cascade
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id uuid not null,
  invoice_id uuid,
  kind text not null check (kind in ('purchase', 'sale', 'return_in', 'return_out', 'adjustment', 'count')),
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  note text not null default '',
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  foreign key (workspace_id, product_id) references public.products(workspace_id, id),
  foreign key (workspace_id, invoice_id) references public.invoices(workspace_id, id)
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('income', 'expense', 'transfer')),
  category text not null default '',
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'cash',
  reference_type text not null default '',
  reference_id uuid,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists products_workspace_name_idx on public.products(workspace_id, name);
create index if not exists customers_workspace_name_idx on public.customers(workspace_id, name);
create index if not exists suppliers_workspace_name_idx on public.suppliers(workspace_id, name);
create index if not exists invoices_workspace_date_idx on public.invoices(workspace_id, issue_date desc);
create index if not exists invoice_lines_workspace_invoice_idx on public.invoice_lines(workspace_id, invoice_id);
create index if not exists inventory_movements_workspace_product_idx on public.inventory_movements(workspace_id, product_id, occurred_at desc);
create index if not exists financial_transactions_workspace_date_idx on public.financial_transactions(workspace_id, occurred_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_orders enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "owners read own workspaces" on public.workspaces;
drop policy if exists "workspace members read workspaces" on public.workspaces;
create policy "workspace members read workspaces" on public.workspaces for select to authenticated
  using ((select auth.uid()) = owner_id or public.is_workspace_member(id));
drop policy if exists "owners create own workspaces" on public.workspaces;
create policy "owners create own workspaces" on public.workspaces for insert to authenticated with check ((select auth.uid()) = owner_id and status = 'pending_payment');

create or replace function public.update_my_workspace(
  p_workspace_id uuid,
  p_name text,
  p_business_type text,
  p_brand_color text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.workspaces set name = p_name, business_type = p_business_type,
    brand_color = p_brand_color, updated_at = now()
  where id = p_workspace_id and owner_id = (select auth.uid());
  return found;
end;
$$;
revoke all on function public.update_my_workspace(uuid, text, text, text) from public, anon;
grant execute on function public.update_my_workspace(uuid, text, text, text) to authenticated;

drop policy if exists "owners read own subscriptions" on public.subscriptions;
create policy "owners read own subscriptions" on public.subscriptions for select to authenticated
  using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid())));

drop policy if exists "owners read own payments" on public.payment_orders;
create policy "owners read own payments" on public.payment_orders for select to authenticated using ((select auth.uid()) = owner_id);

alter table public.workspace_members enable row level security;
drop policy if exists "users read own workspace membership" on public.workspace_members;
create policy "users read own workspace membership" on public.workspace_members for select to authenticated
  using (user_id = (select auth.uid()) or public.can_manage_workspace(workspace_id));

do $$
declare
  tenant_table text;
begin
  foreach tenant_table in array array['products', 'customers', 'suppliers', 'invoices', 'invoice_lines', 'invoice_payments', 'inventory_movements', 'financial_transactions']
  loop
    execute format('alter table public.%I enable row level security', tenant_table);
    execute format('drop policy if exists "workspace members read tenant data" on public.%I', tenant_table);
    execute format('create policy "workspace members read tenant data" on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', tenant_table);
    execute format('drop policy if exists "workspace managers write tenant data" on public.%I', tenant_table);
    execute format('create policy "workspace managers write tenant data" on public.%I for all to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id))', tenant_table);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tenant_table);
  end loop;
end;
$$;

-- Called only by the server after verifying a Kashier webhook signature, merchant, order, amount, and currency.
create or replace function public.fulfill_kashier_order(
  p_merchant_order_id text,
  p_success boolean,
  p_transaction_id text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row public.payment_orders%rowtype;
begin
  select * into order_row from public.payment_orders
  where merchant_order_id = p_merchant_order_id for update;

  if not found then return 'not_found'; end if;
  if order_row.status = 'paid' then return 'already_paid'; end if;
  if order_row.status in ('canceled', 'refunded') then return order_row.status; end if;

  if p_success then
    update public.payment_orders set status = 'paid', kashier_transaction_id = p_transaction_id,
      paid_at = now(), updated_at = now() where id = order_row.id;
    update public.workspaces set status = 'active', updated_at = now() where id = order_row.workspace_id;
    insert into public.subscriptions (workspace_id, plan, status, amount, currency, current_period_end)
    values (
      order_row.workspace_id, order_row.plan, 'active', order_row.amount, order_row.currency,
      case order_row.plan when 'monthly' then now() + interval '1 month'
                          when 'annual' then now() + interval '1 year' else null end
    )
    on conflict (workspace_id) do update set plan = excluded.plan, status = 'active', amount = excluded.amount,
      currency = excluded.currency, current_period_end = excluded.current_period_end, updated_at = now();
    return 'paid';
  end if;

  update public.payment_orders set status = 'failed', updated_at = now() where id = order_row.id;
  return 'failed';
end;
$$;

revoke all on function public.fulfill_kashier_order(text, boolean, text) from public, anon, authenticated;
grant execute on function public.fulfill_kashier_order(text, boolean, text) to service_role;

create or replace function public.revoke_kashier_order(p_merchant_order_id text, p_event text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row public.payment_orders%rowtype;
  revoked_status text;
begin
  if p_event not in ('refund', 'partial_refund', 'void', 'reversal') then return 'ignored'; end if;
  select * into order_row from public.payment_orders
  where merchant_order_id = p_merchant_order_id for update;
  if not found then return 'not_found'; end if;
  if order_row.status in ('refunded', 'canceled') then return order_row.status; end if;
  if order_row.status <> 'paid' then return order_row.status; end if;
  revoked_status := case when p_event in ('refund', 'partial_refund') then 'refunded' else 'canceled' end;
  update public.payment_orders set status = revoked_status, updated_at = now() where id = order_row.id;
  update public.subscriptions set status = 'canceled', updated_at = now() where workspace_id = order_row.workspace_id;
  update public.workspaces set status = 'suspended', updated_at = now() where id = order_row.workspace_id;
  return revoked_status;
end;
$$;
revoke all on function public.revoke_kashier_order(text, text) from public, anon, authenticated;
grant execute on function public.revoke_kashier_order(text, text) to service_role;

revoke update on public.workspaces from authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.payment_orders to authenticated;
grant all on public.profiles, public.workspaces, public.subscriptions, public.payment_orders to service_role;
