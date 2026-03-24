import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import {
  FiltroMensalTransacao,
  FiltroPeriodoTransacao,
  FiltrosTransacao,
  PayloadTransacao,
  Transacao,
} from '../../../../models/transacao.models';
import { InputFormularioComponent } from '../../../../shared/components/input-formulario/input-formulario';
import { BotaoSubmitComponent } from '../../../../shared/components/botao-submit/botao-submit';
import { ServicoTransacoes } from '../../service/servico-transacoes';
import { FiltrosTransacoesComponent } from '../../ui/filtros-transacoes/filtros-transacoes';
import { ListaTransacoesComponent } from '../../ui/lista-transacoes/lista-transacoes';
import { TransacoesStore } from '../../../../store/transacoes/transacoes-store';
import { extrairMensagemErroTransacao } from '../../../../shared/utils/mensagem-erro-transacao';

type FormularioTransacao = {
  descricao: FormControl<string>;
  valor: FormControl<number>;
  data: FormControl<string>;
  tipo: FormControl<string>;
  categoria: FormControl<string>;
};

@Component({
  selector: 'app-pagina-transacoes',
  imports: [
    ReactiveFormsModule,
    InputFormularioComponent,
    BotaoSubmitComponent,
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
  private readonly transacoesStore = inject(TransacoesStore);

  readonly formulario: FormGroup<FormularioTransacao> = this.construtorFormulario.group({
    descricao: this.construtorFormulario.control('', [
      Validators.required,
      Validators.maxLength(180),
    ]),
    valor: this.construtorFormulario.control(0, [Validators.required, Validators.min(0.01)]),
    data: this.construtorFormulario.control('', [Validators.required]),
    tipo: this.construtorFormulario.control('', [Validators.required]),
    categoria: this.construtorFormulario.control('', [
      Validators.required,
      Validators.maxLength(100),
    ]),
  });

  readonly carregando = this.transacoesStore.carregando;
  readonly mensagemErro = this.transacoesStore.mensagemErro;
  readonly mensagemSucesso = this.transacoesStore.mensagemSucesso;
  readonly transacoes = this.transacoesStore.transacoes;
  readonly totalTransacoes = this.transacoesStore.totalTransacoes;
  readonly transacaoEmEdicaoId = this.transacoesStore.transacaoEmEdicaoId;
  readonly temMensagemErro = computed(() => this.mensagemErro() !== null);
  readonly temMensagemSucesso = computed(() => this.mensagemSucesso() !== null);

  constructor() {
    this.listar();
  }

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const payload = this.formulario.getRawValue() as PayloadTransacao;

    this.transacoesStore.definirCarregando(true);
    this.transacoesStore.definirErro(null);
    this.transacoesStore.definirSucesso(null);

    const idEmEdicao = this.transacaoEmEdicaoId();

    const operacao = idEmEdicao
      ? this.servicoTransacoes.atualizar(idEmEdicao, payload)
      : this.servicoTransacoes.criar(payload);

    operacao.pipe(finalize(() => this.transacoesStore.definirCarregando(false))).subscribe({
      next: () => {
        this.formulario.reset({
          descricao: '',
          valor: 0,
          data: '',
          tipo: '',
          categoria: '',
        });

        this.transacoesStore.definirSucesso(
          idEmEdicao ? 'Transacao atualizada com sucesso.' : 'Transacao criada com sucesso.',
        );
        this.transacoesStore.definirEmEdicao(null);
        this.listar();
      },
      error: (erro: unknown) => {
        this.transacoesStore.definirErro(
          extrairMensagemErroTransacao(erro, 'Nao foi possivel salvar a transacao.'),
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
      categoria: transacao.categoria,
    });
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
          this.transacoesStore.definirSucesso('Transacao excluida com sucesso.');
          this.listar();
        },
        error: (erro: unknown) => {
          this.transacoesStore.definirErro(
            extrairMensagemErroTransacao(erro, 'Nao foi possivel excluir a transacao.'),
          );
        },
      });
  }

  aplicarFiltroPeriodo(dataInicio: string, dataFim: string): void {
    const filtro: FiltroPeriodoTransacao = { dataInicio, dataFim };
    this.transacoesStore.definirFiltroAtivo(filtro);
    this.listar(filtro);
  }

  aplicarFiltroMensal(mes: number, ano: number): void {
    const filtro: FiltroMensalTransacao = { mes, ano };
    this.transacoesStore.definirFiltroAtivo(filtro);
    this.listar(filtro);
  }

  limparFiltros(): void {
    this.transacoesStore.definirFiltroAtivo(undefined);
    this.listar();
  }

  campoInvalido(campo: keyof FormularioTransacao): 'true' | 'false' {
    const controle = this.formulario.controls[campo];
    return controle.touched && controle.invalid ? 'true' : 'false';
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
            extrairMensagemErroTransacao(erro, 'Nao foi possivel carregar as transacoes.'),
          );
        },
      });
  }
}
