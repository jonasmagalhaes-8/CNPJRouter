import React from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import interestModalStyles from '../InterestModal/InterestModal.module.css';
import registerFormStyles from './RegisterForm.module.css';

interface RegisterFormProps {
  nome: string;
  setNome: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  senha: string;
  setSenha: (val: string) => void;
  perfil: string;
  setPerfil: (val: string) => void;
  perfilOutro: string;
  setPerfilOutro: (val: string) => void;
  authError: string;
  authLoading: boolean;
  handleRegister: () => void;
  setAuthView: (view: 'login') => void;
  clearError: () => void;
}

export default function RegisterForm({
  nome, setNome, email, setEmail, senha, setSenha, perfil, setPerfil, perfilOutro, setPerfilOutro,
  authError, authLoading, handleRegister, setAuthView, clearError
}: RegisterFormProps) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
      <div className="max-w-sm mx-auto space-y-6">
        <h2 className="text-2xl font-black text-slate-900 text-center">Criar Conta</h2>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Nome</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className={interestModalStyles.inputField} placeholder="Seu nome" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={interestModalStyles.inputField} placeholder="seu@email.com" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={interestModalStyles.inputField} placeholder="Crie uma senha" onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Qual o seu perfil?</label>
          <select value={perfil} onChange={(e) => { setPerfil(e.target.value); if (e.target.value !== 'Outro (Informar)') setPerfilOutro(''); }} className={interestModalStyles.inputField}>
            <option value="" disabled>Selecione uma opção</option>
            <option value="Contador">Contador</option>
            <option value="Advogado">Advogado</option>
            <option value="Desenvolvedor">Desenvolvedor</option>
            <option value="Vendedor / Representante Comercial">Vendedor / Representante Comercial</option>
            <option value="Consultor de Negócios">Consultor de Negócios</option>
            <option value="Profissional de Marketing">Profissional de Marketing</option>
            <option value="Empreendedor / Empresário">Empreendedor / Empresário</option>
            <option value="Outro (Informar)">Outro (Informar)</option>
          </select>
        </div>
        {perfil === 'Outro (Informar)' && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Especifique seu perfil</label>
            <input type="text" value={perfilOutro} onChange={(e) => setPerfilOutro(e.target.value)} className={interestModalStyles.inputField} placeholder="Digite seu perfil" onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
          </div>
        )}
        {authError && <p className="text-sm text-red-500 font-bold text-center">{authError}</p>}
        <button onClick={handleRegister} disabled={authLoading} className="w-full bg-emerald-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
          {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Criar Conta
        </button>
        <p className="text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <button onClick={() => { setAuthView('login'); clearError(); }} className="text-emerald-600 font-bold hover:underline">Fazer login</button>
        </p>
      </div>
    </div>
  );
}
