import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type TipoRequerimiento = 'nueva' | 'modificacion' | 'ampliacion' | 'reactivacion';

@Component({
  selector: 'app-siau-solicitud-no-atendida',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './siau-solicitud-no-atendida.html',
  styleUrls: ['./siau-solicitud-no-atendida.scss'],
})
export class SiauSolicitudNoAtendidaComponent {
  @Input() titulo = 'Sistema Integral de Administración de Usuarios (SIAU)';
  @Input() nombreUsuario = 'Juan Pérez';
  @Input() folio = 'PM-2025-10-12345';
  @Input() tipoRequerimiento: TipoRequerimiento = 'nueva';

  // Motivos configurables desde el padre
  @Input() motivos: string[] = [
    'La información proporcionada no coincide con los registros institucionales.',
    'Falta documentación para validar la solicitud.',
  ];

  // Contacto
  @Input() mesaServicioTelefono = '55-1103-6000 (ext. 12345)';
  @Input() correoMesa = 'mesadeservicios@sspc.gob.mx';

  get descripcionTipo(): string {
    switch (this.tipoRequerimiento) {
      case 'nueva':        return 'nueva cuenta';
      case 'modificacion': return 'modificación de perfil o adscripción';
      case 'ampliacion':   return 'ampliación de perfil';
      case 'reactivacion': return 'reactivación de cuenta';
    }
  }
}
