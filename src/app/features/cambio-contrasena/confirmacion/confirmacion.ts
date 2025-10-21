import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faChevronDown,
  faCircleUser,
  faCircleCheck,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from '../../../shared/header-siau/header-siau';

@Component({
  selector: 'app-confirmacion-contrasena',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent],
  templateUrl: './confirmacion.html',
  styleUrls: ['./confirmacion.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionContrasenaComponent {
  /** Altura del header para posicionar el sidebar fijo */
  @Input() headerOffset = 140;

  /** Datos del header (puedes sobreescribir desde el contenedor) */
  @Input() usuarioNombre = 'Juan Pérez';
  @Input() usuarioCuenta = 'U123456';

  /** Click en "Volver al sistema" */
  @Output() volver = new EventEmitter<void>();

  i = {
    bars: faBars,
    chevronDown: faChevronDown,
    user: faCircleUser,
    check: faCircleCheck,
    info: faCircleInfo,
  };

  onVolver() {
    this.volver.emit();
  }
}
