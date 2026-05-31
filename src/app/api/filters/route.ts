import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { FavoriteEntity } from '@/app/database/entities/Favorite';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const favRepo = ds.getRepository(FavoriteEntity);
    const favs = await favRepo.find({ where: { userId: payload.userId } });
    const favIds = new Set(favs.map((f) => f.empresaId));

    const result: ResponseDTO<{ favoriteIds: string[] }> = {
      response: { favoriteIds: Array.from(favIds) },
      mensagem: 'Filtros carregados.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
