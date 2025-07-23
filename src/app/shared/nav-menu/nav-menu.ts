import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UsuarioService }    from '../../services/usuario.service';
import { LoginResponse }     from '../../models/login-response.model';

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-menu.html',
  styleUrls: ['./nav-menu.scss']
})
export class NavMenuComponent implements OnInit {
  // Datos que aparecen en el botón y dropdown
  session = {
    nombreCompleto: '',
    rol: '',
    permiso: '',
    entidad: '',
    version: 'Version 0.1.0'
  };
  userName: string = '';
  menuOpen = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Carga perfil completo
    const profile: LoginResponse | null = this.usuarioService.getStoredProfile();
    if (profile) {
      this.session.nombreCompleto = profile.nombreCompleto;
      this.session.rol            = profile.rol;
      this.session.permiso        = profile.userId.toString();
      this.session.entidad        = profile.nombreEstado;
    }
    // Carga cuenta de usuario (username)
    this.userName = this.usuarioService.getUsername();
  }

  toggleUserMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    // Limpia tokens y perfil
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
