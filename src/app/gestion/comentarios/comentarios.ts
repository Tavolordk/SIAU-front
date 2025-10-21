import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faUserCircle, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import { HeroCtaComponent } from "../../shared/hero-cta/hero-cta";
import { SiauSidebarComponent } from "../../shared/siau-sidebar/siau-sidebar";

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule, HeaderSiauComponent, FontAwesomeModule, HeroCtaComponent, SiauSidebarComponent],
  templateUrl: './comentarios.html',
  styleUrls: ['./comentarios.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComentariosComponent {
onSidebarNavigate($event: { main: "cedulas"|"contrasena"; sub?: "mis"|"consultar"|null; }) {
throw new Error('Method not implemented.');
}
  @Input() usuarioNombre = 'Juan Pérez';
  @Input() usuarioCuenta = 'U123456';

  icons = {
    bars: faBars,
    chevronDown: faChevronDown,
    user: faUserCircle,
    close: faTimes,
    plus: faPlus,
  };

  onNuevaSolicitud() {}
  onCerrarBitacora() {}
  onCancelar() {}
  onAgregar() {}
}
