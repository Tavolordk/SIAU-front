import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login';
import { OlvidoContrasenaComponent } from './auth/olvido-contrasena/olvido-contrasena';
import { ResetContrasenaComponent } from './auth/reset-contrasena/reset-contrasena';
import { CambiarContrasenaComponent } from './auth/cambiar-contrasena/cambiar-contrasena';
import { PrimerInicioComponent } from './auth/primer-inicio/primer-inicio';
import { MainLayoutComponent } from './shared/main-layout/main-layout';
import { SolicitudesComponent } from './solicitudes/solicitudes/solicitudes';
import { CargaUsuarioComponent } from './usuarios/carga-usuario/carga-usuario';
import { CargaMasivaUsuariosComponent } from './usuarios/carga-masiva-usuarios/carga-masiva-usuarios';
import { ErrorComponent } from './shared/error/error';

/**
 * Enrutamiento de la aplicación
 * Rutas públicas (sin layout) y protegidas (con layout + guard)
 */
export const routes: Routes = [
  // Rutas públicas
  { path: '',               redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',          component: LoginComponent },
  { path: 'olvido-contrasena', component: OlvidoContrasenaComponent },
  { path: 'restablecer-contrasena', component: ResetContrasenaComponent },
  { path: 'cambiar-contrasena',     component: CambiarContrasenaComponent },

  // Rutas protegidas con layout principal y AuthGuard
  {
    path: '',
    component: MainLayoutComponent,
    // canActivate: [AuthGuard], // <-- agregar guard si se requiere
    children: [
      // Primer inicio de sesión (requiere estar autenticado)
      { path: 'primer-inicio', component: PrimerInicioComponent },

      // Módulos internos
      { path: 'solicitudes',          component: SolicitudesComponent },
      { path: 'cargausuario',         component: CargaUsuarioComponent },
      { path: 'cargausuario/:indice', component: CargaUsuarioComponent },
      { path: 'cargamasiva',          component: CargaMasivaUsuariosComponent },
    ]
  },

  // Ruta comodín para errores 404
  { path: '**', component: ErrorComponent },
];
