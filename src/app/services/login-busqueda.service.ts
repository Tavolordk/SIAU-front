// src/app/services/login-busqueda.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BusquedaRequest } from '../models/busqueda-request.model';
import { LoginBusquedaResponse } from '../models/login-busqueda-response.model';

@Injectable({ providedIn: 'root' })
export class LoginBusquedaService {
  private http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:5183/api/login/busqueda';

  buscar(body: BusquedaRequest): Observable<LoginBusquedaResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<LoginBusquedaResponse>(this.endpoint, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err.error?.message ?? err.message ?? 'Error de red';
        return throwError(() => ({ status: err.status, message }));
      })
    );
  }
}
