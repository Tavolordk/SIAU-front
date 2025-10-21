import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type CtaColor = 'vino' | 'oro' | 'secondary';
type CtaSize  = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-hero-cta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-cta.html',
  styleUrls: ['./hero-cta.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCtaComponent {
  /** Texto del botón */
  @Input() label = 'Nueva solicitud';
  /** Color (usa tus clases .btn-vino / .btn-oro) */
  @Input() color: CtaColor = 'vino';
  /** Tamaño Bootstrap */
  @Input() size: CtaSize = 'lg';
  /** Que el botón ocupe todo el ancho */
  @Input() fullWidth = true;
  /** Deshabilitar */
  @Input() disabled = false;

  /** Click del botón */
  @Output() clicked = new EventEmitter<void>();

  get btnClass(): string {
    switch (this.color) {
      case 'vino': return 'btn-vino';
      case 'oro': return 'btn-oro';
      default:    return 'btn-secondary';
    }
  }
  get sizeClass(): string {
    return this.size === 'lg'
      ? 'btn-lg'
      : this.size === 'sm'
      ? 'btn-sm'
      : ''; // md
  }

  onClick() {
    if (!this.disabled) this.clicked.emit();
  }
}
