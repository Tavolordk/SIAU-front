export type JwtPayload = { exp?: number; [k: string]: any };

export function decodeJwt(token: string | null): JwtPayload | null {
  try {
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function getExpiryMs(token: string | null): number | null {
  const payload = decodeJwt(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

/** Regresa true si el token está vencido, con tolerancia de 5s */
export function isTokenExpired(token: string | null, skewMs = 5000): boolean {
  const expMs = getExpiryMs(token);
  if (!expMs) return true; // si no trae exp, trátalo como inválido
  return Date.now() + skewMs >= expMs;
}
