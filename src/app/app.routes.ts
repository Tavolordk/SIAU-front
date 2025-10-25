import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { LoginComponent } from './auth/login/login';
import { PrimerInicioComponent } from './auth/primer-inicio/primer-inicio';
import { ResetContrasenaComponent } from './auth/reset-contrasena/reset-contrasena';
import { CambiarContrasenaComponent } from './auth/cambiar-contrasena/cambiar-contrasena';
import { OlvidoContrasenaComponent } from './auth/olvido-contrasena/olvido-contrasena';

import { MainLayoutComponent } from './shared/main-layout/main-layout';
import { SolicitudesComponent } from './solicitudes/solicitudes/solicitudes';
import { CargaUsuarioComponent } from './usuarios/carga-usuario/carga-usuario';
import { CargaMasivaUsuariosComponent } from './usuarios/carga-masiva-usuarios/carga-masiva-usuarios';
import { ErrorComponent } from './shared/error/error';
import { GestionSolicitudes } from './solicitudes/solicitudes-enlace/gestion-solicitudes';
import { StepFormComponent } from './step-form/step-form';

import { SiauShellComponent } from './siau-shell/siau-shell';
import { ConsultarCedulasComponent } from './pages/consultar-cedulas/consultar-cedulas';
import { MisCedulasComponent } from './pages/mis-cedulas/mis-cedulas';

import { SiauNotificacionComponent } from './features/siau-notificacion/siau-notificacion';
import { SiauCodigoVerificacionComponent } from './features/siau-codigo-verificacion/siau-codigo-verificacion';
import { SiauSolicitudNoAtendidaComponent } from './features/siau-solicitud-no-atendida/siau-solicitud-no-atendida';
import { ResultadosCoincidenciaComponent } from './features/resultados-coincidencia/resultados-coincidencia';
import { ConfirmacionPersonaComponent } from './features/confirmacion-persona/confirmacion-persona';
import { RegistroCedulaComponent } from './features/registro-cedula/registro-cedula';
import { GestionContrasenaComponent } from './features/gestion-contrasena/gestion-contrasena';
import { NuevaContrasenaComponent } from './features/cambio-contrasena/nueva-contrasena/nueva-contrasena';
import { ConfirmacionContrasenaComponent } from './features/cambio-contrasena/confirmacion/confirmacion';
import { SeleccionRequerimientosComponent } from './features/seleccion-requerimientos/seleccion-requerimientos';
import { ComentariosComponent } from './gestion/comentarios/comentarios';
import { GestionContrasenaFlowComponent } from './features/gestion-contrasena/gestion-contrasena-flow';

export const routes: Routes = [
  // Públicas sin layout
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // 🔹 SHELL con Bienvenida integrada Y rutas hijas
  {
    path: 'bienvenida',
    component: SiauShellComponent,
    children: [
      // Hijas que se renderizan dentro del <router-outlet> del Shell
      { path: 'mis-cedulas', component: MisCedulasComponent /*, canActivate:[AuthGuard]*/ },
      { path: 'consulta-cedulas', component: ConsultarCedulasComponent /*, canActivate:[AuthGuard]*/ },
      {
        path: 'gestion-contrasena',
        component: GestionContrasenaFlowComponent   // 👈 NUEVO CONTENEDOR
      },

      // (No pongas componente en path:'' para no “fragmentar” la bienvenida;
      // el propio Shell muestra la bienvenida cuando no hay hijo activo)
    ]
  },

  // ✅ Redirecciones (opcional) para no romper accesos directos antiguos
  { path: 'mis-cedulas', redirectTo: 'bienvenida/mis-cedulas', pathMatch: 'full' },
  { path: 'consulta-cedulas', redirectTo: 'bienvenida/consulta-cedulas', pathMatch: 'full' },

  // Rutas sueltas que ya tenías
  { path: 'stepform', component: StepFormComponent },

  { path: 'correo-1', component: SiauNotificacionComponent },
  { path: 'correo-2', component: SiauCodigoVerificacionComponent },
  { path: 'correo-3', component: SiauSolicitudNoAtendidaComponent },

  { path: 'resultados-coincidencia', component: ResultadosCoincidenciaComponent },
  { path: 'confirmacion-persona', component: ConfirmacionPersonaComponent },
  { path: 'registro-enlace', component: RegistroCedulaComponent },
  { path: 'cambio-contrasenia', component: GestionContrasenaComponent },
  { path: 'cambio-contrasenia-2', component: NuevaContrasenaComponent },
  { path: 'cambio-contrasenia-3', component: ConfirmacionContrasenaComponent },
  { path: 'seleccion-requisitos', component: SeleccionRequerimientosComponent },
  { path: 'comentarios', component: ComentariosComponent },

  // Layout principal con guardas (como lo tenías)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'olvido-contrasena', component: OlvidoContrasenaComponent },
      { path: 'restablecer-contrasena', component: ResetContrasenaComponent },
      { path: 'cambiar-contrasena', component: CambiarContrasenaComponent },

      { path: 'solicitudes', component: SolicitudesComponent, canActivate: [AuthGuard] },
      { path: 'usuario-enlace/gestion-de-solicitudes', component: GestionSolicitudes, canActivate: [AuthGuard] },
      { path: 'primer-inicio', component: PrimerInicioComponent, canActivate: [AuthGuard] },
      { path: 'cargausuario', component: CargaUsuarioComponent, canActivate: [AuthGuard] },
      { path: 'cargausuario/:indice', component: CargaUsuarioComponent, canActivate: [AuthGuard] },
      { path: 'cargamasiva', component: CargaMasivaUsuariosComponent, canActivate: [AuthGuard] },
    ]
  },

  // Wildcard
  { path: '**', component: ErrorComponent }
];
