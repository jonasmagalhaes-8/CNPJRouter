import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { DailyUsageEntity } from '@/app/database/entities/DailyUsage';
import { UserEntity } from '@/app/database/entities/User';
import { verifyToken } from '@/app/middleware/auth';
import { getTodayStr } from '@/app/utils/dateUtils';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const usageRepo = ds.getRepository(DailyUsageEntity);
    const today = getTodayStr();

    let usage = await usageRepo.findOneBy({ userId: payload.userId, usageDate: today });

    if (!usage) {
      usage = new DailyUsageEntity();
      usage.id = uuidv4();
      usage.userId = payload.userId;
      usage.usageDate = today;
      usage.viewsCount = 0;
      await usageRepo.save(usage);
    }

    const userRepo = ds.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id: payload.userId });
    const planLimit = user?.plano || 100;

    const result: ResponseDTO<{ viewsCount: number; planLimit: number; usageDate: string; percentage: number }> = {
      response: {
        viewsCount: usage.viewsCount,
        planLimit,
        usageDate: usage.usageDate,
        percentage: Math.min(100, Math.round((usage.viewsCount / planLimit) * 100)),
      },
      mensagem: 'Uso diário.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const usageRepo = ds.getRepository(DailyUsageEntity);
    const today = getTodayStr();

    let usage = await usageRepo.findOneBy({ userId: payload.userId, usageDate: today });

    if (!usage) {
      usage = new DailyUsageEntity();
      usage.id = uuidv4();
      usage.userId = payload.userId;
      usage.usageDate = today;
      usage.viewsCount = 1;
      await usageRepo.save(usage);
    } else {
      usage.viewsCount += 1;
      await usageRepo.save(usage);
    }

    const userRepo = ds.getRepository(UserEntity);
    const user = await userRepo.findOneBy({ id: payload.userId });
    const planLimit = user?.plano || 100;
    const isLimitReached = usage.viewsCount >= planLimit;

    const result: ResponseDTO<{ viewsCount: number; planLimit: number; isLimitReached: boolean }> = {
      response: {
        viewsCount: usage.viewsCount,
        planLimit,
        isLimitReached,
      },
      mensagem: isLimitReached ? 'Limite diário atingido!' : 'Uso registrado.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
