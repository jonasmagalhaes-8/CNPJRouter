import { apiBackend } from '../config/apiBackend';
import type { ResponseDTO } from '../dtos/ResponseDTO';

export async function serviceGetUser(): Promise<ResponseDTO<any>> {
  const json = await apiBackend.get('/user');
  return json.data;
}

export async function serviceUpdateUser(data: {
  nome?: string;
  email?: string;
  senhaAtual?: string;
  novaSenha?: string;
}): Promise<ResponseDTO<{ token: string; user: { id: string; nome: string; email: string; plano: number } }>> {
  const json = await apiBackend.patch('/user', data);
  return json.data;
}

export async function serviceGetUsage(): Promise<ResponseDTO<{
  viewsCount: number;
  planLimit: number;
  usageDate: string;
  percentage: number;
}>> {
  const json = await apiBackend.get('/usage');
  return json.data;
}

export async function serviceRecordUsage(): Promise<ResponseDTO<{
  viewsCount: number;
  planLimit: number;
  isLimitReached: boolean;
}>> {
  const json = await apiBackend.post('/usage');
  return json.data;
}

export async function serviceRecordHistory(empresaId: string, cnpj: string): Promise<ResponseDTO<{ cooldown: boolean }>> {
  const json = await apiBackend.post('/history', { empresaId, cnpj });
  return json.data;
}

export async function serviceGetHistory(): Promise<ResponseDTO<any[]>> {
  const json = await apiBackend.get('/history');
  return json.data;
}
