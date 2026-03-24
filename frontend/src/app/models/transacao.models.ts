export type TipoTransacao = 'RECEITA' | 'DESPESA';

export type PayloadTransacao = Readonly<{
  descricao: string;
  valor: number;
  data: string;
  tipo: TipoTransacao;
  categoria: string;
}>;

export type FiltroPeriodoTransacao = Readonly<{
  dataInicio: string;
  dataFim: string;
}>;

export type FiltroMensalTransacao = Readonly<{
  mes: number;
  ano: number;
}>;

export type FiltrosTransacao = FiltroPeriodoTransacao | FiltroMensalTransacao;

export type Transacao = Readonly<{
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: TipoTransacao;
  categoria: string;
}>;
