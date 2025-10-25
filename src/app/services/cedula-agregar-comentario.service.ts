import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CedulaAgregarComentarioRequest } from '../models/cedula-agregar-comentario-request.model';
import { CedulaAgregarComentarioResponse } from '../models/cedula-agregar-comentario-response.model';

@Injectable({ providedIn: 'root' })
export class CedulaAgregarComentarioService {
  private http = inject(HttpClient);

  // URL completa
  private readonly endpoint = 'http://localhost:5183/api/login/cedula-agregar-comentario';

  agregar(body: CedulaAgregarComentarioRequest): Observable<CedulaAgregarComentarioResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'X-Skip-Auth': 'true',
    });

    return this.http.post<CedulaAgregarComentarioResponse>(this.endpoint, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err?.error?.message ?? err.message ?? 'Error de red';
        return throwError(() => ({ status: err.status ?? 0, message }));
      })
    );
  }
}
