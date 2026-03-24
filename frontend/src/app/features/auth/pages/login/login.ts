import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { PayloadLogin } from '../../../../models/auth.models';
import { AuthStore } from '../../../../store/auth/auth-store';
import { extrairMensagemErroAutenticacao } from '../../../../shared/utils/mensagem-erro-autenticacao';
import { ServicoAutenticacao } from '../../service/servico-autenticacao';
import { CabecalhoAuthComponent } from '../../ui/cabecalho-auth/cabecalho-auth';
import { InputFormularioComponent } from '../../../../shared/components/input-formulario/input-formulario';
import { BotaoSubmitComponent } from '../../../../shared/components/botao-submit/botao-submit';

type FormularioLogin = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CabecalhoAuthComponent,
    InputFormularioComponent,
    BotaoSubmitComponent,
  ],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class PaginaLogin {
  private readonly construtorFormulario = inject(NonNullableFormBuilder);
  private readonly servicoAutenticacao = inject(ServicoAutenticacao);
  private readonly authStore = inject(AuthStore);
  private readonly roteador = inject(Router);

  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);
  readonly mensagemSucesso = signal<string | null>(null);

  readonly temMensagemErro = computed(() => this.mensagemErro() !== null);
  readonly temMensagemSucesso = computed(() => this.mensagemSucesso() !== null);

  readonly formulario: FormGroup<FormularioLogin> = this.construtorFormulario.group({
    email: this.construtorFormulario.control('', [Validators.required, Validators.email]),
    password: this.construtorFormulario.control('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const payload: PayloadLogin = this.formulario.getRawValue();

    this.carregando.set(true);
    this.mensagemErro.set(null);
    this.mensagemSucesso.set(null);

    this.servicoAutenticacao
      .autenticar(payload)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (resposta) => {
          this.authStore.definirSessao({
            token: resposta.token,
            userId: resposta.userId,
            nome: resposta.name,
          });

          this.mensagemSucesso.set('Login realizado com sucesso.');
          void this.roteador.navigate(['/painel']).catch(() => undefined);
        },
        error: (erro: unknown) => {
          this.mensagemErro.set(
            extrairMensagemErroAutenticacao(
              erro,
              'Não foi possível autenticar com os dados informados.',
            ),
          );
        },
      });
  }

  mostrarErro(campo: keyof FormularioLogin, validacao: string): boolean {
    const controle = this.formulario.controls[campo];
    return controle.touched && controle.hasError(validacao);
  }

  campoInvalido(campo: keyof FormularioLogin): 'true' | 'false' {
    const controle = this.formulario.controls[campo];
    return controle.touched && controle.invalid ? 'true' : 'false';
  }
}
