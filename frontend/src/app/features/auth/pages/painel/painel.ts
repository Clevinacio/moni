import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  Bell,
  CircleUserRound,
  DoorOpen,
  LogOut,
  LucideAngularModule,
  Plus,
} from 'lucide-angular';

import { AuthStore } from '../../../../store/auth/auth-store';
import { Transacao } from '../../../../models/transacao.models';
import { extrairMensagemErroTransacao } from '../../../../shared/utils/mensagem-erro-transacao';
import { ServicoTransacoes } from '../../../transacoes/service/servico-transacoes';

type ItemNavegacao = Readonly<{
  titulo: string;
  subtitulo: string;
  rota?: string;
  ativo?: boolean;
}>;

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
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './painel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class PaginaPainel {
  private readonly authStore = inject(AuthStore);
  private readonly servicoTransacoes = inject(ServicoTransacoes);
  private readonly roteador = inject(Router);
  private readonly formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  private readonly coresCategorias = ['#355872', '#7aaace', '#4a7c59', '#cfd5c8'];

  readonly carregandoResumo = signal(false);
  readonly mensagemErroResumo = signal<string | null>(null);
  readonly transacoes = signal<readonly Transacao[]>([]);
  readonly iconeUsuario = CircleUserRound;
  readonly iconeNotificacao = Bell;
  readonly iconeAdicionar = Plus;
  readonly iconeSair = LogOut;
  readonly iconePorta = DoorOpen;

  readonly temSessao = this.authStore.autenticado;
  readonly descricaoSessao = this.authStore.descricaoSessao;

  readonly navegacaoLateral: readonly ItemNavegacao[] = [
    {
      titulo: 'Painel',
      subtitulo: 'Dashboard',
      rota: '/painel',
      ativo: true,
    },
    {
      titulo: 'Transações',
      subtitulo: 'Lançamentos',
      rota: '/transacoes',
    },
    {
      titulo: 'Resumo inicial',
      subtitulo: 'Visão geral',
      rota: '/inicio',
    },
    {
      titulo: 'Metas',
      subtitulo: 'Em breve',
    },
    {
      titulo: 'Faturas',
      subtitulo: 'Em breve',
    },
    {
      titulo: 'Notificações',
      subtitulo: 'Em breve',
    },
  ];

  readonly navegacaoMobile: readonly ItemNavegacao[] = [
    {
      titulo: 'Painel',
      subtitulo: 'Dashboard',
      rota: '/painel',
      ativo: true,
    },
    {
      titulo: 'Transações',
      subtitulo: 'Lançamentos',
      rota: '/transacoes',
    },
    {
      titulo: 'Metas',
      subtitulo: 'Em breve',
    },
    {
      titulo: 'Faturas',
      subtitulo: 'Em breve',
    },
  ];

  readonly metasMock = [
    {
      titulo: 'Viagem 2024',
      descricao: 'R$ 12.000 de R$ 20.000',
      percentual: 60,
      valorAtual: 12000,
      valorObjetivo: 20000,
      corBarra: 'bg-brand-dark',
    },
    {
      titulo: 'Novo MacBook',
      descricao: 'R$ 4.500 de R$ 15.000',
      percentual: 30,
      valorAtual: 4500,
      valorObjetivo: 15000,
      corBarra: 'bg-success',
    },
  ] as const satisfies readonly MetaPainel[];

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

  readonly saudacao = computed(() => {
    const sessao = this.authStore.sessao();
    const nomeSessao = sessao?.nome?.trim() ?? '';
    const nomeEmail = sessao?.email?.split('@')[0]?.trim() ?? '';
    const nomeLimpo = nomeSessao || nomeEmail;

    if (!nomeLimpo) {
      return 'Olá, usuário!';
    }

    return `Olá, ${nomeLimpo.charAt(0).toUpperCase()}${nomeLimpo.slice(1)}!`;
  });

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

  sair(): void {
    this.authStore.limparSessao();
    this.roteador.navigate(['/auth/login']);
  }

  private carregarResumo(): void {
    this.carregandoResumo.set(true);
    this.mensagemErroResumo.set(null);

    this.servicoTransacoes
      .listar()
      .pipe(finalize(() => this.carregandoResumo.set(false)))
      .subscribe({
        next: (lista) => {
          this.transacoes.set(lista);
        },
        error: (erro: unknown) => {
          this.mensagemErroResumo.set(
            extrairMensagemErroTransacao(erro, 'Não foi possível carregar os dados do painel.'),
          );
        },
      });
  }
}
