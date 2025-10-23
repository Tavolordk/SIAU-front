import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrls: ['./pagination.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent<T> implements OnChanges {
  /** Arreglo completo a paginar */
  @Input() items: T[] = [];

  /** Tamaño de página (por defecto 10) */
  @Input() pageSize = 10;
  @Input() hideOnSinglePage = true;  // <— NUEVO

  /** Página actual (1-based) */
  @Input() currentPage = 1;

  /** Emite la página actual cuando cambia */
  @Output() pageChange = new EventEmitter<number>();

  /** Emite el slice (elementos visibles) cuando cambia la página o el arreglo */
  @Output() pageItemsChange = new EventEmitter<T[]>();

  /** Emite índices de corte por si prefieres slice manual en el padre */
  @Output() indexChange = new EventEmitter<{ start: number; end: number }>();

  totalPages = 1;
  pages: number[] = [];
  pageItems: T[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }

  private update(): void {
    const total = this.items?.length ?? 0;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    this.currentPage = this.clamp(this.currentPage, 1, this.totalPages);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, total);

    this.pageItems = (this.items ?? []).slice(start, end);

    this.indexChange.emit({ start, end });
    this.pageItemsChange.emit(this.pageItems);
    this.pageChange.emit(this.currentPage);
  }

  setPage(p: number): void {
    if (p === this.currentPage || p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.update();
  }

  prev(): void { this.setPage(this.currentPage - 1); }
  next(): void { this.setPage(this.currentPage + 1); }

  trackByIndex = (i: number) => i;

  private clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v || 1));
  }
}
