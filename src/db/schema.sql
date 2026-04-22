-- ================================================================
-- e-PetPlace – Supabase schema
-- Ejecutar en el SQL Editor de Supabase
-- ================================================================

-- ── profiles ────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text not null,
  nombre     text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Usuarios pueden ver su perfil"
  on public.profiles for select using (auth.uid() = id);

create policy "Usuarios pueden insertar su perfil"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Usuarios pueden actualizar su perfil"
  on public.profiles for update using (auth.uid() = id);

-- ── mascotas ────────────────────────────────────────────────────
create table if not exists public.mascotas (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users on delete cascade not null,
  nombre           text not null,
  especie          text not null default 'perro',
  raza             text,
  fecha_nacimiento date,
  peso             numeric(5, 2),
  foto_url         text,
  notas            text,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

alter table public.mascotas enable row level security;

create policy "Usuarios gestionan sus mascotas"
  on public.mascotas for all using (auth.uid() = user_id);

create index if not exists mascotas_user_id_idx on public.mascotas (user_id);

-- ── vacunas ─────────────────────────────────────────────────────
create table if not exists public.vacunas (
  id             uuid default gen_random_uuid() primary key,
  mascota_id     uuid references public.mascotas on delete cascade not null,
  nombre         text not null,
  fecha_aplicada date,
  fecha_proxima  date,
  veterinario    text,
  created_at     timestamptz default now() not null
);

alter table public.vacunas enable row level security;

create policy "Usuarios gestionan vacunas de sus mascotas"
  on public.vacunas for all using (
    exists (
      select 1 from public.mascotas m
      where m.id = vacunas.mascota_id
        and m.user_id = auth.uid()
    )
  );

create index if not exists vacunas_mascota_id_idx on public.vacunas (mascota_id);
create index if not exists vacunas_fecha_proxima_idx on public.vacunas (fecha_proxima);

-- ── productos ───────────────────────────────────────────────────
create table if not exists public.productos (
  id          uuid default gen_random_uuid() primary key,
  nombre      text not null,
  categoria   text not null,
  precio      numeric(10, 2) not null default 0,
  imagen_url  text,
  descripcion text,
  para_especie text not null default 'todos',
  created_at  timestamptz default now() not null
);

alter table public.productos enable row level security;

create policy "Cualquiera puede ver productos"
  on public.productos for select using (true);

create index if not exists productos_para_especie_idx on public.productos (para_especie);
create index if not exists productos_categoria_idx    on public.productos (categoria);

-- ── Trigger: auto-crear perfil al registrarse ───────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Productos de muestra ────────────────────────────────────────
insert into public.productos (nombre, categoria, precio, descripcion, para_especie) values
  ('Croquetas Premium Perro Adulto',  'Alimento',    45.99, 'Alimento balanceado con proteína de pollo', 'perro'),
  ('Croquetas Gatitos Indoor',         'Alimento',    38.50, 'Nutrición especial para gatos de interior',  'gato'),
  ('Alimento Peces Tropicales',        'Alimento',    12.99, 'Hojuelas nutritivas para peces de colores',  'pez'),
  ('Mezcla de Semillas para Aves',     'Alimento',    18.00, 'Mix de semillas naturales sin aditivos',      'ave'),
  ('Collar LED Seguridad',             'Accesorios',  15.99, 'Collar luminoso para paseos nocturnos',       'perro'),
  ('Arnés Antipull Ergonómico',        'Accesorios',  32.00, 'Arnés de control sin jalar para paseos',      'perro'),
  ('Arena Sanitaria Premium',          'Higiene',     22.00, 'Arena aglomerante sin polvo para gatos',      'gato'),
  ('Torre Rascadora con Juguetes',     'Juguetes',    55.99, 'Centro de juego con múltiples niveles',       'gato'),
  ('Pelota Kong Classic M',            'Juguetes',    18.50, 'Juguete relleable resistente',                'perro'),
  ('Jaula Espaciosa para Aves',        'Accesorios',  89.99, 'Jaula con perchas y comedero incluido',       'ave'),
  ('Acuario Kit 20L',                  'Accesorios',  65.00, 'Kit completo con filtro y termómetro',        'pez'),
  ('Champú Hipoalergénico',            'Higiene',     19.99, 'Champú suave para pieles sensibles',          'todos'),
  ('Vitaminas Multivitamínico',        'Salud',       35.00, 'Suplemento completo para mascotas',           'todos'),
  ('Pipeta Antipulgas Mensual',        'Salud',       28.00, 'Tratamiento antipulgas y garrapatas',         'perro'),
  ('Comedero Antiderrames',            'Accesorios',  24.99, 'Comedero con base antideslizante',            'todos')
on conflict do nothing;
