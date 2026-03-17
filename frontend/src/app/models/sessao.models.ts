export type SessaoAutenticacao = Readonly<{
  token: string;
  userId?: string;
  nome?: string;
  email?: string;
}>;
