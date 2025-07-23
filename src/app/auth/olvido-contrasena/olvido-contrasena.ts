import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { MainLayoutComponent } from "../../shared/main-layout/main-layout";
@Component({
  selector: 'app-olvido-contrasena',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainLayoutComponent],
  templateUrl: './olvido-contrasena.html',
  styleUrls: ['./olvido-contrasena.scss']
})
export class OlvidoContrasenaComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  cargando = false;
  mensaje = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  ngAfterViewInit(): void {
    if (typeof (window as any).ocultarNavbar === 'function') {
      (window as any).ocultarNavbar();
    }
  }

  /** Envía solicitud de restablecimiento de contraseña */
  enviar(): void {
    if (this.form.invalid) return;
    this.cargando = true;
    this.mensaje = '';
    const correo = this.form.get('correo')!.value;
    this.usuarioService.olvidoPasswordAsync(correo).subscribe(success => {
      this.mensaje = success
        ? 'Se enviaron instrucciones a tu correo.'
        : 'No fue posible enviar el correo. Verifica la dirección.';
      this.cargando = false;
    }, () => {
      this.mensaje = 'Error al enviar la solicitud.';
      this.cargando = false;
    });
  }

  /** Navega al login */
  alternarModo(): void {
    this.router.navigate(['/login']);
  }
}