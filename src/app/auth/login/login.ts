// File: src/app/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { LoginResponse } from '../../models/login-response.model';
import { FooterComponent } from "../../footer/footer";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FooterComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  mensajeError: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      contrasena: ['', Validators.required]
    });
  }

  iniciarSesion(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.mensajeError = 'Usuario y contraseña son requeridos.';
      return;
    }

    const { usuario, contrasena } = this.loginForm.value;
    this.mensajeError = null;
    this.loading = true;

    this.usuarioService.loginAsync(usuario, contrasena).subscribe({
      next: (res: LoginResponse | null) => {
        this.loading = false;
        if (res?.token) {
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

  // Getters para el template si quieres mostrar errores puntuales
  get usuarioControl() {
    return this.loginForm.get('usuario');
  }
  get contrasenaControl() {
    return this.loginForm.get('contrasena');
  }
}
