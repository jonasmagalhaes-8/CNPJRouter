import { serviceBuscarEmpresas, serviceRevelarEmpresa } from "../services/Empresa.service";
import { EmpresaModel } from "../models/Empresa.model";

export class SearchController {
  static async handleSearch(params: { query?: string, bairro?: string, cidade?: string, nicho?: string, page?: number }): Promise<{ items: EmpresaModel[], total: number }> {
    const result = await serviceBuscarEmpresas(params);
    return result.response;
  }

  static async handleReveal(empresa: EmpresaModel, onLimitReached: () => void): Promise<EmpresaModel | null> {
    // Logic for daily limit check could go here or in User Controller
    // For now, simple reveal flow
    const result = await serviceRevelarEmpresa(empresa.id);
    return { ...empresa, ...result.response, isRevelado: true };
  }

  static async handleLookalike(cnpj: string): Promise<EmpresaModel[]> {
    const result = await serviceBuscarEmpresas({ query: `Lookalike for ${cnpj}` });
    return result.response.items;
  }
}
