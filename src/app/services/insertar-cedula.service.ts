// src/app/services/insertar-cedula.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InsertarCedulaRequest } from '../models/insertar-cedula-request.model';
import { InsertarCedulaResponse } from '../models/insertar-cedula-response.model';

@Injectable({ providedIn: 'root' })
export class InsertarCedulaService {
  private http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:5183/api/login/insertar-cedula';

  insertar(body: InsertarCedulaRequest): Observable<InsertarCedulaResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<InsertarCedulaResponse>(this.endpoint, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) =>
        throwError(() => ({ status: err.status, message: err.error?.message ?? err.message ?? 'Error de red' }))
      )
    );
  }
}
