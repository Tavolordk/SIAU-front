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
import { PasswordFlowStateService } from '../../gestion-contrasena/password-flow-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmacion-contrasena',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './confirmacion.html',
  styleUrls: ['./confirmacion.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionContrasenaComponent {
  /** Altura del header para posicionar el sidebar fijo */
  @Input() headerOffset = 140;

  /** Datos del header (puedes sobreescribir desde el contenedor) */
  @Input() usuarioNombre = 'Octavio Olea';
  @Input() usuarioCuenta = 'U123456';

  /** Mostrar/ocultar botones locales; el flow los pone en false */
  @Input() showButtons = true;

  /** Click en "Volver al sistema" (modo standalone) */
  @Output() volver = new EventEmitter<void>();

  i = {
    bars: faBars,
    chevronDown: faChevronDown,
    user: faCircleUser,
    check: faCircleCheck,
    info: faCircleInfo,
  };

  constructor(private flow: PasswordFlowStateService, private router:Router) {}

  // Helpers por si quieres mostrar algo del estado (sin exponer la contraseña)
  get done()  { return this.flow.done; }
  get paso1() { return this.flow.paso1; } // { currentPassword: '...' } – no la muestres en UI
  get paso2() { return this.flow.paso2; } // { codigo?: string, nueva?: string } – tampoco muestres la nueva

  onVolver() {
    this.volver.emit();
    this.router.navigate(['/bienvenida']);
  }

  /** Por si el contenedor quisiera llamarlo simétricamente */
  submitFromParent(): boolean {
    return true;
  }
}
