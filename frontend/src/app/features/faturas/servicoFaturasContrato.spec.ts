import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ServicoFaturas } from './service/servico-faturas';
import { Fatura, FaturaPayload } from '../../models/fatura.models';

describe('ServicoFaturas (Contrato)', () => {
  let servico: ServicoFaturas;
  let httpTestingController: HttpTestingController;

  const faturaMock: Fatura = {
    id: 'fatura-123',
    descricao: 'Conta de Luz',
    valor: 150.75,
    dataVencimento: '2026-05-10',
    paga: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServicoFaturas,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    servico = TestBed.inject(ServicoFaturas);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('deve criar uma fatura chamando POST /api/v1/bills', () => {
    const payload: FaturaPayload = {
      descricao: 'Conta de Luz',
      valor: 150.75,
      dataVencimento: '2026-05-10'
    };

    servico.criar(payload).subscribe((resultado) => {
      expect(resultado).toEqual(faturaMock);
    });

    const requisicao = httpTestingController.expectOne((valor) => valor.url.endsWith('/api/v1/bills'));
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(payload);
    
    requisicao.flush(faturaMock);
  });

  it('deve pagar uma fatura chamando PATCH /api/v1/bills/{id}/pay', () => {
    const faturaPaga = { ...faturaMock, paga: true };

    servico.pagar('fatura-123').subscribe((resultado) => {
      expect(resultado).toEqual(faturaPaga);
    });

    const requisicao = httpTestingController.expectOne((valor) =>
      valor.url.endsWith('/api/v1/bills/fatura-123/pay'),
    );
    expect(requisicao.request.method).toBe('PATCH');
    
    requisicao.flush(faturaPaga);
  });

  it('deve listar as faturas chamando GET /api/v1/bills', () => {
    const faturasMock: Fatura[] = [faturaMock];

    servico.listar().subscribe((resultado) => {
      expect(resultado).toEqual(faturasMock);
    });

    const requisicao = httpTestingController.expectOne((valor) => valor.url.endsWith('/api/v1/bills'));
    expect(requisicao.request.method).toBe('GET');
    
    requisicao.flush(faturasMock);
  });
});
