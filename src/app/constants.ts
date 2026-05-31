export const PLANS = [25, 50, 100];

export const PERIODS = [
  'Este mês',
  'Últimos 3 meses',
  'Últimos 6 meses',
  'Últimos 12 meses',
];

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Kept for backward compatibility with dead components (NicheCard, PorteSection, RegionalGeoCard)
export const PORTE_EMPRESA = [
  'Microempresa (ME)',
  'Pequena Empresa',
  'Média Empresa',
  'Grande Empresa',
] as const;

export type PorteEmpresa = (typeof PORTE_EMPRESA)[number];

export const PORTE_FUNCIONARIOS_MAP: Record<string, string> = {
  'Microempresa (ME)': '1-5',
  'Pequena Empresa': '6-20',
  'Média Empresa': '21-200',
  'Grande Empresa': '201+',
};

export const ITEMS_PER_PAGE = 12;
