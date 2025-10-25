import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { LoginService } from '../../services/login.service';
import { LoginRequest } from '../../models/login-request.model';
import { LoginResponse } from '../../models/login-response.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(LoginService);
  private router = inject(Router);

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  hidePassword = true;
  loading = false;
  mensajeError: string | null = null;

  loginForm = this.fb.group({
    usuario: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  ngOnInit(): void {}

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  iniciarSesion(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.mensajeError = 'Usuario y contraseña son requeridos.';
      return;
    }

    const { usuario, contrasena } = this.loginForm.getRawValue();
    const payload: LoginRequest = {
      Usuario: String(usuario ?? ''),
      Contrasena: String(contrasena ?? '')
    };

    this.loading = true;
    this.mensajeError = null;

    this.api.login(payload).subscribe({
      next: (res: LoginResponse) => {
        this.loading = false;

        // ✅ criterio correcto con el nuevo backend
        if (res?.success === 1) {
          // Guarda lo que necesites para el resto de la sesión:
          localStorage.setItem('user_id', String(res.user_id ?? ''));
          localStorage.setItem('rol_id', String(res.fk_cat_tp_usuarios ?? ''));
          // Si algún día el backend regresa 'code' como token, guárdalo aquí.
          // if (res.code) localStorage.setItem('authToken', res.code);

          this.router.navigate(['/bienvenida']);
        } else {
          this.mensajeError = res?.message ?? 'Usuario o contraseña incorrectos.';
        }
      },
      error: (e: any) => {
        this.loading = false;
        this.mensajeError = e?.message ?? 'No se pudo iniciar sesión.';
      }
    });
  }

  // Getters útiles en el template
  get usuarioCtrl() { return this.loginForm.get('usuario'); }
  get contrasenaCtrl() { return this.loginForm.get('contrasena'); }
}
