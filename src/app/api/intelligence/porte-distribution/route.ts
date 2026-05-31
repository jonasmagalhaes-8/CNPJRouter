import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface PorteDistribution {
  porte: string;
  count: number;
  percentage: number;
}

// GET /api/intelligence/porte-distribution — Porte Distribution
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || '';
    const categoria = searchParams.get('categoria') || '';
    const municipio = searchParams.get('municipio') || '';

    const ds = await initializeDataSource();
    const empresaRepo = ds.getRepository(EmpresaEntity);

    const queryBuilder = empresaRepo
      .createQueryBuilder('e')
      .select('e."porte"', 'porte')
      .addSelect('COUNT(*)', 'count')
      .where('e."porte" IS NOT NULL')
      .andWhere('e."porte" != \'\'');

    if (estado && estado !== 'null') {
      queryBuilder.andWhere('e."estado" = :estado', { estado });
    }
    if (categoria && categoria !== 'null') {
      queryBuilder.andWhere('e."categoriaIA" = :categoria', { categoria });
    }
    if (municipio && municipio !== 'null') {
      queryBuilder.andWhere('e."municipio" = :municipio', { municipio });
    }

    const rows = await queryBuilder
      .groupBy('e."porte"')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    const total = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    const distribution: PorteDistribution[] = rows.map((row) => {
      const count = parseInt(row.count, 10);
      return {
        porte: row.porte,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });

    const result: ResponseDTO<PorteDistribution[]> = {
      response: distribution,
      mensagem: `Distribuição por porte — ${total} empresas.`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
