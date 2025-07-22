import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-primer-inicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './primer-inicio.html',
  styleUrls: ['./primer-inicio.scss']
})
export class PrimerInicioComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  mensaje = '';
  cuenta = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        nuevaPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmarPassword: ['', Validators.required]
      },
      { validators: this.passwordsMatch }
    );
    this.cuenta = this.usuarioService.getUsername();
  }

  ngAfterViewInit(): void {
    if (typeof (window as any).ocultarNavbar === 'function') {
      (window as any).ocultarNavbar();
    }
  }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const np = group.get('nuevaPassword')?.value;
    const cp = group.get('confirmarPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.mensaje = '';
    const nueva = this.form.get('nuevaPassword')!.value;
    this.usuarioService
      .cambiarPasswordPrimerInicioAsync(this.cuenta, nueva)
      .subscribe(
        ok => {
          if (ok) {
            this.mensaje = 'Contraseña actualizada correctamente. Redirigiendo...';
            setTimeout(() => this.router.navigate(['/login']), 2000);
          } else {
            this.mensaje = 'Hubo un error al cambiar la contraseña.';
          }
        },
        () => (this.mensaje = 'Error inesperado.')
      );
  }
}
