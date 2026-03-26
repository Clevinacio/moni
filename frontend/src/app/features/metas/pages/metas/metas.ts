import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LucideAngularModule, Plus, X } from 'lucide-angular';
import { finalize } from 'rxjs';

import { Meta, PayloadMeta } from '../../../../models/meta.models';
import { MetasStore } from '../../../../store/metas/metas-store';
import { extrairMensagemErroTransacao } from '../../../../shared/utils/mensagem-erro-transacao';
import { ServicoMetas } from '../../service/servico-metas';
import { CardMeta } from '../../ui/card-meta/card-meta';
import { FormularioMeta } from '../../ui/formulario-meta/formulario-meta';

type FormularioMetaDados = {
  nome: FormControl<string>;
  valorAlvo: FormControl<number>;
};

@Component({
  selector: 'app-metas',
  imports: [ReactiveFormsModule, LucideAngularModule, CurrencyPipe, CardMeta, FormularioMeta],
  templateUrl: './metas.html',
  styleUrl: './metas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class PaginaMetas {
  private readonly construtorFormulario = inject(NonNullableFormBuilder);
  private readonly servicoMetas = inject(ServicoMetas);
  private readonly metasStore = inject(MetasStore);

  readonly formulario: FormGroup<FormularioMetaDados> = this.construtorFormulario.group({
    nome: this.construtorFormulario.control('', [Validators.required, Validators.maxLength(120)]),
    valorAlvo: this.construtorFormulario.control(0, [Validators.required, Validators.min(0.01)]),
  });

  readonly metas = this.metasStore.metas;
  readonly carregando = this.metasStore.carregando;
  readonly mensagemErro = this.metasStore.mensagemErro;
  readonly mensagemSucesso = this.metasStore.mensagemSucesso;
  readonly metaEmEdicaoId = this.metasStore.metaEmEdicaoId;
  readonly totalValorPoupado = this.metasStore.totalValorPoupado;
  readonly modalAberto = signal(false);

  readonly temMensagemErro = computed(() => this.mensagemErro() !== null);
  readonly temMensagemSucesso = computed(() => this.mensagemSucesso() !== null);
  readonly tituloModal = computed(() =>
    this.metaEmEdicaoId() ? 'Editar meta' : 'Nova meta de economia',
  );

  readonly iconeAdicionar = Plus;
  readonly iconeFechar = X;

  constructor() {
    this.listar();
  }

  abrirNovaMeta(): void {
    this.metasStore.definirErro(null);
    this.metasStore.definirSucesso(null);
    this.metasStore.definirEmEdicao(null);
    this.formulario.reset({
      nome: '',
      valorAlvo: 0,
    });
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
  }

  editarMeta(metaId: string): void {
    const meta = this.metas().find((item) => item.id === metaId);

    if (!meta) {
      return;
    }

    this.metasStore.definirErro(null);
    this.metasStore.definirSucesso(null);
    this.metasStore.definirEmEdicao(meta.id);
    this.formulario.patchValue({
      nome: meta.nome,
      valorAlvo: meta.valorAlvo,
    });
    this.modalAberto.set(true);
  }

  excluirMeta(metaId: string): void {
    this.metasStore.definirCarregando(true);
    this.metasStore.definirErro(null);
    this.metasStore.definirSucesso(null);

    this.servicoMetas
      .excluir(metaId)
      .pipe(finalize(() => this.metasStore.definirCarregando(false)))
      .subscribe({
        next: () => {
          this.metasStore.definirSucesso('Meta removida com sucesso.');
          this.listar();
        },
        error: (erro: unknown) => {
          this.metasStore.definirErro(
            extrairMensagemErroTransacao(erro, 'Não foi possível excluir a meta.'),
          );
        },
      });
  }

  salvarMeta(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const payload = this.montarPayload();
    const idEmEdicao = this.metaEmEdicaoId();

    this.metasStore.definirCarregando(true);
    this.metasStore.definirErro(null);
    this.metasStore.definirSucesso(null);

    const operacao = idEmEdicao
      ? this.servicoMetas.atualizar(idEmEdicao, payload)
      : this.servicoMetas.criar(payload);

    operacao.pipe(finalize(() => this.metasStore.definirCarregando(false))).subscribe({
      next: () => {
        this.metasStore.definirSucesso(
          idEmEdicao ? 'Meta atualizada com sucesso.' : 'Meta criada com sucesso.',
        );
        this.metasStore.definirEmEdicao(null);
        this.formulario.reset({
          nome: '',
          valorAlvo: 0,
        });
        this.modalAberto.set(false);
        this.listar();
      },
      error: (erro: unknown) => {
        this.metasStore.definirErro(
          extrairMensagemErroTransacao(erro, 'Não foi possível salvar a meta.'),
        );
      },
    });
  }

  calcularPercentual(meta: Meta): number {
    if (meta.valorAlvo <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((meta.valorPoupado / meta.valorAlvo) * 100)));
  }

  private montarPayload(): PayloadMeta {
    const valores = this.formulario.getRawValue();

    return {
      nome: valores.nome.trim(),
      valorAlvo: valores.valorAlvo,
    };
  }

  private listar(): void {
    this.metasStore.definirCarregando(true);
    this.metasStore.definirErro(null);

    this.servicoMetas
      .listar()
      .pipe(finalize(() => this.metasStore.definirCarregando(false)))
      .subscribe({
        next: (lista) => {
          this.metasStore.definirMetas(lista);
        },
        error: (erro: unknown) => {
          this.metasStore.definirErro(
            extrairMensagemErroTransacao(erro, 'Não foi possível carregar as metas.'),
          );
          this.metasStore.definirMetas([]);
        },
      });
  }

}
