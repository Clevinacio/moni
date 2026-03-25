export type TipoTransacao = 'RECEITA' | 'DESPESA';

export type CategoriaPayloadTransacao = Readonly<{
  id?: string;
  nome?: string;
}>;

export type Categoria = Readonly<{
  id: string;
  nome: string;
}>;

export type PayloadTransacao = Readonly<{
  descricao: string;
  valor: number;
  data: string;
  tipo: TipoTransacao;
  categoria: CategoriaPayloadTransacao;
}>;

export type FiltroPeriodoTransacao = Readonly<{
  dataInicio: string;
  dataFim: string;
  categoriaId?: string;
}>;

export type FiltroMensalTransacao = Readonly<{
  mes: number;
  ano: number;
  categoriaId?: string;
}>;

export type FiltroCategoriaTransacao = Readonly<{
  categoriaId: string;
}>;

export type FiltrosTransacao = Readonly<{
  dataInicio?: string;
  dataFim?: string;
  mes?: number;
  ano?: number;
  categoriaId?: string;
}>;

export type Transacao = Readonly<{
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: TipoTransacao;
  categoria: string;
}>;
