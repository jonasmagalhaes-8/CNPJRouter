import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { DiscoveryHistoryEntity } from '@/app/database/entities/DiscoveryHistory';
import { UserBlockEntity } from '@/app/database/entities/UserBlock';
import { DailyUsageEntity } from '@/app/database/entities/DailyUsage';
import { GlobalCooldownEntity } from '@/app/database/entities/GlobalCooldown';
import { UserEntity } from '@/app/database/entities/User';
import { verifyToken } from '@/app/middleware/auth';
import { cosineSimilarity, averageVectors } from '@/app/utils/vectors';
import { getISOWeekStart, getTodayStr } from '@/app/utils/dateUtils';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface SemanticSearchBody {
  query: string;
  estado?: string | null;
  municipio?: string | null;
  porte?: string | null;
  page?: number;
  limit?: number;
}

interface ScoredEmpresa {
  empresa: EmpresaEntity;
  score: number;
}

function parseEmbedding(embeddingStr: string | null | undefined): number[] {
  if (!embeddingStr) return [];
  try {
    return JSON.parse(embeddingStr);
  } catch {
    return [];
  }
}

function serializeEmpresa(e: EmpresaEntity) {
  return {
    id: e.id,
    cnpj: e.cnpj,
    razaoSocial: e.razaoSocial,
    nomeFantasia: e.nomeFantasia,
    cnaePrincipal: e.cnaePrincipal,
    cnaeDescricao: e.cnaeDescricao,
    situacaoCadastral: e.situacaoCadastral,
    endereco: e.endereco,
    municipio: e.municipio,
    bairro: e.bairro,
    estado: e.estado,
    cep: e.cep,
    telefone: e.telefone,
    email: e.email,
    socio: e.socio,
    porte: e.porte,
    funcionarios: e.funcionarios,
    receitaAnual: e.receitaAnual,
    dataAbertura: e.dataAbertura,
    categoriaIA: e.categoriaIA,
    dataProcessamento: e.dataProcessamento,
    createdAt: e.createdAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const body: SemanticSearchBody = await request.json();
    const {
      query,
      estado = null,
      municipio = null,
      porte = null,
      page = 0,
      limit = 12,
    } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Query é obrigatória.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const ds = await initializeDataSource();
    const empresaRepo = ds.getRepository(EmpresaEntity);
    const blockRepo = ds.getRepository(UserBlockEntity);
    const cooldownRepo = ds.getRepository(GlobalCooldownEntity);
    const historyRepo = ds.getRepository(DiscoveryHistoryEntity);
    const usageRepo = ds.getRepository(DailyUsageEntity);
    const userRepo = ds.getRepository(UserEntity);

    // ---- Step 1: Build query embedding via keyword matching ----
    const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const queryWords = removeAccents(query.toLowerCase()).split(/[\s,.;:!?()/\\]+/).filter((w) => w.length > 2);

    // Find distinct categoriaIA values that match any query word
    const distinctCategories = await empresaRepo
      .createQueryBuilder('e')
      .select('DISTINCT e.categoriaIA', 'categoriaIA')
      .getRawMany();

    const matchingCategories: string[] = [];
    for (const row of distinctCategories) {
      if (!row.categoriaIA) continue;
      const catLower = removeAccents(row.categoriaIA.toLowerCase());
      const matches = queryWords.some((word) => catLower.includes(word));
      if (matches) matchingCategories.push(row.categoriaIA);
    }

    // Get embedding centers for matching categories
    let queryEmbedding: number[] = [];

    if (matchingCategories.length > 0) {
      const categoryEmbeddings = await empresaRepo
        .createQueryBuilder('e')
        .select('e.embedding', 'embedding')
        .where('e.categoriaIA IN (:...cats)', { cats: matchingCategories })
        .andWhere('e.embedding IS NOT NULL')
        .getRawMany();

      const vectors: number[][] = [];
      for (const row of categoryEmbeddings) {
        const vec = parseEmbedding(row.embedding);
        if (vec.length > 0) vectors.push(vec);
      }

      if (vectors.length > 0) {
        queryEmbedding = averageVectors(vectors);
      }
    }

    // If no query embedding could be built, create a random vector
    if (queryEmbedding.length === 0) {
      const sampleEmbeddings = await empresaRepo
        .createQueryBuilder('e')
        .select('e.embedding', 'embedding')
        .where('e.embedding IS NOT NULL')
        .limit(1)
        .getRawMany();

      if (sampleEmbeddings.length > 0) {
        const sampleLen = parseEmbedding(sampleEmbeddings[0].embedding).length;
        queryEmbedding = Array.from({ length: sampleLen }, () => Math.random() * 2 - 1);
      } else {
        // No embeddings at all — return empty
        const result: ResponseDTO<any> = {
          response: [],
          mensagem: 'Nenhuma empresa encontrada.',
          sucesso: true,
        };
        return NextResponse.json(result);
      }
    }

    // ---- Step 2: Load user blocks and cooldowns ----
    const blocked = await blockRepo.find({ where: { userId: payload.userId } });
    const blockedIds = new Set(blocked.map((b) => b.empresaId));

    const weekStart = getISOWeekStart();
    const cooldowns = await cooldownRepo
      .createQueryBuilder('gc')
      .where('gc.userId = :userId', { userId: payload.userId })
      .andWhere('gc.weekStart = :weekStart', { weekStart })
      .getMany();
    const cooldownMap = new Map<string, GlobalCooldownEntity>();
    for (const cd of cooldowns) {
      cooldownMap.set(cd.empresaId, cd);
    }

    // ---- Step 3: Query empresas with optional filters ----
    const qb = empresaRepo
      .createQueryBuilder('e')
      .where('e.embedding IS NOT NULL');

    if (estado) {
      qb.andWhere('e.estado = :estado', { estado });
    }
    if (municipio) {
      qb.andWhere('e.municipio = :municipio', { municipio });
    }
    if (porte) {
      const dbPorte = porte.replace(/\s*\(.*?\)\s*/g, '').trim();
      qb.andWhere('e.porte = :porte', { porte: dbPorte });
    }

    const allEmpresas = await qb.getMany();

    // ---- Step 4: Score + apply exposure rules ----
    const scored: ScoredEmpresa[] = [];

    for (const emp of allEmpresas) {
      // Block rule
      if (blockedIds.has(emp.id)) continue;

      // Cooldown rule: if shown 2+ times this week, skip
      const cd = cooldownMap.get(emp.id);
      if (cd && cd.exposures >= 2) continue;

      // Cosine similarity
      const emb = parseEmbedding(emp.embedding);
      const sim = emb.length === queryEmbedding.length
        ? cosineSimilarity(queryEmbedding, emb)
        : 0;

      scored.push({ empresa: emp, score: sim });
    }

    // Sort by similarity descending
    scored.sort((a, b) => b.score - a.score);

    // ---- Step 5: Paginate ----
    const total = scored.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = page * limit;
    const pageResults = scored.slice(start, start + limit);

    // ---- Step 6: Record history + update cooldowns ----
    for (const item of pageResults) {
      // Discovery history
      const history = new DiscoveryHistoryEntity();
      history.id = uuidv4();
      history.empresaId = item.empresa.id;
      history.cnpj = item.empresa.cnpj;
      history.userId = payload.userId;
      await historyRepo.save(history);

      // Cooldown
      const existingCd = cooldownMap.get(item.empresa.id);
      if (existingCd) {
        existingCd.exposures += 1;
        await cooldownRepo.save(existingCd);
      } else {
        const newCd = new GlobalCooldownEntity();
        newCd.id = uuidv4();
        newCd.empresaId = item.empresa.id;
        newCd.userId = payload.userId;
        newCd.exposures = 1;
        newCd.weekStart = weekStart;
        await cooldownRepo.save(newCd);
      }
    }

    // ---- Step 7: Increment daily usage ----
    const today = getTodayStr();
    let usage = await usageRepo.findOneBy({ userId: payload.userId, usageDate: today });
    if (!usage) {
      usage = new DailyUsageEntity();
      usage.id = uuidv4();
      usage.userId = payload.userId;
      usage.usageDate = today;
      usage.viewsCount = pageResults.length;
      await usageRepo.save(usage);
    } else {
      usage.viewsCount += pageResults.length;
      await usageRepo.save(usage);
    }

    // ---- Step 8: Serialize ----
    const serialized = pageResults.map((item) => ({
      ...serializeEmpresa(item.empresa),
      similarityScore: Math.round(item.score * 10000) / 10000,
    }));

    const result: ResponseDTO<any> = {
      response: serialized,
      mensagem: `${serialized.length} empresas encontradas (total: ${total}).`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
