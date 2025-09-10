import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CATALOG_API_BASE_URL, REQUEST_API_BASE_URL, USER_API_BASE_URL } from '../token';
import { isTokenExpired } from '../../auth/jwt.utils';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

function readTokenFromProfile(): string | null {
  try {
    const raw = localStorage.getItem('profile');
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p.token ?? p.jwt ?? p.access_token ?? null;
  } catch {
    return null;
  }
}

function hardLogout(router: Router) {
  try {
    localStorage.removeItem('profile');
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
  } catch {}
  router.navigateByUrl('/login', { replaceUrl: true });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const reqBase     = inject(REQUEST_API_BASE_URL);
  const usrBase     = inject(USER_API_BASE_URL);
  const catalogBase = inject(CATALOG_API_BASE_URL);
  const router      = inject(Router);

  // Endpoints públicos (ajusta si tu login es diferente)
  const PUBLIC_ENDPOINTS = ['/login', '/auth/login', '/auth/refresh', '/password/forgot', '/password/reset'];

  const eligible =
    req.url.startsWith(reqBase) ||
    req.url.startsWith(usrBase) ||
    req.url.startsWith(catalogBase);

  const isPublic = PUBLIC_ENDPOINTS.some(p => req.url.includes(p));

  // Si no es de nuestras APIs conocidas, no tocamos nada
  if (!eligible) return next(req);

  const token = readTokenFromProfile();

  // ❗ No cortes por expiración si la request es pública o si no hay token
  if (!isPublic && token && isTokenExpired(token)) {
    hardLogout(router);
    return new Observable((subscriber) => {
      subscriber.error(new HttpErrorResponse({ status: 401, statusText: 'Token expired' }));
    });
  }

  // Solo adjunta Authorization cuando NO es público y el token existe y es válido
  const authReq = (!isPublic && token && !isTokenExpired(token))
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Desloguea solo si NO es público
      const expiredNow = isTokenExpired(readTokenFromProfile());
      if (
        !isPublic &&
        (err.status === 401 ||
         err.status === 403 ||
         (err.status === 0 && expiredNow))
      ) {
        hardLogout(router);
      }
      // Reenvía el error intacto para que tu componente de login lo muestre
      return throwError(() => err);
    })
  );
};
