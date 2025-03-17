import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BLOCK_SIZE = 5; // Number of players per block

type Player = {
  id: string;
  steamId: string;
  discordName: string;
  joinedAt: string;
  bannedUntil: string | null;
  avatar: string | null;
  rank: string | null;
  quote: string | null;
  matchesPlayed: number;
  isVip?: boolean;
  vipExpiresAt?: string | null;
};

type Block = {
  id: number;
  players: Player[];
  isComplete: boolean;
};

type Match = {
  id: string; // Change to string to match Supabase UUID type
  team1BlockId: number;
  team2BlockId: number;
  startTime: string;
  endTime: string | null;
  remainingTime: number; // em segundos
  isActive: boolean;
  team1Won: boolean | null;
};

interface QueueContextType {
  queue: Player[];
  blocks: Block[];
  activeMatches: Match[];
  joinQueue: () => void;
  leaveQueue: () => void;
  createMatch: (blockId1: number, blockId2: number) => void;
  endMatch: (matchId: string) => Promise<void>; // Change to string
  extendMatchTime: (matchId: string, minutes: number) => Promise<void>; // Change to string
  isInQueue: boolean;
  isInMatch: boolean;
  currentBlockId: number | null;
  loading: boolean;
  markPlayerAway: (userId: string, punishmentTime: number) => void;
  isPunished: boolean;
  punishmentEndTime: string | null;
  clearAllQueue: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const MATCH_DURATION = 60 * 60; // 1 hora em segundos

const generateBlocks = (players: Player[]): Block[] => {
  const blocks: Block[] = [];
  let blockCounter = 1;
  
  for (let i = 0; i < players.length; i += BLOCK_SIZE) {
    const blockPlayers = players.slice(i, i + BLOCK_SIZE);
    blocks.push({
      id: blockCounter++,
      players: blockPlayers,
      isComplete: blockPlayers.length === BLOCK_SIZE
    });
  }
  
  return blocks;
};

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<Player[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [isInMatch, setIsInMatch] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState<number | null>(null);
  const [isPunished, setIsPunished] = useState(false);
  const [punishmentEndTime, setPunishmentEndTime] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
    
    const queueChannel = supabase
      .channel('realtime-queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => {
          fetchQueueData();
        }
      )
      .subscribe();
    
