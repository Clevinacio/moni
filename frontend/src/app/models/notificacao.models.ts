export type Notificacao = Readonly<{
  id: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criadaEm: string;
}>;