// src/app/services/login-cedulas-por-rol.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CedulasPorRolRequest } from '../models/cedulas-por-rol-request.model';
import { CedulasPorRolResponse } from '../models/cedulas-por-rol-response.model';

@Injectable({ providedIn: 'root' })
export class LoginCedulasPorRolService {
  private http = inject(HttpClient);
  // Si usas environments, cambia por: `${environment.apiBase}/api/login/cedulas-por-rol`
  private readonly endpoint = 'http://localhost:5183/api/login/cedulas-por-rol';

  listar(body: CedulasPorRolRequest): Observable<CedulasPorRolResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<CedulasPorRolResponse>(this.endpoint, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err.error?.message ?? err.message ?? 'Error de red';
        return throwError(() => ({ status: err.status, message }));
      })
    );
  }
}