    const matchesChannel = supabase
      .channel('realtime-matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchMatchesData();
        }
      )
      .subscribe();
      
    const usersChannel = supabase
      .channel('realtime-users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          if (user) {
            checkUserPunishment(user.id);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  useEffect(() => {
    if (user) {
      checkUserPunishment(user.id);
    }
  }, [user]);

  const checkUserPunishment = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('banned_until')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data && data.banned_until) {
        const bannedUntil = new Date(data.banned_until);
        const now = new Date();
        
        if (bannedUntil > now) {
          setIsPunished(true);
          setPunishmentEndTime(data.banned_until);
        } else {
          setIsPunished(false);
          setPunishmentEndTime(null);
        }
      } else {
        setIsPunished(false);
        setPunishmentEndTime(null);
      }
    } catch (err) {
      console.error('Erro ao verificar punição do usuário:', err);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchQueueData(), fetchMatchesData()]);
    setLoading(false);
  };

  const fetchQueueData = async () => {
    try {
      // Get queue entries with user data
      const { data: queueEntries, error } = await supabase
        .from('queue_entries')
        .select(`
          *,
          users:user_id (*)`);
      
      if (error) throw error;
      
      if (queueEntries) {
        console.log('Queue entries fetched:', queueEntries);
        
        const processedQueue = queueEntries
          .filter(entry => entry.users) // Filter out entries without user data
          .map(entry => ({
            id: entry.users?.id || '',
            steamId: entry.users?.steam_id || '',
            discordName: entry.users?.discord_name || '',
            joinedAt: entry.joined_at || new Date().toISOString(),
            bannedUntil: entry.users?.banned_until || null,
            avatar: entry.users?.avatar || null,
            rank: entry.users?.rank || null,
            quote: entry.users?.quote || null,
            matchesPlayed: entry.users?.matches_played || 0,
            isVip: entry.users?.is_vip || false,
            vipExpiresAt: entry.users?.vip_expires_at || null
          }));
        
        // Sort the queue to prioritize VIP users
        const sortedQueue = processedQueue.sort((a, b) => {
          // VIP users come first (if their VIP status hasn't expired)
          const aIsVip = a.isVip && a.vipExpiresAt && new Date(a.vipExpiresAt) > new Date();
          const bIsVip = b.isVip && b.vipExpiresAt && new Date(b.vipExpiresAt) > new Date();
          
          if (aIsVip && !bIsVip) return -1;
          if (!aIsVip && bIsVip) return 1;
          
          // If both are VIP or both are not VIP, sort by join time
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        });
        
        console.log('Processed and sorted queue:', sortedQueue);
        setQueue(sortedQueue);
        
        // Generate and set blocks
        const generatedBlocks = generateBlocks(sortedQueue);
        console.log('Generated blocks:', generatedBlocks);
        setBlocks(generatedBlocks);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da fila:', err);
    }
  };

  const fetchMatchesData = async () => {
    try {
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*');
      
      if (error) throw error;
      
      if (matchesData) {
        const processedMatches = matchesData.map(match => ({
          id: match.id, // Keep as string (UUID from Supabase)
          team1BlockId: match.team1_block_id,
          team2BlockId: match.team2_block_id,
          startTime: match.start_time || new Date().toISOString(),
          endTime: match.end_time,
          remainingTime: typeof match.remaining_time === 'string' 
            ? parseInt(match.remaining_time, 10) 
            : match.remaining_time || MATCH_DURATION,
          isActive: match.is_active || false,
          team1Won: match.team1_won
        }));
        
        setActiveMatches(processedMatches);
        console.log("Fetched matches:", processedMatches);
      }
    } catch (err) {
      console.error('Erro ao buscar dados das partidas:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsInQueue(false);
      setIsInMatch(false);
      setCurrentBlockId(null);
      return;
    }

    const userInQueue = queue.some(player => player.steamId === user.steamId);
    setIsInQueue(userInQueue);

    if (userInQueue) {
      const block = blocks.find(block => 
        block.players.some(player => player.steamId === user.steamId)
      );
      setCurrentBlockId(block ? block.id : null);
    } else {
      setCurrentBlockId(null);
    }

    const userInMatch = activeMatches.some(match => {
      if (!match.isActive) return false;
      
      const block1 = blocks.find(b => b.id === match.team1BlockId);
      const block2 = blocks.find(b => b.id === match.team2BlockId);
      
      return (
        (block1 && block1.players.some(p => p.steamId === user.steamId)) ||
        (block2 && block2.players.some(p => p.steamId === user.steamId))
      );
    });
    
    setIsInMatch(userInMatch);
  }, [user, queue, blocks, activeMatches]);

  useEffect(() => {
    if (activeMatches.length === 0) return;
    
    const interval = setInterval(async () => {
      setActiveMatches(prevMatches => {
        const updatedMatches = prevMatches.map(match => {
          if (!match.isActive) return match;
          
          const newRemainingTime = match.remainingTime - 1;
          
          if (newRemainingTime <= 0) {
            // Update database asynchronously
            endMatch(match.id).catch(err => console.error('Erro ao finalizar partida:', err));
            
            return {
              ...match,
              remainingTime: 0,
              endTime: new Date().toISOString(),
              isActive: false
            };
          }
          
          // Persist timer state to database periodically (every 30 seconds)
          if (newRemainingTime % 30 === 0) {
            console.log("Updating match remaining time in database:", match.id, newRemainingTime);
            supabase
              .from('matches')
              .update({ remaining_time: newRemainingTime })
              .eq('id', match.id) // Use string ID directly
              .then(({ error }) => {
                if (error) console.error('Erro ao atualizar tempo restante:', error);
              });
          }
          
          return {
            ...match,
            remainingTime: newRemainingTime
          };
        });
        
        return updatedMatches;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeMatches]);

  const joinQueue = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para entrar na fila");
      return;
    }
    
    if (isInQueue) {
      toast.info("Você já está na fila");
      return;
    }
    
    if (isInMatch) {
      toast.error("Você não pode entrar na fila enquanto estiver em uma partida");
      return;
    }
    
    if (isPunished) {
      toast.error(`Você está punido e não pode entrar na fila até ${new Date(punishmentEndTime!).toLocaleString()}`);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting to join queue for user:', user.id);
      
      // Check if user is VIP with active status
      const isVip = user.isVip && user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();
      
      const { data, error } = await supabase
        .from('queue_entries')
        .insert({
          user_id: user.id,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Successfully joined queue:', data);
      
      // Update local state
      setIsInQueue(true);
      
      // Fetch updated queue data
      await fetchQueueData();
      
      if (isVip) {
        toast.success("Você entrou na fila com prioridade VIP! 🌟");
      } else {
        toast.success("Você entrou na fila");
      }
    } catch (err) {
      console.error('Erro ao entrar na fila:', err);
      toast.error("Erro ao entrar na fila. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    if (!user) return;
    
    if (!isInQueue) {
      toast.info("Você não está na fila");
      return;
    }
    
    if (isInMatch) {
      toast.error("Você não pode sair da fila enquanto estiver em uma partida");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('queue_entries')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.info("Você saiu da fila");
    } catch (err) {
      console.error('Erro ao sair da fila:', err);
      toast.error("Erro ao sair da fila. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (blockId1: number, blockId2: number) => {
    if (blockId1 === blockId2) {
      toast.error("Você deve selecionar dois blocos diferentes");
      return;
    }
    
    const block1 = blocks.find(b => b.id === blockId1);
    const block2 = blocks.find(b => b.id === blockId2);
    
    if (!block1 || !block2) {
      toast.error("Seleção de bloco inválida");
      return;
    }
    
    if (!block1.isComplete || !block2.isComplete) {
      toast.error("Ambos os blocos devem ter 5 jogadores");
      return;
    }
    
    const playersInBlocks = [...block1.players, ...block2.players];
    const anyPlayerInMatch = activeMatches.some(match => {
      if (!match.isActive) return false;
      
      const matchBlock1 = blocks.find(b => b.id === match.team1BlockId);
      const matchBlock2 = blocks.find(b => b.id === match.team2BlockId);
      
      if (!matchBlock1 || !matchBlock2) return false;
      
      const matchPlayers = [...matchBlock1.players, ...matchBlock2.players];
      
      return playersInBlocks.some(player => 
        matchPlayers.some(matchPlayer => matchPlayer.steamId === player.steamId)
      );
    });
    
    if (anyPlayerInMatch) {
      toast.error("Alguns jogadores já estão em uma partida ativa");
      return;
    }
    
    try {
      // Create the match
      const { data, error } = await supabase
        .from('matches')
        .insert({
          team1_block_id: blockId1,
          team2_block_id: blockId2,
          start_time: new Date().toISOString(),
          remaining_time: MATCH_DURATION,
          is_active: true,
          team1_won: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Match created successfully:", data);
      
      // Now get both blocks' players to update their queue entries
      const userIds = [...block1.players, ...block2.players].map(player => player.id);
      
      // Associate players with the match via block_id in queue_entries
      const { error: updateError } = await supabase
        .from('queue_entries')
        .update({ block_id: data.id })
        .in('user_id', userIds);
      
      if (updateError) {
        console.error("Error updating queue entries:", updateError);
        throw updateError;
      }
      
      console.log(`Updated queue entries for ${userIds.length} players`);
      
      // Increment matches_played count for all players
      for (const player of [...block1.players, ...block2.players]) {
        await supabase
          .from('users')
          .update({ matches_played: player.matchesPlayed + 1 })
          .eq('id', player.id);
      }
      
      toast.success("Partida criada com sucesso");
      
      // Refresh data
      await Promise.all([fetchQueueData(), fetchMatchesData()]);
      
    } catch (err) {
      console.error('Erro ao criar partida:', err);
      toast.error("Erro ao criar partida. Tente novamente.");
    }
  };

  const endMatch = async (matchId: string) => {
    try {
      console.log("Attempting to end match:", matchId);
      
      // Find the match in our local state
      const match = activeMatches.find(m => m.id === matchId);
      
      if (!match) {
        console.error("Match not found:", matchId);
        toast.error("Partida não encontrada");
        return;
      }
      
      console.log("Found match to end:", match);
      
      // Find the blocks associated with this match
      const team1Block = blocks.find(b => b.id === match.team1BlockId);
      const team2Block = blocks.find(b => b.id === match.team2BlockId);
      
      if (team1Block && team2Block) {
        const playerIds = [...team1Block.players, ...team2Block.players].map(player => player.id);
        
        console.log("Players to punish:", playerIds);
        
        // Calculate punishment end time
        const punishmentEndTime = new Date();
        punishmentEndTime.setMinutes(punishmentEndTime.getMinutes() + 10);
        
        // Update match first to mark it as inactive
        const { error: matchError } = await supabase
          .from('matches')
          .update({
            is_active: false,
            end_time: new Date().toISOString(),
            remaining_time: 0
          })
          .eq('id', matchId); // Use string ID directly
        
        if (matchError) {
          console.error("Error updating match:", matchError);
          throw matchError;
        }
        
        console.log("Match marked as inactive");
        
        // Apply punishment to all players
        for (const playerId of playerIds) {
          // Apply the punishment
          const { error: punishError } = await supabase
            .from('users')
            .update({
              banned_until: punishmentEndTime.toISOString()
            })
            .eq('id', playerId);
            
          if (punishError) {
            console.error(`Error punishing player ${playerId}:`, punishError);
          }
        }
        
        // Now that players are punished, remove them from queue entries
        const { error: queueError } = await supabase
          .from('queue_entries')
          .delete()
          .in('user_id', playerIds);
          
        if (queueError) {
          console.error("Error removing players from queue:", queueError);
          throw queueError;
        }
        
        console.log("Players punished and removed from queue successfully");
        
        toast.success("Partida finalizada e jogadores punidos por 10 minutos");
      } else {
        console.log("Blocks not found, just ending match");
        
        const { error } = await supabase
          .from('matches')
          .update({
            is_active: false,
            end_time: new Date().toISOString(),
            remaining_time: 0
          })
          .eq('id', matchId); // Use string ID directly
        
        if (error) {
          console.error("Error updating match:", error);
          throw error;
        }
        
        toast.info("Partida finalizada");
      }
      
      // Refresh data
      await fetchMatchesData();
      await fetchQueueData();
      
    } catch (err) {
      console.error('Erro ao finalizar partida:', err);
      toast.error("Erro ao finalizar partida. Tente novamente.");
      throw err; // Re-throw so the UI can handle it
    }
  };

  const extendMatchTime = async (matchId: string, minutes: number) => {
    try {
      console.log(`Extending match ${matchId} time by ${minutes} minutes`);
      
      const match = activeMatches.find(m => m.id === matchId && m.isActive);
      
      if (!match) {
        console.error("Active match not found:", matchId);
        toast.error("Partida ativa não encontrada");
        return;
      }
      
      const newTime = match.remainingTime + (minutes * 60);
      const finalTime = Math.max(newTime, 300); // Ensure minimum of 5 minutes
      
      console.log(`Updating time from ${match.remainingTime} to ${finalTime} seconds`);
      
      const { error } = await supabase
        .from('matches')
        .update({
          remaining_time: finalTime
        })
        .eq('id', matchId); // Use string ID directly
      
      if (error) {
        console.error("Error updating match time:", error);
        throw error;
      }
      
      // Update local state immediately for better UX
      setActiveMatches(prevMatches => 
        prevMatches.map(m => {
          if (m.id === matchId && m.isActive) {
            return { ...m, remainingTime: finalTime };
          }
          return m;
        })
      );
      
      // Also fetch the latest data
      await fetchMatchesData();
      
      if (minutes > 0) {
        toast.success(`Adicionados ${minutes} minutos ao tempo da partida`);
      } else {
        toast.info(`Removidos ${Math.abs(minutes)} minutos do tempo da partida`);
      }
    } catch (err) {
      console.error('Erro ao estender tempo da partida:', err);
      toast.error("Erro ao modificar tempo da partida. Tente novamente.");
      throw err; // Re-throw for UI handling
    }
  };
  
  const markPlayerAway = async (userId: string, punishmentTime: number) => {
    try {
      const punishmentEndTime = new Date();
      punishmentEndTime.setMinutes(punishmentEndTime.getMinutes() + punishmentTime);
      
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
      
      toast.success(`Jogador punido por ${punishmentTime} minutos`);
    } catch (err) {
      console.error('Erro ao punir jogador:', err);
      toast.error("Erro ao punir jogador. Tente novamente.");
    }
  };

  const clearAllQueue = async () => {
    try {
      setLoading(true);
      console.log("Attempting to clear all queue entries");
      
      // First, mark all active matches as inactive
      const { error: matchesError } = await supabase
        .from('matches')
        .update({
          is_active: false,
          end_time: new Date().toISOString(),
          remaining_time: 0
        })
        .eq('is_active', true);
      
      if (matchesError) {
        console.error("Error updating active matches:", matchesError);
        throw matchesError;
      }
      
      // Then delete all queue entries
      const { error: queueError } = await supabase
        .from('queue_entries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This will delete all entries
      
      if (queueError) {
        console.error("Error clearing queue entries:", queueError);
        throw queueError;
      }
      
      console.log("All queue entries cleared successfully");
      toast.success("Fila resetada com sucesso! Todos os usuários foram removidos.");
      
      // Refresh data
      await fetchMatchesData();
      await fetchQueueData();
      
    } catch (err) {
      console.error('Erro ao limpar fila:', err);
      toast.error("Erro ao resetar a fila. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <QueueContext.Provider value={{
      queue,
      blocks,
      activeMatches,
      joinQueue,
      leaveQueue,
      createMatch,
      endMatch,
      extendMatchTime,
      isInQueue,
      isInMatch,
      currentBlockId,
      loading,
      markPlayerAway,
      isPunished,
      punishmentEndTime,
      clearAllQueue
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue deve ser usado dentro de um QueueProvider');
  }
  return context;
};
