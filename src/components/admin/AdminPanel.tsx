import React, { useState } from 'react';
import { useQueue } from '@/context/QueueContext';
import { Button } from '@/components/ui/custom/Button';
import { 
  Play, 
  Pause, 
  Clock, 
  AlertTriangle, 
  Check, 
  RefreshCw,
  Award,
  Trophy,
  Users,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const AdminPanel: React.FC = () => {
  const { 
    activeMatches, 
    blocks, 
    endMatch, 
    extendMatchTime,
    clearAllQueue,
    createMatch
  } = useQueue();
  
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [selectedWinners, setSelectedWinners] = useState<number | null>(null);
  const [selectedMVPCore, setSelectedMVPCore] = useState<string | null>(null);
  const [selectedMVPSup, setSelectedMVPSup] = useState<string | null>(null);
  const [showResultPanel, setShowResultPanel] = useState<string | null>(null);
  
  const handleEndMatch = async (matchId: string) => {
    if (!window.confirm('Tem certeza que deseja finalizar esta partida? Todos os jogadores receberão uma punição de 10 minutos.')) {
      return;
    }
    
    try {
      setIsLoading(prev => ({ ...prev, [`end-${matchId}`]: true }));
      await endMatch(matchId);
      toast.success(`Partida finalizada com sucesso!`);
    } catch (error) {
      console.error('Erro ao finalizar partida:', error);
      toast.error(`Erro ao finalizar partida. Tente novamente.`);
    } finally {
      setIsLoading(prev => ({ ...prev, [`end-${matchId}`]: false }));
    }
  };
  
  const handleExtendTime = async (matchId: string, minutes: number) => {
    try {
      setIsLoading(prev => ({ ...prev, [`extend-${matchId}-${minutes}`]: true }));
      await extendMatchTime(matchId, minutes);
      toast.success(`${minutes > 0 ? 'Adicionados' : 'Removidos'} ${Math.abs(minutes)} minutos ao tempo da partida`);
    } catch (error) {
      console.error('Erro ao estender tempo da partida:', error);
      toast.error(`Erro ao ${minutes > 0 ? 'adicionar' : 'remover'} tempo da partida. Tente novamente.`);
    } finally {
      setIsLoading(prev => ({ ...prev, [`extend-${matchId}-${minutes}`]: false }));
    }
  };

  const handleClearAllQueue = async () => {
    if (!window.confirm('Tem certeza que deseja resetar completamente a fila? Todos os usuários serão removidos e partidas ativas serão finalizadas.')) {
      return;
    }
    
    try {
      await clearAllQueue();
      toast.success("Fila completamente resetada com sucesso!");
    } catch (error) {
      console.error('Erro ao resetar fila:', error);
      toast.error("Erro ao resetar a fila. Tente novamente.");
    }
  };

  const handleStartMatch = () => {
    const completedBlocks = blocks
      .filter(block => block.isComplete && !isBlockInMatch(block.id))
      .slice(0, 2);
    
    if (completedBlocks.length < 2) {
      toast.error("São necessários pelo menos 2 blocos completos para iniciar uma partida");
      return;
    }
    
    try {
      createMatch(completedBlocks[0].id, completedBlocks[1].id);
    } catch (error) {
      console.error('Erro ao iniciar partida:', error);
      toast.error("Erro ao iniciar partida. Tente novamente.");
    }
  };
  
  const getBlockName = (blockId: number) => {
    const block = blocks.find(b => b.id === blockId);
    return block ? `Bloco #${block.id}` : `Bloco #${blockId}`;
  };
  
  const isBlockInMatch = (blockId: number) => {
    return activeMatches.some(match => 
      (match.team1BlockId === blockId || match.team2BlockId === blockId) && match.isActive
    );
  };
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getMatchTeamNames = (match: any) => {
    const team1Block = blocks.find(b => b.id === match.team1BlockId);
    const team2Block = blocks.find(b => b.id === match.team2BlockId);
    
    return {
      team1: team1Block ? `Bloco #${team1Block.id}` : 'Equipe 1',
      team2: team2Block ? `Bloco #${team2Block.id}` : 'Equipe 2',
    };
  };

  const canStartMatch = () => {
    const completedBlocks = blocks.filter(block => block.isComplete && !isBlockInMatch(block.id));
    return completedBlocks.length >= 2;
  };

  const handleShowResultPanel = (matchId: string) => {
    setShowResultPanel(matchId);
    setSelectedWinners(null);
    setSelectedMVPCore(null);
    setSelectedMVPSup(null);
  };

  const getBlockPlayers = (blockId: number) => {
    const block = blocks.find(b => b.id === blockId);
    return block ? block.players : [];
  };

  const handleAdjustMatchPoints = async (userId: string, points: number) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single();
      
      const currentPoints = userData?.total_points || 0;
      const newPoints = Math.max(0, currentPoints + points);
      
      await supabase
        .from('users')
        .update({
          total_points: newPoints
        })
        .eq('id', userId);
      
      toast.success(`${points > 0 ? 'Adicionado' : 'Removido'} ${Math.abs(points)} pontos`);
      
    } catch (error) {
      console.error('Erro ao ajustar pontos:', error);
      toast.error("Erro ao ajustar pontos. Tente novamente.");
    }
  };

  const handleSubmitResults = async (matchId: string) => {
    if (!selectedWinners) {
      toast.error("Selecione o time vencedor");
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, [`submit-results-${matchId}`]: true }));
      const match = activeMatches.find(m => m.id === matchId);
      
      if (!match) {
        throw new Error("Partida não encontrada");
      }

      const team1Players = getBlockPlayers(match.team1BlockId);
      const team2Players = getBlockPlayers(match.team2BlockId);
      
      const winnersPlayers = selectedWinners === match.team1BlockId ? team1Players : team2Players;
      const losersPlayers = selectedWinners === match.team1BlockId ? team2Players : team1Players;
      
      await supabase
        .from('matches')
        .update({
          team1_won: selectedWinners === match.team1BlockId,
          is_active: false,
          end_time: new Date().toISOString()
        })
        .eq('id', matchId);
      
      for (const player of winnersPlayers) {
        const { data: userData } = await supabase
          .from('users')
          .select('total_points, matches_won')
          .eq('id', player.id)
          .single();
        
        const currentPoints = userData?.total_points || 0;
        const matchesWon = userData?.matches_won || 0;
        
        await supabase
          .from('users')
          .update({
            total_points: currentPoints + 25,
            matches_won: matchesWon + 1
          })
          .eq('id', player.id);
      }
      
      for (const player of losersPlayers) {
        const { data: userData } = await supabase
          .from('users')
          .select('total_points, matches_lost')
          .eq('id', player.id)
          .single();
        
        const currentPoints = userData?.total_points || 0;
        const matchesLost = userData?.matches_lost || 0;
        
        await supabase
          .from('users')
          .update({
            total_points: Math.max(0, currentPoints - 25),
            matches_lost: matchesLost + 1
          })
          .eq('id', player.id);
      }
      
      if (selectedMVPCore) {
        const { data: mvpCoreData } = await supabase
          .from('users')
          .select('total_points, mvp_core_count')
          .eq('id', selectedMVPCore)
          .single();
        
        const mvpCorePoints = mvpCoreData?.total_points || 0;
        const mvpCoreCount = mvpCoreData?.mvp_core_count || 0;
        
        await supabase
          .from('users')
          .update({
            total_points: mvpCorePoints + 4,
            mvp_core_count: mvpCoreCount + 1
          })
          .eq('id', selectedMVPCore);
      }
      
      if (selectedMVPSup) {
        const { data: mvpSupData } = await supabase
          .from('users')
          .select('total_points, mvp_sup_count')
          .eq('id', selectedMVPSup)
          .single();
        
        const mvpSupPoints = mvpSupData?.total_points || 0;
        const mvpSupCount = mvpSupData?.mvp_sup_count || 0;
        
        await supabase
          .from('users')
          .update({
            total_points: mvpSupPoints + 3,
            mvp_sup_count: mvpSupCount + 1
          })
          .eq('id', selectedMVPSup);
      }
      
      setShowResultPanel(null);
      toast.success("Resultados da partida registrados com sucesso!");
      
      await endMatch(matchId);
      
    } catch (error) {
      console.error('Erro ao registrar resultados:', error);
      toast.error("Erro ao registrar resultados. Tente novamente.");
    } finally {
      setIsLoading(prev => ({ ...prev, [`submit-results-${matchId}`]: false }));
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Painel de Controle</h2>
        <div className="flex space-x-3">
          {canStartMatch() && (
            <Button 
              variant="primary" 
              leftIcon={<Play size={18} />}
              onClick={handleStartMatch}
              glow
            >
              Iniciar Partida
            </Button>
          )}
          <Button 
            variant="danger" 
            leftIcon={<RefreshCw size={18} />}
            onClick={handleClearAllQueue}
          >
            Resetar Fila
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Partidas Ativas</h3>
        
        {activeMatches.length === 0 || !activeMatches.some(match => match.isActive) ? (
          <div className="glass-panel p-6 text-center text-gaming-text-secondary">
            <p>Nenhuma partida ativa no momento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeMatches.filter(match => match.isActive).map(match => {
              const { team1, team2 } = getMatchTeamNames(match);
              const matchNumber = match.id.substring(0, 8);
              const isResultPanelOpen = showResultPanel === match.id;
              
              return (
                <div key={match.id} className="glass-panel p-4 border-2 border-yellow-400">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div>
                      <h4 className="text-lg font-medium">
                        Partida #{matchNumber} - {team1} vs {team2}
                      </h4>
                      <p className="text-sm text-gaming-text-secondary">
                        Iniciada: {new Date(match.startTime).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                      <div className="flex items-center space-x-2">
                        <Clock size={18} className="text-yellow-400" />
                        <span className={`text-lg font-mono ${match.remainingTime < 300 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {formatTime(match.remainingTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!isResultPanelOpen ? (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gaming-border">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Clock size={16} />}
                        onClick={() => handleExtendTime(match.id, 5)}
                        isLoading={isLoading[`extend-${match.id}-5`]}
                      >
                        +5 min
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Clock size={16} />}
                        onClick={() => handleExtendTime(match.id, -5)}
                        isLoading={isLoading[`extend-${match.id}--5`]}
                      >
                        -5 min
                      </Button>
                      
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Trophy size={16} />}
                        onClick={() => handleShowResultPanel(match.id)}
                      >
                        Registrar Resultado
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<AlertTriangle size={16} />}
                        onClick={() => handleEndMatch(match.id)}
                        isLoading={isLoading[`end-${match.id}`]}
                      >
                        Finalizar Partida
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className={`border-2 cursor-pointer transition-all ${selectedWinners === match.team1BlockId ? 'border-green-500 bg-green-950 bg-opacity-30' : 'border-gaming-border'}`}
                              onClick={() => setSelectedWinners(match.team1BlockId)}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {team1}
                              {selectedWinners === match.team1BlockId && (
                                <Badge variant="outline" className="bg-green-700 text-white">Vencedor</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {getBlockPlayers(match.team1BlockId).map(player => (
                                <div key={player.id} className="flex items-center justify-between bg-gaming-bg-dark p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    {player.avatar && (
                                      <img 
                                        src={player.avatar} 
                                        alt={player.discordName}
                                        className="w-6 h-6 rounded-full"
                                      />
                                    )}
                                    <span>{player.discordName}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button 
                                      className={`p-1 rounded hover:bg-green-900 hover:bg-opacity-30`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdjustMatchPoints(player.id, 25);
                                      }}
                                      title="+25 pontos (Vitória)"
                                    >
                                      <Plus size={16} className="text-green-400" />
                                    </button>
                                    <button 
                                      className={`p-1 rounded hover:bg-red-900 hover:bg-opacity-30`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdjustMatchPoints(player.id, -25);
                                      }}
                                      title="-25 pontos (Derrota)"
                                    >
                                      <Minus size={16} className="text-red-400" />
                                    </button>
                                    <button 
                                      className={`p-1 rounded ${selectedMVPCore === player.id ? 'bg-blue-700 text-white' : 'hover:bg-blue-900 hover:bg-opacity-30'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMVPCore(selectedMVPCore === player.id ? null : player.id);
                                        if (selectedMVPSup === player.id) setSelectedMVPSup(null);
                                      }}
                                      title="MVP Core (+4 pontos)"
                                    >
                                      <Award size={16} className={selectedMVPCore === player.id ? 'text-white' : 'text-blue-400'} />
                                    </button>
                                    <button 
                                      className={`p-1 rounded ${selectedMVPSup === player.id ? 'bg-purple-700 text-white' : 'hover:bg-purple-900 hover:bg-opacity-30'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMVPSup(selectedMVPSup === player.id ? null : player.id);
                                        if (selectedMVPCore === player.id) setSelectedMVPCore(null);
                                      }}
                                      title="MVP Suporte (+3 pontos)"
                                    >
                                      <Users size={16} className={selectedMVPSup === player.id ? 'text-white' : 'text-purple-400'} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={`border-2 cursor-pointer transition-all ${selectedWinners === match.team2BlockId ? 'border-green-500 bg-green-950 bg-opacity-30' : 'border-gaming-border'}`}
                              onClick={() => setSelectedWinners(match.team2BlockId)}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {team2}
                              {selectedWinners === match.team2BlockId && (
                                <Badge variant="outline" className="bg-green-700 text-white">Vencedor</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {getBlockPlayers(match.team2BlockId).map(player => (
                                <div key={player.id} className="flex items-center justify-between bg-gaming-bg-dark p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    {player.avatar && (
                                      <img 
                                        src={player.avatar} 
                                        alt={player.discordName}
                                        className="w-6 h-6 rounded-full"
                                      />
                                    )}
                                    <span>{player.discordName}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button 
                                      className={`p-1 rounded hover:bg-green-900 hover:bg-opacity-30`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdjustMatchPoints(player.id, 25);
                                      }}
                                      title="+25 pontos (Vitória)"
                                    >
                                      <Plus size={16} className="text-green-400" />
                                    </button>
                                    <button 
                                      className={`p-1 rounded hover:bg-red-900 hover:bg-opacity-30`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdjustMatchPoints(player.id, -25);
                                      }}
                                      title="-25 pontos (Derrota)"
                                    >
                                      <Minus size={16} className="text-red-400" />
                                    </button>
                                    <button 
                                      className={`p-1 rounded ${selectedMVPCore === player.id ? 'bg-blue-700 text-white' : 'hover:bg-blue-900 hover:bg-opacity-30'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMVPCore(selectedMVPCore === player.id ? null : player.id);
                                        if (selectedMVPSup === player.id) setSelectedMVPSup(null);
                                      }}
                                      title="MVP Core (+4 pontos)"
                                    >
                                      <Award size={16} className={selectedMVPCore === player.id ? 'text-white' : 'text-blue-400'} />
                                    </button>
                                    <button 
                                      className={`p-1 rounded ${selectedMVPSup === player.id ? 'bg-purple-700 text-white' : 'hover:bg-purple-900 hover:bg-opacity-30'}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMVPSup(selectedMVPSup === player.id ? null : player.id);
                                        if (selectedMVPCore === player.id) setSelectedMVPCore(null);
                                      }}
                                      title="MVP Suporte (+3 pontos)"
                                    >
                                      <Users size={16} className={selectedMVPSup === player.id ? 'text-white' : 'text-purple-400'} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex flex-col space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedMVPCore && (
                            <div className="bg-blue-900 bg-opacity-30 py-1 px-3 rounded-full text-sm flex items-center gap-1">
                              <Award size={14} className="text-blue-400" />
                              <span>MVP Core: {getBlockPlayers(match.team1BlockId).concat(getBlockPlayers(match.team2BlockId)).find(p => p.id === selectedMVPCore)?.discordName}</span>
                            </div>
                          )}
                          
                          {selectedMVPSup && (
                            <div className="bg-purple-900 bg-opacity-30 py-1 px-3 rounded-full text-sm flex items-center gap-1">
                              <Users size={14} className="text-purple-400" />
                              <span>MVP Suporte: {getBlockPlayers(match.team1BlockId).concat(getBlockPlayers(match.team2BlockId)).find(p => p.id === selectedMVPSup)?.discordName}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t border-gaming-border">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Check size={16} />}
                            onClick={() => handleSubmitResults(match.id)}
                            isLoading={isLoading[`submit-results-${match.id}`]}
                            disabled={!selectedWinners}
                          >
                            Confirmar Resultados
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowResultPanel(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
