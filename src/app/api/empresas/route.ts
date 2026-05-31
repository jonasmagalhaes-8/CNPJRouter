import { NextRequest, NextResponse } from 'next/server';
import { initializeDataSource } from '@/app/database/connection';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { UserBlockEntity } from '@/app/database/entities/UserBlock';
import { SegmentationEntity } from '@/app/database/entities/Segmentation';
import { FavoriteEntity } from '@/app/database/entities/Favorite';
import { DailyUsageEntity } from '@/app/database/entities/DailyUsage';
import { GlobalCooldownEntity } from '@/app/database/entities/GlobalCooldown';
import { DiscoveryHistoryEntity } from '@/app/database/entities/DiscoveryHistory';
import { getISOWeekStart, getTodayStr } from '@/app/utils/dateUtils';
import { cosineSimilarity, averageVectors } from '@/app/utils/vectors';
import { SemanticEmbeddingEngine } from '@/app/utils/SemanticEmbeddingEngine';
import { verifyToken } from '@/app/middleware/auth';
import type { NicheDTO } from '@/app/dtos/NicheDTO';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';
import { v4 as uuidv4 } from 'uuid';

const parseEmbedding = (str: string | null): number[] => {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const serializeEmpresa = (e: EmpresaEntity) => ({
  id: e.id,
  cnpj: e.cnpj,
  razaoSocial: e.razaoSocial,
  nomeFantasia: e.nomeFantasia,
  cnaePrincipal: e.cnaePrincipal,
  cnaeDescricao: e.cnaeDescricao,
  situacaoCadastral: e.situacaoCadastral,
  porte: e.porte,
  municipio: e.municipio,
  estado: e.estado,
  bairro: e.bairro,
  endereco: e.endereco,
  logradouro: e.logradouro,
  cep: e.cep,
  telefone: e.telefone,
  email: e.email,
  socio: e.socio,
  categoriaIA: e.categoriaIA,
});

const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

// Calculate embedding for a niche (either from source or by text)
const getNicheEmbedding = async (niche: NicheDTO, ds: any): Promise<number[]> => {
  if (niche.type === 'LOOKALIKE' && niche.sourceEmbedding && niche.sourceEmbedding.length > 0) {
    return niche.sourceEmbedding;
  }
  
  const queryWords = removeAccents(niche.name.toLowerCase()).split(/[\s,.;:!?()/\\]+/).filter(w => w.length > 2);
  const empresaRepo = ds.getRepository(EmpresaEntity);
  const distinctCategories = await empresaRepo.createQueryBuilder('e').select('DISTINCT e.categoriaIA', 'categoriaIA').getRawMany();
  
  const matchingCategories = distinctCategories
    .map((r: any) => r.categoriaIA)
    .filter((cat: any) => {
      if (!cat) return false;
      const normalizedCat = removeAccents(cat.toLowerCase());
      return queryWords.some(w => normalizedCat.includes(w));
    });
    
  if (matchingCategories.length > 0) {
    const categoryEmbeddings = await empresaRepo.createQueryBuilder('e')
      .select('e.embedding', 'embedding')
      .where('e.categoriaIA IN (:...cats)', { cats: matchingCategories })
      .andWhere('e.embedding IS NOT NULL')
      .getRawMany();
      
    const vectors = categoryEmbeddings.map((r: any) => parseEmbedding(r.embedding)).filter((v: any) => v.length > 0);
    if (vectors.length > 0) return averageVectors(vectors);
  }

  return SemanticEmbeddingEngine.calculateEmbeddingForText(niche.name);
};

export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const { searchParams } = new URL(request.url);

    // Filters Dropdown
    const estado = searchParams.get('estado') || '';
    const municipio = searchParams.get('municipio') || '';
    const categoriaIA = searchParams.get('categoriaIA') || '';
    const porte = searchParams.get('porte') || '';
    const periodo = searchParams.get('periodo') || '';
    const favoritesOnly = searchParams.get('favorites') === 'true';

    // Convert periodo label to a cutoff date string (YYYY-MM-DD)
    let periodoCutoff: string | null = null;
    if (periodo) {
      const now = new Date();
      const cutoff = new Date(now);
      if (periodo === 'Este mês') {
        cutoff.setDate(1); // first day of current month
      } else if (periodo === 'Últimos 3 meses') {
        cutoff.setMonth(cutoff.getMonth() - 3);
      } else if (periodo === 'Últimos 6 meses') {
        cutoff.setMonth(cutoff.getMonth() - 6);
      } else if (periodo === 'Últimos 12 meses') {
        cutoff.setFullYear(cutoff.getFullYear() - 1);
      }
      // Format as YYYY-MM-DD for string comparison (dataAbertura is text in same format)
      periodoCutoff = cutoff.toISOString().slice(0, 10);
    }
    
    // Batch limit (Page size)
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 0;
    const limitParam = searchParams.get('limit');
    const batchSize = limitParam ? parseInt(limitParam, 10) : 10;
    
    let skipGeneration = false;

    // ---- Load Blocks and Cooldowns ----
    const blockRepo = ds.getRepository(UserBlockEntity);
    const blocked = await blockRepo.find({ where: { userId: payload.userId } });
    const blockedIds = new Set(blocked.map((b) => b.empresaId));

    const cooldownRepo = ds.getRepository(GlobalCooldownEntity);
    const weekStart = getISOWeekStart();
    const activeCooldowns = await cooldownRepo
      .createQueryBuilder('gc')
      .where('gc.weekStart = :weekStart', { weekStart })
      .getMany();
      
    // Exclude companies that have been exposed to ANYONE (>= 2 exposures)
    const globalCooldownIds = new Set(
      activeCooldowns.filter(cd => cd.exposures >= 2).map(cd => cd.empresaId)
    );
    
    const cooldownMap = new Map<string, GlobalCooldownEntity>();
    for (const cd of activeCooldowns) {
      cooldownMap.set(cd.empresaId, cd);
    }

    // ---- Load User Discovery History ----
    const historyRepo = ds.getRepository(DiscoveryHistoryEntity);
    const userHistory = await historyRepo.find({ where: { userId: payload.userId } });
    const discoveredIds = new Set(userHistory.map(h => h.empresaId));

    // ---- Load Segmentations ----
    const segRepo = ds.getRepository(SegmentationEntity);
    const seg = await segRepo.findOneBy({ userId: payload.userId });
    const niches: NicheDTO[] = seg && seg.segmentationData ? JSON.parse(seg.segmentationData) : [];

    // ---- Load All Companies ----
    const empresaRepo = ds.getRepository(EmpresaEntity);
    const allEmpresas = await empresaRepo.find({ order: { dataAbertura: 'DESC' } });

    let finalBatch: EmpresaEntity[] = [];

    if (niches.length > 0) {
      // Pre-calculate target embeddings for all niches to avoid N+1 DB queries
      const nicheEmbeddings = new Map<string, number[]>();
      for (const niche of niches) {
         nicheEmbeddings.set(niche.id, await getNicheEmbedding(niche, ds));
      }

      // 1. Map all quotas requested by user (porteId -> desired quantity)
      const quotas = new Map<string, { desired: number; fulfilled: number }>();
      
      for (const niche of niches) {
        for (const geo of niche.geographies) {
          for (const p of geo.portes) {
            quotas.set(p.id, { desired: p.quantity, fulfilled: 0 });
          }
          for (const c of geo.cities) {
            for (const p of c.portes) {
              quotas.set(p.id, { desired: p.quantity, fulfilled: 0 });
            }
          }
        }
      }

      // 2. Helper to match a company against Geographies and return matched PorteId
      const getMatchedPorteId = (e: EmpresaEntity, niche: NicheDTO): string | null => {
        const normalizePorte = (p: string) => p.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();

        if (niche.scope === 'NACIONAL') {
          const geo = niche.geographies[0];
          if (geo && geo.portes && geo.portes.length > 0) {
            const matchPorte = geo.portes.find(p => normalizePorte(p.porte) === normalizePorte(e.porte));
            return matchPorte ? matchPorte.id : null;
          }
          return null; // Should not happen if UI forces portes
        }

        if (niche.geographies && niche.geographies.length > 0) {
          for (const g of niche.geographies) {
            if (g.state !== 'BRASIL' && e.estado !== g.state) continue;

            if (g.cities && g.cities.length > 0) {
              const cityMatch = g.cities.find(c => c.name === e.municipio);
              if (!cityMatch) continue;

              if (cityMatch.portes && cityMatch.portes.length > 0) {
                const matchPorte = cityMatch.portes.find(p => normalizePorte(p.porte) === normalizePorte(e.porte));
                if (matchPorte) return matchPorte.id;
              }
            } else {
              if (g.portes && g.portes.length > 0) {
                const matchPorte = g.portes.find(p => normalizePorte(p.porte) === normalizePorte(e.porte));
                if (matchPorte) return matchPorte.id;
              }
            }
          }
        }
        return null;
      };

      // 3. Subtract from quotas based on user's ALREADY DISCOVERED history
      const historyEmpresas = allEmpresas.filter(e => discoveredIds.has(e.id));
      for (const e of historyEmpresas) {
        for (const niche of niches) {
          // We use semantic embedding similarity to decide if a historical company matches this niche
          const targetEmb = nicheEmbeddings.get(niche.id) || [];
          const empEmb = parseEmbedding(e.embedding);
          const score = (empEmb.length === targetEmb.length) ? cosineSimilarity(targetEmb, empEmb) : 0;
          
          // Consider a match if score is above a reasonable semantic threshold, or if it's the only way to deduct
          if (score < 0.7) continue;
          
          const matchedPorteId = getMatchedPorteId(e, niche);
          if (matchedPorteId) {
            const q = quotas.get(matchedPorteId);
            if (q) q.fulfilled++;
            break; // Counted once
          }
        }
      }

      // 3.5. RESTORE 24H HISTORY IF PAGE === 0
      if (page === 0) {
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        
        const recentHistoryIds = new Set(
          userHistory.filter(h => new Date(h.viewedAt) >= yesterday).map(h => h.empresaId)
        );
        
        const recentHistoryEmpresas = historyEmpresas.filter(e => recentHistoryIds.has(e.id));
        
        // Only restore those that STILL match the current niches via embeddings
        for (const emp of recentHistoryEmpresas) {
           for (const niche of niches) {
             const targetEmb = nicheEmbeddings.get(niche.id) || [];
             const empEmb = parseEmbedding(emp.embedding);
             const score = (empEmb.length === targetEmb.length) ? cosineSimilarity(targetEmb, empEmb) : 0;
             
             if (score < 0.7) continue;

             const matchedPorteId = getMatchedPorteId(emp, niche);
             if (matchedPorteId) {
                finalBatch.push(emp);
                break;
             }
           }
        }

        if (finalBatch.length >= batchSize) {
          // If we restored enough to fill a page, skip generating new ones until they click "Next Page" (page > 0)
          skipGeneration = true;
        }
      }

      if (!skipGeneration) {
        // 4. Find FRESH companies (Not discovered, not blocked, not locked globally)
        let availableEmpresas = allEmpresas.filter(e => 
          !discoveredIds.has(e.id) && 
          !blockedIds.has(e.id) && 
          !globalCooldownIds.has(e.id)
        );

      // Apply Post-Filters early to save computation (Dropdowns)
      availableEmpresas = availableEmpresas.filter(e => {
        if (estado && e.estado !== estado) return false;
        if (municipio && e.municipio !== municipio) return false;
        if (categoriaIA && e.categoriaIA !== categoriaIA) return false;

        if (porte) {
          const normalizePorte = (p: string) => p.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
          if (normalizePorte(e.porte) !== normalizePorte(porte)) return false;
        }

        // Date filter: dataAbertura is 'YYYY-MM-DD' text — string comparison works correctly
        if (periodoCutoff && e.dataAbertura) {
          if (e.dataAbertura < periodoCutoff) return false;
        }

        return true;
      });

      // ---- Favorites filter ----
      let favIds: Set<string> | null = null;
      if (favoritesOnly) {
        const favRepo = ds.getRepository(FavoriteEntity);
        const favs = await favRepo.find({ where: { userId: payload.userId } });
        favIds = new Set(favs.map((f) => f.empresaId));
        availableEmpresas = availableEmpresas.filter(e => favIds!.has(e.id));
      }

      const deduplicator = new Set<string>();

      // 5. Fulfill remaining quotas using Semantic Embeddings for ALL niches (NICHE & LOOKALIKE)
      for (const niche of niches) {
        const targetEmb = nicheEmbeddings.get(niche.id) || [];
        if (targetEmb.length === 0) continue;

        // Evaluate all remaining available against this Niche's embedding
        const candidates = availableEmpresas
          .filter(e => !deduplicator.has(e.id) && e.cnpj !== niche.name)
          .map(e => {
            const emb = parseEmbedding(e.embedding);
            const score = emb.length === targetEmb.length ? cosineSimilarity(targetEmb, emb) : 0;
            return { emp: e, score, porteId: getMatchedPorteId(e, niche) };
          })
          .filter(e => e.porteId !== null && e.score >= 0.7); // Must match a geography/porte rule AND meet minimum semantic score

        // Sort by closest semantic match
        candidates.sort((a, b) => b.score - a.score);

        // Take from the top down, filling quotas
        for (const candidate of candidates) {
          const q = quotas.get(candidate.porteId as string);
          if (q && q.fulfilled < q.desired) {
            q.fulfilled++;
            deduplicator.add(candidate.emp.id);
            finalBatch.push(candidate.emp);
          }
        }
      }
      } // close if (!skipGeneration)
    } else {
      // No segmentations configured (Should not happen per UI rules, but fallback)
      if (page === 0) {
         // Fallback logic for empty segmentations: not strictly required, but keeping safe
      }
      if (finalBatch.length === 0) {
        finalBatch = allEmpresas
          .filter(e => !discoveredIds.has(e.id) && !blockedIds.has(e.id) && !globalCooldownIds.has(e.id))
          .slice(0, batchSize);
      }
    }

    if (!skipGeneration || niches.length === 0) {
      // 7. Limit to requested batch size (e.g. 10) only for NEW generations
      finalBatch = finalBatch.slice(0, batchSize);

      // ---- Burn these NEW results (History + Cooldown) ----
      for (const emp of finalBatch) {
        const history = new DiscoveryHistoryEntity();
        history.id = uuidv4();
        history.empresaId = emp.id;
        history.cnpj = emp.cnpj;
        history.userId = payload.userId;
        await historyRepo.save(history);

        const existingCd = cooldownMap.get(emp.id);
        if (existingCd) {
          existingCd.exposures += 1;
          await cooldownRepo.save(existingCd);
        } else {
          const newCd = new GlobalCooldownEntity();
          newCd.id = uuidv4();
          newCd.empresaId = emp.id;
          newCd.userId = payload.userId;
          newCd.exposures = 1;
          newCd.weekStart = weekStart;
          await cooldownRepo.save(newCd);
        }
      }
    }

    // ---- Increment daily usage only for new discoveries ----
    if (finalBatch.length > 0 && (!skipGeneration || niches.length === 0)) {
      const usageRepo = ds.getRepository(DailyUsageEntity);
      const today = getTodayStr();
      let usage = await usageRepo.findOneBy({ userId: payload.userId, usageDate: today });
      if (!usage) {
        usage = new DailyUsageEntity();
        usage.id = uuidv4();
        usage.userId = payload.userId;
        usage.usageDate = today;
        usage.viewsCount = finalBatch.length;
        await usageRepo.save(usage);
      } else {
        usage.viewsCount += finalBatch.length;
        await usageRepo.save(usage);
      }
    }

    // ---- Serialize ----
    const serialized = finalBatch.map(serializeEmpresa);

    const result: ResponseDTO<any> = {
      response: serialized,
      mensagem: `${serialized.length} empresas recém-descobertas.`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}
