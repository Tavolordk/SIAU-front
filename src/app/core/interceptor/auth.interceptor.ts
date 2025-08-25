import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CATALOG_API_BASE_URL, REQUEST_API_BASE_URL, USER_API_BASE_URL } from '../token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const reqBase = inject(REQUEST_API_BASE_URL);
  const usrBase = inject(USER_API_BASE_URL);
  const catalogBase = inject(CATALOG_API_BASE_URL);

  // Firma solo si va a estos dominios
  const shouldSign = req.url.startsWith(reqBase) || req.url.startsWith(usrBase) || req.url.startsWith(catalogBase);
  if (!shouldSign) return next(req);

  // Lee el token guardado por tu login
  let token: string | null = null;
  try {
    const raw = localStorage.getItem('profile');
    if (raw) {
      const p = JSON.parse(raw);
      token = p.token ?? p.jwt ?? p.access_token ?? null; // tu login devuelve "token"
    }
  } catch {}

  if (!token) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
