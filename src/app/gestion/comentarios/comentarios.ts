import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderSiauComponent } from '../../shared/header-siau/header-siau';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faUserCircle, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import { HeroCtaComponent } from '../../shared/hero-cta/hero-cta';
import { SiauSidebarComponent } from '../../shared/siau-sidebar/siau-sidebar';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AdminCedulaDetalleService } from '../../services/admin-cedula-detalle.service';
import { CedulaAgregarComentarioService } from '../../services/cedula-agregar-comentario.service';

type ComentarioItem = {
  rol: string;
  autor: string;
  fecha: string;   // "YYYY-MM-DD HH:mm:ss"
  texto: string;
  cuenta: string;
};

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [
    CommonModule,
    HeaderSiauComponent,
    FontAwesomeModule,
    HeroCtaComponent,
    SiauSidebarComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './comentarios.html',
  styleUrls: ['./comentarios.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComentariosComponent implements OnInit {
  // Encabezado (respetando tu estilo)
  @Input() usuarioNombre = localStorage.getItem('nombre') ?? 'Octavio Olea';
  @Input() usuarioCuenta = localStorage.getItem('cuenta_codigo') ?? 'U123456';
  @Input() usuarioRol    = localStorage.getItem('tipo_usuario') ?? 'ADMINISTRADOR';

  icons = { bars: faBars, chevronDown: faChevronDown, user: faUserCircle, close: faTimes, plus: faPlus };

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private detalleApi = inject(AdminCedulaDetalleService);
  private agregarApi = inject(CedulaAgregarComentarioService);

  // Estado
  folio: string | null = null;
  loading = false;
  error: string | null = null;

  // Datos
  comentarios: ComentarioItem[] = [];

  // Form para el input (mismo control visual)
  form = this.fb.group({
    texto: ['', [Validators.required, Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.folio = this.route.snapshot.queryParamMap.get('folio');
    if (this.folio) this.cargar(this.folio);
    else this.error = 'Folio no proporcionado.';
  }

  // Sidebar (sin tocar estilos)
  onSidebarNavigate(ev: { main: 'cedulas' | 'contrasena'; sub?: 'mis' | 'consultar' | null }) {
    if (ev.main === 'cedulas' && ev.sub === 'mis')      this.router.navigate(['/bienvenida/mis-cedulas']);
    if (ev.main === 'cedulas' && ev.sub === 'consultar')this.router.navigate(['/bienvenida/consultar-cedula']);
    if (ev.main === 'contrasena')                       this.router.navigate(['/bienvenida/gestion-contrasena']);
  }

  // Acciones de UI (respetando tus botones)
  onNuevaSolicitud() { this.router.navigate(['/registro-enlace']); }
  onCerrarBitacora() { this.router.navigate(['/bienvenida/mis-cedulas']); }
  onCancelar()       { this.router.navigate(['/bienvenida/mis-cedulas']); }

  onAgregar() {
    if (!this.folio) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const texto = this.form.value.texto!.trim();
    if (!texto) return;

    this.loading = true;
    this.error = null;

    this.agregarApi.agregar({
      folio: this.folio,
      autor_nombre: this.usuarioNombre,
      rol: this.usuarioRol,
      cuenta_autor: this.usuarioCuenta,
      texto,
      nuevo_estatus: null, // la UI mantiene el estilo anterior, sin selector de estatus
    })
    .subscribe({
      next: (resp) => {
        this.comentarios = resp.comentarios as ComentarioItem[];
        this.form.reset({ texto: '' });
      },
      error: (e) => this.error = e?.message ?? 'No se pudo agregar el comentario',
      complete: () => this.loading = false,
    });
  }

  private cargar(folio: string) {
    this.loading = true;
    this.error = null;
    this.detalleApi.porFolio(folio).subscribe({
      next: (d) => this.comentarios = (d.comentarios ?? []) as ComentarioItem[],
      error: (e) => { this.error = e?.message ?? 'Error al cargar comentarios'; this.comentarios = []; },
      complete: () => this.loading = false,
    });
  }

  // Helper para la fecha, sin tocar estilos
  formatFecha(f: string): string {
    if (!f) return '---';
    const [d, t] = f.split(' ');
    if (!d || !t) return f;
    const [Y, M, D] = d.split('-');
    return `${D}/${M}/${Y} - ${t.slice(0,5)}`;
  }
}
