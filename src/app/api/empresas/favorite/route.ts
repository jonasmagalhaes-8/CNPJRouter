import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { FavoriteEntity } from '@/app/database/entities/Favorite';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

export async function POST(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const body = await request.json();
    const { empresaId } = body;

    if (!empresaId) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'empresaId é obrigatório.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const favRepo = ds.getRepository(FavoriteEntity);
    const existing = await favRepo.findOneBy({ empresaId, userId: payload.userId });

    if (existing) {
      await favRepo.remove(existing);
      const result: ResponseDTO<{ favorited: boolean }> = {
        response: { favorited: false },
        mensagem: 'Removido dos favoritos.',
        sucesso: true,
      };
      return NextResponse.json(result);
    }

    const empresaRepo = ds.getRepository(EmpresaEntity);
    const empresa = await empresaRepo.findOneBy({ id: empresaId, userId: payload.userId });
    if (!empresa) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Empresa não encontrada.', sucesso: false };
      return NextResponse.json(error, { status: 404 });
    }

    const fav = new FavoriteEntity();
    fav.id = uuidv4();
    fav.empresaId = empresaId;
    fav.userId = payload.userId;
    await favRepo.save(fav);

    const result: ResponseDTO<{ favorited: boolean }> = {
      response: { favorited: true },
      mensagem: 'Adicionado aos favoritos.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
