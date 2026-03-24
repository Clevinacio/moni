export type PayloadCadastro = Readonly<{
  name: string;
  email: string;
  password: string;
}>;

export type PayloadLogin = Readonly<{
  email: string;
  password: string;
}>;

export type RespostaCadastro = Readonly<{
  id: string;
  name: string;
  email: string;
  token: string;
}>;

export type RespostaLogin = Readonly<{
  token: string;
  type: string;
  userId: string;
  name: string;
}>;
