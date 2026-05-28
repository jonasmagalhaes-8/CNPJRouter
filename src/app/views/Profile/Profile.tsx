'use client';

import React, { useEffect, useState } from 'react';
import { LogOut, User as UserIcon, Mail, ShieldCheck } from 'lucide-react';
import { useAppDispatch } from '../../context/AppContext';
import styles from './Profile.module.css';

export default function Profile() {
  const { setView } = useAppDispatch();
  const [user, setUser] = useState<{ nome: string; email: string; plano: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
          setUser({ nome: 'Usuário', email: '', plano: 50 });
        }
      } else {
        setUser({ nome: 'Visitante', email: 'Não logado', plano: 0 });
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  if (!user) {
    return <div className={styles.loading}>Carregando perfil...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          <UserIcon className={styles.avatarIcon} />
        </div>
        <div className={styles.userInfo}>
          <h2 className={styles.userName}>{user.nome}</h2>
          <div className={styles.userEmailRow}>
            <Mail className={styles.emailIcon} />
            <span className={styles.emailText}>{user.email}</span>
          </div>
        </div>
        <div className={styles.planContainer}>
          <div className={styles.planBadge}>
            <ShieldCheck className={styles.planIcon} />
            <span className={styles.planText}>
              Plano Ativo
            </span>
          </div>
        </div>
      </div>

      <div className={styles.optionsCard}>
        <h3 className={styles.optionsTitle}>Opções da Conta</h3>
        <p className={styles.optionsDesc}>
          Seu contrato atual permite buscar até <span className={styles.optionsBold}>{user.plano || 50} leads</span> por ciclo de segmentação.
        </p>

        <div className={styles.actionsContainer}>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
          >
            <LogOut className={styles.logoutIcon} />
            Encerrar Sessão (Logout)
          </button>
        </div>
      </div>
    </div>
  );
}
