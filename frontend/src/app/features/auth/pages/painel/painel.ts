import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { Meta } from '../../../../models/meta.models';
import { Transacao } from '../../../../models/transacao.models';
import { extrairMensagemErroTransacao } from '../../../../shared/utils/mensagem-erro-transacao';
import { ServicoMetas } from '../../../metas/service/servico-metas';
import { ServicoTransacoes } from '../../../transacoes/service/servico-transacoes';

type CategoriaResumo = Readonly<{
  categoria: string;
  valor: number;
  percentual: number;
  cor: string;
}>;

type MetaPainel = Readonly<{
  titulo: string;
  descricao: string;
  percentual: number;
  valorAtual: number;
  valorObjetivo: number;
  corBarra: string;
}>;

type ContaPendente = Readonly<{
  titulo: string;
  vencimento: string;
  valor: number;
}>;

@Component({
  selector: 'app-painel',
  templateUrl: './painel.html',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class PaginaPainel {
  private readonly servicoTransacoes = inject(ServicoTransacoes);
  private readonly servicoMetas = inject(ServicoMetas);
  private readonly formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  private readonly coresCategorias = ['#355872', '#7aaace', '#4a7c59', '#cfd5c8'];

  readonly carregandoResumo = signal(false);
  readonly mensagemErroResumo = signal<string | null>(null);
  readonly transacoes = signal<readonly Transacao[]>([]);
  readonly metas = signal<readonly Meta[]>([]);

  readonly contasPendentesMock = [
    {
      titulo: 'Internet Fibra',
      vencimento: 'Vence em 2 dias',
      valor: 149.9,
    },
    {
      titulo: 'Conta de Luz',
      vencimento: 'Vence em 5 dias',
      valor: 324.15,
    },
    {
      titulo: 'Cartão de Crédito',
      vencimento: 'Vence em 6 dias',
      valor: 2450,
    },
  ] as const satisfies readonly ContaPendente[];

  readonly resumoFinanceiro = computed(() => {
    const totais = this.transacoes().reduce(
      (acumulador, transacao) => {
        if (transacao.tipo === 'RECEITA') {
          acumulador.receitas += transacao.valor;
          return acumulador;
        }

        acumulador.despesas += transacao.valor;
        return acumulador;
      },
      {
        receitas: 0,
        despesas: 0,
      },
    );

    return {
      receitas: totais.receitas,
      despesas: totais.despesas,
      saldo: totais.receitas - totais.despesas,
    };
  });

  readonly totalEntradas = computed(() =>
    this.transacoes()
      .filter((transacao) => transacao.tipo === 'RECEITA')
      .reduce((acumulador, transacao) => acumulador + transacao.valor, 0),
  );

  readonly totalDespesas = computed(() =>
    this.transacoes()
      .filter((transacao) => transacao.tipo === 'DESPESA')
      .reduce((acumulador, transacao) => acumulador + transacao.valor, 0),
  );

  readonly totalReceitasDirecionadas = computed(() =>
    this.transacoes()
      .filter((transacao) => transacao.tipo === 'RECEITA' && Boolean(transacao.metaId))
      .reduce((acumulador, transacao) => acumulador + transacao.valor, 0),
  );

  readonly saldoDisponivel = computed(
    () => this.totalEntradas() - (this.totalDespesas() + this.totalReceitasDirecionadas()),
  );

  readonly totalEconomias = computed(() =>
    this.metas().reduce((acumulador, meta) => acumulador + meta.valorPoupado, 0),
  );

  readonly patrimonioTotal = computed(() => this.saldoDisponivel() + this.totalEconomias());

  readonly metasPainel = computed(
    () =>
      this.metas().map((meta, indice) => {
        const percentual =
          meta.valorAlvo > 0
            ? Math.max(0, Math.min(100, Math.round((meta.valorPoupado / meta.valorAlvo) * 100)))
            : 0;

        return {
          titulo: meta.nome,
          descricao: `${this.formatarMoeda(meta.valorPoupado)} de ${this.formatarMoeda(meta.valorAlvo)}`,
          percentual,
          valorAtual: meta.valorPoupado,
          valorObjetivo: meta.valorAlvo,
          corBarra: indice % 2 === 0 ? 'bg-brand-dark' : 'bg-success',
        } satisfies MetaPainel;
      }) satisfies readonly MetaPainel[],
  );

  readonly categoriasDespesas = computed(() => {
    const mapaCategorias = new Map<string, number>();

    for (const transacao of this.transacoes()) {
      if (transacao.tipo !== 'DESPESA') {
        continue;
      }

      const categoria = transacao.categoria.trim() || 'Outros';
      mapaCategorias.set(categoria, (mapaCategorias.get(categoria) ?? 0) + transacao.valor);
    }

    const listaOrdenada = [...mapaCategorias.entries()]
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 4);

    const total = listaOrdenada.reduce((acumulador, item) => acumulador + item.valor, 0);

    return listaOrdenada.map((item, indice) => ({
      categoria: item.categoria,
      valor: item.valor,
      percentual: total > 0 ? Math.round((item.valor / total) * 100) : 0,
      cor: this.coresCategorias[indice] ?? '#cfd5c8',
    })) satisfies readonly CategoriaResumo[];
  });

  readonly graficoDonutBackground = computed(() => {
    const categorias = this.categoriasDespesas();

    if (categorias.length === 0) {
      return 'conic-gradient(#e4e9e0 0deg 360deg)';
    }

    let anguloAtual = 0;
    const segmentos = categorias.map((categoria) => {
      const tamanho = (categoria.percentual / 100) * 360;
      const inicio = anguloAtual;
      const fim = anguloAtual + tamanho;

      anguloAtual = fim;
      return `${categoria.cor} ${inicio}deg ${fim}deg`;
    });

    if (anguloAtual < 360) {
      segmentos.push(`#e4e9e0 ${anguloAtual}deg 360deg`);
    }

    return `conic-gradient(${segmentos.join(', ')})`;
  });

  readonly totalPendente = computed(() =>
    this.contasPendentesMock.reduce((acumulador, conta) => acumulador + conta.valor, 0),
  );

  constructor() {
    this.carregarResumo();
  }

  formatarMoeda(valor: number): string {
    return this.formatadorMoeda.format(valor);
  }

  private carregarResumo(): void {
    this.carregandoResumo.set(true);
    this.mensagemErroResumo.set(null);

    forkJoin({
      transacoes: this.servicoTransacoes.listar(),
      metas: this.servicoMetas.listar(),
    })
      .pipe(finalize(() => this.carregandoResumo.set(false)))
      .subscribe({
        next: ({ transacoes, metas }) => {
          this.transacoes.set(transacoes);
          this.metas.set(metas);
        },
        error: (erro: unknown) => {
          this.mensagemErroResumo.set(
            extrairMensagemErroTransacao(erro, 'Não foi possível carregar os dados do painel.'),
          );
          this.transacoes.set([]);
          this.metas.set([]);
        },
      });
  }
}
