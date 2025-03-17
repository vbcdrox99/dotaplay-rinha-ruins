
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import AdminPanel from '@/components/admin/AdminPanel';
import QueueDisplay from '@/components/queue/QueueDisplay';
import ChatPanel from '@/components/chat/ChatPanel';
import { Button } from '@/components/ui/custom/Button';
import { Users, BarChart } from 'lucide-react';
import { toast } from 'sonner';

const Admin: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect non-admin users to the home page
    if (!user || !isAdmin) {
      toast.error("Você não tem permissão para acessar esta página");
      navigate('/');
    }
  }, [user, isAdmin, navigate]);
  
  if (!user || !isAdmin) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="glass-panel p-6 mb-8 animate-fade-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">Painel de Administração</h1>
              <p className="text-gaming-text-secondary">
                Gerencie o sistema de fila competitiva e partidas ativas.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <Link to="/users-management">
                <Button variant="outline" leftIcon={<Users size={18} />}>
                  Gerenciar Usuários
                </Button>
              </Link>
              
              <Link to="/statistics">
                <Button variant="outline" leftIcon={<BarChart size={18} />}>
                  Estatísticas
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="space-y-10">
          <AdminPanel />
          
          <div className="mt-10">
            <QueueDisplay adminMode />
          </div>
          
          <ChatPanel />
        </div>
      </main>
    </div>
  );
};

export default Admin;
