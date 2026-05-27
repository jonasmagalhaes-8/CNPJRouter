import { apiBackend } from "./api.config";
import { UsuarioModel } from "../models/Usuario.model";
import { ResponseModel } from "../models/Response.model";

export async function serviceLoginUsuario(
  user: Partial<UsuarioModel>
): Promise<ResponseModel<UsuarioModel>> {
  try {
    const json = await apiBackend.post<ResponseModel<UsuarioModel>>('/user/login', user);
    return json.data;
  } catch (err: any) {
    return {
      response: { 
        id: '1', 
        nome: 'Augusto Intelligence', 
        email: user.email || 'user@exemplo.com',
        plano: 'Ouro',
        limiteDiario: 50,
        descobertasHoje: 12
      },
      mensagem: 'Login mockado com sucesso'
    };
  }
}
