import { serviceLogin, serviceRegister } from '../services/AuthService';
import type { AuthResultDTO } from '../dtos/AuthResultDTO';

export async function loginController(email: string, senha: string): Promise<AuthResultDTO> {
  const response = await serviceLogin({ email, senha });
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.response.token);
    localStorage.setItem('user', JSON.stringify(response.response.user));
  }
  return { ...response.response, mensagem: response.mensagem };
}

export async function registerController(nome: string, email: string, senha: string, perfil?: string, perfilOutro?: string): Promise<AuthResultDTO> {
  const response = await serviceRegister({ nome, email, senha, perfil, perfilOutro });
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.response.token);
    localStorage.setItem('user', JSON.stringify(response.response.user));
  }
  return { ...response.response, mensagem: response.mensagem };
}
