import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { DiscoveryHistoryEntity } from '@/app/database/entities/DiscoveryHistory';
import { UserBlockEntity } from '@/app/database/entities/UserBlock';
import { DailyUsageEntity } from '@/app/database/entities/DailyUsage';
import { GlobalCooldownEntity } from '@/app/database/entities/GlobalCooldown';
import { verifyToken } from '@/app/middleware/auth';
import { cosineSimilarity } from '@/app/utils/vectors';
import { getISOWeekStart, getTodayStr } from '@/app/utils/dateUtils';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';

interface LookalikeBody {
  cnpj: string;
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

    const body: LookalikeBody = await request.json();
    const { cnpj, limit = 20 } = body;

    if (!cnpj || typeof cnpj !== 'string') {
      const error: ResponseDTO<null> = { response: null, mensagem: 'CNPJ é obrigatório.', sucesso: false };
      return NextResponse.json(error, { status: 400 });
    }

    const ds = await initializeDataSource();
    const empresaRepo = ds.getRepository(EmpresaEntity);
    const blockRepo = ds.getRepository(UserBlockEntity);
    const cooldownRepo = ds.getRepository(GlobalCooldownEntity);
    const historyRepo = ds.getRepository(DiscoveryHistoryEntity);
    const usageRepo = ds.getRepository(DailyUsageEntity);

    // ---- Step 1: Sempre buscar os dados do CNPJ na API (não checar banco local) ----
    const { CnpjLookupService } = await import('@/app/services/CnpjLookupService');
    const lookupService = new CnpjLookupService();
    const apiData = await lookupService.lookupWithFallback(cnpj);

    if (!apiData) {
      const error: ResponseDTO<null> = {
        response: null,
        mensagem: `Empresa com CNPJ "${cnpj}" não encontrada nas APIs externas.`,
        sucesso: false,
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Map API data to an in-memory EmpresaEntity
    let sourceEmpresa = new EmpresaEntity();
    sourceEmpresa.id = 'temp-external-id';
    sourceEmpresa.cnpj = apiData.cnpj;
    sourceEmpresa.razaoSocial = apiData.razaoSocial;
    sourceEmpresa.nomeFantasia = apiData.nomeFantasia || '';
    sourceEmpresa.cnaePrincipal = apiData.cnaePrincipal;
    sourceEmpresa.cnaeDescricao = apiData.cnaeDescricao;
    sourceEmpresa.situacaoCadastral = apiData.situacaoCadastral;
    sourceEmpresa.porte = apiData.porte;
    sourceEmpresa.estado = apiData.estado;
    sourceEmpresa.municipio = apiData.municipio;
    sourceEmpresa.bairro = apiData.bairro;
    sourceEmpresa.logradouro = apiData.logradouro;
    sourceEmpresa.cep = apiData.cep;
    
    // Assign an embedding mathematically based on the CNAE Description
    const { SemanticEmbeddingEngine } = await import('@/app/utils/SemanticEmbeddingEngine');
    let sourceEmbedding = SemanticEmbeddingEngine.calculateEmbeddingForText(apiData.cnaeDescricao);
    sourceEmpresa.categoriaIA = apiData.cnaeDescricao; // Use the raw description as the category

    if (sourceEmbedding.length === 0) {
      const error: ResponseDTO<null> = {
        response: null,
        mensagem: 'Não foi possível determinar o vetor IA para esta empresa. Não é possível fazer lookalike.',
        sucesso: false,
      };
      return NextResponse.json(error, { status: 400 });
    }

    // ---- Step 2: Load blocks and cooldowns ----
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

    // ---- Step 3: Get all other empresas with embeddings ----
    const allEmpresas = await empresaRepo
      .createQueryBuilder('e')
      .where('e.embedding IS NOT NULL')
      .andWhere('e.id != :id', { id: sourceEmpresa.id })
      .getMany();

    // ---- Step 4: Score + apply exposure rules ----
    const scored: ScoredEmpresa[] = [];

    for (const emp of allEmpresas) {
      if (blockedIds.has(emp.id)) continue;

      const cd = cooldownMap.get(emp.id);
      if (cd && cd.exposures >= 2) continue;

      const emb = parseEmbedding(emp.embedding);
      const sim = emb.length === sourceEmbedding.length
        ? cosineSimilarity(sourceEmbedding, emb)
        : 0;

      scored.push({ empresa: emp, score: sim });
    }

    // Sort by similarity descending
    scored.sort((a, b) => b.score - a.score);

    // Take top N
    const topResults = scored.slice(0, limit);

    // ---- Step 5: Record history + update cooldowns ----
    for (const item of topResults) {
      const history = new DiscoveryHistoryEntity();
      history.id = uuidv4();
      history.empresaId = item.empresa.id;
      history.cnpj = item.empresa.cnpj;
      history.userId = payload.userId;
      await historyRepo.save(history);

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

    // ---- Step 6: Increment daily usage ----
    const today = getTodayStr();
    let usage = await usageRepo.findOneBy({ userId: payload.userId, usageDate: today });
    if (!usage) {
      usage = new DailyUsageEntity();
      usage.id = uuidv4();
      usage.userId = payload.userId;
      usage.usageDate = today;
      usage.viewsCount = topResults.length;
      await usageRepo.save(usage);
    } else {
      usage.viewsCount += topResults.length;
      await usageRepo.save(usage);
    }

    // ---- Step 7: Serialize ----
    const serialized = topResults.map((item) => ({
      ...serializeEmpresa(item.empresa),
      similarityScore: Math.round(item.score * 10000) / 10000,
    }));

    const result: ResponseDTO<any> = {
      response: serialized,
      mensagem: `${serialized.length} empresas similares encontradas.`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
