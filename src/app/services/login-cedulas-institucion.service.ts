// src/app/services/login-cedulas-institucion.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CedulasInstitucionRequest } from '../models/cedulas-institucion-request.model';
import { CedulasInstitucionResponse } from '../models/cedulas-institucion-response.model';

@Injectable({ providedIn: 'root' })
export class LoginCedulasInstitucionService {
  private http = inject(HttpClient);
  // Si usas environments, cambia por: `${environment.apiBase}/api/login/cedulas-institucion`
  private readonly endpoint = 'http://localhost:5183/api/login/cedulas-institucion';

  listar(body: CedulasInstitucionRequest): Observable<CedulasInstitucionResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<CedulasInstitucionResponse>(this.endpoint, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err.error?.message ?? err.message ?? 'Error de red';
        return throwError(() => ({ status: err.status, message }));
      })
    );
  }
}
