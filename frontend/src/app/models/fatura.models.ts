export type FaturaPayload = Readonly<{
  descricao: string;
  valor: number;
  dataVencimento: string;
}>;

export type Fatura = Readonly<{
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  paga: boolean;
}>;
