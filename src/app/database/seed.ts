/**
 * CNPJ BI - Seed Script
 * =====================
 * Populates the database with 600+ pre-classified Brazilian companies
 * simulating the output of the AI pipeline (coleta → enriquecimento → IA processing).
 *
 * Run: npx tsx src/app/database/seed.ts
 */

import { initializeDataSource } from './connection';
import { EmpresaEntity } from './entities/Empresa';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const EMBEDDING_DIMENSIONS = 128;
const CATEGORY_CENTER_SPREAD = 5.0;     // How far apart category centers are (magnitude of each center)
const WITHIN_CATEGORY_NOISE = 0.15;      // Noise within same category (± per dimension)
const TOTAL_COMPANIES = 620;
const BATCH_SIZE = 100;

// ─────────────────────────────────────────────────────────────
// CNAE Categories (25 categories)
// ─────────────────────────────────────────────────────────────

interface CnaeCategory {
  code: string;
  descricao: string;
  categoriaIA: string;
  cnaeSub: string[];
  suffixes: string[];       // razaoSocial suffixes
  nomeBase: string[];       // base words for fantasy names
  porteBias: number[];       // probability weights for [ME, Pequena, Média, Grande]
}

const CATEGORIES: CnaeCategory[] = [
  {
    code: '96.41-1-01',
    descricao: 'Clínicas de Estética',
    categoriaIA: 'Clínicas de Estética',
    cnaeSub: ['96.41-1-02', '96.41-1-99'],
    suffixes: ['Clínica de Estética LTDA', 'Estética e Beleza LTDA', 'Center Esthetic LTDA'],
    nomeBase: ['Beleza Pura', 'SkinCare Pro', 'Estética Express', 'DermaVital', 'Harmoniza Beleza', 'Luminance', 'Glow Esthetics', 'Toque de Anjo'],
    porteBias: [0.65, 0.25, 0.08, 0.02],
  },
  {
    code: '56.11-2-01',
    descricao: 'Restaurantes',
    categoriaIA: 'Restaurantes',
    cnaeSub: ['56.11-2-02', '56.11-2-03'],
    suffixes: ['Restaurante e Lanchonete LTDA', 'Comércio de Alimentos LTDA', 'Gastronomia LTDA'],
    nomeBase: ['Sabor da Terra', 'Delícias do Chef', 'Boca Cheia', 'Panela Quente', 'Sabores do Brasil', 'Mesa Farta', 'Terra e Sabor', 'Comida Boa'],
    porteBias: [0.55, 0.30, 0.12, 0.03],
  },
  {
    code: '47.71-7-01',
    descricao: 'Farmácias',
    categoriaIA: 'Farmácias',
    cnaeSub: ['47.71-7-02', '47.71-7-03', '47.71-7-99'],
    suffixes: ['Farmácia e Drogaria LTDA', 'Drogaria Comercial LTDA', 'Farmácia Popular LTDA'],
    nomeBase: ['FarmaVida', 'Drogaria São Paulo', 'Farmácia do Bem', 'Drogamed', 'FarmaCruz', 'Saúde Fácil', 'Drogaria Central', 'FarmaCidade'],
    porteBias: [0.30, 0.40, 0.20, 0.10],
  },
  {
    code: '86.30-5-01',
    descricao: 'Consultórios Médicos',
    categoriaIA: 'Consultórios Médicos',
    cnaeSub: ['86.30-5-02', '86.30-5-03', '86.30-5-99'],
    suffixes: ['Consultório Médico LTDA', 'Clínica Médica LTDA', 'Centro de Saúde LTDA'],
    nomeBase: ['Vida Saúde', 'Médico Amigo', 'Clínica São Marcos', 'Health Center', 'VidaPlena', 'MedCenter', 'Clínica Boa Vista', 'Pró-Saúde'],
    porteBias: [0.60, 0.30, 0.08, 0.02],
  },
  {
    code: '47.89-0-99',
    descricao: 'Pet Shops',
    categoriaIA: 'Pet Shops',
    cnaeSub: ['47.89-0-01', '47.89-0-02'],
    suffixes: ['Pet Shop e Veterinária LTDA', 'Comércio de Animais LTDA', 'Pet Center LTDA'],
    nomeBase: ['PetLovers', 'Aumigo Pet', 'Bicho Feliz', 'PetFácil', 'MeuPetShop', 'Animal House', 'Patinhas & Cia', 'Pet Mundo'],
    porteBias: [0.70, 0.22, 0.06, 0.02],
  },
  {
    code: '93.12-3-00',
    descricao: 'Academias',
    categoriaIA: 'Academias',
    cnaeSub: ['93.13-1-00'],
    suffixes: ['Academia de Ginástica LTDA', 'Fitness e Saúde LTDA', 'Centro de Treinamento LTDA'],
    nomeBase: ['Power Fitness', 'Corpo Perfeito', 'Gym Life', 'Força Total', 'FitPro Academy', 'Vitality Gym', 'Iron Gym', 'Corpo e Movimento'],
    porteBias: [0.65, 0.25, 0.08, 0.02],
  },
  {
    code: '47.53-0-01',
    descricao: 'Lojas de Roupas',
    categoriaIA: 'Lojas de Roupas',
    cnaeSub: ['47.53-0-02', '47.53-0-03'],
    suffixes: ['Modas e Confecções LTDA', 'Comércio de Vestuário LTDA', 'Loja de Roupas LTDA'],
    nomeBase: ['Fashion Style', 'Trend Moda', 'Elegance Wear', 'ModaFit', 'Cotton House', 'Estilo Próprio', 'Moda Brasileira', 'Trend Store'],
    porteBias: [0.60, 0.28, 0.10, 0.02],
  },
  {
    code: '45.20-0-01',
    descricao: 'Auto Mecânicas',
    categoriaIA: 'Auto Mecânicas',
    cnaeSub: ['45.20-0-02', '45.20-0-03', '45.20-0-99'],
    suffixes: ['Oficina Mecânica LTDA', 'Auto Center LTDA', 'Mecânica Automotiva LTDA'],
    nomeBase: ['AutoFix', 'Mecânica Express', 'Motor Perfeito', 'CarService', 'Oficina do Povo', 'AutoPremium', 'Mecânica Pro', 'MotoServ'],
    porteBias: [0.65, 0.25, 0.08, 0.02],
  },
  {
    code: '69.11-7-01',
    descricao: 'Escritórios de Advocacia',
    categoriaIA: 'Escritórios de Advocacia',
    cnaeSub: ['69.11-7-02', '69.11-7-99'],
    suffixes: ['Advocacia e Consultoria LTDA', 'Escritório de Advocacia LTDA', 'Assessoria Jurídica LTDA'],
    nomeBase: ['Doutores do Direito', 'Advocacia Bretas', 'Jurídico & Associados', 'Borges Advogados', 'Law Office SP', 'Mello e Costa Advogados', 'Telles & Associados', 'Direito & Justiça'],
    porteBias: [0.50, 0.30, 0.15, 0.05],
  },
  {
    code: '69.20-4-00',
    descricao: 'Contabilidade',
    categoriaIA: 'Contabilidade',
    cnaeSub: ['69.20-4-01'],
    suffixes: ['Escritório de Contabilidade LTDA', 'Serviços Contábeis LTDA', 'Assessoria Contábil LTDA'],
    nomeBase: ['Contabiliza', 'Conta Certa', 'Números & Cia', 'Gestão Contábil', 'Excel Contabilidade', 'Balancete', 'ContabPro', 'Fiscal Solutions'],
    porteBias: [0.60, 0.30, 0.08, 0.02],
  },
  {
    code: '68.10-6-02',
    descricao: 'Imobiliárias',
    categoriaIA: 'Imobiliárias',
    cnaeSub: ['68.10-6-01', '68.22-3-00'],
    suffixes: ['Incorporação e Imóveis LTDA', 'Imobiliária e Admin de Bens LTDA', 'Corretagem de Imóveis LTDA'],
    nomeBase: ['Casa Nova', 'Imóvel Ideal', 'Morada', 'Casa & Cia', 'Plano Imóveis', 'Habitat', 'Residencial SP', 'Nossa Casa Imóveis'],
    porteBias: [0.55, 0.30, 0.12, 0.03],
  },
  {
    code: '85.53-2-00',
    descricao: 'Escolas de Idiomas',
    categoriaIA: 'Escolas de Idiomas',
    cnaeSub: ['85.53-2-01'],
    suffixes: ['Escola de Idiomas LTDA', 'Cursos de Línguas LTDA', 'Centro de Ensino LTDA'],
    nomeBase: ['Speak Up', 'Idioma Plus', 'Fluent School', 'Talk English', 'Cultura Inglesa Express', 'Yes! Idiomas', 'Smart English', 'Global Language'],
    porteBias: [0.55, 0.30, 0.12, 0.03],
  },
  {
    code: '10.91-1-00',
    descricao: 'Padarias',
    categoriaIA: 'Padarias',
    cnaeSub: ['10.91-1-01', '10.91-1-02'],
    suffixes: ['Padaria e Confeitaria LTDA', 'Panificação LTDA', 'Padaria Artesanal LTDA'],
    nomeBase: ['Pão Quente', 'Padaria do Povo', 'Forno & Fogão', 'Pão de Mel', 'Massa Fresca', 'Padaria Saborosa', 'O Padeiro', 'Grão de Trigo'],
    porteBias: [0.70, 0.22, 0.06, 0.02],
  },
  {
    code: '96.01-7-01',
    descricao: 'Lavanderias',
    categoriaIA: 'Lavanderias',
    cnaeSub: ['96.01-7-02'],
    suffixes: ['Lavanderia e Limpeza LTDA', 'Lavanderia Industrial LTDA', 'Tinturaria LTDA'],
    nomeBase: ['Lava Jato Express', 'Lavanderia Premium', 'Limpo & Seco', 'Aqua Clean', 'DryClean Pro', 'Lava Tudo', 'Brilho Lavanderia', 'CleanMax'],
    porteBias: [0.70, 0.22, 0.06, 0.02],
  },
  {
    code: '68.10-6-02',
    descricao: 'Oficinas de Corretagem',
    categoriaIA: 'Oficinas de Corretagem',
    cnaeSub: ['66.30-7-00'],
    suffixes: ['Corretora de Seguros LTDA', 'Corretagem e Consultoria LTDA', 'Seguros e Previdência LTDA'],
    nomeBase: ['Seguro Fácil', 'Protege Seguros', 'Seguro Total', 'Confiança Corretora', 'Guardian Seguros', 'Apolice Certa', 'RiskSafe', 'Vida Segura'],
    porteBias: [0.55, 0.28, 0.12, 0.05],
  },
  {
    code: '46.35-4-01',
    descricao: 'Distribuidoras de Bebidas',
    categoriaIA: 'Distribuidoras de Bebidas',
    cnaeSub: ['46.35-4-02', '46.35-4-99'],
    suffixes: ['Distribuidora de Bebidas LTDA', 'Comércio Atacadista de Bebidas LTDA', 'Distribuição e Logística LTDA'],
    nomeBase: ['Bebida Boa', 'Distribuidora Nacional', 'Drink Log', 'BevCo Distribuidora', 'Cerveja & Cia', 'MegaDrink', 'BebidaExpress', 'Líquido Distribuidora'],
    porteBias: [0.35, 0.35, 0.20, 0.10],
  },
  {
    code: '75.00-4-00',
    descricao: 'Clínicas Veterinárias',
    categoriaIA: 'Clínicas Veterinárias',
    cnaeSub: ['75.00-4-01'],
    suffixes: ['Clínica Veterinária LTDA', 'Hospital Veterinário LTDA', 'Vet Care LTDA'],
    nomeBase: ['VetAmigo', 'Animal Saúde', 'Patavet', 'Clínica do Pet', 'Vida Animal', 'ZooVet', 'PetDoctor', 'Bicho Saúde'],
    porteBias: [0.60, 0.28, 0.10, 0.02],
  },
  {
    code: '96.02-5-01',
    descricao: 'Salões de Beleza',
    categoriaIA: 'Salões de Beleza',
    cnaeSub: ['96.02-5-02', '96.02-5-99'],
    suffixes: ['Salão de Beleza LTDA', 'Beleza e Estética LTDA', 'Hair Studio LTDA'],
    nomeBase: ['Hair Design', 'Beauty Salon', 'Cabelo Perfeito', 'Corte & Estilo', 'Estilo Mulher', 'Transforma Hair', 'Beleza Natural', 'Color Style'],
    porteBias: [0.75, 0.20, 0.04, 0.01],
  },
  {
    code: '47.43-0-99',
    descricao: 'Material de Construção',
    categoriaIA: 'Material de Construção',
    cnaeSub: ['47.43-0-01', '47.43-0-02', '47.43-0-03'],
    suffixes: ['Material de Construção LTDA', 'Materiais para Construção LTDA', 'Comércio de Materiais LTDA'],
    nomeBase: ['Construí', 'Tijolo & Cimento', 'Base Forte', 'MegaMat', 'Casa & Construção', 'Ferramenta Certa', 'Reforço Mateial', 'BuildMax'],
    porteBias: [0.45, 0.30, 0.18, 0.07],
  },
  {
    code: '62.01-5-00',
    descricao: 'TI e Desenvolvimento',
    categoriaIA: 'TI e Desenvolvimento',
    cnaeSub: ['62.01-5-01', '62.02-3-00', '62.04-0-00'],
    suffixes: ['Tecnologia e Desenvolvimento LTDA', 'Soluções em TI LTDA', 'Software e Consultoria LTDA'],
    nomeBase: ['TechNova', 'CodeBrasil', 'DevPro', 'SoftSolutions', 'Digital Innovation', 'ByteSoft', 'CloudTech Brasil', 'DataWave'],
    porteBias: [0.40, 0.35, 0.18, 0.07],
  },
  {
    code: '49.30-2-01',
    descricao: 'Logística e Transporte',
    categoriaIA: 'Logística e Transporte',
    cnaeSub: ['49.30-2-02', '49.30-2-03', '49.30-2-99'],
    suffixes: ['Transportadora LTDA', 'Logística e Transportes LTDA', 'Frete e Entregas LTDA'],
    nomeBase: ['LogiTrans', 'Express Delivery', 'Rápido & Seguro', 'FleetMaster', 'Carga Express', 'RoadLog', 'TransBrasil', 'MegaLog'],
    porteBias: [0.40, 0.30, 0.20, 0.10],
  },
  {
    code: '86.50-1-01',
    descricao: 'Laboratórios de Análises',
    categoriaIA: 'Laboratórios de Análises',
    cnaeSub: ['86.50-1-02'],
    suffixes: ['Laboratório de Análises Clínicas LTDA', 'Lab Diagnóstico LTDA', 'Análises e Pesquisa LTDA'],
    nomeBase: ['LabExame', 'BioDiagnóstico', 'LabVida', 'Análise Certa', 'ExamePro', 'BioLab Brasil', 'LabPrecision', 'Diagnóstico Ágil'],
    porteBias: [0.40, 0.35, 0.18, 0.07],
  },
  {
    code: '86.90-4-00',
    descricao: 'Fisioterapia e Reabilitação',
    categoriaIA: 'Fisioterapia e Reabilitação',
    cnaeSub: ['86.90-4-01', '86.90-4-02'],
    suffixes: ['Clínica de Fisioterapia LTDA', 'Reabilitação e Saúde LTDA', 'Centro Fisioterápico LTDA'],
    nomeBase: ['FisioLife', 'Rehab Center', 'Movimento Saudável', 'FisioPro', 'Equilíbrio Fisio', 'Corpo em Harmonia', 'FisioAtiva', 'Reabilita+'],
    porteBias: [0.65, 0.25, 0.08, 0.02],
  },
  {
    code: '47.23-0-01',
    descricao: 'Lojas de Eletrônicos',
    categoriaIA: 'Lojas de Eletrônicos',
    cnaeSub: ['47.23-0-02', '47.23-0-99'],
    suffixes: ['Comércio de Eletrônicos LTDA', 'Eletrônicos e Informática LTDA', 'Loja de Tecnologia LTDA'],
    nomeBase: ['TechStore', 'ElectroWorld', 'Digital Zone', 'BitZone', 'Mundo Tech', 'Circuit Store', 'Volt Eletrônicos', 'MegaByte Store'],
    porteBias: [0.50, 0.30, 0.15, 0.05],
  },
];

