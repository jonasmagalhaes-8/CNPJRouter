import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { DiscoveryHistoryEntity } from '@/app/database/entities/DiscoveryHistory';
import { verifyToken } from '@/app/middleware/auth';
import { Like, Between } from 'typeorm';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

// Record a view (add to discovery history)
export async function POST(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const body = await request.json();
    const { empresaId, cnpj } = body;

    if (!empresaId || !cnpj) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'empresaId e cnpj são obrigatórios.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const ds = await initializeDataSource();
    const historyRepo = ds.getRepository(DiscoveryHistoryEntity);

    // Check cooldown: max 2 views per week per CNPJ for this user
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentViews = await historyRepo.count({
      where: {
        userId: payload.userId,
        cnpj,
        viewedAt: Between(oneWeekAgo.toISOString(), new Date().toISOString()),
      },
    });

    if (recentViews >= 2) {
      const result: ResponseDTO<{ cooldown: boolean }> = {
        response: { cooldown: true },
        mensagem: 'Este CNPJ já foi visualizado 2 vezes esta semana.',
        sucesso: true,
      };
      return NextResponse.json(result);
    }

    const history = new DiscoveryHistoryEntity();
    history.id = uuidv4();
    history.empresaId = empresaId;
    history.cnpj = cnpj;
    history.userId = payload.userId;
    await historyRepo.save(history);

    const result: ResponseDTO<{ cooldown: boolean }> = {
      response: { cooldown: false },
      mensagem: 'Visualização registrada.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}

// Get user's discovery history
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const historyRepo = ds.getRepository(DiscoveryHistoryEntity);

    const history = await historyRepo.find({
      where: { userId: payload.userId },
      order: { viewedAt: 'DESC' },
      take: 100,
    });

    const result: ResponseDTO<typeof history> = {
      response: history,
      mensagem: `${history.length} registros no histórico.`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
