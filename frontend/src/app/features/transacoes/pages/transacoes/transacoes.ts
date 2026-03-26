import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Funnel, LucideAngularModule, Plus, X, XCircle, ChevronDown } from 'lucide-angular';
import { finalize } from 'rxjs';

import {
  Categoria,
  FiltroCategoriaTransacao,
  FiltroPeriodoTransacao,
  FiltrosTransacao,
  PayloadTransacao,
  Transacao,
} from '../../../../models/transacao.models';
import { Meta } from '../../../../models/meta.models';
import { InputFormularioComponent } from '../../../../shared/components/input-formulario/input-formulario';
import { BotaoSubmitComponent } from '../../../../shared/components/botao-submit/botao-submit';
import { CampoCategoriaTransacaoComponent } from '../../../../shared/components/campo-categoria-transacao/campo-categoria-transacao';
import { ServicoTransacoes } from '../../service/servico-transacoes';
import { ServicoCategorias } from '../../service/servico-categorias';
import { ServicoMetas } from '../../../metas/service/servico-metas';
import { FiltrosTransacoesComponent } from '../../ui/filtros-transacoes/filtros-transacoes';
import { ListaTransacoesComponent } from '../../ui/lista-transacoes/lista-transacoes';
import { TransacoesStore } from '../../../../store/transacoes/transacoes-store';
import { extrairMensagemErroTransacao } from '../../../../shared/utils/mensagem-erro-transacao';

type FormularioTransacao = {
  descricao: FormControl<string>;
  valor: FormControl<number>;
  data: FormControl<string>;
  tipo: FormControl<string>;
  categoriaId: FormControl<string>;
  categoriaNome: FormControl<string>;
  direcionarParaMeta: FormControl<boolean>;
  metaId: FormControl<string>;
};

type TipoFiltroVisual = 'TODAS' | 'RECEITA' | 'DESPESA';

type FiltroConsolidadoVisual = {
  tipo: TipoFiltroVisual;
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
};

