import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-primer-inicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './primer-inicio.html',
  styleUrls: ['./primer-inicio.scss']
})
export class PrimerInicioComponent implements OnInit {
  form!: FormGroup;
  mensaje = '';
  cuenta = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Inicializar formulario
    this.form = this.fb.group({
      nuevaPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmarPassword: ['', Validators.required]
    }, { validators: this.passwordsMatch });

    // Obtener cuenta del usuario autenticado
    this.cuenta = this.usuarioService.getUsername();
  }

  /** Valida que las contraseñas coincidan */
  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pwd = group.get('nuevaPassword')?.value;
    const confirm = group.get('confirmarPassword')?.value;
    return pwd === confirm ? null : { notMatching: true };
  }

  /** Maneja el envío del formulario */
  onSubmit(): void {
    if (this.form.invalid) return;
    const { nuevaPassword } = this.form.value;
    this.usuarioService.cambiarPasswordPrimerInicioAsync(this.cuenta, nuevaPassword)
      .subscribe(success => {
        if (success) {
          this.mensaje = 'Contraseña actualizada correctamente. Redirigiendo...';
          setTimeout(() => this.router.navigate(['/']), 2000);
        } else {
          this.mensaje = 'Hubo un error al cambiar la contraseña.';
        }
      }, () => {
        this.mensaje = 'Error inesperado.';
      });
  }
}
