import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Transacao } from '../../../../models/transacao.models';

@Component({
  selector: 'app-lista-transacoes',
  imports: [DecimalPipe],
  templateUrl: './lista-transacoes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class ListaTransacoesComponent {
  @Input() transacoes: Transacao[] = [];
  @Input() carregando: boolean = false;
  @Input() idEmEdicao: string | null = null;
  @Output() editar = new EventEmitter<Transacao>();
  @Output() excluir = new EventEmitter<string>();

  editarItem(transacao: Transacao): void {
    this.editar.emit(transacao);
  }

  excluirItem(id: string): void {
    this.excluir.emit(id);
  }
}
