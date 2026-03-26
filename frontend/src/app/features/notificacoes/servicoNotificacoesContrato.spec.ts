import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ServicoNotificacoes } from './service/servico-notificacoes';

describe('RF07 - Contrato do ServicoNotificacoes', () => {
  let servico: ServicoNotificacoes;
  let controladorHttp: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ServicoNotificacoes],
    });

    servico = TestBed.inject(ServicoNotificacoes);
    controladorHttp = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controladorHttp.verify();
  });

  it('deve listar notificacoes em GET /api/v1/notifications com contrato estrito', async () => {
    const promessaResposta = firstValueFrom(servico.listar());

    const requisicao = controladorHttp.expectOne((valor) =>
      valor.url.endsWith('/api/v1/notifications'),
    );

    expect(requisicao.request.method).toBe('GET');

    requisicao.flush([
      {
        id: 'notif-01',
        mensagem: 'Parabéns! A meta "Viagem" foi atingida.',
        tipo: 'META_ATINGIDA',
        lida: false,
        criadaEm: '2026-03-26T11:20:00Z',
      },
    ]);

    const resposta = await promessaResposta;
    expect(resposta).toEqual([
      {
        id: 'notif-01',
        mensagem: 'Parabéns! A meta "Viagem" foi atingida.',
        tipo: 'META_ATINGIDA',
        lida: false,
        criadaEm: '2026-03-26T11:20:00Z',
      },
    ]);
  });

  it('deve rejeitar resposta com campos inesperados', async () => {
    const promessaResposta = firstValueFrom(servico.listar());

    const requisicao = controladorHttp.expectOne((valor) =>
      valor.url.endsWith('/api/v1/notifications'),
    );

    requisicao.flush([
      {
        id: 'notif-01',
        mensagem: 'Mensagem',
        tipo: 'META_ATINGIDA',
        lida: false,
        criadaEm: '2026-03-26T11:20:00Z',
        extra: 'invalido',
      },
    ]);

    let erroCapturado: unknown = null;

    try {
      await promessaResposta;
    } catch (erro) {
      erroCapturado = erro;
    }

    expect(erroCapturado).toBeInstanceOf(Error);
    expect((erroCapturado as Error).message).toBe(
      'Resposta de listagem invalida: formato de campos inesperado.',
    );
  });

  it('deve limpar notificacoes em DELETE /api/v1/notifications', async () => {
    const promessaResposta = firstValueFrom(servico.limpar());

    const requisicao = controladorHttp.expectOne((valor) =>
      valor.url.endsWith('/api/v1/notifications'),
    );

    expect(requisicao.request.method).toBe('DELETE');

    requisicao.flush(null, { status: 204, statusText: 'No Content' });

    await promessaResposta;
  });
});