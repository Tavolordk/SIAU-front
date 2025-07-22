// File: src/app/auth/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { LoginResponse } from '../../models/login-response.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  cuenta = '';
  password = '';
  mensajeError: string | null = null;
  loading = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  iniciarSesion(): void {
    if (!this.cuenta || !this.password) {
      this.mensajeError = 'Usuario y contraseña son requeridos.';
      return;
    }

    this.mensajeError = null;
    this.loading = true;

    this.usuarioService.loginAsync(this.cuenta, this.password).subscribe({
      next: (res: LoginResponse | null) => {
        this.loading = false;
        if (res && res.token) {
          // Guarda el token y demás datos en storage o servicio de auth
          localStorage.setItem('authToken', res.token);
          this.router.navigate(['/solicitudes']);
        } else {
          this.mensajeError = 'Usuario o contraseña incorrectos.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.mensajeError = err?.error?.message || 'Usuario o contraseña incorrectos.';
      }
    });
  }
}
