import React, { useState } from 'react';
import { supabase } from '../src/supabase';
import { User } from '../src/types';
import { motion } from 'motion/react';
import { ShieldCheck, User as UserIcon, Lock, ArrowRight, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const handleCreateUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const names = nomeCompleto.trim().split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');

      // Gerar ID automático (ex: VC-2024-001)
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const nextId = (count || 0) + 1;
      const year = new Date().getFullYear();
      const customId = `VC-${year}-${String(nextId).padStart(3, '0')}`;

      const newUser: User = {
        id: customId,
        firstName,
        lastName,
        store: 'Loja 1',
        password: senha,
        role: (firstName === 'Valmir' && lastName === 'Melo') ? 'admin' : 'vendedor',
        lastLogin: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('users').insert([newUser]);
      if (insertError) throw insertError;

      onLogin(newUser);
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError('Erro ao criar sua conta. Tente novamente.');
      setShowConfirmNew(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCompleto || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite de conexão esgotado. Verifique sua internet.')), 10000)
    );

    try {
      // Separar nome e sobrenome de forma mais robusta
      const names = nomeCompleto.trim().split(/\s+/);
      if (names.length < 1) {
        setError('Por favor, digite seu nome.');
        setLoading(false);
        return;
      }
      
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');

      // Verificar se o usuário já existe com timeout
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('firstName', firstName)
        .eq('lastName', lastName)
        .single();

      const { data: existingUser, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (fetchError && fetchError.code !== 'PGRST116') { 
        // Se a tabela não existir, o erro costuma ser 42P01
        if (fetchError.code === '42P01') {
          throw new Error('A tabela de usuários ainda não foi criada no banco de dados.');
        }
        throw fetchError;
      }

      if (existingUser) {
        if (existingUser.password === senha) {
          onLogin(existingUser as User);
        } else {
          setError('Senha incorreta para este usuário.');
        }
      } else {
        setShowConfirmNew(true);
      }
    } catch (err: any) {
      console.error('Erro detalhado no login:', err);
      const msg = err.message || 'Erro de conexão. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmNew) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-purple-500/10 border border-gray-100 p-10 space-y-8 text-center"
        >
          <div className="w-20 h-20 bg-purple-100 rounded-[2rem] flex items-center justify-center text-purple-600 mx-auto">
            <UserIcon size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Usuário não encontrado</h2>
            <p className="text-gray-500 text-sm font-medium">
              O nome <span className="text-purple-600 font-bold">"{nomeCompleto}"</span> ainda não está no sistema. 
              Deseja criar um **novo cadastro** com esta senha?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreateUser}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Sim, Criar Minha Conta'}
            </button>
            <button
              onClick={() => setShowConfirmNew(false)}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
            >
              Voltar e Corrigir Nome
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-purple-500/10 border border-gray-100 p-10 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-purple-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-500/30">
            <ShieldCheck size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
              Conquista <span className="text-purple-600">App</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.4em] mt-2">Acesso Restrito</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <UserIcon size={18} />
              </div>
              <input
                type="text"
                placeholder="Nome Completo"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 pl-12 pr-4 py-4 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 transition-all"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Sua Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 pl-12 pr-4 py-4 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 transition-all"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 p-4 rounded-2xl border border-red-100"
            >
              <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest leading-relaxed">
                {error}
              </p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : (
              <>
                Entrar no Sistema
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 text-center">
          <div className="inline-flex flex-col items-center gap-2 px-6 py-4 bg-purple-50 rounded-[2rem] border border-purple-100 w-full">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600" />
              <span className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Novo por aqui?</span>
            </div>
            <p className="text-[9px] text-purple-600/70 font-bold leading-tight">
              Basta digitar seu nome e uma senha nova e clicar em "Entrar". O sistema criará seu ID automaticamente.
            </p>
          </div>
        </div>
      </motion.div>
      
      <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Conquista App Gestão de Alta Performance</p>
    </div>
  );
};

export default Login;
