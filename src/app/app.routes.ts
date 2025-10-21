import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { RegistroStep1V2Component } from './pages/registro-step1-v2/registro-step1-v2';
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
import { GestionSolicitudes } from './solicitudes/solicitudes-enlace/gestion-solicitudes';
import { StepFormComponent } from './step-form/step-form';
import { SiauShellComponent } from './siau-shell/siau-shell';
import { RegistroStep2Component } from './pages/registro-step2-v2/registro-step2';
import { RegistroStep3Component } from './pages/registro-step3/registro-step3';
import { RegistroStep4Component } from './pages/registro-step4/registro-step4';
import { RegistroStep5Component } from './pages/registro-step5/registro-step5';
import { RegistroStep6Component } from './pages/registro-step6/registro-step6';
import { RegistroStep7Component } from './pages/registro-step7/registro-step7';
import { RegistroConfirmacionComponent } from './pages/registro-confirmacion/registro-confirmacion';
import { ConsultarCedulasComponent } from './pages/consultar-cedulas/consultar-cedulas';
import { PasswordSuccessComponent } from './pages/password-success/password-success';
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
import { SiauSidebarComponent } from './shared/siau-sidebar/siau-sidebar';

export const routes: Routes = [
  // RUTAS PÚBLICAS SIN LAYOUT
  { path: '',       redirectTo: 'login', pathMatch: 'full' },
          { path: 'login',  component: LoginComponent },
            { path: 'stepform',           component: StepFormComponent },
            {path:'bienvenida',component:SiauShellComponent},
            {path:'stepform-v2', component:RegistroStep1V2Component},
            {path:'stepform-v2-1',component:RegistroStep2Component},
            {path:'stepform-v2-3',component:RegistroStep3Component},
            {path:'stepform-v2-4',component:RegistroStep4Component},
            {path:'stepform-v2-5',component:RegistroStep5Component},
            {path:'stepform-v2-5.1',component:RegistroStep6Component},
            {path:'stepform-v2-6',component:RegistroStep7Component},
            {path:'stepform-v2-6.1',component:RegistroConfirmacionComponent},
            {path:'consulta-cedulas',component:ConsultarCedulasComponent},
            {path:'password-sucess',component:PasswordSuccessComponent},
            {path:'mis-cedulas',component:MisCedulasComponent},
            {path:'correo-1',component:SiauNotificacionComponent},
            {path:'correo-2',component:SiauCodigoVerificacionComponent},
            {path:'correo-3',component:SiauSolicitudNoAtendidaComponent},
            {path:'resultados-coincidencia',component:ResultadosCoincidenciaComponent},
            {path:'confirmacion-persona',component:ConfirmacionPersonaComponent},
            {path:'registro-enlace',component:RegistroCedulaComponent},
            {path:'cambio-contrasenia',component:GestionContrasenaComponent},
            {path:'cambio-contrasenia-2',component:NuevaContrasenaComponent},
            {path:'cambio-contrasenia-3',component:ConfirmacionContrasenaComponent},
            {path:'seleccion-requisitos',component:SeleccionRequerimientosComponent},
            {path:'comentarios',component:ComentariosComponent},
            {path:'siau-sidebar',component:SiauSidebarComponent},
  // RUTAS QUE USAN TU LAYOUT (header/fondo) PERO ALGUNAS SON PÚBLICAS
  {
    path: '',
    component: MainLayoutComponent, 
    children: [
      // Olvido-contraseña queda aquí, sin AuthGuard
      { path: 'olvido-contrasena', component: OlvidoContrasenaComponent },
  { path: 'restablecer-contrasena',  component: ResetContrasenaComponent },
  { path: 'cambiar-contrasena',      component: CambiarContrasenaComponent },
      // El resto sí requieren sesión
      { path: 'solicitudes',         component: SolicitudesComponent, canActivate: [AuthGuard] },
{
  path: 'usuario-enlace/gestion-de-solicitudes',
  component: GestionSolicitudes,
  canActivate: [AuthGuard]
},      { path: 'primer-inicio',           component: PrimerInicioComponent, canActivate:[AuthGuard] },
      { path: 'cargausuario',        component: CargaUsuarioComponent, canActivate: [AuthGuard] },
      { path: 'cargausuario/:indice',component: CargaUsuarioComponent, canActivate: [AuthGuard] },
      { path: 'cargamasiva',         component: CargaMasivaUsuariosComponent, canActivate: [AuthGuard] },
    ]
  },

  // Wildcard
  { path: '**', component: ErrorComponent }
];
