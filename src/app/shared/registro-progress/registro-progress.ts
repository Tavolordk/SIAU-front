import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro-progress.html',
  styleUrls: ['./registro-progress.scss']
})
export class RegistroProgressComponent {
  /** Texto del título grande (por defecto “Registro”) */
  @Input() title = 'Registro';

  /** Paso actual y total (si los pasas, el componente calcula el % automáticamente) */
  @Input() currentStep?: number;
  @Input() totalSteps?: number;

  /**
   * Puedes sobreescribir el % si ya lo calculas en tu TS (como dijiste):
   * Ej: [percent]="progressPercent"
   */
  @Input() percent?: number;

  /** Color acento (guinda) */
  @Input() accent = '#7a1832';

  get progressPercent(): number {
    if (typeof this.percent === 'number') return Math.max(0, Math.min(100, this.percent));
    if (this.currentStep != null && this.totalSteps) {
      const p = (this.currentStep / this.totalSteps) * 100;
      return Math.max(0, Math.min(100, Math.round(p)));
    }
    return 0;
  }
}
