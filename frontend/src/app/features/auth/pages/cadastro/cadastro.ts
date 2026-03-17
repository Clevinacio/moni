import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { PayloadCadastro } from '../../../../models/auth.models';
import { AuthStore } from '../../../../store/auth/auth-store';
import { extrairMensagemErroAutenticacao } from '../../../../shared/utils/mensagem-erro-autenticacao';
import { ServicoAutenticacao } from '../../service/servico-autenticacao';
import { CabecalhoAuthComponent } from '../../ui/cabecalho-auth/cabecalho-auth';

type FormularioCadastro = {
  name: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, CabecalhoAuthComponent],
  templateUrl: './cadastro.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class PaginaCadastro {
  private readonly construtorFormulario = inject(NonNullableFormBuilder);
  private readonly servicoAutenticacao = inject(ServicoAutenticacao);
  private readonly authStore = inject(AuthStore);

  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);
  readonly mensagemSucesso = signal<string | null>(null);

  readonly temMensagemErro = computed(() => this.mensagemErro() !== null);
  readonly temMensagemSucesso = computed(() => this.mensagemSucesso() !== null);

  readonly formulario: FormGroup<FormularioCadastro> = this.construtorFormulario.group({
    name: this.construtorFormulario.control('', [Validators.required]),
    email: this.construtorFormulario.control('', [Validators.required, Validators.email]),
    password: this.construtorFormulario.control('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const payload: PayloadCadastro = this.formulario.getRawValue();

    this.carregando.set(true);
    this.mensagemErro.set(null);
    this.mensagemSucesso.set(null);

    this.servicoAutenticacao
      .cadastrar(payload)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (resposta) => {
          this.authStore.definirSessao({
            token: resposta.token,
            userId: resposta.id,
            nome: resposta.name,
            email: resposta.email,
          });

          this.mensagemSucesso.set('Cadastro realizado com sucesso.');
        },
        error: (erro: unknown) => {
          this.mensagemErro.set(
            extrairMensagemErroAutenticacao(
              erro,
              'Nao foi possivel concluir seu cadastro no momento.',
            ),
          );
        },
      });
  }

  mostrarErro(campo: keyof FormularioCadastro, validacao: string): boolean {
    const controle = this.formulario.controls[campo];
    return controle.touched && controle.hasError(validacao);
  }

  campoInvalido(campo: keyof FormularioCadastro): 'true' | 'false' {
    const controle = this.formulario.controls[campo];
    return controle.touched && controle.invalid ? 'true' : 'false';
  }
}
