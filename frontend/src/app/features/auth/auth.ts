import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, Moon, Sun } from 'lucide-angular';

import { PreferenciaUiStore } from '../../store/preferencia-ui/preferencia-ui-store';

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet, LucideAngularModule],
  templateUrl: './auth.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthContainer {
  private readonly preferenciaUiStore = inject(PreferenciaUiStore);

  readonly iconeLua = Moon;
  readonly iconeSol = Sun;
  readonly temaEscuroAtivo = this.preferenciaUiStore.temaEscuroAtivo;
  readonly rotuloAlternadorTema = this.preferenciaUiStore.temaAtualDescricao;

  alternarTema(): void {
    this.preferenciaUiStore.alternarTema();
  }
}
