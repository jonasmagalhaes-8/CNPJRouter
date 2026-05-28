export interface AuthResultDTO {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
  };
  mensagem: string;
}
