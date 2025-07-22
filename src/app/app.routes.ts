// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { LoginComponent }            from './auth/login/login';
import { OlvidoContrasenaComponent } from './auth/olvido-contrasena/olvido-contrasena';
import { ResetContrasenaComponent }  from './auth/reset-contrasena/reset-contrasena';
import { CambiarContrasenaComponent }from './auth/cambiar-contrasena/cambiar-contrasena';
import { PrimerInicioComponent }     from './auth/primer-inicio/primer-inicio';
import { MainLayoutComponent }       from './shared/main-layout/main-layout';
import { SolicitudesComponent }      from './solicitudes/solicitudes/solicitudes';
import { CargaUsuarioComponent }     from './usuarios/carga-usuario/carga-usuario';
import { CargaMasivaUsuariosComponent } from './usuarios/carga-masiva-usuarios/carga-masiva-usuarios';
import { ErrorComponent }            from './shared/error/error';

export const routes: Routes = [
  // Publico (sin layout)
  { path: '',       component: LoginComponent },
  { path: 'login',  redirectTo: '', pathMatch: 'full' },
  { path: 'olvido-contrasena',      component: OlvidoContrasenaComponent },
  { path: 'restablecer-contrasena', component: ResetContrasenaComponent },
  { path: 'cambiar-contrasena',     component: CambiarContrasenaComponent },
  { path: 'primer-inicio',          component: PrimerInicioComponent },

  // Protegidas (con layout)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'solicitudes',         component: SolicitudesComponent },
      { path: 'cargausuario',        component: CargaUsuarioComponent },
      { path: 'cargausuario/:indice',component: CargaUsuarioComponent },
      { path: 'cargamasiva',         component: CargaMasivaUsuariosComponent },
    ]
  },

  // Wildcard
  { path: '**', component: ErrorComponent },
];
