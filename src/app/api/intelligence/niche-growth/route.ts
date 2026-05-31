import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface MonthlyData {
  month: string;
  count: number;
  growth: number | null;
}

interface NicheGrowthResponse {
  categoria: string;
  monthlyData: MonthlyData[];
  total: number;
  trend: 'growing' | 'stable' | 'declining';
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

function getMonthKey(dateStr: string): string {
  // dateStr format: "YYYY-MM-DD" or similar
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return dateStr.slice(0, 7);
}

function determineTrend(monthlyData: MonthlyData[]): 'growing' | 'stable' | 'declining' {
  if (monthlyData.length < 2) return 'stable';

  const firstHalf = monthlyData.slice(0, Math.floor(monthlyData.length / 2));
  const secondHalf = monthlyData.slice(Math.floor(monthlyData.length / 2));

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;

  if (firstAvg === 0 && secondAvg === 0) return 'stable';
  if (firstAvg === 0) return 'growing';

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (change > 5) return 'growing';
  if (change < -5) return 'declining';
  return 'stable';
}

// GET /api/intelligence/niche-growth — Dashboard de Crescimento de Nicho
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria') || '';
    const estado = searchParams.get('estado') || '';
    const municipio = searchParams.get('municipio') || '';

    if (!categoria) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'O parâmetro "categoria" é obrigatório.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const ds = await initializeDataSource();
    const empresaRepo = ds.getRepository(EmpresaEntity);

    const now = new Date();
    const twelveMonthsAgo = subtractMonths(now, 12);

    const queryBuilder = empresaRepo
      .createQueryBuilder('e')
      .select('SUBSTR(e."dataAbertura", 1, 7)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('e."categoriaIA" = :categoria', { categoria })
      .andWhere('e."dataAbertura" >= :startDate', { startDate: twelveMonthsAgo.toISOString().slice(0, 10) })
      .andWhere('e."dataAbertura" <= :endDate', { endDate: now.toISOString().slice(0, 10) });

    if (estado && estado !== 'null') {
      queryBuilder.andWhere('e."estado" = :estado', { estado });
    }
    if (municipio && municipio !== 'null') {
      queryBuilder.andWhere('e."municipio" = :municipio', { municipio });
    }

    const rows = await queryBuilder
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    // Build month map
    const monthMap = new Map<string, number>();
    for (const row of rows) {
      monthMap.set(row.month, parseInt(row.count, 10));
    }

    // Generate all 12 months
    const monthlyData: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subtractMonths(now, i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = monthMap.get(key) || 0;

      // Growth vs previous month
      let growth: number | null = null;
      if (i < 11) {
        const prevD = subtractMonths(now, i + 1);
        const prevKey = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`;
        const prevCount = monthMap.get(prevKey) || 0;
        if (prevCount > 0) {
          growth = Math.round(((count - prevCount) / prevCount) * 1000) / 10;
        }
      }

      monthlyData.push({ month: key, count, growth });
    }

    const total = monthlyData.reduce((sum, d) => sum + d.count, 0);
    const trend = determineTrend(monthlyData);

    const response: NicheGrowthResponse = {
      categoria,
      monthlyData,
      total,
      trend,
    };

    const result: ResponseDTO<NicheGrowthResponse> = {
      response,
      mensagem: `Dados de crescimento para "${categoria}".`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
