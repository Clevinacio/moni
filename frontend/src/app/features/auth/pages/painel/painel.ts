import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthStore } from '../../../../store/auth/auth-store';

@Component({
  selector: 'app-painel',
  imports: [],
  templateUrl: './painel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class PaginaPainel {
  private readonly authStore = inject(AuthStore);

  readonly temSessao = this.authStore.autenticado;
  readonly descricaoSessao = this.authStore.descricaoSessao;

  sair(): void {
    this.authStore.limparSessao();
  }
}
