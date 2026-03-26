export type Meta = Readonly<{
  id: string;
  nome: string;
  valorAlvo: number;
  valorPoupado: number;
}>;

export type PayloadMeta = Readonly<{
  nome: string;
  valorAlvo: number;
}>;
