import { apiBackend } from "./api.config";
import { EmpresaModel } from "../models/Empresa.model";
import { ResponseModel } from "../models/Response.model";
import { decryptPayload } from "../utils/crypto.util";

export async function serviceBuscarEmpresas(
  params: { query?: string; bairro?: string; cidade?: string; nicho?: string; page?: number }
): Promise<ResponseModel<{ items: EmpresaModel[], total: number }>> {
  try {
    const response = await apiBackend.post<string>('/empresas/search', params);
    return {
      response: decryptPayload<{ items: EmpresaModel[], total: number }>(response.data),
      mensagem: 'Sucesso'
    };
  } catch (err: any) {
    // MOCK DATA based on PDF specs (1-2 years old companies)
    const mockData: EmpresaModel[] = Array.from({ length: 9 }).map((_, i) => ({
      id: `${(params.page || 0) * 9 + i}`,
      cnpj: `${Math.floor(Math.random() * 99)}.345.678/0001-${Math.floor(Math.random() * 99)}`,
      nomeFantasia: `Business ${params.nicho || 'Geral'} ${(params.page || 0) * 9 + i}`,
      razaoSocial: `Razão Social Business ${(params.page || 0) * 9 + i} LTDA`,
      cnaePrincipal: params.nicho || '4711-3/01',
      situacaoCadastral: 'Ativa',
      municipio: params.cidade || 'São Paulo',
      bairro: params.bairro || 'Pinheiros',
      cep: '05400-000',
      descricaoIA: 'Empresa identificada via pipeline offline SERPRO+ e processada por IA semântica.',
      categoriaIA: params.nicho || 'Tecnologia',
      dataEntrada: new Date(Date.now() - Math.random() * 31536000000).toISOString(), 
      isRevelado: false,
      isBloqueado: false
    }));

    return {
      response: {
        items: mockData,
        total: 100
      },
      mensagem: 'Resultados filtrados (Mock) carregados'
    };
  }
}

export async function serviceRevelarEmpresa(
  id: string
): Promise<ResponseModel<EmpresaModel>> {
  try {
    const response = await apiBackend.get<string>(`/empresas/reveal/${id}`);
    return decryptPayload<ResponseModel<EmpresaModel>>(response.data);
  } catch (err: any) {
    return {
      response: { id, isRevelado: true } as EmpresaModel,
      mensagem: 'CNPJ Revelado com sucesso (Mock)'
    };
  }
}
