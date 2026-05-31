import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { UserContactEntity } from '@/app/database/entities/UserContact';
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
    const { empresaId } = body;

    if (!empresaId) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'empresaId é obrigatório.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const contactRepo = ds.getRepository(UserContactEntity);
    const existingContact = await contactRepo.findOneBy({
      userId: payload.userId,
      empresaId: empresaId,
    });

    let isContacted = false;

    if (existingContact) {
      await contactRepo.remove(existingContact);
    } else {
      const contact = new UserContactEntity();
      contact.id = uuidv4();
      contact.empresaId = empresaId;
      contact.userId = payload.userId;
      await contactRepo.save(contact);
      isContacted = true;
    }

    const result: ResponseDTO<{ contacted: boolean }> = {
      response: { contacted: isContacted },
      mensagem: isContacted ? 'Empresa marcada como contatada.' : 'Empresa desmarcada.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
