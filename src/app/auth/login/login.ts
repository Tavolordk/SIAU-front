import { Component }   from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import { AuthService }  from '../services/auth.service';

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
    private auth: AuthService,
    private router: Router
  ) {}

  iniciarSesion(): void {
    if (!this.cuenta || !this.password) {
      this.mensajeError = 'Usuario y contraseña son requeridos.';
      return;
    }

    this.mensajeError = null;
    this.loading = true;

    this.auth.login(this.cuenta, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/solicitudes']);
      },
      error: (err) => {
        this.loading = false;
        this.mensajeError = err?.error?.message || 'Usuario o contraseña incorrectos.';
      }
    });
  }
}
