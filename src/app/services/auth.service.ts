import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface LoginResponse {
  token: string;
  // aquí puedes incluir más campos que envíe tu API, ej. usuario, permisos, etc.
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = '/api/auth';

  constructor(private http: HttpClient) {}

  /** Autentica y guarda el token en localStorage */
  login(username: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, { username, password }, { observe: 'response' })
      .pipe(
        tap((res: HttpResponse<LoginResponse>) => {
          const body = res.body!;
          localStorage.setItem('token', body.token);
        }),
        map(() => void 0)
      );
  }

  /** Inicia flujo de “¿Olvidaste tu contraseña?” */
  requestPasswordReset(username: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/forgot-password`, { username });
  }

  /** Confirma cambio de contraseña con token */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  /** Cambia contraseña una vez logueado */
  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/change-password`, { oldPassword, newPassword });
  }

  /** Fuerza cambio en primer inicio si aplica */
  initialLogin(username: string, password: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/initial-login`, { username, password, newPassword });
  }

  /** Elimina el token al cerrar sesión */
  logout(): void {
    localStorage.removeItem('token');
  }

  /** Retorna true si hay token guardado */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}
