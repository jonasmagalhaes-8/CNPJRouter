import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { UserBlockEntity } from '@/app/database/entities/UserBlock';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

export async function PATCH(request: NextRequest) {
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

    const empresaRepo = ds.getRepository(EmpresaEntity);
    const empresa = await empresaRepo.findOneBy({ id: empresaId, userId: payload.userId });
    if (!empresa) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Empresa não encontrada.', sucesso: false };
      return NextResponse.json(error, { status: 404 });
    }

    empresa.isBlocked = true;
    await empresaRepo.save(empresa);

    // Persist definitive block in user_blocks table
    const blockRepo = ds.getRepository(UserBlockEntity);
    const existingBlock = await blockRepo.findOneBy({
      userId: payload.userId,
      empresaId: empresa.id,
    });

    if (!existingBlock) {
      const block = new UserBlockEntity();
      block.id = uuidv4();
      block.empresaId = empresa.id;
      block.cnpj = empresa.cnpj;
      block.empresaNome = empresa.nome;
      block.userId = payload.userId;
      await blockRepo.save(block);
    }

    const result: ResponseDTO<{ id: string }> = {
      response: { id: empresa.id },
      mensagem: 'Empresa ocultada com sucesso.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
