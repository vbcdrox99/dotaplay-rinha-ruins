import React from 'react';
import { useQueue } from '@/context/QueueContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { UserMinus, Crown } from 'lucide-react';

interface PlayerBlockProps {
  blockId: number;
  isSelected?: boolean;
  isInMatch?: boolean;
  onClick?: () => void;
  selectable?: boolean;
  onRemovePlayer?: (userId: string, playerName: string) => void;
}

const PlayerBlock: React.FC<PlayerBlockProps> = ({ 
  blockId, 
  isSelected = false, 
  isInMatch = false,
  onClick,
  selectable = false,
  onRemovePlayer
}) => {
  const { blocks } = useQueue();
  const { user } = useAuth();
  
  const block = blocks.find(b => b.id === blockId);
  
  if (!block) return null;
  
  const blockClasses = `
    glass-panel p-4 h-full
    ${isSelected ? 'ring-2 ring-gaming-accent-blue' : ''}
    ${isInMatch ? 'bg-yellow-800 bg-opacity-20 border-2 border-yellow-500' : ''}
    ${selectable ? 'cursor-pointer hover:ring-1 hover:ring-gaming-accent-blue transition-all' : ''}
    relative
  `;

  const isPlayerVIP = (player: any) => {
    return player.isVip && player.vipExpiresAt && new Date(player.vipExpiresAt) > new Date();
  };
  
  return (
    <div 
      className={blockClasses}
      onClick={selectable ? onClick : undefined}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-lg">Bloco {blockId}</h4>
        <div className="flex items-center gap-2">
          <Badge variant={block.isComplete ? "secondary" : "outline"} className={block.isComplete ? "bg-green-700 text-white" : ""}>
            {block.isComplete ? "Completo" : `${block.players.length}/5`}
          </Badge>
          
          {isInMatch && (
            <Badge variant="secondary" className="bg-yellow-700 text-white">Em Partida</Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {block.players.map(player => {
          const isCurrentUser = user?.id === player.id;
          const playerIsVIP = isPlayerVIP(player);
          
          return (
            <div 
              key={player.id}
              className={`
                flex items-center justify-between p-2 rounded
                ${isCurrentUser ? 'bg-gaming-accent-blue bg-opacity-20' : 
                  playerIsVIP ? 'bg-yellow-600 bg-opacity-20' : 'bg-gaming-bg-dark'}
                hover:bg-opacity-30 transition-colors
              `}
            >
              <div className="flex items-center">
                {player.avatar && (
                  <img 
                    src={player.avatar} 
                    alt={player.discordName}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <div>
                  <div className="font-medium flex items-center gap-1">
                    {player.discordName}
                    {playerIsVIP && (
                      <Crown size={16} className="text-yellow-400" aria-label="VIP" />
                    )}
                  </div>
                  {player.rank && (
                    <div className="text-xs text-gaming-text-secondary">{player.rank}</div>
                  )}
                </div>
              </div>
              
              {onRemovePlayer && !isInMatch && (
                <button 
                  className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-900 hover:bg-opacity-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePlayer(player.id, player.discordName);
                  }}
                  aria-label={`Remove ${player.discordName} from queue`}
                >
                  <UserMinus size={18} />
                </button>
              )}
            </div>
          );
        })}
        
        {!block.isComplete && (
          <div className="p-2 rounded bg-gaming-bg-dark border border-dashed border-gaming-border text-center">
            <span className="text-sm text-gaming-text-secondary">Aguardando jogadores...</span>
          </div>
        )}
      </div>
      
      {isInMatch && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default PlayerBlock;
