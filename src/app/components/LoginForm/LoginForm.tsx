import React from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import interestModalStyles from '../InterestModal/InterestModal.module.css';
import loginFormStyles from './LoginForm.module.css';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  senha: string;
  setSenha: (val: string) => void;
  authError: string;
  authLoading: boolean;
  handleLogin: () => void;
  setAuthView: (view: 'register') => void;
  clearError: () => void;
}

export default function LoginForm({
  email, setEmail, senha, setSenha, authError, authLoading, handleLogin, setAuthView, clearError
}: LoginFormProps) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
      <div className="max-w-sm mx-auto space-y-6">
        <h2 className="text-2xl font-black text-slate-900 text-center">Entrar</h2>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={interestModalStyles.inputField} placeholder="seu@email.com" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={interestModalStyles.inputField} placeholder="Sua senha" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
        </div>
        {authError && <p className="text-sm text-red-500 font-bold text-center">{authError}</p>}
        <button onClick={handleLogin} disabled={authLoading} className="w-full bg-emerald-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
          {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Entrar
        </button>
        <p className="text-center text-sm text-slate-500">
          Não tem conta?{' '}
          <button onClick={() => { setAuthView('register'); clearError(); }} className="text-emerald-600 font-bold hover:underline">Criar conta</button>
        </p>
      </div>
    </div>
  );
}
