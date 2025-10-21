import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons'; // <-- iconos

type TipoRequerimiento = 'nueva' | 'modificacion' | 'ampliacion' | 'reactivacion';

@Component({
  selector: 'app-siau-notificacion',
  standalone: true,
  templateUrl: './siau-notificacion.html',
  imports: [FontAwesomeModule],
  styleUrls: ['./siau-notificacion.scss'],
})
export class SiauNotificacionComponent {
  faUser = faUser;
  faLock = faLock;
  @Input() nombreUsuario = 'Juan Pérez';                       // "Juan Pérez"
  @Input() folio = 'PM-2025-10-123456';                               // "PM-2025-10-123456"
  @Input() tipoRequerimiento: TipoRequerimiento = 'nueva';

  // Solo aplica cuando tipoRequerimiento === 'nueva'
  @Input() cuentaUsuario?: string = 'jperez';                   // "jperez"
  @Input() contrasenaTemporal?: string = 'Abc123!x';              // "Abc123!x"

  // Datos de contacto (puedes sobreescribirlos desde el padre si cambian)
  @Input() mesaServicioTelefono = '55-1103-6000 (ext. 12345)';
  @Input() correoMesa = 'mesadeservicios@sspc.gob.mx';

  get titulo(): string {
    return 'Sistema Integral de Administración de Usuarios (SIAU)';
  }

  get descripcionTipo(): string {
    switch (this.tipoRequerimiento) {
      case 'nueva': return 'nueva cuenta';
      case 'modificacion': return 'modificación de perfil o adscripción';
      case 'ampliacion': return 'ampliación de perfil';
      case 'reactivacion': return 'reactivación de cuenta';
    }
  }
}
