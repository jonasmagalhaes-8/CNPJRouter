import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { UserAlertEntity } from '@/app/database/entities/UserAlert';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { verifyToken } from '@/app/middleware/auth';
import { encrypt } from '@/app/utils/encryption';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface AlertMatch {
  alertId: string;
  query: string;
  newCompanies: number;
  companies: Array<{
    id: string;
    razaoSocial: string;
    cnpj: string;
    municipio: string;
    estado: string;
    bairro: string;
    categoriaIA: string;
    dataAbertura: string;
  }>;
}

// GET /api/alerts/check — Check for new companies matching alerts
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const alertRepo = ds.getRepository(UserAlertEntity);
    const empresaRepo = ds.getRepository(EmpresaEntity);

    // Get all active alerts for this user
    const alerts = await alertRepo.find({
      where: { userId: payload.userId, isActive: true },
    });

    if (alerts.length === 0) {
      const result: ResponseDTO<{ matches: AlertMatch[] }> = {
        response: { matches: [] },
        mensagem: 'Nenhum alerta ativo.',
        sucesso: true,
      };
      return NextResponse.json(result);
    }

    const matches: AlertMatch[] = [];

    for (const alert of alerts) {
      // Only fetch empresas with dataProcessamento AFTER lastTriggeredAt
      const lastTriggered = alert.lastTriggeredAt
        ? alert.lastTriggeredAt.toISOString()
        : new Date(0).toISOString();

      const queryKeywords = alert.query.trim().split(/\s+/);

      // Build the LIKE clauses for each keyword
      const categoriaLikes = queryKeywords.map((_, i) => `e."categoriaIA" LIKE :kw${i}`).join(' AND ');
      const razaoLikes = queryKeywords.map((_, i) => `e."razaoSocial" LIKE :kw${i}`).join(' AND ');

      const params: Record<string, string> = { lastTriggered };
      queryKeywords.forEach((kw, i) => {
        params[`kw${i}`] = `%${kw}%`;
      });
      if (alert.estado) params.estado = alert.estado;
      if (alert.municipio) params.municipio = alert.municipio;
      if (alert.bairro) params.bairro = alert.bairro;

      const qb = empresaRepo
        .createQueryBuilder('e')
        .where(`(${categoriaLikes} OR ${razaoLikes})`, params)
        .andWhere('e."dataProcessamento" > :lastTriggered', { lastTriggered });

      if (alert.estado) {
        qb.andWhere('e."estado" = :estado', { estado: alert.estado });
      }
      if (alert.municipio) {
        qb.andWhere('e."municipio" = :municipio', { municipio: alert.municipio });
      }
      if (alert.bairro) {
        qb.andWhere('e."bairro" = :bairro', { bairro: alert.bairro });
      }

      const newEmpresas = await qb
        .orderBy('e."dataProcessamento"', 'DESC')
        .limit(50)
        .getMany();

      if (newEmpresas.length > 0) {
        // Update lastTriggeredAt
        alert.lastTriggeredAt = new Date();
        await alertRepo.save(alert);

        // Encrypt sensitive fields
        const companies = newEmpresas.map((e) => ({
          id: e.id,
          razaoSocial: e.razaoSocial ? encrypt(e.razaoSocial) : '',
          cnpj: e.cnpj ? encrypt(e.cnpj) : '',
          municipio: e.municipio || '',
          estado: e.estado || '',
          bairro: e.bairro || '',
          categoriaIA: e.categoriaIA || '',
          dataAbertura: e.dataAbertura || '',
        }));

        matches.push({
          alertId: alert.id,
          query: alert.query,
          newCompanies: newEmpresas.length,
          companies,
        });
      }
    }

    const result: ResponseDTO<{ matches: AlertMatch[] }> = {
      response: { matches },
      mensagem: matches.length > 0
        ? `${matches.length} alerta(s) com novas empresas.`
        : 'Nenhuma nova empresa encontrada para seus alertas.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
