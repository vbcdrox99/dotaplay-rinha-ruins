
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Users } from 'lucide-react';
import { useQueue } from '@/context/QueueContext';

type MatchHistory = {
  id: number;
  team1BlockId: number;
  team2BlockId: number;
  startTime: string;
  endTime: string | null;
  remainingTime: number;
  isActive: boolean;
  team1Won: boolean | null;
};

const History: React.FC = () => {
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { blocks } = useQueue();
  
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .eq('is_active', false)
          .order('end_time', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Convert the data to the expected format
          const formattedMatches: MatchHistory[] = data.map(match => ({
            id: typeof match.id === 'string' ? parseInt(match.id, 10) : match.id as number,
            team1BlockId: match.team1_block_id,
            team2BlockId: match.team2_block_id,
            startTime: match.start_time || new Date().toISOString(),
            endTime: match.end_time,
            remainingTime: match.remaining_time || 0,
            isActive: match.is_active || false,
            team1Won: match.team1_won
          }));
          
          setMatches(formattedMatches);
        }
      } catch (error) {
        console.error('Error fetching match history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatches();
  }, []);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };
  
  const calculateDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'Em andamento';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="glass-panel p-6 mb-8">
          <h1 className="text-2xl font-bold">Histórico de Partidas</h1>
          <p className="text-gaming-text-secondary">
            Visualize o histórico de partidas realizadas na plataforma
          </p>
        </div>
        
        {isLoading ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-gaming-text-secondary">Carregando histórico...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-gaming-text-secondary">Nenhuma partida finalizada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="glass-panel p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <div>
                    <h2 className="text-lg font-medium">
                      Partida {match.id} - Bloco {match.team1BlockId} vs Bloco {match.team2BlockId}
                    </h2>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                      <div className="flex items-center">
                        <CalendarDays size={16} className="mr-2 text-gaming-text-secondary" />
                        <span className="text-sm text-gaming-text-secondary">
                          Início: {formatDate(match.startTime)}
                        </span>
                      </div>
                      
                      {match.endTime && (
                        <div className="flex items-center">
                          <CalendarDays size={16} className="mr-2 text-gaming-text-secondary" />
                          <span className="text-sm text-gaming-text-secondary">
                            Fim: {formatDate(match.endTime)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Users size={16} className="mr-2 text-gaming-text-secondary" />
                        <span className="text-sm text-gaming-text-secondary">
                          Duração: {calculateDuration(match.startTime, match.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {match.team1Won !== null && (
                    <div className={`
                      px-3 py-1 rounded-full mt-2 md:mt-0
                      ${match.team1Won ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}
                    `}>
                      {match.team1Won ? 'Equipe 1 Venceu' : 'Equipe 2 Venceu'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
