import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeDataSource } from '@/app/database/connection';
import { NicheEntity } from '@/app/database/entities/Niche';
import { GeoIntelligenceEntity } from '@/app/database/entities/GeoIntelligence';
import { CityEntity } from '@/app/database/entities/City';
import { PorteConfigEntity } from '@/app/database/entities/PorteConfig';
import { EmpresaEntity } from '@/app/database/entities/Empresa';
import { verifyToken } from '@/app/middleware/auth';
import { IsNull } from 'typeorm';
import type { ResponseDTO } from '@/app/dtos/ResponseDTO';
import type { NicheDTO } from '@/app/dtos/NicheDTO';

const SOCIOS = ['Ricardo Santos', 'Ana Paula Oliveira', 'Marcos Pereira', 'Juliana Costa', 'Fernando Souza'];
const RECEITAS = ['R$ 150k - 500k', 'R$ 500k - 2M', 'R$ 2M - 10M', 'R$ 10M+', 'Sob Consulta'];
const BAIRROS = ['Centro', 'Jardins', 'Vila Nova', 'Industrial', 'Setor Oeste'];
const SUFIXOS = ['S.A.', 'LTDA', 'EIRELI', 'SOLUÇÕES'];
const PORTE_FUNC: Record<string, string> = {
  'Microempresa (ME)': '1-5', 'Pequena Empresa': '6-20',
  'Média Empresa': '21-200', 'Grande Empresa': '201+',
};

