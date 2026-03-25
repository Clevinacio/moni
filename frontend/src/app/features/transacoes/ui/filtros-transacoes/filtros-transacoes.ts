import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Categoria } from '../../../../models/transacao.models';

type TipoFiltroVisual = 'TODAS' | 'RECEITA' | 'DESPESA';

type FiltroConsolidadoTransacoes = {
  tipo: TipoFiltroVisual;
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
};

@Component({
  selector: 'app-filtros-transacoes',
  imports: [FormsModule],
  templateUrl: './filtros-transacoes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class FiltrosTransacoesComponent {
  @Input() carregando: boolean = false;
  @Input() categorias: Categoria[] = [];
  @Output() filtrar = new EventEmitter<FiltroConsolidadoTransacoes>();
  @Output() limpar = new EventEmitter<void>();

  tipo: TipoFiltroVisual = 'TODAS';
  dataInicio: string = '';
  dataFim: string = '';
  categoriaId: string = '';

  aplicarFiltros(): void {
    const categoriaId = this.categoriaSelecionada();
    const possuiPeriodoCompleto = this.dataInicio.length > 0 && this.dataFim.length > 0;
    const payload: FiltroConsolidadoTransacoes = {
      tipo: this.tipo,
      ...(categoriaId ? { categoriaId } : {}),
      ...(possuiPeriodoCompleto
        ? {
            dataInicio: this.dataInicio,
            dataFim: this.dataFim,
          }
        : {}),
    };

    this.filtrar.emit(payload);
  }

  limparFiltros(): void {
    this.tipo = 'TODAS';
    this.dataInicio = '';
    this.dataFim = '';
    this.categoriaId = '';
    this.limpar.emit();
  }

  categoriaSelecionada(): string | undefined {
    const categoriaId = this.categoriaId.trim();
    return categoriaId.length > 0 ? categoriaId : undefined;
  }

  get periodoIncompleto(): boolean {
    return Boolean(this.dataInicio) !== Boolean(this.dataFim);
  }

  get filtroInvalido(): boolean {
    return this.periodoIncompleto;
  }

  get possuiFiltroAplicavel(): boolean {
    return (
      this.tipo !== 'TODAS' ||
      this.dataInicio.length > 0 ||
      this.dataFim.length > 0 ||
      this.categoriaId.trim().length > 0
    );
  }

  get podeAplicar(): boolean {
    return !this.filtroInvalido && this.possuiFiltroAplicavel;
  }

  get podeLimpar(): boolean {
    return this.possuiFiltroAplicavel;
  }

  get mensagemPeriodoInvalido(): string {
    return 'Para filtrar por período, preencha data início e data fim.';
  }

  get ariaDescricaoPeriodo(): string {
    return this.periodoIncompleto ? 'aviso-periodo-incompleto' : '';
  }

  onAplicar(): void {
    if (!this.podeAplicar) {
      return;
    }

    this.aplicarFiltros();
  }
}
