export class UsuarioModel {
  id: string;
  nome: string;
  email: string;
  plano: "Bronze" | "Prata" | "Ouro";
  limiteDiario: number;
  descobertasHoje: number;
  token?: string;
}
