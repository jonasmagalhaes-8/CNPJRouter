import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initializeDataSource } from '@/app/database/connection';
import { UserEntity } from '@/app/database/entities/User';
import { verifyToken } from '@/app/middleware/auth';
import { JWT_SECRET } from '@/app/config/constants';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

const PLANS = [
  { leads: 25, preco: 19, nome: 'Básico' },
  { leads: 50, preco: 35, nome: 'Profissional' },
  { leads: 100, preco: 65, nome: 'Empresarial' },
];

export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const userRepo = ds.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id: payload.userId });

    if (!user) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Usuário não encontrado.', sucesso: false };
      return NextResponse.json(error, { status: 404 });
    }

    const planInfo = PLANS.find((p) => p.leads === user.plano) || PLANS[2];

    const result: ResponseDTO<typeof user & { planInfo: typeof planInfo }> = {
      response: {
        ...user,
        planInfo,
      } as any,
      mensagem: 'Dados do usuário.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const userRepo = ds.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id: payload.userId });

    if (!user) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Usuário não encontrado.', sucesso: false };
      return NextResponse.json(error, { status: 404 });
    }

    const body = await request.json();
    const { nome, email, senhaAtual, novaSenha } = body;

    if (nome) user.nome = nome;
    if (email) user.email = email;

    if (novaSenha) {
      if (!senhaAtual) {
        const error: ResponseDTO<null> = { response: null, mensagem: 'Senha atual é obrigatória para alterar.', sucesso: false };
        return NextResponse.json(error, { status: 400 });
      }
      const valid = await bcrypt.compare(senhaAtual, user.senha);
      if (!valid) {
        const error: ResponseDTO<null> = { response: null, mensagem: 'Senha atual incorreta.', sucesso: false };
        return NextResponse.json(error, { status: 400 });
      }
      user.senha = await bcrypt.hash(novaSenha, 10);
    }

    await userRepo.save(user);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const result: ResponseDTO<{ token: string; user: { id: string; nome: string; email: string; plano: number } }> = {
      response: {
        token,
        user: { id: user.id, nome: user.nome, email: user.email, plano: user.plano },
      },
      mensagem: 'Perfil atualizado com sucesso!',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
