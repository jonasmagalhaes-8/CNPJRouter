import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { verifyToken } from '@/app/middleware/auth';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface FilterOptions {
  categorias: string[];
  estados: string[];
  municipios: string[];
  bairros: string[];
  portes: string[];
}

// GET /api/intelligence/filters — Available Filter Options
export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || '';
    const categoria = searchParams.get('categoria') || '';
    const municipio = searchParams.get('municipio') || '';

    const ds = await initializeDataSource();
    const empresaRepo = ds.getRepository(EmpresaEntity);

    // Base query builder with optional filters
    function baseQuery() {
      const qb = empresaRepo.createQueryBuilder('e');
      if (estado && estado !== 'null') {
        qb.andWhere('e."estado" = :estado', { estado });
      }
      if (categoria && categoria !== 'null') {
        qb.andWhere('e."categoriaIA" = :categoria', { categoria });
      }
      if (municipio && municipio !== 'null') {
        qb.andWhere('e."municipio" = :municipio', { municipio });
      }
      return qb;
    }

    // Fetch distinct values for each dimension in parallel
    const params = {
      estado: estado && estado !== 'null' ? estado : undefined,
      categoria: categoria && categoria !== 'null' ? categoria : undefined,
      municipio: municipio && municipio !== 'null' ? municipio : undefined,
    };

    const [categorias, estados, municipios, bairros, portes] = await Promise.all([
      // Categorias — exclude the current filter
      empresaRepo
        .createQueryBuilder('e')
        .select('DISTINCT e."categoriaIA"', 'value')
        .where('e."categoriaIA" IS NOT NULL')
        .andWhere('e."categoriaIA" != \'\'')
        .andWhere(params.estado ? 'e."estado" = :estado' : '1=1', params.estado ? { estado: params.estado } : {})
        .andWhere(params.municipio ? 'e."municipio" = :municipio' : '1=1', params.municipio ? { municipio: params.municipio } : {})
        .orderBy('e."categoriaIA"', 'ASC')
        .limit(200)
        .getRawMany(),

      // Estados
      empresaRepo
        .createQueryBuilder('e')
        .select('DISTINCT e."estado"', 'value')
        .where('e."estado" IS NOT NULL')
        .andWhere('e."estado" != \'\'')
        .andWhere(params.categoria ? 'e."categoriaIA" = :categoria' : '1=1', params.categoria ? { categoria: params.categoria } : {})
        .andWhere(params.municipio ? 'e."municipio" = :municipio' : '1=1', params.municipio ? { municipio: params.municipio } : {})
        .orderBy('e."estado"', 'ASC')
        .getRawMany(),

      // Municipios
      empresaRepo
        .createQueryBuilder('e')
        .select('DISTINCT e."municipio"', 'value')
        .where('e."municipio" IS NOT NULL')
        .andWhere('e."municipio" != \'\'')
        .andWhere(params.estado ? 'e."estado" = :estado' : '1=1', params.estado ? { estado: params.estado } : {})
        .andWhere(params.categoria ? 'e."categoriaIA" = :categoria' : '1=1', params.categoria ? { categoria: params.categoria } : {})
        .orderBy('e."municipio"', 'ASC')
        .limit(500)
        .getRawMany(),

      // Bairros
      empresaRepo
        .createQueryBuilder('e')
        .select('DISTINCT e."bairro"', 'value')
        .where('e."bairro" IS NOT NULL')
        .andWhere('e."bairro" != \'\'')
        .andWhere(params.estado ? 'e."estado" = :estado' : '1=1', params.estado ? { estado: params.estado } : {})
        .andWhere(params.municipio ? 'e."municipio" = :municipio' : '1=1', params.municipio ? { municipio: params.municipio } : {})
        .andWhere(params.categoria ? 'e."categoriaIA" = :categoria' : '1=1', params.categoria ? { categoria: params.categoria } : {})
        .orderBy('e."bairro"', 'ASC')
        .limit(500)
        .getRawMany(),

      // Portes
      empresaRepo
        .createQueryBuilder('e')
        .select('DISTINCT e."porte"', 'value')
        .where('e."porte" IS NOT NULL')
        .andWhere('e."porte" != \'\'')
        .andWhere(params.estado ? 'e."estado" = :estado' : '1=1', params.estado ? { estado: params.estado } : {})
        .andWhere(params.municipio ? 'e."municipio" = :municipio' : '1=1', params.municipio ? { municipio: params.municipio } : {})
        .andWhere(params.categoria ? 'e."categoriaIA" = :categoria' : '1=1', params.categoria ? { categoria: params.categoria } : {})
        .orderBy('e."porte"', 'ASC')
        .getRawMany(),
    ]);

    const response: FilterOptions = {
      categorias: categorias.map((c) => c.value),
      estados: estados.map((e) => e.value),
      municipios: municipios.map((m) => m.value),
      bairros: bairros.map((b) => b.value),
      portes: portes.map((p) => p.value),
    };

    const result: ResponseDTO<FilterOptions> = {
      response,
      mensagem: 'Filtros carregados.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
