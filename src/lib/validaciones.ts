export const validarEmailReal = (email: string): string | null => {
  if (!email || !email.trim()) return 'El email es requerido';

  const partes = email.trim().split('@');
  if (partes.length !== 2 || !partes[0] || !partes[1])
    return 'Ingresa un email válido';

  if (!partes[1].includes('.'))
    return 'Ingresa un email válido';

  return null; // Todo lo demás lo valida Supabase
};

export const MSG_EMAIL_REAL =
  'Necesitas un email real para recibir confirmaciones de pedidos y recuperar tu cuenta 📧';
