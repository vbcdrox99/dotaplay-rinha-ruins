
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Users, Timer, Shield, Award, Trophy, Medal, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UserProfileModal from '@/components/user/UserProfileModal';

interface LeaderboardUser {
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
}

const Statistics: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalUsers: 0,
    totalPunishedUsers: 0,
    averageMatchTime: 0,
    matchesPerUser: [],
    rankDistribution: {
      "Global": 0,
      "Supremo": 0,
      "Águia": 0,
      "AK": 0,
      "Xerife": 0,
      "Prata": 0
    }
  });
  
  useEffect(() => {
    fetchStatistics();
  }, [user]);
  
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Get leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false });
      
      if (leaderboardError) throw leaderboardError;
      
      setLeaderboard(leaderboardData || []);
      
      // Get total matches (ended matches count)
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .is('is_active', false);
      
      if (matchesError) throw matchesError;
      
      // Get total users
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact' });
      
      if (usersError) throw usersError;
      
      // Get punished users (users with banned_until in the future)
      const { count: punishedCount, error: punishedError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte('banned_until', new Date().toISOString());
      
      if (punishedError) throw punishedError;
      
      // Calculate rank distribution
      const rankDistribution = {
        "Global": 0,
        "Supremo": 0,
        "Águia": 0,
        "AK": 0,
        "Xerife": 0,
        "Prata": 0
      };
      
      leaderboardData?.forEach(user => {
        if (user.rank && rankDistribution[user.rank as keyof typeof rankDistribution] !== undefined) {
          rankDistribution[user.rank as keyof typeof rankDistribution]++;
        } else {
          rankDistribution["Prata"]++;
        }
      });
      
      // Calculate average match time
      let totalTime = 0;
      let completedMatches = 0;
      
      matchesData.forEach(match => {
        if (match.end_time && match.start_time) {
          const startTime = new Date(match.start_time).getTime();
          const endTime = new Date(match.end_time).getTime();
          const duration = (endTime - startTime) / (1000 * 60); // in minutes
          
          if (duration > 0) {
            totalTime += duration;
            completedMatches++;
          }
        }
      });
      
      const averageTime = completedMatches > 0 ? Math.round(totalTime / completedMatches) : 0;
      
      // Format data for charts
      const matchesPerUserData = leaderboardData
        ?.slice(0, 10)
        .map(user => ({
          name: user.discord_name,
          partidas: (user.matches_won || 0) + (user.matches_lost || 0),
          vitorias: user.matches_won || 0,
          derrotas: user.matches_lost || 0
        })) || [];
      
      setStats({
        totalMatches: matchesData.length,
        totalUsers: usersCount || 0,
        totalPunishedUsers: punishedCount || 0,
        averageMatchTime: averageTime,
        matchesPerUser: matchesPerUserData,
        rankDistribution
      });
      
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUserClick = (user: LeaderboardUser) => {
    setSelectedUser({
      id: user.id,
      steamId: 'N/A', // We don't have steam ID in leaderboard
      discordName: user.discord_name,
      avatar: user.avatar,
      rank: user.rank,
      isVip: user.is_vip,
      vipExpiresAt: user.vip_expires_at,
      total_points: user.total_points,
      matches_won: user.matches_won,
      matches_lost: user.matches_lost,
      mvp_core_count: user.mvp_core_count,
      mvp_sup_count: user.mvp_sup_count,
      matchesPlayed: (user.matches_won || 0) + (user.matches_lost || 0),
    });
    setShowUserModal(true);
  };
  
  const RANK_COLORS = {
    "Global": "#ff4d4f",
    "Supremo": "#ff7a45",
    "Águia": "#ffc53d",
    "AK": "#73d13d",
    "Xerife": "#40a9ff",
    "Prata": "#8c8c8c"
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="glass-panel p-6 mb-8 animate-fade-up">
          <h1 className="text-2xl font-bold mb-2">Ranking & Estatísticas</h1>
          <p className="text-gaming-text-secondary">
            Ranking de jogadores e estatísticas do sistema
          </p>
        </div>
        
        {loading ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-gaming-text-secondary">Carregando estatísticas...</p>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-up">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-6 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gaming-bg-card flex items-center justify-center mr-4">
                  <Timer size={24} className="text-gaming-accent-blue" />
                </div>
                <div>
                  <p className="text-sm text-gaming-text-secondary">Total de Partidas</p>
                  <p className="text-2xl font-bold">{stats.totalMatches}</p>
                </div>
              </div>
              
              <div className="glass-panel p-6 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gaming-bg-card flex items-center justify-center mr-4">
                  <Users size={24} className="text-gaming-accent-blue" />
                </div>
                <div>
                  <p className="text-sm text-gaming-text-secondary">Total de Usuários</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
              
              <div className="glass-panel p-6 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gaming-bg-card flex items-center justify-center mr-4">
                  <Shield size={24} className="text-gaming-accent-blue" />
                </div>
                <div>
                  <p className="text-sm text-gaming-text-secondary">Usuários Punidos</p>
                  <p className="text-2xl font-bold">{stats.totalPunishedUsers}</p>
                </div>
              </div>
              
              <div className="glass-panel p-6 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gaming-bg-card flex items-center justify-center mr-4">
                  <Award size={24} className="text-gaming-accent-blue" />
                </div>
                <div>
                  <p className="text-sm text-gaming-text-secondary">Tempo Médio (min)</p>
                  <p className="text-2xl font-bold">{stats.averageMatchTime}</p>
                </div>
              </div>
            </div>
            
            {/* Leaderboard */}
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Trophy size={24} className="text-yellow-400 mr-2" />
                Ranking de Jogadores
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gaming-border">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Jogador</th>
                      <th className="px-4 py-3 text-right">Pontos</th>
                      <th className="px-4 py-3 text-center">Rank</th>
                      <th className="px-4 py-3 text-center">V/D</th>
                      <th className="px-4 py-3 text-center">MVPs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.slice(0, 20).map((user, index) => {
                      const isVipActive = user.is_vip && user.vip_expires_at && new Date(user.vip_expires_at) > new Date();
                      
                      return (
                        <tr 
                          key={user.id} 
                          className={`border-b border-gaming-border hover:bg-gaming-bg-dark hover:bg-opacity-50 cursor-pointer transition-colors ${index < 3 ? 'font-medium' : ''}`}
                          onClick={() => handleUserClick(user)}
                        >
                          <td className="px-4 py-3">
                            {index === 0 ? (
                              <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold">1</div>
                            ) : index === 1 ? (
                              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold">2</div>
                            ) : index === 2 ? (
                              <div className="w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold">3</div>
                            ) : (
                              <span className="text-gaming-text-secondary">{index + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.discord_name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gaming-bg-card flex items-center justify-center">
                                  <Users size={16} className="text-gaming-text-secondary" />
                                </div>
                              )}
                              <span className="flex items-center gap-1">
                                {user.discord_name}
                                {isVipActive && <Crown size={14} className="text-yellow-400" />}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold">{user.total_points}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className={
                              user.rank === 'Global' ? 'text-red-400 border-red-400' :
                              user.rank === 'Supremo' ? 'text-orange-400 border-orange-400' :
                              user.rank === 'Águia' ? 'text-yellow-400 border-yellow-400' :
                              user.rank === 'AK' ? 'text-green-400 border-green-400' :
                              user.rank === 'Xerife' ? 'text-blue-400 border-blue-400' :
                              'text-gray-400 border-gray-400'
                            }>
                              {user.rank || 'Prata'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-green-400">{user.matches_won || 0}W</span>
                            {" / "}
                            <span className="text-red-400">{user.matches_lost || 0}L</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {user.mvp_core_count > 0 && (
                                <span className="flex items-center gap-1 bg-blue-900 bg-opacity-30 px-2 py-0.5 rounded-full">
                                  <Award size={12} className="text-blue-400" />
                                  <span className="text-xs">{user.mvp_core_count}</span>
                                </span>
                              )}
                              {user.mvp_sup_count > 0 && (
                                <span className="flex items-center gap-1 bg-purple-900 bg-opacity-30 px-2 py-0.5 rounded-full">
                                  <Users size={12} className="text-purple-400" />
                                  <span className="text-xs">{user.mvp_sup_count}</span>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Top Users Chart */}
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4">Jogadores Mais Ativos</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.matchesPerUser}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      tick={{ fill: '#e0e0e0' }}
                      height={70}
                    />
                    <YAxis tick={{ fill: '#e0e0e0' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid #333',
                        color: '#e0e0e0'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="vitorias" stackId="a" fill="#4caf50" name="Vitórias" />
                    <Bar dataKey="derrotas" stackId="a" fill="#f44336" name="Derrotas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* User Rank Distribution */}
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4">Distribuição de Ranks</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.rankDistribution).map(([rank, count]) => ({
                        name: rank,
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(stats.rankDistribution).map((rank, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={RANK_COLORS[rank as keyof typeof RANK_COLORS]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid #333',
                        color: '#e0e0e0'
                      }}
                      formatter={(value, name) => [`${value} jogadores`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Point system explanation */}
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4">Sistema de Pontuação</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-green-900 bg-opacity-20 border-green-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy size={18} className="text-green-400" />
                      Vitória
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-400">+25</p>
                    <p className="text-sm text-gray-300 mt-1">pontos por vitória</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-900 bg-opacity-20 border-blue-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award size={18} className="text-blue-400" />
                      MVP Core
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-400">+4</p>
                    <p className="text-sm text-gray-300 mt-1">pontos extras</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-900 bg-opacity-20 border-purple-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users size={18} className="text-purple-400" />
                      MVP Suporte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-400">+3</p>
                    <p className="text-sm text-gray-300 mt-1">pontos extras</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 glass-panel-inner p-4 rounded-lg">
                <h3 className="font-medium mb-2">Níveis de Rank</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="flex flex-col items-center bg-gaming-bg-dark p-3 rounded">
                    <Badge variant="outline" className="mb-2 text-gray-400 border-gray-400">Prata</Badge>
                    <p className="text-xs text-gray-400">0-99 pontos</p>
                  </div>
                  <div className="flex flex-col items-center bg-gaming-bg-dark p-3 rounded">
                    <Badge variant="outline" className="mb-2 text-blue-400 border-blue-400">Xerife</Badge>
                    <p className="text-xs text-gray-400">100-199 pontos</p>
                  </div>
                  <div className="flex flex-col items-center bg-gaming-bg-dark p-3 rounded">
                    <Badge variant="outline" className="mb-2 text-green-400 border-green-400">AK</Badge>
                    <p className="text-xs text-gray-400">200-299 pontos</p>
                  </div>
                  <div className="flex flex-col items-center bg-gaming-bg-dark p-3 rounded">
                    <Badge variant="outline" className="mb-2 text-yellow-400 border-yellow-400">Águia</Badge>
                    <p className="text-xs text-gray-400">300-399 pontos</p>
                  </div>
                  <div className="flex flex-col items-center bg-gaming-bg-dark p-3 rounded">
                    <Badge variant="outline" className="mb-2 text-orange-400 border-orange-400">Supremo</Badge>
                    <p className="text-xs text-gray-400">400-499 pontos</p>
                  </div>
                  <div className="flex flex-col items-center bg-gaming-bg-dark p-3 rounded">
                    <Badge variant="outline" className="mb-2 text-red-400 border-red-400">Global</Badge>
                    <p className="text-xs text-gray-400">500+ pontos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  );
};

export default Statistics;
