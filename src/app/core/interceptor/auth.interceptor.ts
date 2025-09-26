import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CATALOG_API_BASE_URL, REQUEST_API_BASE_URL, USER_API_BASE_URL } from '../token';
import { isTokenExpired } from '../../auth/jwt.utils';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service'; // 👈

function readTokenFromProfile(): string | null {
  try {
    const raw = localStorage.getItem('profile');
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p.token ?? p.jwt ?? p.access_token ?? null;
  } catch { return null; }
}

function hardLogout(router: Router) {
  try {
    localStorage.removeItem('profile');
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
  } catch { }
  router.navigateByUrl('/login', { replaceUrl: true });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const reqBase     = inject(REQUEST_API_BASE_URL);
  const usrBase     = inject(USER_API_BASE_URL);
  const catalogBase = inject(CATALOG_API_BASE_URL);
  const router      = inject(Router);
  const auth        = inject(AuthService); // 👈

  const PUBLIC_ENDPOINTS = ['/login', '/auth/login', '/auth/refresh', '/password/forgot', '/password/reset'];

  const eligible =
    req.url.startsWith(reqBase) ||
    req.url.startsWith(usrBase) ||
    req.url.startsWith(catalogBase);

  const isPublic = PUBLIC_ENDPOINTS.some(p => req.url.includes(p));
  if (!eligible) return next(req);

  const token = readTokenFromProfile();

  if (!isPublic && token && isTokenExpired(token)) {
    auth.logout(); // 👈 en lugar de hardLogout(router)
    return new Observable(sub => {
      sub.error(new HttpErrorResponse({ status: 401, statusText: 'Token expired' }));
    });
  }

  const authReq = (!isPublic && token && !isTokenExpired(token))
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const expiredNow = isTokenExpired(readTokenFromProfile());
      if (!isPublic && (err.status === 401 || err.status === 403 || (err.status === 0 && expiredNow))) {
        auth.logout(); // 👈
      }
      return throwError(() => err);
    })
  );
};
