import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-cabecalho-auth',
  imports: [],
  template: `
    <header class="mb-5">
      <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-emerald-700">Moni</p>
      <h2
        [attr.id]="identificadorTitulo()"
        class="mt-1 text-[clamp(1.4rem,3.5vw,1.9rem)] font-semibold leading-tight text-emerald-950"
      >
        {{ titulo() }}
      </h2>
      <p class="m-0 text-sm text-emerald-900/75">{{ descricao() }}</p>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabecalhoAuthComponent {
  readonly identificadorTitulo = input('');
  readonly titulo = input('');
  readonly descricao = input('');
}
