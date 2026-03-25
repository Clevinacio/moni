import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  BriefcaseBusiness,
  CarFront,
  CircleDollarSign,
  Coffee,
  Film,
  LucideAngularModule,
  Pencil,
  ShoppingCart,
  Trash2,
  Tv,
  Zap,
} from 'lucide-angular';

import { Transacao } from '../../../../models/transacao.models';

type GrupoDataTransacao = Readonly<{
  chaveData: string;
  rotulo: string;
  transacoes: readonly Transacao[];
}>;

@Component({
  selector: 'app-lista-transacoes',
  imports: [DecimalPipe, LucideAngularModule],
  templateUrl: './lista-transacoes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class ListaTransacoesComponent implements OnChanges {
  private readonly formatadorData = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  @Input() transacoes: Transacao[] = [];
  @Input() carregando: boolean = false;
  @Input() idEmEdicao: string | null = null;
  @Output() editar = new EventEmitter<Transacao>();
  @Output() excluir = new EventEmitter<string>();

  paginaAtual = 1;
  readonly itensPorPagina = 8;

  readonly iconeReceita = BriefcaseBusiness;
  readonly iconeMercado = ShoppingCart;
  readonly iconeCafe = Coffee;
  readonly iconeStreaming = Tv;
  readonly iconeTransporte = CarFront;
  readonly iconeConta = Zap;
  readonly iconeLazer = Film;
  readonly iconePadrao = CircleDollarSign;
  readonly iconeEditar = Pencil;
  readonly iconeExcluir = Trash2;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['transacoes']) {
      return;
    }

    const totalPaginas = this.obterTotalPaginas();

    if (this.paginaAtual > totalPaginas) {
      this.paginaAtual = totalPaginas;
      return;
    }

    this.paginaAtual = 1;
  }

  obterTransacoesPaginadas(): Transacao[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.transacoes.slice(inicio, inicio + this.itensPorPagina);
  }

  obterTotalPaginas(): number {
    return Math.max(1, Math.ceil(this.transacoes.length / this.itensPorPagina));
  }

  obterPaginasVisiveis(): number[] {
    const total = this.obterTotalPaginas();
    const paginas = Array.from({ length: total }, (_, indice) => indice + 1);

    if (total <= 5) {
      return paginas;
    }

    if (this.paginaAtual <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (this.paginaAtual >= total - 2) {
      return [total - 4, total - 3, total - 2, total - 1, total];
    }

    return [
      this.paginaAtual - 2,
      this.paginaAtual - 1,
      this.paginaAtual,
      this.paginaAtual + 1,
      this.paginaAtual + 2,
    ];
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.obterTotalPaginas()) {
      return;
    }

    this.paginaAtual = pagina;
  }

  paginaAnterior(): void {
    this.irParaPagina(this.paginaAtual - 1);
  }

  proximaPagina(): void {
    this.irParaPagina(this.paginaAtual + 1);
  }

  obterGrupos(): readonly GrupoDataTransacao[] {
    const mapa = new Map<string, Transacao[]>();

    for (const transacao of this.transacoes) {
      const dataChave = transacao.data;
      const listaAtual = mapa.get(dataChave) ?? [];
      listaAtual.push(transacao);
      mapa.set(dataChave, listaAtual);
    }

    return [...mapa.entries()]
      .sort(([dataA], [dataB]) => this.normalizarData(dataB).getTime() - this.normalizarData(dataA).getTime())
      .map(([chaveData, lista]) => ({
        chaveData,
        rotulo: this.obterRotuloData(chaveData),
        transacoes: [...lista].sort((a, b) => b.descricao.localeCompare(a.descricao, 'pt-BR')),
      }));
  }

  obterIconeTransacao(transacao: Transacao) {
    if (transacao.tipo === 'RECEITA') {
      return this.iconeReceita;
    }

    const contexto = `${transacao.descricao} ${transacao.categoria}`.toLowerCase();

    if (contexto.includes('mercado') || contexto.includes('grocer')) {
      return this.iconeMercado;
    }

    if (contexto.includes('cafe')) {
      return this.iconeCafe;
    }

    if (contexto.includes('netflix') || contexto.includes('stream') || contexto.includes('entret')) {
      return this.iconeStreaming;
    }

    if (contexto.includes('uber') || contexto.includes('transporte') || contexto.includes('trip')) {
      return this.iconeTransporte;
    }

    if (contexto.includes('luz') || contexto.includes('energia') || contexto.includes('conta')) {
      return this.iconeConta;
    }

    if (contexto.includes('cinema') || contexto.includes('lazer')) {
      return this.iconeLazer;
    }

    return this.iconePadrao;
  }

  obterCategoriaVisivel(categoria: string): string {
    return categoria.trim() || 'Outros';
  }

  formatarData(dataIso: string): string {
    return this.formatadorData.format(this.normalizarData(dataIso));
  }

  editarItem(transacao: Transacao): void {
    this.editar.emit(transacao);
  }

  excluirItem(id: string): void {
    this.excluir.emit(id);
  }

  private obterRotuloData(dataIso: string): string {
    const dataReferencia = this.normalizarData(dataIso);
    const hoje = this.zerarHora(new Date());
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    if (dataReferencia.getTime() === hoje.getTime()) {
      return 'Hoje';
    }

    if (dataReferencia.getTime() === ontem.getTime()) {
      return 'Ontem';
    }

    return this.formatadorData.format(dataReferencia);
  }

  private normalizarData(dataIso: string): Date {
    const [ano, mes, dia] = dataIso.split('-').map((parte) => Number(parte));

    if (!ano || !mes || !dia) {
      return this.zerarHora(new Date(dataIso));
    }

    return this.zerarHora(new Date(ano, mes - 1, dia));
  }

  private zerarHora(data: Date): Date {
    const dataSemHora = new Date(data);
    dataSemHora.setHours(0, 0, 0, 0);
    return dataSemHora;
  }
}
