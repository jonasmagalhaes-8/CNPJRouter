import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
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
    const { searchParams } = new URL(request.url);
    const favoriteOnly = searchParams.get('favorites') === 'true';

    const empresaRepo = ds.getRepository(EmpresaEntity);
    let empresas = await empresaRepo.find({
      where: { userId: payload.userId, isBlocked: false },
      order: { createdAt: 'DESC' },
    });

    if (favoriteOnly) {
      const favRepo = ds.getRepository(FavoriteEntity);
      const favs = await favRepo.find({ where: { userId: payload.userId } });
      const favIds = new Set(favs.map((f) => f.empresaId));
      empresas = empresas.filter((e) => favIds.has(e.id));
    }

    const serialized = empresas.map((e) => ({
      id: e.id,
      nome: e.nome,
      cnpj: e.cnpj,
      nicho: e.nicho,
      estado: e.estado,
      cidade: e.cidade,
      bairro: e.bairro,
      telefone: e.telefone,
      email: e.email,
      whatsapp: e.whatsapp,
      score: e.score,
      socio: e.socio,
      receita: e.receita,
      funcionarios: e.funcionarios,
      porte: e.porte,
      dataAbertura: e.dataAbertura,
    }));

    const result: ResponseDTO<typeof serialized> = {
      response: serialized,
      mensagem: `${serialized.length} empresas encontradas.`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
