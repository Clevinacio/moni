import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { Fatura } from '../../../../models/fatura.models';
import { Meta } from '../../../../models/meta.models';
import { Transacao } from '../../../../models/transacao.models';
import { extrairMensagemErroTransacao } from '../../../../shared/utils/mensagem-erro-transacao';
import { ServicoFaturas } from '../../../faturas/service/servico-faturas';
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
  id: string;
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
  private readonly servicoFaturas = inject(ServicoFaturas);
  private readonly formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  private readonly coresCategorias = ['#355872', '#7aaace', '#4a7c59', '#cfd5c8'];

  readonly carregandoResumo = signal(false);
  readonly mensagemErroResumo = signal<string | null>(null);
  readonly transacoes = signal<readonly Transacao[]>([]);
  readonly metas = signal<readonly Meta[]>([]);
  readonly faturas = signal<readonly Fatura[]>([]);

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

  readonly contasPendentes = computed(
    () =>
      [...this.faturas()]
        .filter((fatura) => !fatura.paga)
        .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
        .map(
          (fatura) =>
            ({
              id: fatura.id,
              titulo: fatura.descricao,
              vencimento: this.formatarVencimento(fatura.dataVencimento),
              valor: fatura.valor,
            }) satisfies ContaPendente,
        ),
  );

  readonly totalPendente = computed(() =>
    this.contasPendentes().reduce(
      (acumulador, conta) => acumulador + Math.round(conta.valor * 100),
      0,
    ) / 100,
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
      faturas: this.servicoFaturas.listar(),
    })
      .pipe(finalize(() => this.carregandoResumo.set(false)))
      .subscribe({
        next: ({ transacoes, metas, faturas }) => {
          this.transacoes.set(transacoes);
          this.metas.set(metas);
          this.faturas.set(faturas);
        },
        error: (erro: unknown) => {
          this.mensagemErroResumo.set(
            extrairMensagemErroTransacao(erro, 'Não foi possível carregar os dados do painel.'),
          );
          this.transacoes.set([]);
          this.metas.set([]);
          this.faturas.set([]);
        },
      });
  }

  private formatarVencimento(dataVencimento: string): string {
    const hoje = normalizarDataLocal(new Date());
    const vencimento = criarDataLocal(dataVencimento);
    const diferencaDias = Math.round(
      (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diferencaDias === 0) {
      return 'Vence hoje';
    }

    if (diferencaDias < 0) {
      const diasAtraso = Math.abs(diferencaDias);
      return diasAtraso === 1 ? 'Atrasada há 1 dia' : `Atrasada há ${diasAtraso} dias`;
    }

    return diferencaDias === 1 ? 'Vence amanhã' : `Vence em ${diferencaDias} dias`;
  }
}

function criarDataLocal(dataIso: string): Date {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function normalizarDataLocal(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}