interface NichePayload {
  id: string;
  name: string;
  scope: string;
  geographies: Array<{
    id: string;
    state: string;
    cities: Array<{
      id: string;
      name: string;
      portes: Array<{ id: string; porte: string; period: string; quantity: number }>;
    }>;
    portes: Array<{ id: string; porte: string; period: string; quantity: number }>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const body: { niches: NicheDTO[]; limit: number } = await request.json();
    const { niches } = body;

    /* Clean previous data for this user */
    const nicheRepo = ds.getRepository(NicheEntity);
    const geoRepo = ds.getRepository(GeoIntelligenceEntity);
    const cityRepo = ds.getRepository(CityEntity);
    const porteRepo = ds.getRepository(PorteConfigEntity);
    const empresaRepo = ds.getRepository(EmpresaEntity);

    const oldNiches = await nicheRepo.find({ where: { userId: payload.userId } });
    if (oldNiches.length > 0) {
      const nicheIds = oldNiches.map((n) => n.id);
      const oldGeos = await geoRepo.createQueryBuilder()
        .where('nicheId IN (:...nicheIds)', { nicheIds }).getMany();
      const geoIds = oldGeos.map((g) => g.id);
      if (geoIds.length > 0) {
        const oldCities = await cityRepo.createQueryBuilder()
          .where('geoId IN (:...geoIds)', { geoIds }).getMany();
        const cityIds = oldCities.map((c) => c.id);
        if (cityIds.length > 0) {
          await porteRepo.createQueryBuilder()
            .delete().where('cityId IN (:...cityIds)', { cityIds }).execute();
        }
        await porteRepo.createQueryBuilder()
          .delete().where('geoId IN (:...geoIds)', { geoIds }).execute();
        await cityRepo.createQueryBuilder()
          .delete().where('geoId IN (:...geoIds)', { geoIds }).execute();
      }
      await geoRepo.createQueryBuilder()
        .delete().where('nicheId IN (:...nicheIds)', { nicheIds }).execute();
    }

    await empresaRepo.delete({ userId: payload.userId });
    await nicheRepo.delete({ userId: payload.userId });

    const allEmpresas: Partial<EmpresaEntity>[] = [];

    for (const niche of niches) {
      const nicheEntity = new NicheEntity();
      nicheEntity.id = niche.id || uuidv4();
      nicheEntity.name = niche.name;
      nicheEntity.scope = niche.scope;
      nicheEntity.userId = payload.userId;
      await nicheRepo.save(nicheEntity);

      for (const geo of niche.geographies) {
        const geoEntity = new GeoIntelligenceEntity();
        geoEntity.id = geo.id || uuidv4();
        geoEntity.state = geo.state;
        geoEntity.nicheId = nicheEntity.id;
        await geoRepo.save(geoEntity);

        if (geo.cities.length > 0) {
          for (const city of geo.cities) {
            const cityEntity = new CityEntity();
            cityEntity.id = city.id || uuidv4();
            cityEntity.name = city.name;
            cityEntity.geoId = geoEntity.id;
            await cityRepo.save(cityEntity);

            for (const pc of city.portes) {
              const pcEntity = new PorteConfigEntity();
              pcEntity.id = pc.id || uuidv4();
              pcEntity.porte = pc.porte;
              pcEntity.period = pc.period || '';
              pcEntity.quantity = pc.quantity;
              pcEntity.geoId = geoEntity.id;
              pcEntity.cityId = cityEntity.id;
              await porteRepo.save(pcEntity);

              for (let i = 0; i < pc.quantity; i++) {
                allEmpresas.push(createMockEmpresa(
                  niche.name, geo.state, city.name, pc.period || '', pc.porte, payload.userId,
                ));
              }
            }
          }
        } else {
          for (const pc of geo.portes) {
            const pcEntity = new PorteConfigEntity();
            pcEntity.id = pc.id || uuidv4();
            pcEntity.porte = pc.porte;
            pcEntity.period = pc.period || '';
            pcEntity.quantity = pc.quantity;
            pcEntity.geoId = geoEntity.id;
            pcEntity.cityId = null;
            await porteRepo.save(pcEntity);

            for (let i = 0; i < pc.quantity; i++) {
              allEmpresas.push(createMockEmpresa(
                niche.name, geo.state, 'Todas', pc.period || '', pc.porte, payload.userId,
              ));
            }
          }
        }
      }
    }

    if (allEmpresas.length > 0) {
      await empresaRepo.save(allEmpresas);
    }

    const result: ResponseDTO<{ count: number }> = {
      response: { count: allEmpresas.length },
      mensagem: `${allEmpresas.length} empresas geradas com sucesso!`,
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      const error: ResponseDTO<null> = { response: null, mensagem: 'Não autorizado.', sucesso: false };
      return NextResponse.json(error, { status: 401 });
    }

    const ds = await initializeDataSource();
    const nicheRepo = ds.getRepository(NicheEntity);
    const geoRepo = ds.getRepository(GeoIntelligenceEntity);
    const cityRepo = ds.getRepository(CityEntity);
    const porteRepo = ds.getRepository(PorteConfigEntity);

    const niches = await nicheRepo.find({ where: { userId: payload.userId } });

    const serialized: any[] = [];
    for (const n of niches) {
      const geos = await geoRepo.find({ where: { nicheId: n.id } });
      const geoData: any[] = [];
      for (const g of geos) {
        const cities = await cityRepo.find({ where: { geoId: g.id } });
        const geoPortes = await porteRepo.find({ where: { geoId: g.id, cityId: IsNull() } });
        const cityData: any[] = [];
        for (const c of cities) {
          const cityPortes = await porteRepo.find({ where: { cityId: c.id } });
          cityData.push({
            id: c.id, name: c.name,
            portes: cityPortes.map((p) => ({ id: p.id, porte: p.porte, period: p.period, quantity: p.quantity })),
          });
        }
        geoData.push({
          id: g.id, state: g.state, cities: cityData,
          portes: geoPortes.map((p) => ({ id: p.id, porte: p.porte, period: p.period, quantity: p.quantity })),
        });
      }
      serialized.push({ id: n.id, name: n.name, scope: n.scope, geographies: geoData });
    }

    const result: ResponseDTO<typeof serialized> = {
      response: serialized,
      mensagem: 'Segmentação carregada.',
      sucesso: true,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno do servidor.';
    const error: ResponseDTO<null> = { response: null, mensagem: message, sucesso: false };
    return NextResponse.json(error, { status: 500 });
  }
}

function createMockEmpresa(
  nicho: string, estado: string, cidade: string, period: string, porte: string, userId: string,
): Partial<EmpresaEntity> {
  const nome = `${nicho.toUpperCase()} ${SUFIXOS[Math.floor(Math.random() * SUFIXOS.length)]}`;
  const cnpj = `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}/0001-${Math.floor(Math.random() * 90 + 10)}`;

  return {
    id: uuidv4(),
    nome,
    cnpj,
    nicho,
    estado: estado === 'TODOS' ? 'Nacional' : estado,
    cidade,
    bairro: BAIRROS[Math.floor(Math.random() * BAIRROS.length)],
    telefone: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    email: `contato@${nicho.toLowerCase().replace(/\s/g, '')}${Math.floor(Math.random() * 1000)}.com.br`,
    score: Math.floor(Math.random() * 40 + 60),
    socio: SOCIOS[Math.floor(Math.random() * SOCIOS.length)],
    receita: RECEITAS[Math.floor(Math.random() * RECEITAS.length)],
    funcionarios: PORTE_FUNC[porte] || '1-5',
    porte,
    dataAbertura: period,
    isBlocked: false,
    userId,
  };
}
