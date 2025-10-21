import { Component, HostListener, ViewEncapsulation  } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { HeaderSiauComponent } from "../shared/header-siau/header-siau";
import { SiauSidebarComponent } from "../shared/siau-sidebar/siau-sidebar";
@Component({
  selector: 'app-siau-shell',
  templateUrl: './siau-shell.html',
    standalone: true,
      imports: [FontAwesomeModule, HeaderSiauComponent, SiauSidebarComponent],
  styleUrls: ['./siau-shell.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SiauShellComponent {
onSidebarNavigate($event: { main: "cedulas"|"contrasena"; sub?: "mis"|"consultar"|null; }) {
throw new Error('Method not implemented.');
}
  iconUser = faCircleUser; // <- icono FA para el template

  // Control del sidebar en responsive
  sidebarOpen = true;

  // Control del dropdown por hover/click
  dropdownOpen = false;
usuarioNombre: string='Juan Pérez';
usuarioRol: string='Capturista';

  // Cierra el dropdown si se hace click fuera
  @HostListener('document:click', ['$event'])
  onDocClick(evt: MouseEvent) {
    const target = evt.target as HTMLElement;
    const inDropdown = target.closest('.nav-user') || target.classList.contains('nav-user');
    if (!inDropdown) this.dropdownOpen = false;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // Abre/cierra por hover en desktop
  onDropdownEnter() { this.dropdownOpen = true; }
  onDropdownLeave() { this.dropdownOpen = false; }
  onDropdownToggleClick(evt: Event) {
    evt.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }
}
