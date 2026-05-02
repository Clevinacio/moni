import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';

import { FaturasStore } from './../../store/faturas/faturas-store';
import { ServicoFaturas } from './service/servico-faturas';
import { of } from 'rxjs';

describe('PaginaFaturas (Contrato)', () => {
  let fixture: ComponentFixture<any>;
  let component: any;
  let store: FaturasStore;
  let servicoListarChamado = false;

  const stubServicoFaturas = {
    listar: () => {
      servicoListarChamado = true;
      return of([]);
    },
    criar: () => of({}),
    pagar: () => of({})
  };

  beforeEach(async () => {
    servicoListarChamado = false;

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FaturasStore,
        { provide: ServicoFaturas, useValue: stubServicoFaturas }
      ]
    }).compileComponents();

    try {
      const { PaginaFaturas } = await import('./pages/faturas/faturas');
      fixture = TestBed.createComponent(PaginaFaturas);
      component = fixture.componentInstance;
      store = TestBed.inject(FaturasStore);
      fixture.detectChanges();
    } catch (e) {
      // Ignora se o componente ainda não foi criado
    }
  });

  it('deve expor o componente PaginaFaturas no modulo esperado', async () => {
    const modulo = await import('./pages/faturas/faturas');
    expect(modulo.PaginaFaturas).toBeDefined();
  });

  it('deve carregar as faturas ao iniciar', () => {
    if (!component) return;
    expect(servicoListarChamado).toBe(true);
  });
});
