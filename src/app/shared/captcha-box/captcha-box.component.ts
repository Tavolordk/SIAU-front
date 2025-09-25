import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaptchaApi } from '../../core/captcha/captcha.api';

@Component({
  selector: 'app-captcha-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
template: `
  <div class="d-flex align-items-center gap-2">
    <img [src]="imgSrc" alt="captcha"
         class="captcha-img border rounded"
         width="180" height="60" />
    <button type="button" class="btn btn-light" (click)="refresh()" [disabled]="loading" title="Otro código">↻</button>
  </div>
  <input type="text"
         class="form-control mt-2"
         placeholder="Escribe el texto"
         [(ngModel)]="answer"
         (ngModelChange)="emit()"
         maxlength="5"
         autocapitalize="characters"
         autocomplete="off" />
  <small class="text-muted" *ngIf="ttl>0">expira en {{ttl}}s</small>
`,
styles: [`
  .captcha-img{
    width:100%;
    height:60px;
    object-fit:contain;
    background:#eee;
    display:block;
  }
`]
})
export class CaptchaBoxComponent implements OnInit, OnDestroy {
  @Output() changed = new EventEmitter<{ id?: string; answer: string }>();
  imgSrc = '';
  id?: string;
  answer = '';
  ttl = 0;
  private timer?: any;
  loading = false;

  constructor(private api: CaptchaApi) {}

  ngOnInit() { this.refresh(); }
  ngOnDestroy() { clearInterval(this.timer); }

  refresh() {
    this.loading = true;
    this.api.new$().subscribe({
      next: c => {
        this.id = c.id;
        this.imgSrc = `data:image/png;base64,${c.imageBase64}`; // ← importante el prefijo
        this.ttl = c.ttlSeconds ?? 120;
        this.answer = '';
        this.emit();
        clearInterval(this.timer);
        this.timer = setInterval(() => { if (this.ttl>0) this.ttl--; else this.refresh(); }, 1000);
      },
      error: _ => { this.imgSrc = ''; },
      complete: () => this.loading = false
    });
  }
emit() {
  this.changed.emit({
    id: this.id,
    answer: (this.answer ?? '').trim().toUpperCase()
  });
}
}
