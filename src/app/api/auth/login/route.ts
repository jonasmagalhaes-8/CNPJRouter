import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initializeDataSource } from '@/app/database/connection';
import { UserEntity } from '@/app/database/entities/User';
import { JWT_SECRET } from '@/app/config/constants';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

export async function POST(request: NextRequest) {
  try {
    const ds = await initializeDataSource();
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      const error: ResponseDTO<null> = {
        response: null,
        mensagem: 'Email e senha são obrigatórios.',
        sucesso: false,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const userRepo = ds.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ email });
    if (!user) {
      const error: ResponseDTO<null> = {
        response: null,
        mensagem: 'Credenciais inválidas.',
        sucesso: false,
      };
      return NextResponse.json(error, { status: 401 });
    }

    const valid = await bcrypt.compare(senha, user.senha);
    if (!valid) {
      const error: ResponseDTO<null> = {
        response: null,
        mensagem: 'Credenciais inválidas.',
        sucesso: false,
      };
      return NextResponse.json(error, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const result: ResponseDTO<{ token: string; user: { id: string; nome: string; email: string; plano: number } }> = {
      response: { token, user: { id: user.id, nome: user.nome, email: user.email, plano: user.plano } },
      mensagem: 'Login efetuado com sucesso.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
