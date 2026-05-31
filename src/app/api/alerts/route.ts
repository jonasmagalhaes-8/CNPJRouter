import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { UserAlertEntity } from '@/app/database/entities/UserAlert';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

// GET /api/alerts — List user's alerts
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const alertRepo = ds.getRepository(UserAlertEntity);

    const alerts = await alertRepo.find({
      where: { userId: payload.userId },
      order: { createdAt: 'DESC' },
    });

    const result: ResponseDTO<typeof alerts> = {
      response: alerts,
      mensagem: `${alerts.length} alerta(s) encontrado(s).`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}

// POST /api/alerts — Create alert
export async function POST(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const body = await request.json();
    const { query, municipio, estado, bairro } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'O campo "query" é obrigatório.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const ds = await initializeDataSource();
    const alertRepo = ds.getRepository(UserAlertEntity);

    // Check max alerts per user (plan-based limit)
    const existingAlerts = await alertRepo.count({ where: { userId: payload.userId, isActive: true } });
    if (existingAlerts >= 50) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Limite de 50 alertas ativos atingido.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const alert = new UserAlertEntity();
    alert.id = uuidv4();
    alert.userId = payload.userId;
    alert.query = query.trim();
    alert.municipio = municipio || null;
    alert.estado = estado || null;
    alert.bairro = bairro || null;
    alert.isActive = true;
    alert.lastTriggeredAt = new Date(); // Set to now so we only find NEW companies going forward

    await alertRepo.save(alert);

    const result: ResponseDTO<typeof alert> = {
      response: alert,
      mensagem: 'Alerta criado com sucesso.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}

// DELETE /api/alerts — Delete alert
export async function DELETE(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const body = await request.json();
    const { alertId } = body;

    if (!alertId || typeof alertId !== 'string') {
      const error: ResponseDTO<null> = { response: null, mensagem: 'O campo "alertId" é obrigatório.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const ds = await initializeDataSource();
    const alertRepo = ds.getRepository(UserAlertEntity);

    const alert = await alertRepo.findOne({ where: { id: alertId, userId: payload.userId } });

    if (!alert) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Alerta não encontrado.', sucesso: false };
      return NextResponse.json(error, { status: 404 });
    }

    await alertRepo.remove(alert);

    const result: ResponseDTO<{ deleted: boolean }> = {
      response: { deleted: true },
      mensagem: 'Alerta removido com sucesso.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
