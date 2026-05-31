export interface StandardCnpjResponse {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  situacaoCadastral: string;
  cnaePrincipal: string;
  cnaeDescricao: string;
  porte: string;
  municipio: string;
  estado: string;
  bairro: string;
  logradouro: string;
  numero: string;
  cep: string;
}

export interface ICnpjProvider {
  name: string;
  lookup(cnpj: string): Promise<StandardCnpjResponse | null>;
}

export class CnpjLookupService {
  private providers: ICnpjProvider[] = [];

  constructor() {
    this.providers.push(new BrasilApiProvider());
    this.providers.push(new CnpjaProvider());
    this.providers.push(new OpenCnpjProvider());
  }

  public async lookupWithFallback(cnpj: string): Promise<StandardCnpjResponse | null> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    for (const provider of this.providers) {
      try {
        console.log(`[CnpjLookupService] Tentando API: ${provider.name} para o CNPJ ${cleanCnpj}...`);
        const result = await provider.lookup(cleanCnpj);
        if (result) {
          console.log(`[CnpjLookupService] Sucesso na API: ${provider.name}!`);
          return result;
        }
      } catch (err) {
        console.error(`[CnpjLookupService] Falha na API ${provider.name}:`, err instanceof Error ? err.message : String(err));
      }
    }
    
    console.error(`[CnpjLookupService] Todas as APIs falharam para o CNPJ ${cleanCnpj}.`);
    return null;
  }
}

class BrasilApiProvider implements ICnpjProvider {
  name = 'BrasilAPI';

  async lookup(cnpj: string): Promise<StandardCnpjResponse | null> {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Status ${res.status}`);
    }
    const data = await res.json();

    return {
      cnpj: data.cnpj,
      razaoSocial: data.razao_social,
      nomeFantasia: data.nome_fantasia || null,
      situacaoCadastral: data.descricao_situacao_cadastral,
      cnaePrincipal: String(data.cnae_fiscal),
      cnaeDescricao: data.cnae_fiscal_descricao,
      porte: data.porte || 'NÃO INFORMADO',
      municipio: data.municipio,
      estado: data.uf,
      bairro: data.bairro,
      logradouro: data.logradouro,
      numero: data.numero,
      cep: data.cep,
    };
  }
}

class CnpjaProvider implements ICnpjProvider {
  name = 'CNPJA';

  async lookup(cnpj: string): Promise<StandardCnpjResponse | null> {
    const res = await fetch(`https://open.cnpja.com/office/${cnpj}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Status ${res.status}`);
    }
    const data = await res.json();

    return {
      cnpj: data.taxId,
      razaoSocial: data.company?.name || '',
      nomeFantasia: data.alias || null,
      situacaoCadastral: data.status?.text || '',
      cnaePrincipal: String(data.mainActivity?.id || ''),
      cnaeDescricao: data.mainActivity?.text || '',
      porte: data.company?.size?.text || 'NÃO INFORMADO',
      municipio: data.address?.city || '',
      estado: data.address?.state || '',
      bairro: data.address?.district || '',
      logradouro: data.address?.street || '',
      numero: data.address?.number || '',
      cep: data.address?.zip || '',
    };
  }
}

class OpenCnpjProvider implements ICnpjProvider {
  name = 'OpenCNPJ';

  async lookup(cnpj: string): Promise<StandardCnpjResponse | null> {
    const res = await fetch(`https://kitana.opencnpj.com/cnpj/${cnpj}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Status ${res.status}`);
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      return null;
    }
    
    const data = json.data;
    const cnaeObj = data.cnaes?.[0];

    return {
      cnpj: data.cnpj,
      razaoSocial: data.razaoSocial || '',
      nomeFantasia: data.nomeFantasia || null,
      situacaoCadastral: data.situacaoCadastral || '',
      cnaePrincipal: cnaeObj?.cnae || '',
      cnaeDescricao: cnaeObj?.descricao || '',
      porte: 'NÃO INFORMADO', // Kitana doesn't seem to return precise porte text in the provided sample
      municipio: data.municipio || '',
      estado: data.uf || '',
      bairro: data.bairro || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      cep: data.cep || '',
    };
  }
}
