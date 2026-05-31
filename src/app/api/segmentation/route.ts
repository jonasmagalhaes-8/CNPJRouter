import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { SegmentationEntity } from '@/app/database/entities/Segmentation';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';
import type { NicheDTO } from '@/app/dtos/NicheDTO';
import type { SegmentationPayloadDTO } from '@/app/dtos/SegmentationPayloadDTO';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const segRepo = ds.getRepository(SegmentationEntity);
    const seg = await segRepo.findOneBy({ userId: payload.userId });

    if (!seg) {
      const result: ResponseDTO<{ niches: NicheDTO[]; limit: number }> = {
        response: { niches: [], limit: 12 },
        mensagem: 'Nenhuma segmentação encontrada.',
        sucesso: true,
      };
      return NextResponse.json(result);
    }

    const niches: NicheDTO[] = JSON.parse(seg.segmentationData);
    const result: ResponseDTO<{ niches: NicheDTO[]; limit: number }> = {
      response: { niches, limit: seg.limit ?? 12 },
      mensagem: 'Segmentação recuperada.',
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

    const body = await request.json() as SegmentationPayloadDTO;
    const { niches, limit } = body;

    const ds = await initializeDataSource();
    const segRepo = ds.getRepository(SegmentationEntity);
    
    let seg = await segRepo.findOneBy({ userId: payload.userId });
    if (!seg) {
      seg = segRepo.create({ userId: payload.userId });
    }

    seg.segmentationData = JSON.stringify(niches);
    seg.limit = limit;

    await segRepo.save(seg);

    const result: ResponseDTO<{ count: number }> = {
      response: { count: niches.length },
      mensagem: 'Segmentação salva com sucesso!',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
