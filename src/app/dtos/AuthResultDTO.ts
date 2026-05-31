export interface AuthResultDTO {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    plano: number;
    planInfo?: { leads: number; preco: number; nome: string };
  };
  mensagem: string;
}
