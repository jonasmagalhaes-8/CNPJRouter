import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { UserContactEntity } from '@/app/database/entities/UserContact';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const contactRepo = ds.getRepository(UserContactEntity);
    const contacts = await contactRepo.find({ where: { userId: payload.userId } });

    const contactIds = contacts.map(c => c.empresaId);

    const result: ResponseDTO<{ contactIds: string[] }> = {
      response: { contactIds },
      mensagem: 'IDs contatados obtidos.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
