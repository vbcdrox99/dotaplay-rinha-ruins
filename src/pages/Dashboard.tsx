
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import QueueDisplay from '@/components/queue/QueueDisplay';
import ChatPanel from '@/components/chat/ChatPanel';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirecionar usuários não autenticados para a página inicial
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  if (!user) {
    return null; // Não renderiza nada enquanto redireciona
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="glass-panel p-6 mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold mb-2">Bem-vindo à Rinha de Ruins, {user.discordName}!</h1>
          <p className="text-gaming-text-secondary">
            Entre na fila e aguarde, você será chamado em breve (Entrar no Discord é Obrigatório). Se divirta!
          </p>
        </div>
        
        <div className="space-y-8">
          <QueueDisplay />
          <ChatPanel />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
