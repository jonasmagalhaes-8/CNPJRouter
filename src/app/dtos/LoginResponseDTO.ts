export interface LoginResponseDTO {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
  };
}
