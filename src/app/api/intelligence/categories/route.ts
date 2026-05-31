import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface CategoryEntry {
  name: string;
  count: number;
}

// GET /api/intelligence/categories — Available Categories
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const empresaRepo = ds.getRepository(EmpresaEntity);

    const categories = await empresaRepo
      .createQueryBuilder('e')
      .select('e."categoriaIA"', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('e."categoriaIA" IS NOT NULL')
      .andWhere('e."categoriaIA" != \'\'')
      .groupBy('e."categoriaIA"')
      .orderBy('COUNT(*)', 'DESC')
      .limit(100)
      .getRawMany();

    const result: ResponseDTO<CategoryEntry[]> = {
      response: categories.map((c) => ({
        name: c.name,
        count: parseInt(c.count, 10),
      })),
      mensagem: `${categories.length} categorias encontradas.`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
