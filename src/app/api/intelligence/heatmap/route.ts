import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface HeatmapResponse {
  labels: string[];
  months: string[];
  matrix: number[][];
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

// GET /api/intelligence/heatmap — Grid Heatmap Data
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'bairro';
    const estado = searchParams.get('estado') || '';
    const municipio = searchParams.get('municipio') || '';
    const categoria = searchParams.get('categoria') || '';
    const period = searchParams.get('period') || '6m';

    const { months } = (() => {
      const match = period.match(/^(\d+)m$/);
      return { months: match ? parseInt(match[1], 10) : 6 };
    })();

    const ds = await initializeDataSource();
    const empresaRepo = ds.getRepository(EmpresaEntity);

    const now = new Date();
    const startDate = subtractMonths(now, months);

    // Determine the grouping column
    const groupColumn = type === 'cidade' ? 'municipio' : 'bairro';

    const queryBuilder = empresaRepo
      .createQueryBuilder('e')
      .select(`e."${groupColumn}"`, 'location')
      .addSelect('SUBSTR(e."dataAbertura", 1, 7)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where(`e."${groupColumn}" IS NOT NULL`)
      .andWhere(`e."${groupColumn}" != ''`)
      .andWhere('e."dataAbertura" >= :startDate', { startDate: startDate.toISOString().slice(0, 10) })
      .andWhere('e."dataAbertura" <= :endDate', { endDate: now.toISOString().slice(0, 10) });

    if (estado && estado !== 'null') {
      queryBuilder.andWhere('e."estado" = :estado', { estado });
    }
    if (municipio && municipio !== 'null' && type === 'bairro') {
      queryBuilder.andWhere('e."municipio" = :municipio', { municipio });
    }
    if (categoria && categoria !== 'null') {
      queryBuilder.andWhere('e."categoriaIA" = :categoria', { categoria });
    }

    const rows = await queryBuilder
      .groupBy(`e."${groupColumn}"`)
      .addGroupBy('month')
      .orderBy(`e."${groupColumn}"`, 'ASC')
      .addOrderBy('month', 'ASC')
      .getRawMany();

    // Generate all month labels
    const monthLabels: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = subtractMonths(now, i);
      monthLabels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Collect unique locations, sorted by total count descending
    const locationCounts = new Map<string, number>();
    const dataMap = new Map<string, Map<string, number>>(); // location -> month -> count

    for (const row of rows) {
      const loc = row.location;
      const month = row.month;
      const count = parseInt(row.count, 10);

      if (!dataMap.has(loc)) {
        dataMap.set(loc, new Map());
      }
      dataMap.get(loc)!.set(month, count);

      locationCounts.set(loc, (locationCounts.get(loc) || 0) + count);
    }

    // Sort locations by total count, take top 30
    const sortedLocations = [...locationCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([loc]) => loc);

    // Build matrix
    const matrix: number[][] = sortedLocations.map((loc) => {
      const monthData = dataMap.get(loc) || new Map();
      return monthLabels.map((month) => monthData.get(month) || 0);
    });

    const response: HeatmapResponse = {
      labels: sortedLocations,
      months: monthLabels,
      matrix,
    };

    const result: ResponseDTO<HeatmapResponse> = {
      response,
      mensagem: `Heatmap por ${type === 'cidade' ? 'cidade' : 'bairro'} — últimos ${months} meses.`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
