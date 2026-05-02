import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';

import { SessaoAutenticacaoStorage } from '../../features/auth/service/sessao-autenticacao-storage';
import { naoAutenticadoGuard } from './nao-autenticado-guard';

describe('naoAutenticadoGuard', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve permitir acesso ao login quando nao houver sessao', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SessaoAutenticacaoStorage,
          useValue: {
            carregar: () => null,
          },
        },
        {
          provide: Router,
          useValue: {
            createUrlTree: vi.fn(),
          },
        },
      ],
    });

    const resultado = TestBed.runInInjectionContext(() =>
      naoAutenticadoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(resultado).toBe(true);
  });

  it('deve redirecionar para painel quando houver sessao', () => {
    const createUrlTreeSpy = vi.fn().mockImplementation((commands: unknown[]) => ({ commands }));

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SessaoAutenticacaoStorage,
          useValue: {
            carregar: () => ({ token: 'jwt-token-valido' }),
          },
        },
        {
          provide: Router,
          useValue: {
            createUrlTree: createUrlTreeSpy,
          },
        },
      ],
    });

    const resultado = TestBed.runInInjectionContext(() =>
      naoAutenticadoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/painel']);
    expect(resultado).toEqual({ commands: ['/painel'] });
  });
});