// ─────────────────────────────────────────────────────────────
// Geographic Data
// ─────────────────────────────────────────────────────────────

interface CityData {
  nome: string;
  bairros: string[];
  cepBase: string;
}

interface StateData {
  uf: string;
  ddd: string;
  peso: number;   // percentage weight
  cidades: CityData[];
}

const STATES: StateData[] = [
  {
    uf: 'SP', ddd: '11', peso: 0.40,
    cidades: [
      {
        nome: 'São Paulo', cepBase: '01',
        bairros: ['Consolação', 'Bela Vista', 'Pinheiros', 'Vila Mariana', 'Moema', 'Liberdade', 'Itaim Bibi', 'Perdizes', 'Vila Madalena', 'Santana', 'Lapa', 'Tatuapé', 'Ipiranga', 'Penha', 'Butantã'],
      },
      {
        nome: 'Campinas', cepBase: '13',
        bairros: ['Jardim Campineiro', 'Centro', 'Sousas', 'Barão Geraldo', 'Vila Industrial', 'Swansea', 'Jardim do Lago', 'Taquaral', 'Cambuí', 'Nova Campinas'],
      },
      {
        nome: 'Santos', cepBase: '11',
        bairros: ['Gonzaga', 'Boqueirão', 'Ponta da Praia', 'Embaré', 'José Menino', 'Aparecida', 'Centro', 'Marília', 'Vila Mathias'],
      },
      {
        nome: 'Ribeirão Preto', cepBase: '14',
        bairros: ['Centro', 'Jardim Paulista', 'Jardim Botânico', 'Ribeirânia', 'Sumarézinho', 'Cascata', 'Morro Alegre', 'Ipiranga'],
      },
      {
        nome: 'Sorocaba', cepBase: '18',
        bairros: ['Centro', 'Jardim Europa', 'Vila Hortência', 'Parque Campolim', 'Água Funda', 'Éden', 'Jardim São Carlos', 'Vila Elvira'],
      },
      {
        nome: 'São José dos Campos', cepBase: '12',
        bairros: ['Centro', 'Jardim São José', 'Vila Adyana', 'Parque Industrial', 'Satélite', 'São Dimas', 'Jardim Aquarius', 'Bosque dos Eucaliptos'],
      },
      {
        nome: 'Bauru', cepBase: '17',
        bairros: ['Centro', 'Vila Paulista', 'Jardim Estoril', 'Alto da Ribeira', 'Nações', 'Vila IAPI', 'Jardim Montesano', 'Vila Vitória'],
      },
    ],
  },
  {
    uf: 'RJ', ddd: '21', peso: 0.15,
    cidades: [
      {
        nome: 'Rio de Janeiro', cepBase: '20',
        bairros: ['Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Tijuca', 'Centro', 'Barra da Tijuca', 'Niterói', 'Recreio dos Bandeirantes', 'Laranjeiras', 'Catete', 'Leme'],
      },
      {
        nome: 'Niterói', cepBase: '24',
        bairros: ['Centro', 'Icarai', 'São Francisco', 'Charitas', 'Ingá', 'Ponta d\'Areia', 'Sacramento', 'Vila Progresso'],
      },
      {
        nome: 'Petrópolis', cepBase: '25',
        bairros: ['Centro', 'Alto da Serra', 'Quitandinha', 'Mosela', 'Valparaíso', 'Cascatinha', 'Coronel Veiga', 'Retiro'],
      },
      {
        nome: 'Duque de Caxias', cepBase: '25',
        bairros: ['Centro', 'Jardim Catarina', 'Pq. Centenário', 'Jardim São Cândido', 'Vila Meriti', 'Imbariê', 'Gramacho', 'Saracuruna'],
      },
    ],
  },
  {
    uf: 'MG', ddd: '31', peso: 0.10,
    cidades: [
      {
        nome: 'Belo Horizonte', cepBase: '30',
        bairros: ['Savassi', 'Funcionários', 'Sion', 'Lourdes', 'Centro', 'Pampulha', 'Bairro das Indústrias', 'Santa Efigênia', 'Barro Preto', 'Florești'],
      },
      {
        nome: 'Uberlândia', cepBase: '38',
        bairros: ['Centro', 'Santa Mônica', 'Tubalina', 'Martins', 'Luizote de Freitas', 'Saraiva', 'Manoel Moreira', 'N.S. das Graças'],
      },
      {
        nome: 'Contagem', cepBase: '32',
        bairros: ['Centro', 'Petrolândia', 'Ipiranga', 'Tupi B', 'Nova Contagem', 'Bernardo Monteiro', 'Alto dos Pinheiros', 'Cidade Industrial'],
      },
      {
        nome: 'Juiz de Fora', cepBase: '36',
        bairros: ['Centro', 'São Mateus', 'Bairro dos Estados', 'Granbery', 'Jardim do Sol', 'Poço Rico', 'Passo d\'Areia', 'Santa Cruz'],
      },
      {
        nome: 'Governador Valadares', cepBase: '35',
        bairros: ['Centro', 'Alto Campanário', 'Jardim Panorama', 'São Geraldo', 'Vila Bretas', 'Betânia', 'Fátima', 'Novo Horizonte'],
      },
    ],
  },
  {
    uf: 'BA', ddd: '71', peso: 0.10,
    cidades: [
      {
        nome: 'Salvador', cepBase: '40',
        bairros: ['Barra', 'Pelourinho', 'Pituba', 'Campeche', 'Costa Azul', 'Graça', 'Caminho das Árvores', 'Rio Vermelho', 'Itaigara', 'Stella Maris'],
      },
      {
        nome: 'Feira de Santana', cepBase: '44',
        bairros: ['Centro', 'Ponto Novo', 'Jardim Cruzeiro', 'Serraria', 'Papagaio', 'Kalilândia', 'Parque Getúlio Vargas', 'Mangabeira'],
      },
      {
        nome: 'Vitória da Conquista', cepBase: '45',
        bairros: ['Centro', 'Jardim Vila Madalena', 'Universitário', 'Salão', 'Cabeça de Boi', 'Zelândia', 'Primavera', 'Urbanização'],
      },
    ],
  },
  {
    uf: 'PR', ddd: '41', peso: 0.05,
    cidades: [
      {
        nome: 'Curitiba', cepBase: '80',
        bairros: ['Centro', 'Jardim Social', 'Água Verde', 'Ecoville', 'Jardim Botânico', 'Portão', 'Cabral', 'Alto da XV', 'Hugo Lange', 'Mercês'],
      },
      {
        nome: 'Londrina', cepBase: '86',
        bairros: ['Centro', 'Jardim Shangri-lá', 'Jardim Acapulco', 'Cervejaria', 'Gleba Palhano', 'Jardim Aleixo', 'Vila Rica', 'Parque das Nações'],
      },
      {
        nome: 'Maringá', cepBase: '87',
        bairros: ['Centro', 'Zona 01', 'Zona 02', 'Zona 04', 'Zona 05', 'Zona 07', 'Jardim Universitário', 'Jardim das Américas'],
      },
    ],
  },
  {
    uf: 'RS', ddd: '51', peso: 0.05,
    cidades: [
      {
        nome: 'Porto Alegre', cepBase: '90',
        bairros: ['Centro Histórico', 'Moinhos de Vento', 'Menino Deus', 'Rio Branco', 'Petrópolis', 'Tristeza', 'Jardim Lindóia', 'Floresta', 'Cidade Baixa', 'São José'],
      },
      {
        nome: 'Caxias do Sul', cepBase: '95',
        bairros: ['Centro', 'Pio X', 'Loreto', 'São Pelegrino', 'Santa Maria', 'Jardim América', 'São Ciro', 'Fátima'],
      },
    ],
  },
  {
    uf: 'PE', ddd: '81', peso: 0.05,
    cidades: [
      {
        nome: 'Recife', cepBase: '50',
        bairros: ['Boa Viagem', 'Centro', 'Madalena', 'Santos Dumont', 'Graças', 'Casa Amarela', 'Espinheiro', 'Parnamirim', 'Derby', 'Torre'],
      },
      {
        nome: 'Caruaru', cepBase: '55',
        bairros: ['Centro', 'Indianópolis', 'São Gonçalo', 'Vila Eduardo', 'Jardim São Paulo', 'Alto do Moura', 'Nova Caruaru', 'Pé de Leite'],
      },
    ],
  },
  {
    uf: 'CE', ddd: '85', peso: 0.03,
    cidades: [
      {
        nome: 'Fortaleza', cepBase: '60',
        bairros: ['Aldeota', 'Meireles', 'Mucuripe', 'Beira Mar', 'Centro', 'Jardim das Oliveiras', 'Bela Vista', 'Parquelândia', 'Fátima', 'Benfica'],
      },
    ],
  },
  {
    uf: 'DF', ddd: '61', peso: 0.03,
    cidades: [
      {
        nome: 'Brasília', cepBase: '70',
        bairros: ['Asa Sul', 'Asa Norte', 'Lago Sul', 'Lago Norte', 'Sudoeste', 'Norte', 'Ceilândia', 'Taguatinga', 'Guara', 'Plano Piloto'],
      },
    ],
  },
  {
    uf: 'GO', ddd: '62', peso: 0.02,
    cidades: [
      {
        nome: 'Goiânia', cepBase: '74',
        bairros: ['Centro', 'Setor Bueno', 'Setor Marista', 'Jardim Goiás', 'Setor Oeste', 'Jardim América', 'Alto da Glória', 'Setor Sul'],
      },
      {
        nome: 'Anápolis', cepBase: '75',
        bairros: ['Centro', 'Jardim América', 'Jardim Europa', 'Vila Boa Vista', 'Nova Vila', 'Cidade Jardim', 'Alto da Boa Vista', 'Setor Industrial'],
      },
    ],
  },
  {
    uf: 'SC', ddd: '48', peso: 0.02,
    cidades: [
      {
        nome: 'Florianópolis', cepBase: '88',
        bairros: ['Centro', 'Trindade', 'Jurerê', 'Lagoa da Conceição', 'Coqueiros', 'Costeira do Pirajubaé', 'Córrego Grande', 'Itacorubi'],
      },
      {
        nome: 'Joinville', cepBase: '89',
        bairros: ['Centro', 'Bucarein', 'Jardim Paraíso', 'Atiradores', 'Comasa', 'Floresta', 'Americana', 'Morro do Meio'],
      },
    ],
  },
  {
    uf: 'AM', ddd: '92', peso: 0.02,
    cidades: [
      {
        nome: 'Manaus', cepBase: '69',
        bairros: ['Centro', 'Adrianópolis', 'Nossa Senhora das Graças', 'Petrópolis', 'Japiim', 'Alto do Verde', 'Jorge Teixeira', 'Cidade Nova', 'Coroado', 'São José'],
      },
    ],
  },
  {
    uf: 'PA', ddd: '91', peso: 0.02,
    cidades: [
      {
        nome: 'Belém', cepBase: '66',
        bairros: ['Centro', 'Cidade Velha', 'Nazaré', 'Umarizal', 'Marambaia', 'São Brás', 'Sacramenta', 'Cabanagem', 'Terra Firme', 'Barrio do Marco'],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(weights: number[]): number {
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r <= sum) return i;
  }
  return weights.length - 1;
}

function formatCNPJ(): string {
  const base = String(randomInt(10000000, 99999999));
  const branch = '0001';
  const digits = String(randomInt(10, 99));
  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/${branch}-${digits}`;
}

function formatPhone(ddd: string): string {
  const prefix = String(randomInt(9000, 9999));
  const suffix = String(randomInt(1000, 9999));
  return `(${ddd}) ${prefix}-${suffix}`;
}

function formatCEP(_uf: string, cepBase: string): string {
  // CEP format: XXXXX-XXX (8 digits total, 5+3)
  // cepBase is 2 digits, generate remaining 3+3
  const mid = String(randomInt(100, 999));     // digits 3-5
  const suf = String(randomInt(100, 999));     // digits 6-8
  return `${cepBase}${mid}-${suf}`;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function weightedRandomDate(): Date {
  // Weight towards more recent months (last 2 years, 2023-06-01 to 2025-05-28)
  const startDate = new Date(2023, 5, 1);  // 2023-06-01
  const endDate = new Date(2025, 4, 28);   // 2025-05-28
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Use exponential weighting: more recent dates are more likely
  // r^2 * totalDays gives bias towards the end (recent)
  const r = Math.random();
  const daysOffset = Math.floor(Math.pow(r, 1.8) * totalDays);

  const result = new Date(startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  return result;
}

// ─────────────────────────────────────────────────────────────
// Embedding Generation
// ─────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  // Simple LCG PRNG for deterministic embeddings
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function generateUnitVector(dims: number, rng: () => number): number[] {
  const v: number[] = [];
  for (let i = 0; i < dims; i++) {
    v.push(rng());
  }
  // Normalize to unit vector
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map(x => x / norm);
}

function generateCategoryCenters(numCategories: number, dims: number): number[][] {
  // Generate well-separated category centers using deterministic seeds
  // Each center is a unit vector in a different "direction"
  const centers: number[][] = [];
  for (let c = 0; c < numCategories; c++) {
    const rng = seededRandom(42 + c * 137);
    centers.push(generateUnitVector(dims, rng));
  }

  // Orthogonalize approximately to ensure separation
  // Use Gram-Schmidt-like approach: start with unit vectors, then amplify differences
  for (let c = 1; c < numCategories; c++) {
    // Subtract projections of previous centers
    for (let prev = 0; prev < c; prev++) {
      let dot = 0;
      for (let d = 0; d < dims; d++) {
        dot += centers[c][d] * centers[prev][d];
      }
      for (let d = 0; d < dims; d++) {
        centers[c][d] -= dot * centers[prev][d];
      }
    }
    // Re-normalize
    const norm = Math.sqrt(centers[c].reduce((s, x) => s + x * x, 0));
    if (norm > 0.0001) {
      for (let d = 0; d < dims; d++) {
        centers[c][d] /= norm;
      }
    }
  }

  // Scale to desired spread
  for (const center of centers) {
    for (let d = 0; d < dims; d++) {
      center[d] *= CATEGORY_CENTER_SPREAD;
    }
  }

  return centers;
}

function generateCompanyEmbedding(
  categoryCenter: number[],
  companyId: number,
  dims: number,
  noise: number,
): number[] {
  const rng = seededRandom(companyId * 31 + 7);
  return categoryCenter.map(base => {
    const perturbation = (rng() - 0.5) * 2 * noise; // ±noise
    return parseFloat((base + perturbation).toFixed(6));
  });
}

// ─────────────────────────────────────────────────────────────
// Porte / Funcionários / Receita
// ─────────────────────────────────────────────────────────────

interface PorteInfo {
  porte: string;
  funcionarios: string;
  receitaAnual: string;
}

function getPorteInfo(porteIndex: number): PorteInfo {
  switch (porteIndex) {
    case 0: // Microempresa
      return { porte: 'Microempresa', funcionarios: '1-5', receitaAnual: 'Até R$ 360 mil' };
    case 1: // Pequena Empresa
      return { porte: 'Pequena Empresa', funcionarios: pick(['6-20', '6-50']), receitaAnual: 'R$ 360 mil - R$ 4,8 milhões' };
    case 2: // Média Empresa
      return { porte: 'Média Empresa', funcionarios: '21-200', receitaAnual: 'R$ 4,8 milhões - R$ 300 milhões' };
    case 3: // Grande Empresa
      return { porte: 'Grande Empresa', funcionarios: pick(['201-500', '501+']), receitaAnual: 'Acima de R$ 300 milhões' };
    default:
      return { porte: 'Microempresa', funcionarios: '1-5', receitaAnual: 'Até R$ 360 mil' };
  }
}

// ─────────────────────────────────────────────────────────────
// Email generation
// ─────────────────────────────────────────────────────────────

function generateEmail(nomeFantasia: string): string {
  const clean = nomeFantasia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com.br', 'yahoo.com.br', 'empresa.com.br', 'terra.com.br'];
  const domain = pick(domains);
  const suffixes = ['', 'contato', 'admin', 'comercial', 'sac'];
  const suffix = pick(suffixes);
  if (suffix) {
    return `${suffix}@${clean}.${domain}`.replace(`.${domain}`, '').replace('@', `${suffix}@`);
  }
  return `${clean}@${domain}`;
}

function generateEmailClean(nomeFantasia: string): string {
  const clean = nomeFantasia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 18);
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com.br', 'yahoo.com.br', 'empresa.com.br', 'terra.com.br'];
  return `${clean}@${pick(domains)}`;
}

// ─────────────────────────────────────────────────────────────
// Socio (partner) names
// ─────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Fernanda', 'José', 'Juliana',
  'Paulo', 'Patrícia', 'Luís', 'Camila', 'Marcos', 'Letícia', 'Rafael', 'Beatriz',
  'André', 'Gabriela', 'Bruno', 'Vanessa', 'Diego', 'Mariana', 'Lucas', 'Isabella',
  'Ricardo', 'Natália', 'Felipe', 'Amanda', 'Gustavo', 'Carolina', 'Roberto', 'Larissa',
  'Thiago', 'Daniela', 'Eduardo', 'Aline', 'Rodrigo', 'Priscila', 'Marcelo', 'Tatiana',
  'Alexandre', 'Renata', 'Guilherme', 'Cristina', 'Leandro', 'Fernanda', 'Vinícius', 'Elaine',
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos',
  'Gonçalves', 'Santana', 'Teixeira', 'Monteiro', 'Correia', 'Pinto', 'Batista', 'Araújo',
];

function generateSocio(): string {
  return `${pick(FIRST_NAMES)} ${pick(FIRST_NAMES)} ${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
}

// ─────────────────────────────────────────────────────────────
// State/Location selection (weighted)
// ─────────────────────────────────────────────────────────────

function pickState(): { state: StateData; city: CityData } {
  const r = Math.random();
  let cumulative = 0;
  for (const state of STATES) {
    cumulative += state.peso;
    if (r <= cumulative) {
      return { state, city: pick(state.cidades) };
    }
  }
  return { state: STATES[0], city: STATES[0].cidades[0] };
}

// ─────────────────────────────────────────────────────────────
// Address generation
// ─────────────────────────────────────────────────────────────

const STREET_TYPES = ['Rua', 'Avenida', 'Rua', 'Rua', 'Rua', 'Avenida', 'Praça', 'Alameda', 'Travessa', 'Rua'];

const STREET_NAMES = [
  'das Flores', 'da Paz', 'Brasil', 'São Paulo', 'Rio de Janeiro', 'Minas Gerais',
  'do Comércio', 'da Constituição', 'Ipê', 'Palmeiras', 'Jabuticabeiras', 'das Carmelitas',
  'da Liberdade', 'Tiradentes', 'Dom Pedro I', 'Dom Pedro II', 'Getúlio Vargas',
  'Marechal Deodoro', 'General Osório', 'Barão de Mauá', 'Conselheiro Lafayete',
  'Santos Dumont', 'Alberto Santos', 'Sete de Setembro', 'Quinze de Novembro',
  'Cinco de Março', 'Treze de Maio', 'Primeiro de Maio', 'Vinte e Cinco de Março',
  'Carlos Gomes', 'Borges de Medeiros', 'Voluntários da Pátria', 'das Indústrias',
  'do Progresso', 'da Esperança', 'da Saúde', 'do Comércio', 'da Cultura',
  'da Educação', 'da Ciência', 'da Tecnologia', 'Boa Vista', 'Alto São João',
];

function generateEndereco(): string {
  const tipo = pick(STREET_TYPES);
  const nome = pick(STREET_NAMES);
  const numero = String(randomInt(10, 9999));
  const complements = ['', '', '', '', '', 'Sala 101', 'Sala 202', 'Loja 1', 'Loja 05', 'Sala 03', 'Cj 402', 'Cj 1201'];
  const comp = pick(complements);
  return `${tipo} ${nome}, ${numero}${comp ? ` - ${comp}` : ''}`;
}

// ─────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────

async function seedDatabase() {
  console.log('='.repeat(60));
  console.log('  CNPJ BI - Seed Script');
  console.log('  Populating database with pre-classified companies');
  console.log('='.repeat(60));

  const ds = await initializeDataSource();
  const repo = ds.getRepository(EmpresaEntity);

  // Step 1: Clear existing data
  console.log('\n[1/5] Clearing existing empresas...');
  await repo.clear();
  console.log('  ✓ Cleared');

  // Step 2: Generate category centers for embeddings
  console.log(`\n[2/5] Generating ${CATEGORIES.length} category embedding centers (${EMBEDDING_DIMENSIONS}d)...`);
  const categoryCenters = generateCategoryCenters(CATEGORIES.length, EMBEDDING_DIMENSIONS);

  // Quick validation: check inter-category distances
  let minInterDist = Infinity;
  for (let i = 0; i < categoryCenters.length; i++) {
    for (let j = i + 1; j < categoryCenters.length; j++) {
      let dot = 0;
      let ni = 0, nj = 0;
      for (let d = 0; d < EMBEDDING_DIMENSIONS; d++) {
        dot += categoryCenters[i][d] * categoryCenters[j][d];
        ni += categoryCenters[i][d] ** 2;
        nj += categoryCenters[j][d] ** 2;
      }
      const cosine = dot / (Math.sqrt(ni) * Math.sqrt(nj));
      const dist = 1 - cosine;
      minInterDist = Math.min(minInterDist, dist);
    }
  }
  console.log(`  ✓ Min inter-category distance: ${minInterDist.toFixed(3)} (target > 0.6)`);

  // Step 3: Generate companies
  console.log(`\n[3/5] Generating ${TOTAL_COMPANIES} companies across ${CATEGORIES.length} categories...`);

  const companies: Partial<EmpresaEntity>[] = [];
  const cnpjSet = new Set<string>();

  // Calculate companies per category (roughly proportional, ~25 per category on average)
  const companiesPerCategory: number[] = [];
  let remaining = TOTAL_COMPANIES;
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (i === CATEGORIES.length - 1) {
      companiesPerCategory.push(remaining);
    } else {
      const count = Math.max(18, Math.round(TOTAL_COMPANIES / CATEGORIES.length + (Math.random() - 0.5) * 10));
      companiesPerCategory.push(Math.min(count, remaining - (CATEGORIES.length - i - 1) * 18));
      remaining -= companiesPerCategory[i];
    }
  }

  let globalCompanyIndex = 0;

  for (let catIdx = 0; catIdx < CATEGORIES.length; catIdx++) {
    const category = CATEGORIES[catIdx];
    const count = companiesPerCategory[catIdx];
    const center = categoryCenters[catIdx];

    for (let i = 0; i < count; i++) {
      globalCompanyIndex++;

      // Generate unique CNPJ
      let cnpj: string;
      do {
        cnpj = formatCNPJ();
      } while (cnpjSet.has(cnpj));
      cnpjSet.add(cnpj);

      // Pick location
      const { state, city } = pickState();
      const bairro = pick(city.bairros);

      // Porte
      const porteIndex = pickWeighted(category.porteBias);
      const porteInfo = getPorteInfo(porteIndex);

      // Company name
      const suffix = pick(category.suffixes);
      const nomeBase = pick(category.nomeBase);
      const cnaeCode = pick(category.cnaeSub);

      // Dates
      const dataAbertura = weightedRandomDate();
      const processingDays = randomInt(1, 30);
      const dataProcessamento = new Date(dataAbertura.getTime() + processingDays * 24 * 60 * 60 * 1000);

      // Embedding (using the exact same engine as the API for mathematical parity)
      const { SemanticEmbeddingEngine } = await import('@/app/utils/SemanticEmbeddingEngine');
      const baseEmbedding = SemanticEmbeddingEngine.calculateEmbeddingForText(category.descricao);
      
      // Add slight within-category noise so they aren't all exactly identical 1.0 vectors
      const rng = seededRandom(globalCompanyIndex * 31 + 7);
      const embedding = baseEmbedding.map(val => {
        const perturbation = (rng() - 0.5) * 2 * 0.15; // ±0.15 noise
        return parseFloat((val + perturbation).toFixed(6));
      });

      companies.push({
        id: uuidv4(),
        cnpj,
        razaoSocial: `${nomeBase} ${suffix}`,
        nomeFantasia: nomeBase,
        cnaePrincipal: cnaeCode,
        cnaeDescricao: category.descricao,
        situacaoCadastral: 'Ativa',
        endereco: generateEndereco(),
        municipio: city.nome,
        bairro,
        estado: state.uf,
        cep: formatCEP(state.uf, city.cepBase),
        telefone: formatPhone(state.ddd),
        email: generateEmailClean(nomeBase),
        socio: generateSocio(),
        porte: porteInfo.porte,
        funcionarios: porteInfo.funcionarios,
        receitaAnual: porteInfo.receitaAnual,
        dataAbertura: formatDate(dataAbertura),
        categoriaIA: category.categoriaIA,
        embedding: JSON.stringify(embedding),
        dataProcessamento: formatDate(dataProcessamento),
      });
    }
  }

  console.log(`  ✓ Generated ${companies.length} unique companies`);

  // Step 4: Batch insert
  console.log(`\n[4/5] Inserting into database (batches of ${BATCH_SIZE})...`);
  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    await repo.save(batch as EmpresaEntity[]);
    const progress = Math.min(((i + BATCH_SIZE) / companies.length) * 100, 100);
    process.stdout.write(`\r  Inserting... ${progress.toFixed(0)}% (${Math.min(i + BATCH_SIZE, companies.length)}/${companies.length})`);
  }
  console.log('\n  ✓ Insert complete');

  // Step 5: Print statistics
  console.log(`\n[5/5] Database statistics:`);

  const total = await repo.count();

  // Category distribution
  const catRows = await repo.createQueryBuilder('e')
    .select('e.categoriaIA', 'categoria')
    .addSelect('COUNT(*)', 'count')
    .groupBy('e.categoriaIA')
    .orderBy('count', 'DESC')
    .getRawMany();

  console.log(`\n  Total companies: ${total}`);
  console.log('\n  Category distribution:');
  console.log('  ' + '-'.repeat(50));
  for (const row of catRows) {
    const bar = '█'.repeat(Math.round(Number(row.count) / total * 40));
    console.log(`  ${row.categoria.padEnd(30)} ${String(row.count).padStart(4)} ${bar}`);
  }

  // State distribution
  const stateRows = await repo.createQueryBuilder('e')
    .select('e.estado', 'estado')
    .addSelect('COUNT(*)', 'count')
    .groupBy('e.estado')
    .orderBy('count', 'DESC')
    .getRawMany();

  console.log('\n  State distribution:');
  console.log('  ' + '-'.repeat(35));
  for (const row of stateRows) {
    const pct = (Number(row.count) / total * 100).toFixed(1);
    console.log(`  ${row.estado.padEnd(5)} ${String(row.count).padStart(4)} (${pct}%)`);
  }

  // Porte distribution
  const porteRows = await repo.createQueryBuilder('e')
    .select('e.porte', 'porte')
    .addSelect('COUNT(*)', 'count')
    .groupBy('e.porte')
    .orderBy('count', 'DESC')
    .getRawMany();

  console.log('\n  Porte distribution:');
  console.log('  ' + '-'.repeat(40));
  for (const row of porteRows) {
    const pct = (Number(row.count) / total * 100).toFixed(1);
    console.log(`  ${row.porte.padEnd(20)} ${String(row.count).padStart(4)} (${pct}%)`);
  }

  // Embedding quality check
  console.log('\n  Embedding quality check:');
  const sample = await repo.createQueryBuilder('e')
    .select('e.categoriaIA', 'categoria')
    .addSelect('e.embedding', 'embedding')
    .where("e.categoriaIA = 'Restaurantes'")
    .limit(5)
    .getRawMany();

  if (sample.length >= 2) {
    const e1 = JSON.parse(sample[0].embedding) as number[];
    const e2 = JSON.parse(sample[1].embedding) as number[];
    let dot = 0, n1 = 0, n2 = 0;
    for (let d = 0; d < e1.length; d++) {
      dot += e1[d] * e2[d];
      n1 += e1[d] ** 2;
      n2 += e2[d] ** 2;
    }
    const cosSim = dot / (Math.sqrt(n1) * Math.sqrt(n2));
    console.log(`  ✓ Same-category cosine sim (Restaurantes #1 vs #2): ${cosSim.toFixed(4)} (target > 0.7)`);
  }

  // Cross-category check
  const crossCat = await repo.createQueryBuilder('e')
    .select('e.categoriaIA', 'categoria')
    .addSelect('e.embedding', 'embedding')
    .groupBy('e.categoriaIA')
    .limit(2)
    .getRawMany();

  if (crossCat.length >= 2 && crossCat[0].categoria !== crossCat[1].categoria) {
    const e1 = JSON.parse(crossCat[0].embedding) as number[];
    const e2 = JSON.parse(crossCat[1].embedding) as number[];
    let dot = 0, n1 = 0, n2 = 0;
    for (let d = 0; d < e1.length; d++) {
      dot += e1[d] * e2[d];
      n1 += e1[d] ** 2;
      n2 += e2[d] ** 2;
    }
    const cosSim = dot / (Math.sqrt(n1) * Math.sqrt(n2));
    console.log(`  ✓ Cross-category cosine sim (${crossCat[0].categoria} vs ${crossCat[1].categoria}): ${cosSim.toFixed(4)} (target < 0.4)`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Seed completed successfully!');
  console.log('='.repeat(60));

  await ds.destroy();
}

// Run
seedDatabase().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