@Component({
  selector: 'app-pagina-transacoes',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    LucideAngularModule,
    InputFormularioComponent,
    BotaoSubmitComponent,
    CampoCategoriaTransacaoComponent,
    FiltrosTransacoesComponent,
    ListaTransacoesComponent,
  ],
  templateUrl: './transacoes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class PaginaTransacoes {
  private readonly construtorFormulario = inject(NonNullableFormBuilder);
  private readonly servicoTransacoes = inject(ServicoTransacoes);
  private readonly servicoCategorias = inject(ServicoCategorias);
  private readonly servicoMetas = inject(ServicoMetas);
  private readonly transacoesStore = inject(TransacoesStore);

  readonly formulario: FormGroup<FormularioTransacao> = this.construtorFormulario.group({
    descricao: this.construtorFormulario.control('', [
      Validators.required,
      Validators.maxLength(180),
    ]),
    valor: this.construtorFormulario.control(0, [Validators.required, Validators.min(0.01)]),
    data: this.construtorFormulario.control('', [Validators.required]),
    tipo: this.construtorFormulario.control('', [Validators.required]),
    categoriaId: this.construtorFormulario.control('', [Validators.required]),
    categoriaNome: this.construtorFormulario.control('', [Validators.maxLength(100)]),
    direcionarParaMeta: this.construtorFormulario.control(false),
    metaId: this.construtorFormulario.control(''),
  });

  readonly carregando = this.transacoesStore.carregando;
  readonly mensagemErro = this.transacoesStore.mensagemErro;
  readonly mensagemSucesso = this.transacoesStore.mensagemSucesso;
  readonly transacoes = this.transacoesStore.transacoes;
  readonly totalTransacoes = this.transacoesStore.totalTransacoes;
  readonly transacaoEmEdicaoId = this.transacoesStore.transacaoEmEdicaoId;
  readonly temMensagemErro = computed(() => this.mensagemErro() !== null);
  readonly temMensagemSucesso = computed(() => this.mensagemSucesso() !== null);
  readonly modalTransacaoAberto = signal(false);
  readonly modalFiltrosMobileAberto = signal(false);
  readonly filtroVisualTipo = signal<TipoFiltroVisual>('TODAS');
  readonly modoNovaCategoria = signal(false);
  readonly categorias = signal<Categoria[]>([]);
  readonly metas = signal<Meta[]>([]);
  readonly filtrosDesktopExpandido = signal(true);

  readonly iconeAdicionar = Plus;
  readonly iconeFiltrar = Funnel;
  readonly iconeFechar = X;
  readonly iconeLimpar = XCircle;
  readonly iconeChevron = ChevronDown;

  readonly transacoesFiltradas = computed(() => {
    const filtroVisual = this.filtroVisualTipo();

    if (filtroVisual === 'TODAS') {
      return this.transacoes();
    }

    return this.transacoes().filter((item) => item.tipo === filtroVisual);
  });

  readonly totalTransacoesVisiveis = computed(() => this.transacoesFiltradas().length);
  readonly metasAtivas = computed(() => this.metas().filter((meta) => meta.valorPoupado < meta.valorAlvo));

  constructor() {
    this.carregarCategorias();
    this.carregarMetas();
    this.listar();
  }

  abrirModalTransacao(): void {
    this.transacoesStore.definirErro(null);
    this.transacoesStore.definirSucesso(null);
    this.modalTransacaoAberto.set(true);
  }

  fecharModalTransacao(): void {
    this.modalTransacaoAberto.set(false);
  }

  abrirNovaTransacao(): void {
    this.transacoesStore.definirEmEdicao(null);
    this.transacoesStore.definirErro(null);
    this.transacoesStore.definirSucesso(null);
    this.formulario.reset({
      descricao: '',
      valor: 0,
      data: '',
      tipo: '',
      categoriaId: '',
      categoriaNome: '',
      direcionarParaMeta: false,
      metaId: '',
    });
    this.modoNovaCategoria.set(false);
    this.atualizarValidadoresCategoria();
    this.atualizarValidadoresMeta();
    this.abrirModalTransacao();
  }

  alternarModoNovaCategoria(): void {
    const novoModo = !this.modoNovaCategoria();
    this.modoNovaCategoria.set(novoModo);

    if (novoModo) {
      this.formulario.controls.categoriaId.setValue('');
    } else {
      this.formulario.controls.categoriaNome.setValue('');
    }

    this.atualizarValidadoresCategoria();
  }

  abrirModalFiltrosMobile(): void {
    this.modalFiltrosMobileAberto.set(true);
  }

  fecharModalFiltrosMobile(): void {
    this.modalFiltrosMobileAberto.set(false);
  }

  alternarFiltrosDesktop(): void {
    this.filtrosDesktopExpandido.set(!this.filtrosDesktopExpandido());
  }

  definirFiltroVisualTipo(tipo: TipoFiltroVisual): void {
    this.filtroVisualTipo.set(tipo);
  }

  aplicarFiltros(filtros: FiltroConsolidadoVisual): void {
    this.definirFiltroVisualTipo(filtros.tipo);

    const filtroBackend = this.montarFiltroBackend(filtros);

    this.transacoesStore.definirFiltroAtivo(filtroBackend);
    this.modalFiltrosMobileAberto.set(false);
    this.listar(filtroBackend);
  }

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const payload = this.montarPayload();

    this.transacoesStore.definirCarregando(true);
    this.transacoesStore.definirErro(null);
    this.transacoesStore.definirSucesso(null);

    const idEmEdicao = this.transacaoEmEdicaoId();

    const operacao = idEmEdicao
      ? this.servicoTransacoes.atualizar(idEmEdicao, payload)
      : this.servicoTransacoes.criar(payload);

    const metasAntes = this.metas();
    const metaIdVinculada = payload.metaId;

    operacao.pipe(finalize(() => this.transacoesStore.definirCarregando(false))).subscribe({
      next: () => {
        this.formulario.reset({
          descricao: '',
          valor: 0,
          data: '',
          tipo: '',
          categoriaId: '',
          categoriaNome: '',
          direcionarParaMeta: false,
          metaId: '',
        });
        this.modoNovaCategoria.set(false);
        this.atualizarValidadoresCategoria();
        this.atualizarValidadoresMeta();
        this.carregarCategorias();
        this.carregarMetas(() => {
          const mensagemMetaConcluida = this.criarMensagemMetaConcluida(
            metaIdVinculada,
            metasAntes,
            this.metas(),
          );

          this.transacoesStore.definirSucesso(
            mensagemMetaConcluida ??
              (idEmEdicao ? 'Transação atualizada com sucesso.' : 'Transação criada com sucesso.'),
          );
        });

        this.transacoesStore.definirEmEdicao(null);
        this.modalTransacaoAberto.set(false);
        this.listar();
      },
      error: (erro: unknown) => {
        this.transacoesStore.definirErro(
          extrairMensagemErroTransacao(erro, 'Não foi possível salvar a transação.'),
        );
      },
    });
  }

  editarTransacao(transacao: Transacao): void {
    this.transacoesStore.definirEmEdicao(transacao.id);
    this.transacoesStore.definirErro(null);
    this.transacoesStore.definirSucesso(null);

    this.formulario.patchValue({
      descricao: transacao.descricao,
      valor: transacao.valor,
      data: transacao.data,
      tipo: transacao.tipo,
      categoriaId: '',
      categoriaNome: '',
      direcionarParaMeta: Boolean(transacao.metaId),
      metaId: transacao.metaId ?? '',
    });

    const categoriaExistente = this.categorias().find(
      (item) => item.nome.toLowerCase() === transacao.categoria.toLowerCase(),
    );

    if (categoriaExistente) {
      this.modoNovaCategoria.set(false);
      this.formulario.controls.categoriaId.setValue(categoriaExistente.id);
      this.formulario.controls.categoriaNome.setValue('');
    } else {
      this.modoNovaCategoria.set(true);
      this.formulario.controls.categoriaId.setValue('');
      this.formulario.controls.categoriaNome.setValue(transacao.categoria);
    }

    this.atualizarValidadoresCategoria();
    this.atualizarValidadoresMeta();

    this.modalTransacaoAberto.set(true);
  }

  onAlterarTipo(): void {
    if (this.formulario.controls.tipo.value !== 'RECEITA') {
      this.formulario.controls.direcionarParaMeta.setValue(false);
      this.formulario.controls.metaId.setValue('');
    }

    this.atualizarValidadoresMeta();
  }

  onAlternarDirecionamentoMeta(): void {
    if (!this.formulario.controls.direcionarParaMeta.value) {
      this.formulario.controls.metaId.setValue('');
    }

    this.atualizarValidadoresMeta();
  }

  excluirTransacao(id: string): void {
    this.transacoesStore.definirCarregando(true);
    this.transacoesStore.definirErro(null);
    this.transacoesStore.definirSucesso(null);

    this.servicoTransacoes
      .excluir(id)
      .pipe(finalize(() => this.transacoesStore.definirCarregando(false)))
      .subscribe({
        next: () => {
          this.transacoesStore.definirSucesso('Transação excluída com sucesso.');
          this.listar();
        },
        error: (erro: unknown) => {
          this.transacoesStore.definirErro(
            extrairMensagemErroTransacao(erro, 'Não foi possível excluir a transação.'),
          );
        },
      });
  }

  limparFiltros(): void {
    this.filtroVisualTipo.set('TODAS');
    this.transacoesStore.definirFiltroAtivo(undefined);
    this.modalFiltrosMobileAberto.set(false);
    this.listar();
  }

  campoInvalido(campo: keyof FormularioTransacao): 'true' | 'false' {
    const controle = this.formulario.controls[campo];
    return controle.touched && controle.invalid ? 'true' : 'false';
  }

  mostrarDirecionamentoMeta(): boolean {
    return this.formulario.controls.tipo.value === 'RECEITA' && this.metasAtivas().length > 0;
  }

  private listar(filtro?: FiltrosTransacao): void {
    this.transacoesStore.definirCarregando(true);
    this.transacoesStore.definirErro(null);

    this.servicoTransacoes
      .listar(filtro)
      .pipe(finalize(() => this.transacoesStore.definirCarregando(false)))
      .subscribe({
        next: (lista) => {
          this.transacoesStore.definirTransacoes(lista);
        },
        error: (erro: unknown) => {
          this.transacoesStore.definirErro(
            extrairMensagemErroTransacao(erro, 'Não foi possível carregar as transações.'),
          );
        },
      });
  }

  private montarFiltroBackend(filtros: FiltroConsolidadoVisual): FiltrosTransacao | undefined {
    const categoriaId = filtros.categoriaId?.trim();
    const possuiPeriodoCompleto = Boolean(filtros.dataInicio) && Boolean(filtros.dataFim);

    if (possuiPeriodoCompleto) {
      const filtroPeriodo: FiltroPeriodoTransacao = {
        dataInicio: filtros.dataInicio as string,
        dataFim: filtros.dataFim as string,
        ...(categoriaId ? { categoriaId } : {}),
      };

      return filtroPeriodo;
    }

    if (categoriaId) {
      const filtroCategoria: FiltroCategoriaTransacao = { categoriaId };
      return filtroCategoria;
    }

    return undefined;
  }

  private carregarCategorias(): void {
    this.servicoCategorias.listar().subscribe({
      next: (lista) => {
        this.categorias.set(lista);
      },
      error: () => {
        this.categorias.set([]);
      },
    });
  }

  private carregarMetas(aoConcluir?: () => void): void {
    this.servicoMetas.listar().subscribe({
      next: (lista) => {
        this.metas.set(lista);
        aoConcluir?.();
      },
      error: () => {
        this.metas.set([]);
        aoConcluir?.();
      },
    });
  }

  private criarMensagemMetaConcluida(
    metaIdVinculada: string | undefined,
    metasAntes: readonly Meta[],
    metasDepois: readonly Meta[],
  ): string | null {
    if (!metaIdVinculada) {
      return null;
    }

    const metaAntes = metasAntes.find((meta) => meta.id === metaIdVinculada);
    const metaDepois = metasDepois.find((meta) => meta.id === metaIdVinculada);

    if (!metaAntes || !metaDepois) {
      return null;
    }

    const estavaIncompleta = metaAntes.valorPoupado < metaAntes.valorAlvo;
    const foiConcluida = metaDepois.valorPoupado >= metaDepois.valorAlvo;

    if (estavaIncompleta && foiConcluida) {
      return `Transação salva. Notificação: a meta "${metaDepois.nome}" foi concluída.`;
    }

    return null;
  }

  private montarPayload(): PayloadTransacao {
    const valores = this.formulario.getRawValue();

    return {
      descricao: valores.descricao,
      valor: valores.valor,
      data: valores.data,
      tipo: valores.tipo as PayloadTransacao['tipo'],
      ...(this.deveEnviarMetaId() ? { metaId: valores.metaId } : {}),
      categoria: this.modoNovaCategoria()
        ? {
            nome: valores.categoriaNome.trim(),
          }
        : {
            id: valores.categoriaId,
          },
    };
  }

  private atualizarValidadoresCategoria(): void {
    if (this.modoNovaCategoria()) {
      this.formulario.controls.categoriaId.clearValidators();
      this.formulario.controls.categoriaNome.setValidators([
        Validators.required,
        Validators.maxLength(100),
      ]);
    } else {
      this.formulario.controls.categoriaNome.setValidators([Validators.maxLength(100)]);
      this.formulario.controls.categoriaId.setValidators([Validators.required]);
    }

    this.formulario.controls.categoriaId.updateValueAndValidity({ emitEvent: false });
    this.formulario.controls.categoriaNome.updateValueAndValidity({ emitEvent: false });
  }

  private atualizarValidadoresMeta(): void {
    if (this.deveEnviarMetaId()) {
      this.formulario.controls.metaId.setValidators([Validators.required]);
    } else {
      this.formulario.controls.metaId.clearValidators();
    }

    this.formulario.controls.metaId.updateValueAndValidity({ emitEvent: false });
  }

  private deveEnviarMetaId(): boolean {
    return (
      this.formulario.controls.tipo.value === 'RECEITA' &&
      this.formulario.controls.direcionarParaMeta.value === true
    );
  }
}
