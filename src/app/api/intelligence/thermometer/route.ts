import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface ThermometerEntry {
  location: string;
  state: string;
  count: number;
  growth: number | null;
}

function parsePeriod(period: string): { months: number } {
  const match = period.match(/^(\d+)m$/);
  if (match) {
    return { months: parseInt(match[1], 10) };
  }
  return { months: 6 }; // default
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

// GET /api/intelligence/thermometer — Termômetro de Empreendedorismo
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6m';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const { months } = parsePeriod(period);
    const now = new Date();
    const startDate = subtractMonths(now, months);
    const prevStartDate = subtractMonths(startDate, months);

    const ds = await initializeDataSource();
    const empresaRepo = ds.getRepository(EmpresaEntity);

    // Current period: group by municipio + estado, count empresas
    const currentRows = await empresaRepo
      .createQueryBuilder('e')
      .select('e."municipio"', 'municipio')
      .addSelect('e."estado"', 'estado')
      .addSelect('COUNT(*)', 'count')
      .where('e."dataAbertura" >= :startDate', { startDate: startDate.toISOString().slice(0, 10) })
      .andWhere('e."dataAbertura" <= :endDate', { endDate: now.toISOString().slice(0, 10) })
      .andWhere('e."municipio" IS NOT NULL')
      .andWhere('e."municipio" != \'\'')
      .groupBy('e."municipio"')
      .addGroupBy('e."estado"')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    // Previous period: same grouping for growth calculation
    const prevRows = await empresaRepo
      .createQueryBuilder('e')
      .select('e."municipio"', 'municipio')
      .addSelect('e."estado"', 'estado')
      .addSelect('COUNT(*)', 'count')
      .where('e."dataAbertura" >= :startDate', { startDate: prevStartDate.toISOString().slice(0, 10) })
      .andWhere('e."dataAbertura" < :endDate', { endDate: startDate.toISOString().slice(0, 10) })
      .andWhere('e."municipio" IS NOT NULL')
      .andWhere('e."municipio" != \'\'')
      .groupBy('e."municipio"')
      .addGroupBy('e."estado"')
      .getRawMany();

    // Build a lookup for previous period counts
    const prevMap = new Map<string, number>();
    for (const row of prevRows) {
      const key = `${row.municipio}||${row.estado}`;
      prevMap.set(key, parseInt(row.count, 10));
    }

    const results: ThermometerEntry[] = currentRows.map((row) => {
      const key = `${row.municipio}||${row.estado}`;
      const currentCount = parseInt(row.count, 10);
      const prevCount = prevMap.get(key) || 0;
      const growth = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : null;

      return {
        location: row.municipio,
        state: row.estado,
        count: currentCount,
        growth: growth !== null ? Math.round(growth * 10) / 10 : null,
      };
    });

    const result: ResponseDTO<ThermometerEntry[]> = {
      response: results,
      mensagem: `Termômetro de empreendedorismo — últimos ${months} mês(es).`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
