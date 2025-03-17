
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Crown, Award, Users } from 'lucide-react';

export interface UserProfileModalProps {
  user: {
    id: string;
    steamId: string;
    discordName: string;
    isAdmin?: boolean;
    isVip?: boolean;
    vipExpiresAt?: string | null;
    avatar?: string | null;
    rank?: string | null;
    quote?: string | null;
    matchesPlayed?: number;
    total_points?: number;
    matches_won?: number;
    matches_lost?: number;
    mvp_core_count?: number;
    mvp_sup_count?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose }) => {
  const isVipActive = user.isVip && user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="glass-panel border-gaming-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Perfil do Jogador</DialogTitle>
          <DialogDescription>
            Detalhes e estatísticas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            {user.avatar && (
              <img 
                src={user.avatar} 
                alt={user.discordName} 
                className="w-16 h-16 rounded-full"
              />
            )}
            
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                {user.discordName}
                {isVipActive && (
                  <Crown size={16} className="text-yellow-400" aria-label="VIP" />
                )}
              </h3>
              <p className="text-sm text-gaming-text-secondary">
                Steam ID: {user.steamId}
              </p>
              
              <div className="flex gap-2 mt-1">
                {user.rank && (
                  <Badge variant="outline">
                    {user.rank}
                  </Badge>
                )}
                
                {isVipActive && (
                  <Badge variant="outline" className="bg-yellow-900 bg-opacity-50 text-yellow-400 border-yellow-500">
                    VIP
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="glass-panel-inner p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gaming-text-secondary mb-3">Ranking e Estatísticas</h4>
            
            {user.total_points !== undefined && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-gaming-accent-blue"></div>
                <div className="text-2xl font-bold">{user.total_points}</div>
                <div className="text-sm text-gaming-text-secondary">pontos totais</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gaming-text-secondary">Partidas Jogadas</p>
                <p className="text-xl font-medium">{user.matchesPlayed || 0}</p>
              </div>
              
              <div>
                <p className="text-sm text-gaming-text-secondary">Vitórias / Derrotas</p>
                <p className="text-md font-medium">
                  <span className="text-green-400">{user.matches_won || 0}W</span>
                  {" / "}
                  <span className="text-red-400">{user.matches_lost || 0}L</span>
                </p>
              </div>
              
              {(user.mvp_core_count || user.mvp_sup_count) && (
                <div className="col-span-2 border-t border-gaming-border pt-3 mt-1">
                  <p className="text-sm text-gaming-text-secondary mb-2">Premiações MVP</p>
                  <div className="flex gap-4">
                    {user.mvp_core_count ? (
                      <div className="flex items-center gap-1">
                        <Award size={16} className="text-blue-400" />
                        <span className="text-md">{user.mvp_core_count} Core</span>
                      </div>
                    ) : null}
                    
                    {user.mvp_sup_count ? (
                      <div className="flex items-center gap-1">
                        <Users size={16} className="text-purple-400" />
                        <span className="text-md">{user.mvp_sup_count} Suporte</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
              
              {isVipActive && (
                <div>
                  <p className="text-sm text-gaming-text-secondary">VIP até</p>
                  <p className="text-md font-medium text-yellow-400">
                    {new Date(user.vipExpiresAt!).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {user.quote && (
                <div className="col-span-2 mt-2">
                  <p className="text-sm text-gaming-text-secondary">Citação</p>
                  <p className="italic text-sm mt-1">"{user.quote}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
