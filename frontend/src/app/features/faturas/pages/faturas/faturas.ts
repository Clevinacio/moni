import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FaturasStore } from '../../../../store/faturas/faturas-store';
import { ServicoFaturas } from '../../service/servico-faturas';
import { LucideAngularModule, CheckCircle, Clock, PlusCircle } from 'lucide-angular';

@Component({
  selector: 'app-faturas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './faturas.html'
})
export class PaginaFaturas implements OnInit {
  store = inject(FaturasStore);
  private servico = inject(ServicoFaturas);
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    descricao: ['', Validators.required],
    valor: [null, [Validators.required, Validators.min(0.01)]],
    dataVencimento: ['', Validators.required]
  });

  icones = { CheckCircle, Clock, PlusCircle };
  
  get hoje() {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.carregarFaturas();
  }

  carregarFaturas(): void {
    this.store.definirCarregando(true);
    this.servico.listar().subscribe({
      next: (faturas) => {
        this.store.definirFaturas(faturas);
        this.store.definirCarregando(false);
      },
      error: () => {
        this.store.definirErro('Erro ao carregar faturas');
        this.store.definirCarregando(false);
      }
    });
  }

  adicionarFatura(): void {
    if (this.form.invalid) return;

    this.store.definirCarregando(true);
    this.servico.criar(this.form.value).subscribe({
      next: (fatura) => {
        this.store.adicionarFatura(fatura);
        this.store.definirSucesso('Fatura criada com sucesso');
        this.form.reset();
        this.store.definirCarregando(false);
      },
      error: () => {
        this.store.definirErro('Erro ao criar fatura');
        this.store.definirCarregando(false);
      }
    });
  }

  pagarFatura(id: string): void {
    this.store.definirCarregando(true);
    this.servico.pagar(id).subscribe({
      next: (fatura) => {
        this.store.atualizarFatura(fatura);
        this.store.definirSucesso('Fatura paga com sucesso');
        this.store.definirCarregando(false);
      },
      error: () => {
        this.store.definirErro('Erro ao pagar fatura');
        this.store.definirCarregando(false);
      }
    });
  }
}
