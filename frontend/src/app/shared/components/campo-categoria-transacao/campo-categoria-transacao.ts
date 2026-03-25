import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { Categoria } from '../../../models/transacao.models';
import { InputFormularioComponent } from '../input-formulario/input-formulario';

@Component({
  selector: 'app-campo-categoria-transacao',
  imports: [ReactiveFormsModule, InputFormularioComponent],
  templateUrl: './campo-categoria-transacao.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class CampoCategoriaTransacaoComponent {
  @Input({ required: true }) categorias: readonly Categoria[] = [];
  @Input({ required: true }) modoNovaCategoria: boolean = false;
  @Input({ required: true }) controleCategoriaId!: FormControl<string>;
  @Input({ required: true }) controleCategoriaNome!: FormControl<string>;
  @Input({ required: true }) invalidoCategoriaId: 'true' | 'false' = 'false';
  @Input({ required: true }) invalidoCategoriaNome: 'true' | 'false' = 'false';

  @Output() alternar = new EventEmitter<void>();

  alternarModo(): void {
    this.alternar.emit();
  }
}
