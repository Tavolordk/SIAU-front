import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type Proposito = 'registro' | 'verificar' | 'restablecer';

@Component({
  selector: 'app-siau-codigo-verificacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './siau-codigo-verificacion.html',
  styleUrls: ['./siau-codigo-verificacion.scss'],
})
export class SiauCodigoVerificacionComponent {
  /** Texto principal */
  @Input() titulo = 'Sistema Integral de Administración de Usuarios (SIAU)';

  /** Código (6 dígitos o el largo que tú manejes) */
  @Input() codigo = '428923';

  /** “Estimado …” (si lo dejas vacío mostrará “Usuario”) */
  @Input() nombreUsuario = 'Usuario';

  /** Propósito del código */
  @Input() proposito: Proposito = 'registro';

  /** Fecha/hora de emisión del código */
  @Input() fecha: Date | string = new Date();

  /** Contacto (sobrescribibles) */
  @Input() mesaServicio = '5511036000 (ext. 12345)';
  @Input() red = '833 12345';
  @Input() correo = 'mesadeservicios@sspc.gob.mx';

  get subtitulo(): string {
    return 'Su código de verificación es:';
  }

  get descripcionProposito(): string {
    switch (this.proposito) {
      case 'registro':    return 'completar su registro';
      case 'verificar':   return 'verificar su cuenta';
      case 'restablecer': return 'restablecer acceso';
    }
  }
}
