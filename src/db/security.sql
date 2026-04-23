-- ================================================================
-- e-PetPlace – Security: RLS + Policies completas
-- Ejecutar en el SQL Editor de Supabase
-- ================================================================

-- ── Habilitar RLS en todas las tablas ───────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacunas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_adopcion ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Usuarios pueden ver su perfil"        ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden insertar su perfil"   ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users manage own profile"             ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── mascotas ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Usuarios gestionan sus mascotas" ON public.mascotas;
DROP POLICY IF EXISTS "Users manage own mascotas"       ON public.mascotas;

CREATE POLICY "mascotas_select" ON public.mascotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mascotas_insert" ON public.mascotas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mascotas_update" ON public.mascotas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mascotas_delete" ON public.mascotas
  FOR DELETE USING (auth.uid() = user_id);

-- ── vacunas ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Usuarios gestionan vacunas de sus mascotas" ON public.vacunas;
DROP POLICY IF EXISTS "Users manage own vacunas"                   ON public.vacunas;

CREATE POLICY "vacunas_select" ON public.vacunas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mascotas
      WHERE mascotas.id = vacunas.mascota_id
        AND mascotas.user_id = auth.uid()
    )
  );

CREATE POLICY "vacunas_insert" ON public.vacunas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mascotas
      WHERE mascotas.id = vacunas.mascota_id
        AND mascotas.user_id = auth.uid()
    )
  );

CREATE POLICY "vacunas_update" ON public.vacunas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mascotas
      WHERE mascotas.id = vacunas.mascota_id
        AND mascotas.user_id = auth.uid()
    )
  );

CREATE POLICY "vacunas_delete" ON public.vacunas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.mascotas
      WHERE mascotas.id = vacunas.mascota_id
        AND mascotas.user_id = auth.uid()
    )
  );

-- ── productos ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Cualquiera puede ver productos" ON public.productos;
DROP POLICY IF EXISTS "productos_public_read"          ON public.productos;

CREATE POLICY "productos_public_read" ON public.productos
  FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE solo via service_role (dashboard/backend)

-- ── citas ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own citas" ON public.citas;

CREATE POLICY "citas_select" ON public.citas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "citas_insert" ON public.citas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "citas_update" ON public.citas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "citas_delete" ON public.citas
  FOR DELETE USING (auth.uid() = user_id);

-- ── pedidos ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own pedidos" ON public.pedidos;

CREATE POLICY "pedidos_select" ON public.pedidos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pedidos_insert" ON public.pedidos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pedidos_update" ON public.pedidos
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- No DELETE: historial de pedidos es inmutable

-- ── solicitudes_adopcion ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own solicitudes" ON public.solicitudes_adopcion;

CREATE POLICY "solicitudes_select" ON public.solicitudes_adopcion
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "solicitudes_insert" ON public.solicitudes_adopcion
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- No UPDATE/DELETE: las solicitudes son inmutables una vez enviadas
