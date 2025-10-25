// src/app/services/login-admin-busqueda-full.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminBusquedaFullRequest } from '../models/admin-busqueda-full-request.model';
import { AdminBusquedaFullResponse } from '../models/admin-busqueda-full-response.model';

@Injectable({ providedIn: 'root' })
export class LoginAdminBusquedaFullService {
  private http = inject(HttpClient);
  // Si usas environments: `${environment.apiBase}/api/login/admin-busqueda-full`
  private readonly endpoint = 'http://localhost:5183/api/login/admin-busqueda-full';

  buscar(body: AdminBusquedaFullRequest): Observable<AdminBusquedaFullResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AdminBusquedaFullResponse>(this.endpoint, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err.error?.message ?? err.message ?? 'Error de red';
        return throwError(() => ({ status: err.status, message }));
      })
    );
  }
}
