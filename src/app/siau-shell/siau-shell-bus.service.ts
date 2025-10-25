import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SiauShellBusService {
  /** Emisor de eventos de toggle del sidebar */
   _toggle$ = new Subject<void>();

  /** Llamado desde cualquier vista para pedir colapsar/expandir el sidebar */
  requestToggle(): void {
    this._toggle$.next();
  }

  /** Observable al que se suscribe el sidebar para reaccionar al toggle */
  onRequestToggle(): Observable<void> {
    return this._toggle$.asObservable();
  }
}
