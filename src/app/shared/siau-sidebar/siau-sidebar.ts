import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { SiauShellBusService } from '../../siau-shell/siau-shell-bus.service';

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
export class SiauSidebarComponent implements OnInit, OnDestroy {
    // @Inputs como ya los tienes...
  @Output() navigate = new EventEmitter<{ main: MainSection; sub?: SubCedulas }>();
  // ...

  // Nuevo: marcar activo localmente ANTES de navegar
  selectMain(main: MainSection) {
    this.activeMain = main;
    this.activeSub  = null;
    this.navigate.emit({ main });
  }

  selectSub(sub: SubCedulas) {
    this.activeMain = 'cedulas';
    this.activeSub  = sub;
    this.navigate.emit({ main: 'cedulas', sub });
  }
  /** Posición fija y separación desde el header */
  @Input() fixed = true;
  @Input() top = 110; // px

  /** Título (dos líneas) */
  @Input() titleLine1 = 'Gestión de Cédulas Únicas';
  @Input() titleLine2 = 'de Registro de Usuario';

  /** Estado de selección */
  @Input() activeMain: MainSection = 'cedulas';
  @Input() activeSub: SubCedulas = null;

  /** Submenú de cédulas desplegado (cuando no está colapsado el sidebar) */
  @Input() showCedulasSubmenu = true;

  /** Emite la navegación elegida */

  /** Estado visual: colapsado = queda sólo el botón hamburguesa */
  collapsed = false;

  /** Manejo de eventos externos (si alguna vista quiere pedir toggle) */
  private sub?: Subscription;

  icons = { bars: faBars, chevronDown: faChevronDown };

  constructor(private bus: SiauShellBusService) {}

  ngOnInit(): void {
    // si alguna vista dispara "requestToggle()", aquí lo atendemos
    this.sub = this.bus.onRequestToggle().subscribe(() => this.toggleCollapsed());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Abre/cierra el modo colapsado */
  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      // cuando se colapsa, escondemos submenú (se volverá a abrir al expandir)
      this.showCedulasSubmenu = false;
    }
  }

  /** Alterna solo el submenú de “Gestión de cédulas” (si no está colapsado) */
  toggleCedulasSubmenu() {
    if (this.collapsed) return;
    this.showCedulasSubmenu = !this.showCedulasSubmenu;
  }

  goMain(main: MainSection) {
    this.navigate.emit({ main });
  }

  goSub(sub: SubCedulas) {
    this.navigate.emit({ main: 'cedulas', sub });
  }
}
