import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-transacoes',
  imports: [RouterOutlet],
  templateUrl: './transacoes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransacoesContainer {}
