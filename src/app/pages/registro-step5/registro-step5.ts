import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { RegistroProgressComponent } from "../../shared/registro-progress/registro-progress";

@Component({
  selector: 'app-registro-step5',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HeaderSiauComponent, RegistroProgressComponent],
  templateUrl: './registro-step5.html',
  styleUrls: ['./registro-step5.scss']
})
export class RegistroStep5Component {
  // Header (demo)
  usuarioNombre = 'Luis Vargas';
  usuarioRol = 'Capturista';

  // Paso / progreso
  totalSteps = 6;
  currentStep = 5;
  get progressPercent() { return Math.round((this.currentStep / this.totalSteps) * 100); }

  // Icons
  icMail = faEnvelope;
  icTelegram = faTelegramPlane;

  // Handlers
  onSelect(channel: 'email' | 'telegram') {
    // TODO: Aquí disparas la petición para enviar código por el canal elegido
    console.log('Enviar código por:', channel);
    // p.ej. this.service.sendCode(channel).subscribe(...)
    // y después router.navigate(['/registro/step5/codigo'])
  }
}
