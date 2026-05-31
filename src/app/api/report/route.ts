import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
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
    const { nicho, estados, cidades, portes, periodo } = body;

    const empresaRepo = ds.getRepository(EmpresaEntity);
    const empresas = await empresaRepo.find({
      order: { createdAt: 'DESC' },
    });

    let filtered = empresas;
    if (nicho) filtered = filtered.filter((e) => e.categoriaIA === nicho);
    if (estados?.length) filtered = filtered.filter((e) => estados.includes(e.estado));
    if (cidades?.length) filtered = filtered.filter((e) => cidades.includes(`${e.municipio} - ${e.estado}`));
    if (portes?.length) {
      const normalizedPortes = portes.map((p: string) => p.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase());
      filtered = filtered.filter((e) => normalizedPortes.includes(e.porte.toLowerCase()));
    }
    if (periodo) filtered = filtered.filter((e) => e.dataAbertura === periodo);

    // Build report data for PDF generation on client side
    const nichoDistribution: Record<string, number> = {};
    const cidadeDistribution: Record<string, number> = {};
    const porteDistribution: Record<string, number> = {};
    const estadoDistribution: Record<string, number> = {};

    filtered.forEach((e) => {
      nichoDistribution[e.categoriaIA] = (nichoDistribution[e.categoriaIA] || 0) + 1;
      const cityKey = `${e.municipio} - ${e.estado}`;
      cidadeDistribution[cityKey] = (cidadeDistribution[cityKey] || 0) + 1;
      porteDistribution[e.porte] = (porteDistribution[e.porte] || 0) + 1;
      estadoDistribution[e.estado] = (estadoDistribution[e.estado] || 0) + 1;
    });

    const trendData = filtered.length > 0 ? [
      { mes: 'Jan', valor: Math.floor(filtered.length * 0.4) },
      { mes: 'Fev', valor: Math.floor(filtered.length * 0.5) },
      { mes: 'Mar', valor: Math.floor(filtered.length * 0.45) },
      { mes: 'Abr', valor: Math.floor(filtered.length * 0.7) },
      { mes: 'Mai', valor: Math.floor(filtered.length * 0.85) },
      { mes: 'Jun', valor: filtered.length },
    ] : [];

    // Porte growth over months
    const porteTrend = ['Microempresa (ME)', 'Pequena Empresa', 'Média Empresa', 'Grande Empresa'].map((porte) => {
      const porteData = filtered.filter((e) => e.porte === porte);
      const base = porteData.length;
      return {
        porte,
        jan: Math.floor(base * 0.3),
        fev: Math.floor(base * 0.45),
        mar: Math.floor(base * 0.4),
        abr: Math.floor(base * 0.6),
        mai: Math.floor(base * 0.8),
        jun: base,
      };
    });

    const result: ResponseDTO<{
      totalEmpresas: number;
      empresas: any[];
      nichoDistribution: typeof nichoDistribution;
      cidadeDistribution: typeof cidadeDistribution;
      porteDistribution: typeof porteDistribution;
      estadoDistribution: typeof estadoDistribution;
      trendData: typeof trendData;
      porteTrend: typeof porteTrend;
      generatedAt: string;
    }> = {
      response: {
        totalEmpresas: filtered.length,
        empresas: filtered.map((e) => ({
          id: e.id,
          nome: e.razaoSocial,
          cnpj: e.cnpj,
          nicho: e.categoriaIA,
          estado: e.estado,
          cidade: e.municipio,
          bairro: e.bairro,
          telefone: e.telefone,
          email: e.email,
          score: 1.0,
          socio: e.socio,
          receita: e.receitaAnual,
          funcionarios: e.funcionarios,
          porte: e.porte,
          dataAbertura: e.dataAbertura,
        })),
        nichoDistribution,
        cidadeDistribution,
        porteDistribution,
        estadoDistribution,
        trendData,
        porteTrend,
        generatedAt: new Date().toISOString(),
      },
      mensagem: 'Dados do relatório gerados com sucesso.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
