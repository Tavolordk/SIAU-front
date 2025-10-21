import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons';

type MainSection = 'cedulas' | 'contrasena';
type SubCedulas  = 'mis' | 'consultar' | null;

@Component({
  selector: 'app-siau-sidebar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './siau-sidebar.html',
  styleUrls: ['./siau-sidebar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiauSidebarComponent {
  /** Posición fija y separación desde el header (si lo usas fijo) */
  @Input() fixed = true;
  @Input() top = 110; // px

  /** Título (2 líneas) */
  @Input() titleLine1 = 'Gestión de Cédulas Únicas';
  @Input() titleLine2 = 'de Registro de Usuario';

  /** Estado de selección */
  @Input() activeMain: MainSection = 'cedulas';
  @Input() activeSub: SubCedulas = 'mis';

  /** Mostrar/ocultar submenú de “Gestión de cédulas” */
  @Input() showCedulasSubmenu = true;

  /** Emite la navegación elegida */
  @Output() navigate = new EventEmitter<{ main: MainSection; sub?: SubCedulas }>();

  icons = {
    bars: faBars,
    chevronDown: faChevronDown,
  };

  goMain(main: MainSection) {
    this.navigate.emit({ main });
  }
  goSub(sub: SubCedulas) {
    this.navigate.emit({ main: 'cedulas', sub });
  }
}
