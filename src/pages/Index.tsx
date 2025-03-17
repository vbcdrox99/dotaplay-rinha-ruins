
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthForm from '@/components/auth/AuthForm';
import Header from '@/components/Header';
import LeaderboardWidget from '@/components/leaderboard/LeaderboardWidget';

const Index: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect authenticated users to the appropriate dashboard
    if (user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-16">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-shadow animate-fade-up">
              <span className="text-gaming-accent-blue">RINHA</span>DE<span className="text-gaming-accent-blue">RUINS</span>
            </h1>
            <p className="text-xl text-gaming-text-secondary max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Entre na fila para participar das partidas organizadas!
            </p>
          </div>
          
          <div className="w-full max-w-md mb-10">
            <AuthForm />
          </div>
          
          {/* Leaderboard Widget */}
          <div className="w-full mb-10">
            <LeaderboardWidget />
          </div>
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gaming-accent-blue bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gaming-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cadastro Simples</h3>
              <p className="text-gaming-text-secondary">
                Crie uma conta com seu ID da Steam e nome do Discord para começar
              </p>
            </div>
            
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gaming-accent-blue bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gaming-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sistema de Fila</h3>
              <p className="text-gaming-text-secondary">
                Entre na fila e seja automaticamente organizado em blocos de 5 jogadores
              </p>
            </div>
            
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gaming-accent-blue bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gaming-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Partidas Competitivas</h3>
              <p className="text-gaming-text-secondary">
                Participe de partidas organizadas 5v5 gerenciadas por administradores
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-8 border-t border-gaming-border mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gaming-text-secondary text-sm">
            &copy; {new Date().getFullYear()} Ruinha de Ruins
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
