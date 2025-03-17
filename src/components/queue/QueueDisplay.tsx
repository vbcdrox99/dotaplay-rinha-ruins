import React, { useState, useEffect } from 'react';
import { useQueue } from '@/context/QueueContext';
import PlayerBlock from './PlayerBlock';
import { Button } from '@/components/ui/custom/Button';
import { Plus, Minus, UserPlus, Clock, Play, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface QueueDisplayProps {
  adminMode?: boolean;
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ adminMode = false }) => {
  const { 
    blocks, 
    activeMatches, 
    queue, 
    joinQueue, 
    leaveQueue, 
    isInQueue, 
    isInMatch, 
    loading,
    createMatch,
    isPunished,
    punishmentEndTime,
    markPlayerAway
  } = useQueue();
  
  const [selectedBlocks, setSelectedBlocks] = useState<number[]>([]);
  const [queueStats, setQueueStats] = useState({ total: 0, inQueue: 0, inMatch: 0 });
  
  useEffect(() => {
    // Calculate players in active matches (only count players from blocks in active matches)
    const playersInMatch = activeMatches
      .filter(match => match.isActive)
      .flatMap(match => {
        const block1 = blocks.find(b => b.id === match.team1BlockId);
        const block2 = blocks.find(b => b.id === match.team2BlockId);
        return [
          ...(block1?.players || []), 
          ...(block2?.players || [])
        ];
      }).length;
    
    // Calculate total players in blocks (both waiting and in match)
    const playersInBlocks = blocks.reduce((total, block) => total + block.players.length, 0);
    
    // Total online players is the sum of players in queue
    const totalOnlinePlayers = queue.length;
    
    setQueueStats({
      total: totalOnlinePlayers,
      inQueue: playersInBlocks,
      inMatch: playersInMatch
    });
  }, [queue, blocks, activeMatches]);
  
  const handleBlockSelect = (blockId: number) => {
    if (!adminMode) return;
    
    const isSelected = selectedBlocks.includes(blockId);
    
    if (isSelected) {
      setSelectedBlocks(selectedBlocks.filter(id => id !== blockId));
    } else {
      if (selectedBlocks.length >= 2) {
        setSelectedBlocks([...selectedBlocks.slice(1), blockId]);
      } else {
        setSelectedBlocks([...selectedBlocks, blockId]);
      }
    }
  };
  
  const handleCreateMatch = () => {
    if (selectedBlocks.length !== 2) return;
    
    const block1 = blocks.find(b => b.id === selectedBlocks[0]);
    const block2 = blocks.find(b => b.id === selectedBlocks[1]);
    
    if (!block1?.isComplete || !block2?.isComplete) {
      toast.error("Erro ao criar partida: Ambos os blocos devem estar completos com 5 jogadores");
      return;
    }
    
    createMatch(selectedBlocks[0], selectedBlocks[1]);
    setSelectedBlocks([]);
    
    toast.success(`Partida iniciada entre Bloco #${selectedBlocks[0]} e Bloco #${selectedBlocks[1]}`);
    
    const audio = new Audio('/match-start.mp3');
    audio.play().catch(e => console.error("Erro ao reproduzir som:", e));
  };
  
  const isBlockInMatch = (blockId: number) => {
    return activeMatches.some(match => 
      (match.team1BlockId === blockId || match.team2BlockId === blockId) && match.isActive
    );
  };
  
  const canStartMatch = () => {
    const completedBlocks = blocks.filter(block => block.isComplete && !isBlockInMatch(block.id));
    return completedBlocks.length >= 2;
  };

  const handleRemovePlayer = (userId: string, playerName: string) => {
    if (!adminMode) return;
    
    if (window.confirm(`Tem certeza que deseja remover ${playerName} da fila?`)) {
      markPlayerAway(userId, 10); // 10 minutes punishment
      toast.success(`${playerName} foi removido da fila e receberá uma punição de 10 minutos`);
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Status da Fila</h2>
          <p className="text-gaming-text-secondary">
            Veja como estão as filas hoje
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {!adminMode && (
            isInQueue ? (
              <Button
                variant="outline"
                onClick={leaveQueue}
                isLoading={loading}
                leftIcon={<Minus size={18} />}
                disabled={isInMatch || isPunished}
                aria-label={isPunished ? `Punido até ${new Date(punishmentEndTime!).toLocaleString('pt-BR')}` : 'Sair da Fila'}
              >
                Sair da Fila
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={joinQueue}
                isLoading={loading}
                leftIcon={<Plus size={18} />}
                disabled={isInMatch || isPunished}
                aria-label={isPunished ? `Punido até ${new Date(punishmentEndTime!).toLocaleString('pt-BR')}` : 'Entrar na Fila'}
                glow
              >
                Entrar na Fila
              </Button>
            )
          )}
          
          {adminMode && selectedBlocks.length === 2 ? (
            <Button
              variant="success"
              onClick={handleCreateMatch}
              glow
            >
              Criar Partida
            </Button>
          ) : adminMode && canStartMatch() ? (
            <Button
              variant="outline"
              leftIcon={<Play size={18} />}
              onClick={() => {
                const completedBlocks = blocks
                  .filter(block => block.isComplete && !isBlockInMatch(block.id))
                  .slice(0, 2)
                  .map(block => block.id);
                
                if (completedBlocks.length === 2) {
                  setSelectedBlocks(completedBlocks);
                }
              }}
            >
              Iniciar Partida
            </Button>
          ) : null}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center">
          <div className="w-12 h-12 rounded-full bg-gaming-bg-card flex items-center justify-center mr-4">
            <UserPlus size={24} className="text-gaming-accent-blue" />
          </div>
          <div>
            <p className="text-sm text-gaming-text-secondary">Total de Jogadores</p>
            <p className="text-2xl font-bold">{queueStats.total}</p>
          </div>
        </div>
        
        <div className="glass-panel p-4 flex items-center">
          <div className="w-12 h-12 rounded-full bg-gaming-bg-card flex items-center justify-center mr-4">
            <Clock size={24} className="text-gaming-accent-blue" />
          </div>
          <div>
            <p className="text-sm text-gaming-text-secondary">Na Fila</p>
            <p className="text-2xl font-bold">{queueStats.inQueue}</p>
          </div>
        </div>
        
        <div className="glass-panel p-4 flex items-center">
          <div className="w-12 h-12 rounded-full bg-gaming-bg-card flex items-center justify-center mr-4">
            <Clock size={24} className="text-gaming-success" />
          </div>
          <div>
            <p className="text-sm text-gaming-text-secondary">Em Partida</p>
            <p className="text-2xl font-bold">{queueStats.inMatch}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Blocos Atuais</h3>
          
          {adminMode && selectedBlocks.length === 2 && (
            <Button
              variant="success"
              size="sm"
              onClick={handleCreateMatch}
            >
              Criar Partida com Blocos Selecionados
            </Button>
          )}
        </div>
        
        {blocks.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-gaming-text-secondary">Nenhum jogador na fila</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocks.map(block => {
              const blockInMatch = isBlockInMatch(block.id);
              const blockClasses = blockInMatch ? 'border-2 border-yellow-400' : '';
              
              return (
                <div key={block.id} className={blockClasses}>
                  <PlayerBlock
                    blockId={block.id}
                    isSelected={selectedBlocks.includes(block.id)}
                    isInMatch={blockInMatch}
                    onClick={() => handleBlockSelect(block.id)}
                    selectable={adminMode && !blockInMatch}
                    onRemovePlayer={adminMode ? handleRemovePlayer : undefined}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueDisplay;
