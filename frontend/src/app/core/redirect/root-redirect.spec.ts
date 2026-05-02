import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { SessaoAutenticacaoStorage } from '../../features/auth/service/sessao-autenticacao-storage';
import { RootRedirectComponent } from './root-redirect';

describe('RootRedirectComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve redirecionar para /auth/login quando nao houver token', async () => {
    const navegarSpy = vi.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [RootRedirectComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            navigateByUrl: navegarSpy,
          },
        },
        {
          provide: SessaoAutenticacaoStorage,
          useValue: {
            carregar: () => null,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RootRedirectComponent);
    fixture.detectChanges();

    expect(navegarSpy).toHaveBeenCalledWith('/auth/login', { replaceUrl: true });
  });

  it('deve redirecionar para /painel quando houver token em sessao', async () => {
    const navegarSpy = vi.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [RootRedirectComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            navigateByUrl: navegarSpy,
          },
        },
        {
          provide: SessaoAutenticacaoStorage,
          useValue: {
            carregar: () => ({
              token: 'jwt-token-valido',
              userId: 'u-01',
              nome: 'Ana',
            }),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RootRedirectComponent);
    fixture.detectChanges();

    expect(navegarSpy).toHaveBeenCalledWith('/painel', { replaceUrl: true });
  });
});
