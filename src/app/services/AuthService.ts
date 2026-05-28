import { apiBackend } from '../config/apiBackend';
import type { ResponseDTO } from '../dtos/ResponseDTO';
import type { LoginPayloadDTO } from '../dtos/LoginPayloadDTO';
import type { RegisterPayloadDTO } from '../dtos/RegisterPayloadDTO';
import type { LoginResponseDTO } from '../dtos/LoginResponseDTO';

export async function serviceLogin(user: LoginPayloadDTO): Promise<ResponseDTO<LoginResponseDTO>> {
  const json = await apiBackend.post<ResponseDTO<LoginResponseDTO>>('/auth/login', user);
  return json.data;
}

export async function serviceRegister(user: RegisterPayloadDTO): Promise<ResponseDTO<LoginResponseDTO>> {
  const json = await apiBackend.post<ResponseDTO<LoginResponseDTO>>('/auth/register', user);
  return json.data;
}
