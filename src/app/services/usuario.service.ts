// File: src/app/auth/services/usuario.service.ts
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LoginResponse } from '../models/login-response.model';
import { USER_API_BASE_URL } from '../core/token';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(
    private http: HttpClient,
    @Inject(USER_API_BASE_URL) private baseUrl: string 
  ) {}

  /**
   * Autentica usuario y obtiene tokens
   */
loginAsync(cuenta: string, password: string): Observable<LoginResponse | null> {
  const request = { Username: cuenta, Password: password };
  return this.http.post<LoginResponse>(`${this.baseUrl}/user/login`, request).pipe(
    map(res => {
      if (res) {
        // Guarda el perfil completo
        localStorage.setItem('profile', JSON.stringify(res));
        // Guarda la cuenta que enviaste
        localStorage.setItem('username', cuenta);
      }
      return res;
    }),
    catchError(() => of(null))
  );
}


getStoredProfile(): LoginResponse | null {
  const json = localStorage.getItem('profile');
  return json ? JSON.parse(json) as LoginResponse : null;
}


  /**
   * Cambia la contraseña en primer inicio
   */
  cambiarPasswordPrimerInicioAsync(cuenta: string, nuevaPassword: string): Observable<boolean> {
    const request = { Cuenta: cuenta, NuevaPassword: nuevaPassword };
    return this.http.put(`${this.baseUrl}/user/primer-inicio`, request, { observe: 'response' })
      .pipe(
        map(res => res.ok),
        catchError(() => of(false))
      );
  }

  /**
   * Cambia contraseña existente
   */
  cambiarPasswordAsync(cuenta: string, passwordActual: string, nuevaPassword: string): Observable<boolean> {
    const request = { Cuenta: cuenta, PasswordActual: passwordActual, NuevaPassword: nuevaPassword };
    return this.http.put(`${this.baseUrl}/user/cambiar-password`, request, { observe: 'response' })
      .pipe(
        map(res => res.ok),
        catchError(() => of(false))
      );
  }

  /**
   * Restablece contraseña dado correo
   */
  restablecerPasswordAsync(cuenta: string, nuevaPassword: string): Observable<boolean> {
    const request = { Cuenta: cuenta, NuevaPassword: nuevaPassword };
    return this.http.put(`${this.baseUrl}/user/restablecer-password`, request, { observe: 'response' })
      .pipe(
        map(res => res.ok),
        catchError(() => of(false))
      );
  }

  /**
   * Solicita olvido de contraseña por correo
   */
  olvidoPasswordAsync(correo: string): Observable<boolean> {
    const request = { Correo: correo };
    return this.http.post(`${this.baseUrl}/user/olvido-password`, request, { observe: 'response' })
      .pipe(
        map(res => res.ok),
        catchError(() => of(false))
      );
  }

  /**
   * Método unificado de cambio o restablecimiento
   */
  cambiarOReestablecerPasswordAsync(
    cuenta: string,
    nuevaPassword: string,
    passwordActual?: string
  ): Observable<boolean> {
    if (passwordActual) {
      return this.cambiarPasswordAsync(cuenta, passwordActual, nuevaPassword);
    }
    return this.restablecerPasswordAsync(cuenta, nuevaPassword);
  }

  /**
   * Obtiene el nombre de usuario autenticado (p.ej. desde localStorage o JWT)
   */
  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  /** Devuelve el ID del usuario autenticado, o null si no hay */
  getUserId(): number | null {
    const perfil = this.getStoredProfile();
    return null;
  }
}
