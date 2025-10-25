// src/app/services/login.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginResponse } from '../models/login-response.model';

export interface LoginRequest {
  Usuario: string;     // "tavo.olea"
  Contrasena: string;  // "cambio00"
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:5183/api/login';

  login(body: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<LoginResponse>(this.endpoint, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => throwError(() => ({ status: err.status, message: err.error?.message ?? err.message ?? 'Error de red' })))
    );
  }
}
