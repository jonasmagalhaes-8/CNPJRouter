export interface CityItem { 
  id: string; 
  name: string; 
  quota: number;
}

export interface GeoIntelligence {
  id: string;
  state: string;
  cities: CityItem[];
  baseQuota: number;
}

export interface NicheItem { 
  id: string; 
  name: string; 
  scope: 'NACIONAL' | 'REGIONAL';
  period: string;
  geographies: GeoIntelligence[];
}

export interface EmpresaModel {
  id: string;
  nome: string;
  cnpj: string;
  nicho: string;
  estado: string;
  cidade: string;
  bairro: string;
  telefone: string;
  email: string;
  whatsapp: string;
  score: number;
  socio: string;
  receita: string;
  funcionarios: string;
  dataAbertura: string;
}

export class SearchController {
  static generateMockData(niches: NicheItem[], limit: number): EmpresaModel[] {
    const results: EmpresaModel[] = [];
    
    niches.forEach(niche => {
      niche.geographies.forEach(geo => {
        if (geo.cities.length > 0) {
          geo.cities.forEach(city => {
            for (let i = 0; i < city.quota; i++) {
              results.push(this.createMockEmpresa(niche.name, geo.state, city.name, niche.period));
            }
          });
        } else {
          for (let i = 0; i < geo.baseQuota; i++) {
            results.push(this.createMockEmpresa(niche.name, geo.state, 'Capital', niche.period));
          }
        }
      });
    });
    
    return results;
  }

  private static createMockEmpresa(nicho: string, estado: string, cidade: string, period: string): EmpresaModel {
    const socios = ['Ricardo Santos', 'Ana Paula Oliveira', 'Marcos Pereira', 'Juliana Costa', 'Fernando Souza'];
    const receitas = ['R$ 150k - 500k', 'R$ 500k - 2M', 'R$ 2M - 10M', 'R$ 10M+', 'Sob Consulta'];
    const funcionarios = ['1-5', '6-20', '21-50', '51-200', '201+'];

    return {
      id: Math.random().toString(36).substr(2, 9),
      nome: `${nicho.toUpperCase()} ${['S.A.', 'LTDA', 'EIRELI', 'SOLUÇÕES'][Math.floor(Math.random() * 4)]}`,
      cnpj: `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}/0001-${Math.floor(Math.random() * 90 + 10)}`,
      nicho,
      estado: estado === 'TODOS' ? 'Nacional' : estado,
      cidade,
      bairro: ['Centro', 'Jardins', 'Vila Nova', 'Industrial', 'Setor Oeste'][Math.floor(Math.random() * 5)],
      telefone: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      email: `contato@${nicho.toLowerCase().replace(/\s/g, '')}${Math.floor(Math.random()*1000)}.com.br`,
      whatsapp: 'Disponível',
      score: Math.floor(Math.random() * 40 + 60),
      socio: socios[Math.floor(Math.random() * socios.length)],
      receita: receitas[Math.floor(Math.random() * receitas.length)],
      funcionarios: funcionarios[Math.floor(Math.random() * funcionarios.length)],
      dataAbertura: period
    };
  }
}
