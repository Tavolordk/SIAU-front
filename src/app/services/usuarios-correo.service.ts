import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UsuariosCorreoService {
  private http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:5030/api/usuarios/correo';

  /**
   * Envía el correo con el código.
   * - Solo cambias `nombreUsuario` y `destinatario` (y el `codigo` si no es 123456).
   * - El resto va fijo, y `Descripcion` se autogenera si no la pasas.
   */
  enviarCodigo(
    codigo: string,
    nombreUsuario: string,
    destinatario: string,
    descripcionProposito = 'activar tu cuenta en el sistema',
    descripcion?: string
  ): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const body = {
      // Fijos
      TipoTramite: 'codigo',
      Titulo: 'Código de Verificación',
      Subtitulo: 'Activación de cuenta',

      // Variables
      Codigo: codigo || '123456',
      NombreUsuario: nombreUsuario,
      DescripcionProposito: descripcionProposito,
      Destinatario: destinatario,

      // 👇 Requerido por el backend (nuevo)
      Descripcion:
        descripcion ??
        `Hola ${nombreUsuario}, tu código de verificación es ${codigo || '123456'}. ` +
        `Utilízalo para ${descripcionProposito}.`
    };

    return this.http.post(this.endpoint, body, { headers }).pipe(
      timeout(15000),
      catchError((err) => this.handleError(err))
    );
  }

  private handleError(err: unknown) {
    if (err instanceof TimeoutError) {
      return throwError(() => ({ status: 0, message: 'Tiempo de espera agotado (timeout)' }));
    }
    const httpErr = err as HttpErrorResponse;
    // Intenta sacar el primer mensaje de validación si viene en errors.{campo}[0]
    const validationMsg =
      (httpErr?.error?.errors &&
        Object.values(httpErr.error.errors)?.[0]?.[0]) as string | undefined;

    const message =
      validationMsg ||
      httpErr?.error?.title ||
      httpErr?.error?.message ||
      httpErr?.message ||
      'Error de red';

    return throwError(() => ({ status: httpErr?.status ?? 0, message }));
  }
}
