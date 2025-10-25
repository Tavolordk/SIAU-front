import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  AdminCedulaDetalleRequest,
  AdminCedulaDetalleResponse,
} from '../models/admin-cedula-detalle.model';

@Injectable({ providedIn: 'root' })
export class AdminCedulaDetalleService {
  private http = inject(HttpClient);

  // URL completa (sin environment)
  private readonly endpoint =
    'http://localhost:5183/api/login/admin-cedula-detalle';

  /**
   * Consulta detalle por { id } o { folio }.
   * Ejemplo body: { "id": 12 }  o  { "folio": "PM-2025-20003" }
   */
  consultar(
    payload: AdminCedulaDetalleRequest
  ): Observable<AdminCedulaDetalleResponse> {
    // Validación básica: debe traer id XOR folio
    const hasId = (payload as any)?.id != null;
    const hasFolio = !!(payload as any)?.folio;
    if (hasId === hasFolio) {
      // ambos o ninguno ⇒ payload inválido
      return throwError(() => ({
        status: 400,
        message: 'Debes enviar exactamente uno: { id } o { folio }',
      }));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      'X-Skip-Auth': 'true', // si tu interceptor lo respeta, no inyecta auth
    });

    return this.http
      .post<AdminCedulaDetalleResponse>(this.endpoint, payload, { headers })
      .pipe(timeout(15000), catchError((e) => this.handleError(e)));
  }

  /** Azúcar sintáctica */
  porId(id: number): Observable<AdminCedulaDetalleResponse> {
    return this.consultar({ id });
  }

  porFolio(folio: string): Observable<AdminCedulaDetalleResponse> {
    return this.consultar({ folio });
  }

  private handleError(err: unknown) {
    if (err instanceof TimeoutError) {
      return throwError(() => ({
        status: 0,
        message: 'Tiempo de espera agotado (timeout)',
      }));
    }
    const httpErr = err as HttpErrorResponse;
    const status = httpErr?.status ?? 0;
    const backendMsg =
      (httpErr?.error &&
        (httpErr.error.message ||
          httpErr.error?.Message ||
          httpErr.error?.error)) ||
      httpErr?.message ||
      'Error de red';
    return throwError(() => ({ status, message: backendMsg }));
  }
}
