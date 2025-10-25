// src/app/services/login-actualizar-password.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ActualizarPasswordRequest } from '../models/actualizar-password-request.model';
import { ActualizarPasswordResponse } from '../models/actualizar-password-response.model';

// --- Token de contexto para saltarse Auth en el interceptor ---
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

@Injectable({ providedIn: 'root' })
export class LoginActualizarPasswordService {
  private http = inject(HttpClient);

  // URL completa (como la tenías)
  private readonly endpoint = 'http://localhost:5183/api/login/actualizar-password';

  /**
   * Cambia la contraseña del usuario.
   * - Usa HttpContext SKIP_AUTH para que el interceptor lo deje pasar
   * - No-cache
   * - Timeout de 15s
   */
  cambiar(body: ActualizarPasswordRequest): Observable<ActualizarPasswordResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    });

    // 👇 contexto que el interceptor puede leer para no tocar este request
    const context = new HttpContext().set(SKIP_AUTH, true);

    return this.http
      .post<ActualizarPasswordResponse>(this.endpoint, body, {
        headers,
        context,
        // withCredentials: true, // (solo si usas cookies de sesión)
      })
      .pipe(
        timeout(15000),
        catchError((err) => this.handleError(err)),
      );
  }

  private handleError(err: unknown) {
    if (err instanceof TimeoutError) {
      return throwError(() => ({ status: 0, message: 'Tiempo de espera agotado (timeout)' }));
    }
    const httpErr = err as HttpErrorResponse;
    const status = httpErr?.status ?? 0;
    const backendMsg =
      (httpErr?.error && (httpErr.error.message || httpErr.error?.Message || httpErr.error?.error)) ||
      httpErr?.message ||
      'Error de red';
    return throwError(() => ({ status, message: backendMsg }));
  }
}
