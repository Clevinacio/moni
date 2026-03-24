import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  @Output() filtrarPeriodo = new EventEmitter<{ dataInicio: string; dataFim: string }>();
  @Output() filtrarMensal = new EventEmitter<{ mes: number; ano: number }>();
  @Output() limpar = new EventEmitter<void>();

  dataInicio: string = '';
  dataFim: string = '';
  mes: number | null = null;
  ano: number | null = null;

  aplicarPeriodo(): void {
    if (!this.dataInicio || !this.dataFim) {
      return;
    }

    this.filtrarPeriodo.emit({
      dataInicio: this.dataInicio,
      dataFim: this.dataFim,
    });
  }

  aplicarMensal(): void {
    if (this.mes === null || this.ano === null) {
      return;
    }

    this.filtrarMensal.emit({
      mes: this.mes,
      ano: this.ano,
    });
  }

  limparFiltros(): void {
    this.dataInicio = '';
    this.dataFim = '';
    this.mes = null;
    this.ano = null;
    this.limpar.emit();
  }
}
