import { Component, HostListener, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from "../shared/header-siau/header-siau";
import { SiauSidebarComponent } from "../shared/siau-sidebar/siau-sidebar";
import { SiauShellBusService } from './siau-shell-bus.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-siau-shell',
  templateUrl: './siau-shell.html',
  standalone: true,
  imports: [FontAwesomeModule, HeaderSiauComponent, SiauSidebarComponent, RouterOutlet, CommonModule],
  styleUrls: ['./siau-shell.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SiauShellComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private shellBus: SiauShellBusService
  ) {}

  ngOnInit(): void {
    // Estado inicial
    this.computeActive();

    // Recalcula activo/hasChild en cada navegación
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.computeActive());

    // Escucha peticiones de "toggle" desde páginas hijas
    this.shellBus._toggle$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.toggleSidebar());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // UI
  iconUser = faCircleUser;
  sidebarOpen = true;        // (si lo usas para otra lógica visual)
  dropdownOpen = false;
  usuarioNombre = 'Octavio Olea';
  usuarioRol = 'Administrador';

  // Selección activa para el sidebar
  activeMain: 'cedulas' | 'contrasena' = 'cedulas';
  activeSub:  'mis' | 'consultar' | null = null;   // 👈 antes 'mis'

  // Si hay hijo en router-outlet (true) o la portada de bienvenida (false)
  hasChild = false;

  /** Navegación proveniente del sidebar */
  onSidebarNavigate(ev: { main: 'cedulas'|'contrasena'; sub?: 'mis'|'consultar'|null; }) {
    if (ev.main === 'cedulas') {
      // Marca activo inmediatamente (negritas al instante)
      this.activeMain = 'cedulas';
      if (ev.sub === 'consultar') {
        this.activeSub = 'consultar';
        this.router.navigate(['/bienvenida', 'consulta-cedulas']);
      } else {
        this.activeSub = 'mis';
        this.router.navigate(['/bienvenida', 'mis-cedulas']);
      }
    } else {
      this.activeMain = 'contrasena';
      this.activeSub  = null;
      this.router.navigate(['/bienvenida', 'gestion-contrasena']); // cuando exista
    }
  }

  /** Determina qué item está activo y si mostrar Bienvenida o hijo */
  private computeActive() {
    const url = this.router.url;

    if (url.startsWith('/bienvenida/mis-cedulas')) {
      this.activeMain = 'cedulas';
      this.activeSub = 'mis';
      this.hasChild   = true;
      return;
    }

    if (url.startsWith('/bienvenida/consulta-cedulas')) {
      this.activeMain = 'cedulas';
      this.activeSub  = 'consultar';
      this.hasChild   = true;
      return;
    }

    if (url.startsWith('/bienvenida/gestion-contrasena')) { // 👈 nuevo
      this.activeMain = 'contrasena';
      this.activeSub  = null;
      this.hasChild   = true;
      return;
    }

    // Default: pantalla de bienvenida dentro del Shell
    this.activeMain = 'cedulas';
    this.activeSub  = null;
    this.hasChild   = false;
  }


  // Dropdown de usuario en el header
  @HostListener('document:click', ['$event'])
  onDocClick(evt: MouseEvent) {
    const target = evt.target as HTMLElement;
    const inDropdown = target.closest('.nav-user') || target.classList.contains('nav-user');
    if (!inDropdown) this.dropdownOpen = false;
  }

  // Si mantienes alguna animación/estado adicional del sidebar
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  onDropdownEnter() { this.dropdownOpen = true; }
  onDropdownLeave() { this.dropdownOpen = false; }
  onDropdownToggleClick(evt: Event) { evt.stopPropagation(); this.dropdownOpen = !this.dropdownOpen; }
}
