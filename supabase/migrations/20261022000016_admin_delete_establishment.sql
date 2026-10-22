-- Fideliza: exclusao administrativa de estabelecimento
-- Executar uma vez no Supabase SQL Editor.
-- A funcao exclui o estabelecimento e os registros relacionados
-- que possuem ON DELETE CASCADE. O perfil/conta do proprietario permanece.

CREATE OR REPLACE FUNCTION public.fideliza_admin_delete_establishment(
  p_establishment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin_id uuid;
  v_establishment_name text;
  v_owner_id uuid;
BEGIN
  -- Somente um usuario autenticado com perfil admin pode executar.
  v_admin_id := auth.uid();

  IF v_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_admin_id
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir estabelecimentos.'
      USING ERRCODE = '42501';
  END IF;

  IF p_establishment_id IS NULL THEN
    RAISE EXCEPTION 'O identificador do estabelecimento e obrigatorio.'
      USING ERRCODE = '22004';
  END IF;

  SELECT e.name, e.owner_id
    INTO v_establishment_name, v_owner_id
  FROM public.establishments e
  WHERE e.id = p_establishment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estabelecimento nao encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  -- Registrar a acao antes da exclusao. A tabela de auditoria nao possui
  -- chave estrangeira para o estabelecimento, portanto o registro permanece.
  INSERT INTO public.admin_audit_logs
    (admin_id, action, entity, entity_id, details)
  VALUES
    (
      v_admin_id,
      'delete_establishment',
      'establishments',
      p_establishment_id,
      jsonb_build_object(
        'establishment_name', v_establishment_name,
        'owner_id', v_owner_id
      )
    );

  DELETE FROM public.establishments
  WHERE id = p_establishment_id;
END;
$$;

-- Permitir a chamada via Supabase RPC para usuarios autenticados.
REVOKE ALL ON FUNCTION public.fideliza_admin_delete_establishment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fideliza_admin_delete_establishment(uuid) TO authenticated;

-- Solicitar ao PostgREST que atualize o cache do esquema.
NOTIFY pgrst, 'reload schema';
