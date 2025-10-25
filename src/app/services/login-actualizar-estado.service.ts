// src/app/services/login-actualizar-estado.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActualizarEstadoRequest, EstadoCedula } from '../models/actualizar-estado-request.model';
import { ActualizarEstadoResponse } from '../models/actualizar-estado-response.model';

@Injectable({ providedIn: 'root' })
export class LoginActualizarEstadoService {
  private http = inject(HttpClient);
  // Si usas environments: `${environment.apiBase}/api/login/actualizar-estado`
  private readonly endpoint = 'http://localhost:5183/api/login/actualizar-estado';

  actualizar(body: ActualizarEstadoRequest): Observable<ActualizarEstadoResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<ActualizarEstadoResponse>(this.endpoint, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err.error?.message ?? err.message ?? 'Error de red';
        return throwError(() => ({ status: err.status, message }));
      })
    );
  }

  // Azúcar sintáctico por si quieres mandar uno solo
  actualizarUno(id: number, nuevoDato: EstadoCedula): Observable<ActualizarEstadoResponse> {
    return this.actualizar({ cedula: [{ id, nuevoDato }] });
  }
}
