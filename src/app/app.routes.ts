import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';

import { LoginComponent }            from './auth/login/login';
import { PrimerInicioComponent }     from './auth/primer-inicio/primer-inicio';
import { ResetContrasenaComponent }  from './auth/reset-contrasena/reset-contrasena';
import { CambiarContrasenaComponent }from './auth/cambiar-contrasena/cambiar-contrasena';
import { OlvidoContrasenaComponent } from './auth/olvido-contrasena/olvido-contrasena';

import { MainLayoutComponent }       from './shared/main-layout/main-layout';
import { SolicitudesComponent }      from './solicitudes/solicitudes/solicitudes';
import { CargaUsuarioComponent }     from './usuarios/carga-usuario/carga-usuario';
import { CargaMasivaUsuariosComponent } from './usuarios/carga-masiva-usuarios/carga-masiva-usuarios';
import { ErrorComponent }            from './shared/error/error';

export const routes: Routes = [
  // RUTAS PÚBLICAS SIN LAYOUT
  { path: '',       redirectTo: 'login', pathMatch: 'full' },
  // RUTAS QUE USAN TU LAYOUT (header/fondo) PERO ALGUNAS SON PÚBLICAS
  {
    path: '',
    component: MainLayoutComponent, 
    children: [
      // Olvido-contraseña queda aquí, sin AuthGuard
        { path: 'login',  component: LoginComponent },
      { path: 'olvido-contrasena', component: OlvidoContrasenaComponent },
  { path: 'restablecer-contrasena',  component: ResetContrasenaComponent },
  { path: 'cambiar-contrasena',      component: CambiarContrasenaComponent },
      // El resto sí requieren sesión
      { path: 'solicitudes',         component: SolicitudesComponent, canActivate: [AuthGuard] },
      { path: 'primer-inicio',           component: PrimerInicioComponent, canActivate:[AuthGuard] },
      { path: 'cargausuario',        component: CargaUsuarioComponent, canActivate: [AuthGuard] },
      { path: 'cargausuario/:indice',component: CargaUsuarioComponent, canActivate: [AuthGuard] },
      { path: 'cargamasiva',         component: CargaMasivaUsuariosComponent, canActivate: [AuthGuard] },
    ]
  },

  // Wildcard
  { path: '**', component: ErrorComponent }
];
