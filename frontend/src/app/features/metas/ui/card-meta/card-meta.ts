import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { Meta } from '../../../../models/meta.models';

@Component({
  selector: 'app-card-meta',
  imports: [CurrencyPipe],
  templateUrl: './card-meta.html',
  styleUrl: './card-meta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMeta {
  @Input({ required: true }) meta!: Meta;
  @Output() editar = new EventEmitter<string>();
  @Output() excluir = new EventEmitter<string>();

  percentual(): number {
    if (!this.meta || this.meta.valorAlvo <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((this.meta.valorPoupado / this.meta.valorAlvo) * 100)));
  }

  onEditar(): void {
    this.editar.emit(this.meta.id);
  }

  onExcluir(): void {
    this.excluir.emit(this.meta.id);
  }
}
