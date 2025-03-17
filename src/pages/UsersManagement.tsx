import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/custom/Button';
import { Input } from '@/components/ui/input';
import { User, Shield, Ban, Clock, ArrowUp, Search, UserCheck, Crown, Award, Users, Trophy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import UserProfileModal from '@/components/user/UserProfileModal';
import { Badge } from '@/components/ui/badge';

interface UserData {
  id: string;
  steamId: string;
  discordName: string;
  isAdmin: boolean;
  isVip?: boolean;
  vipExpiresAt?: string | null;
  avatar: string | null;
  bannedUntil: string | null;
  rank: string | null;
  quote: string | null;
  matchesPlayed: number;
  total_points: number;
  matches_won: number;
  matches_lost: number;
  mvp_core_count: number;
  mvp_sup_count: number;
}

const UsersManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    if (!user || !isAdmin) {
      toast.error("Você não tem permissão para acessar esta página");
      navigate('/');
    } else {
      fetchUsers();
    }
  }, [user, isAdmin, navigate]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*, is_vip, vip_expires_at, total_points, matches_won, matches_lost, mvp_core_count, mvp_sup_count')
        .order('discord_name', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const formattedUsers = data.map(user => ({
          id: user.id,
          steamId: user.steam_id,
          discordName: user.discord_name,
          isAdmin: user.is_admin || false,
          isVip: user.is_vip || false,
          vipExpiresAt: user.vip_expires_at,
          avatar: user.avatar,
          bannedUntil: user.banned_until,
          rank: user.rank,
          quote: user.quote,
          matchesPlayed: user.matches_played || 0,
          total_points: user.total_points || 0,
          matches_won: user.matches_won || 0, 
          matches_lost: user.matches_lost || 0,
          mvp_core_count: user.mvp_core_count || 0,
          mvp_sup_count: user.mvp_sup_count || 0
        }));
        
        setUsers(formattedUsers);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      toast.error("Erro ao carregar usuários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGrantVIP = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      if (!window.confirm(`Tem certeza que deseja conceder VIP por 1 mês para ${targetUser.discordName}?`)) {
        return;
      }
      
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      
      const { error } = await supabase
        .from('users')
        .update({
          is_vip: true,
          vip_expires_at: expirationDate.toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`VIP concedido para ${targetUser.discordName} até ${expirationDate.toLocaleDateString()}`);
      
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isVip: true,
            vipExpiresAt: expirationDate.toISOString()
          };
        }
        return u;
      }));
      
    } catch (err) {
      console.error('Erro ao conceder VIP:', err);
      toast.error("Erro ao conceder VIP. Tente novamente.");
    }
  };
  
  const handleRemoveVIP = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      if (!window.confirm(`Tem certeza que deseja remover o status VIP de ${targetUser.discordName}?`)) {
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .update({
          is_vip: false,
          vip_expires_at: null
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`Status VIP removido de ${targetUser.discordName}`);
      
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isVip: false,
            vipExpiresAt: null
          };
        }
        return u;
      }));
      
    } catch (err) {
      console.error('Erro ao remover VIP:', err);
      toast.error("Erro ao remover VIP. Tente novamente.");
    }
  };
  
  const handlePunishUser = async (userId: string, minutes: number) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      if (!window.confirm(`Tem certeza que deseja punir ${targetUser.discordName} por ${minutes} minutos?`)) {
        return;
      }
      
      const punishmentEndTime = new Date();
      punishmentEndTime.setMinutes(punishmentEndTime.getMinutes() + minutes);
      
      const { error } = await supabase
        .from('users')
        .update({
          banned_until: punishmentEndTime.toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      await supabase
        .from('queue_entries')
        .delete()
        .eq('user_id', userId);
      
      toast.success(`${targetUser.discordName} foi punido por ${minutes} minutos`);
      
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            bannedUntil: punishmentEndTime.toISOString()
          };
        }
        return u;
      }));
      
    } catch (err) {
      console.error('Erro ao punir usuário:', err);
      toast.error("Erro ao punir usuário. Tente novamente.");
    }
  };
  
  const handleRemovePunishment = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      if (!window.confirm(`Tem certeza que deseja remover a punição de ${targetUser.discordName}?`)) {
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .update({
          banned_until: null
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`Punição de ${targetUser.discordName} removida com sucesso`);
      
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            bannedUntil: null
          };
        }
        return u;
      }));
      
    } catch (err) {
      console.error('Erro ao remover punição:', err);
      toast.error("Erro ao remover punição. Tente novamente.");
    }
  };
  
  const handleResetStats = async (userId: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      if (!window.confirm(`Tem certeza que deseja resetar as estatísticas de ${targetUser.discordName}? Todos os pontos e MVPs serão zerados.`)) {
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .update({
          total_points: 0,
          matches_won: 0,
          matches_lost: 0,
          mvp_core_count: 0,
          mvp_sup_count: 0
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`Estatísticas de ${targetUser.discordName} resetadas com sucesso`);
      
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            total_points: 0,
            matches_won: 0,
            matches_lost: 0,
            mvp_core_count: 0,
            mvp_sup_count: 0
          };
        }
        return u;
      }));
      
    } catch (err) {
      console.error('Erro ao resetar estatísticas:', err);
      toast.error("Erro ao resetar estatísticas. Tente novamente.");
    }
  };
  
  const handleAdjustPoints = async (userId: string, points: number) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;
      
      const pointsAction = points > 0 ? "adicionar" : "remover";
      const pointsAbsolute = Math.abs(points);
      
      if (!window.confirm(`Tem certeza que deseja ${pointsAction} ${pointsAbsolute} pontos ${points > 0 ? 'para' : 'de'} ${targetUser.discordName}?`)) {
        return;
      }
      
      const newPoints = Math.max(0, (targetUser.total_points || 0) + points);
      
      const { error } = await supabase
        .from('users')
        .update({
          total_points: newPoints
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`${pointsAbsolute} pontos ${points > 0 ? 'adicionados para' : 'removidos de'} ${targetUser.discordName}`);
      
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            total_points: newPoints
          };
        }
        return u;
      }));
      
    } catch (err) {
      console.error('Erro ao ajustar pontos:', err);
      toast.error("Erro ao ajustar pontos. Tente novamente.");
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.discordName.toLowerCase().includes(search.toLowerCase()) ||
    user.steamId.toLowerCase().includes(search.toLowerCase())
  );
  
  const isUserPunished = (user: UserData) => {
    if (!user.bannedUntil) return false;
    
    const bannedUntil = new Date(user.bannedUntil);
    const now = new Date();
    
    return bannedUntil > now;
  };
  
  const isUserVIP = (user: UserData) => {
    if (!user.isVip || !user.vipExpiresAt) return false;
    
    const vipExpiresAt = new Date(user.vipExpiresAt);
    const now = new Date();
    
    return vipExpiresAt > now;
  };
  
  const getPunishmentTimeLeft = (bannedUntil: string) => {
    const now = new Date();
    const end = new Date(bannedUntil);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expirada';
    
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = diffMs % 60;
      return `${hours}h ${mins}min`;
    }
  };
  
  const getVIPTimeLeft = (vipExpiresAt: string) => {
    const now = new Date();
    const end = new Date(vipExpiresAt);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expirado';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      return `${hours}h`;
    } else {
      return `${diffDays} dias`;
    }
  };
  
  const openUserProfile = (user: UserData) => {
    setSelectedUser(user);
    setShowModal(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="glass-panel p-6 mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold mb-2">Gerenciamento de Usuários</h1>
          <p className="text-gaming-text-secondary">
            Administre usuários da plataforma
          </p>
        </div>
        
        <div className="glass-panel p-6 mb-8 animate-fade-up">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-text-secondary" size={18} />
              <Input
                className="pl-10 bg-gaming-bg-card border-gaming-border"
                placeholder="Buscar por nome ou Steam ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                leftIcon={<ArrowUp size={16} />}
              >
                Atualizar Lista
              </Button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-gaming-text-secondary">Carregando usuários...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {filteredUsers.length === 0 ? (
              <div className="glass-panel p-8 text-center">
                <p className="text-gaming-text-secondary">Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className={`glass-panel p-4 flex flex-col md:flex-row justify-between items-start md:items-center ${
                    isUserPunished(user) ? 'border-l-4 border-red-500' : 
                    isUserVIP(user) ? 'border-l-4 border-yellow-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-gaming-bg-card flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.discordName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <User size={20} className="text-gaming-text-secondary" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium flex items-center gap-2">
                        {user.discordName}
                        {user.isAdmin && (
                          <Shield size={16} className="text-yellow-400" aria-label="Administrador" />
                        )}
                        {isUserVIP(user) && (
                          <Crown size={16} className="text-yellow-400" aria-label="VIP" />
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gaming-text-secondary">
                          Steam ID: {user.steamId}
                        </p>
                        {user.rank && (
                          <Badge variant="outline" className={
                            user.rank === 'Global' ? 'text-red-400 border-red-400' :
                            user.rank === 'Supremo' ? 'text-orange-400 border-orange-400' :
                            user.rank === 'Águia' ? 'text-yellow-400 border-yellow-400' :
                            user.rank === 'AK' ? 'text-green-400 border-green-400' :
                            user.rank === 'Xerife' ? 'text-blue-400 border-blue-400' :
                            'text-gray-400 border-gray-400'
                          }>
                            {user.rank}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {isUserPunished(user) && (
                          <p className="text-xs text-red-400">
                            <Clock size={12} className="inline-block mr-1" />
                            Punido: {getPunishmentTimeLeft(user.bannedUntil!)}
                          </p>
                        )}
                        {isUserVIP(user) && (
                          <p className="text-xs text-yellow-400">
                            <Crown size={12} className="inline-block mr-1" />
                            VIP: {getVIPTimeLeft(user.vipExpiresAt!)}
                          </p>
                        )}
                        {user.total_points > 0 && (
                          <p className="text-xs text-blue-400">
                            <Trophy size={12} className="inline-block mr-1" />
                            {user.total_points} pontos
                          </p>
                        )}
                        {(user.mvp_core_count > 0 || user.mvp_sup_count > 0) && (
                          <p className="text-xs text-purple-400">
                            <Award size={12} className="inline-block mr-1" />
                            {user.mvp_core_count > 0 && `${user.mvp_core_count} MVP Core`}
                            {user.mvp_core_count > 0 && user.mvp_sup_count > 0 && ' / '}
                            {user.mvp_sup_count > 0 && `${user.mvp_sup_count} MVP Sup`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUserProfile(user)}
                      leftIcon={<User size={14} />}
                    >
                      Ver Perfil
                    </Button>
                    
                    {isUserVIP(user) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveVIP(user.id)}
                        leftIcon={<Crown size={14} />}
                      >
                        Remover VIP
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGrantVIP(user.id)}
                        leftIcon={<Crown size={14} />}
                        className="text-yellow-400 hover:text-yellow-500"
                      >
                        Conceder VIP (1 mês)
                      </Button>
                    )}
                    
                    {isUserPunished(user) ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleRemovePunishment(user.id)}
                        leftIcon={<UserCheck size={14} />}
                      >
                        Remover Punição
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePunishUser(user.id, 10)}
                          leftIcon={<Clock size={14} />}
                        >
                          Punir 10min
                        </Button>
                        
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handlePunishUser(user.id, 60)}
                          leftIcon={<Ban size={14} />}
                        >
                          Punir 1h
                        </Button>
                      </>
                    )}
                    
                    <div className="dropdown relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Trophy size={14} />}
                      >
                        Rankings
                      </Button>
                      <div className="dropdown-content absolute z-10 right-0 mt-2 w-48 rounded-md shadow-lg bg-gaming-bg-card border border-gaming-border hidden group-hover:block">
                        <div className="p-2">
                          <button 
                            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gaming-bg-dark rounded-md"
                            onClick={() => handleAdjustPoints(user.id, 10)}
                          >
                            <Award size={14} className="mr-2 text-green-400" />
                            <span>Adicionar 10pts</span>
                          </button>
                          <button 
                            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gaming-bg-dark rounded-md"
                            onClick={() => handleAdjustPoints(user.id, -10)}
                          >
                            <Award size={14} className="mr-2 text-red-400" />
                            <span>Remover 10pts</span>
                          </button>
                          <div className="border-t border-gaming-border my-1"></div>
                          <button 
                            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gaming-bg-dark rounded-md"
                            onClick={() => handleResetStats(user.id)}
                          >
                            <RefreshCw size={14} className="mr-2 text-red-400" />
                            <span>Resetar Estatísticas</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default UsersManagement;
