import { serviceLogin, serviceRegister } from '../services/AuthService';
import type { AuthResultDTO } from '../dtos/AuthResultDTO';
import { isAxiosError } from 'axios';

export async function loginController(email: string, senha: string): Promise<AuthResultDTO> {
  try {
    const response = await serviceLogin({ email, senha });
    if (!response.sucesso) {
      throw new Error(response.mensagem || 'Credenciais inválidas.');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.response.token);
      localStorage.setItem('user', JSON.stringify(response.response.user));
    }
    return { ...response.response, mensagem: response.mensagem };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new Error('E-mail ou senha incorretos.');
    }
    if (isAxiosError(error) && error.response?.data?.mensagem) {
      throw new Error(error.response.data.mensagem);
    }
    throw error;
  }
}

export async function registerController(nome: string, email: string, senha: string, perfil?: string, perfilOutro?: string): Promise<AuthResultDTO> {
  try {
    const response = await serviceRegister({ nome, email, senha, perfil, perfilOutro });
    if (!response.sucesso) {
      throw new Error(response.mensagem || 'Erro ao criar conta.');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.response.token);
      localStorage.setItem('user', JSON.stringify(response.response.user));
    }
    return { ...response.response, mensagem: response.mensagem };
  } catch (error) {
    if (isAxiosError(error) && error.response?.data?.mensagem) {
      throw new Error(error.response.data.mensagem);
    }
    if (isAxiosError(error)) {
      throw new Error('Ocorreu um erro de rede ao tentar criar a conta.');
    }
    throw error;
  }
}
