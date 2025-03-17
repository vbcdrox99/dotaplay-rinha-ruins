
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/custom/Button';
import { LogIn, UserPlus, ScreenShare, User } from 'lucide-react';

const AuthForm: React.FC = () => {
  const { login, register, loading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [steamId, setSteamId] = useState('');
  const [discordName, setDiscordName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    // Resetar formulário ao alternar modos
    setSteamId('');
    setDiscordName('');
    setPassword('');
    setConfirmPassword('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      await login(steamId, password);
    } else {
      await register(steamId, discordName, password, confirmPassword);
    }
  };
  
  return (
    <div className="glass-panel w-full max-w-md p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? 'Entrar' : 'Criar Conta'}
      </h2>
      
      <div className="mb-6 flex">
        <button
          className={`flex-1 py-2 text-center transition-all ${
            isLogin
              ? 'text-gaming-accent-blue border-b-2 border-gaming-accent-blue font-medium'
              : 'text-gaming-text-secondary hover:text-white border-b border-gaming-border'
          }`}
          onClick={() => setIsLogin(true)}
          disabled={isLogin}
        >
          Entrar
        </button>
        <button
          className={`flex-1 py-2 text-center transition-all ${
            !isLogin
              ? 'text-gaming-accent-blue border-b-2 border-gaming-accent-blue font-medium'
              : 'text-gaming-text-secondary hover:text-white border-b border-gaming-border'
          }`}
          onClick={() => setIsLogin(false)}
          disabled={!isLogin}
        >
          Registrar
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="steamId" className="block text-sm font-medium text-gaming-text-secondary">
            Steam ID
          </label>
          <div className="relative">
            <ScreenShare size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-text-secondary" />
            <input
              type="text"
              id="steamId"
              className="form-input-gaming pl-10 w-full"
              placeholder="Digite seu Steam ID"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              required
            />
          </div>
        </div>
        
        {!isLogin && (
          <div className="space-y-2">
            <label htmlFor="discordName" className="block text-sm font-medium text-gaming-text-secondary">
              Nome no Discord
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-text-secondary" />
              <input
                type="text"
                id="discordName"
                className="form-input-gaming pl-10 w-full"
                placeholder="Digite seu nome no Discord"
                value={discordName}
                onChange={(e) => setDiscordName(e.target.value)}
                required={!isLogin}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gaming-text-secondary">
            Senha
          </label>
          <input
            type="password"
            id="password"
            className="form-input-gaming w-full"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {!isLogin && (
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gaming-text-secondary">
              Confirmar Senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input-gaming w-full"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={!isLogin}
            />
          </div>
        )}
        
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            leftIcon={isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            isLoading={loading}
            glow
          >
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </Button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <button
          onClick={handleToggleMode}
          className="text-gaming-accent-blue hover:underline text-sm"
        >
          {isLogin
            ? "Não tem uma conta? Registre-se"
            : "Já tem uma conta? Entre"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
