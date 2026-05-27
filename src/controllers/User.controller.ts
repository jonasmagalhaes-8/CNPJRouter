import { serviceLoginUsuario } from "../services/Auth.service";
import { UsuarioModel } from "../models/Usuario.model";

export class UserController {
  private static currentUser: UsuarioModel | null = null;

  static async login(email: string): Promise<UsuarioModel> {
    const result = await serviceLoginUsuario({ email });
    this.currentUser = {
      ...result.response,
      plano: 'Ouro',
      limiteDiario: 100, // Monthly plans still often have daily protective caps
    };
    localStorage.setItem('token', 'mock-jwt-token');
    return this.currentUser;
  }

  static getCurrentUser(): UsuarioModel | null {
    return this.currentUser;
  }

  static hasLimit(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.descobertasHoje < this.currentUser.limiteDiario;
  }

  static incrementDiscovery() {
    if (this.currentUser) {
      this.currentUser.descobertasHoje++;
    }
  }
}
