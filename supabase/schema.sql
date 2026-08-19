-- Evolua database schema for Supabase

create extension if not exists pgcrypto;

create type public.tipo_solicitacao_ferias as enum ('periodo', 'fixos');
create type public.status_solicitacao_ferias as enum ('pendente', 'em_revisao', 'aprovada', 'recusada', 'cancelada');
create type public.tipo_registro_ponto as enum ('entrada', 'intervalo', 'retorno', 'saida');



create table public.periodos_aquisitivos (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.usuarios(id) on delete cascade,
    inicio date not null,
    fim date not null,
    vencimento date not null,
    direito_dias integer not null default 30 check (direito_dias > 0),
    created_at timestamptz not null default now(),
    constraint periodo_aquisitivo_datas_validas check (fim >= inicio and vencimento >= fim),
    unique (usuario_id, inicio, fim)
);

create table public.solicitacoes_ferias (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.usuarios(id) on delete cascade,
    periodo_aquisitivo_id uuid references public.periodos_aquisitivos(id) on delete set null,
    tipo public.tipo_solicitacao_ferias not null,
    data_inicio date,
    data_fim date,
    quantidade_dias integer not null check (quantidade_dias > 0 and quantidade_dias <= 30),
    status public.status_solicitacao_ferias not null default 'pendente',
    observacoes text,
    aprovado_por uuid references public.usuarios(id) on delete set null,
    aprovado_em timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint solicitacao_periodo_valido check (
        (tipo = 'periodo' and data_inicio is not null and data_fim is not null and data_fim >= data_inicio)
        or
        (tipo = 'fixos' and data_inicio is null and data_fim is null)
    ),
    constraint aprovacao_consistente check (
        (status = 'aprovada' and aprovado_por is not null and aprovado_em is not null)
        or status <> 'aprovada'
    )
);

create table public.registros_ponto (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null references public.usuarios(id) on delete cascade,
    data_referencia date not null default current_date,
    tipo public.tipo_registro_ponto not null,
    registrado_em timestamptz not null default now(),
    observacoes text,
    created_at timestamptz not null default now(),
    unique (usuario_id, data_referencia, tipo)
);

create index solicitacoes_ferias_usuario_status_idx
    on public.solicitacoes_ferias (usuario_id, status, created_at desc);
create index periodos_aquisitivos_usuario_vencimento_idx
    on public.periodos_aquisitivos (usuario_id, vencimento);
create index registros_ponto_usuario_data_idx
    on public.registros_ponto (usuario_id, data_referencia, registrado_em);

create or replace function public.criar_usuario_do_auth()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.usuarios (id, nome, email)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
        new.email
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.criar_usuario_do_auth();

create or replace function public.atualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger usuarios_updated_at
before update on public.usuarios
for each row execute function public.atualizar_updated_at();

create trigger solicitacoes_ferias_updated_at
before update on public.solicitacoes_ferias
for each row execute function public.atualizar_updated_at();

alter table public.usuarios enable row level security;
alter table public.periodos_aquisitivos enable row level security;
alter table public.solicitacoes_ferias enable row level security;
alter table public.registros_ponto enable row level security;

create policy "usuarios podem consultar seu perfil"
on public.usuarios for select
using (auth.uid() = id);

create policy "usuarios podem consultar seus periodos"
on public.periodos_aquisitivos for select
using (auth.uid() = usuario_id);

create policy "usuarios podem consultar suas solicitacoes"
on public.solicitacoes_ferias for select
using (auth.uid() = usuario_id);

create policy "usuarios podem criar suas solicitacoes"
on public.solicitacoes_ferias for insert
with check (auth.uid() = usuario_id);

create policy "usuarios podem editar suas solicitacoes pendentes"
on public.solicitacoes_ferias for update
using (auth.uid() = usuario_id and status = 'pendente')
with check (auth.uid() = usuario_id and status = 'pendente');

create policy "usuarios podem cancelar suas solicitacoes"
on public.solicitacoes_ferias for delete
using (auth.uid() = usuario_id and status = 'pendente');

create policy "usuarios podem consultar seus registros"
on public.registros_ponto for select
using (auth.uid() = usuario_id);

create policy "usuarios podem criar seus registros"
on public.registros_ponto for insert
with check (auth.uid() = usuario_id);
