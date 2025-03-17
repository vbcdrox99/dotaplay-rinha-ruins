
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Award, Users, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type LeaderboardPlayer = {
  id: string;
  discord_name: string;
  avatar: string | null;
  rank: string | null;
  total_points: number;
  matches_won: number;
  matches_lost: number;
  mvp_core_count: number;
  mvp_sup_count: number;
  is_vip: boolean;
  vip_expires_at: string | null;
};

const LeaderboardWidget: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLeaderboard();
  }, []);
  
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (data) {
        setPlayers(data);
      }
    } catch (err) {
      console.error('Erro ao buscar leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const isUserVIP = (player: LeaderboardPlayer) => {
    if (!player.is_vip || !player.vip_expires_at) return false;
    
    const vipExpiresAt = new Date(player.vip_expires_at);
    const now = new Date();
    
    return vipExpiresAt > now;
  };
  
  return (
    <div className="glass-panel p-6 animate-fade-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Top 10 Jogadores</h2>
        <button 
          onClick={fetchLeaderboard}
          className="text-sm text-gaming-text-secondary hover:text-white"
        >
          Atualizar
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gaming-text-secondary">Carregando classificação...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gaming-text-secondary">Nenhum jogador encontrado</p>
            </div>
          ) : (
            players.map((player, index) => (
              <div 
                key={player.id} 
                className={`flex items-center p-3 rounded-lg gap-3 ${
                  index < 3 ? 'bg-gaming-bg-card bg-opacity-50 border border-gaming-border' : ''
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-amber-600 text-black' :
                  'bg-gaming-bg-card text-gaming-text-secondary'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex items-center gap-2 flex-grow">
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.discord_name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gaming-bg-card" />
                  )}
                  
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{player.discord_name}</span>
                      {isUserVIP(player) && (
                        <Crown size={14} className="text-yellow-400" aria-label="VIP" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gaming-text-secondary">
                      {player.rank && (
                        <Badge variant="outline" className={`text-xs ${
                          player.rank === 'Global' ? 'text-red-400 border-red-400' :
                          player.rank === 'Supremo' ? 'text-orange-400 border-orange-400' :
                          player.rank === 'Águia' ? 'text-yellow-400 border-yellow-400' :
                          player.rank === 'AK' ? 'text-green-400 border-green-400' :
                          player.rank === 'Xerife' ? 'text-blue-400 border-blue-400' :
                          'text-gray-400 border-gray-400'
                        }`}>
                          {player.rank}
                        </Badge>
                      )}
                      
                      <span className="text-green-400">{player.matches_won}W</span>
                      <span className="text-red-400">{player.matches_lost}L</span>
                      
                      {player.mvp_core_count > 0 && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <Award size={12} />
                          {player.mvp_core_count}
                        </span>
                      )}
                      
                      {player.mvp_sup_count > 0 && (
                        <span className="flex items-center gap-1 text-purple-400">
                          <Users size={12} />
                          {player.mvp_sup_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-xl font-bold text-gaming-accent-blue flex items-center gap-1">
                  <Trophy size={16} className="text-yellow-400" />
                  {player.total_points}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardWidget;
