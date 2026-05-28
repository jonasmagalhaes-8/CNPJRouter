import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
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
    const { nome, email, senha, perfil, perfilOutro } = body;

    if (!nome || !email || !senha) {
      const error: ResponseDTO<null> = {
        response: null,
        mensagem: 'Nome, email e senha são obrigatórios.',
        sucesso: false,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const userRepo = ds.getRepository(UserEntity);
    const existing = await userRepo.findOneBy({ email });
    if (existing) {
      const error: ResponseDTO<null> = {
        response: null,
        mensagem: 'Email já cadastrado.',
        sucesso: false,
      };
      return NextResponse.json(error, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const user = new UserEntity();
    user.id = uuidv4();
    user.nome = nome;
    user.email = email;
    user.senha = hashedPassword;
    user.plano = 50;
    user.perfil = perfil || null;
    user.perfilOutro = perfilOutro || null;
    await userRepo.save(user);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const result: ResponseDTO<{ token: string; user: { id: string; nome: string; email: string; plano: number } }> = {
      response: { token, user: { id: user.id, nome: user.nome, email: user.email, plano: user.plano } },
      mensagem: 'Usuário cadastrado com sucesso!',
      sucesso: true,
    };
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
