
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/ui/avatar';

interface Message {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  discordName: string;
  avatar: string | null;
}

const ChatPanel: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('realtime-chat')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, users:user_id(*)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      
      if (data) {
        const processedMessages = data.map(msg => ({
          id: msg.id,
          userId: msg.user_id,
          message: msg.message,
          createdAt: msg.created_at,
          discordName: msg.users?.discord_name || 'Usuário Desconhecido',
          avatar: msg.users?.avatar || null
        }));
        
        setMessages(processedMessages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newMessage.trim()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: newMessage.trim()
        });
      
      if (error) throw error;
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Format time to display in a readable format
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <MessageCircle className="w-5 h-5 mr-2 text-gaming-accent-blue" />
        <h3 className="text-xl font-semibold">Chat</h3>
      </div>
      
      <div className="glass-panel p-4 h-[400px] flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gaming-text-secondary">Sem mensagens. Seja o primeiro a enviar!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = user?.id === msg.userId;
              
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`
                      max-w-[80%] rounded-lg p-3
                      ${isCurrentUser 
                        ? 'bg-gaming-accent-blue bg-opacity-20 ml-auto' 
                        : 'bg-gaming-bg-dark mr-auto'
                      }
                    `}
                  >
                    <div className="flex items-center mb-1">
                      {!isCurrentUser && (
                        <Avatar className="h-6 w-6 mr-2">
                          {msg.avatar ? (
                            <img src={msg.avatar} alt={msg.discordName} />
                          ) : (
                            <div className="bg-gaming-bg-dark rounded-full h-full w-full flex items-center justify-center text-sm">
                              {msg.discordName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Avatar>
                      )}
                      
                      <span className="text-sm font-medium">
                        {isCurrentUser ? 'Você' : msg.discordName}
                      </span>
                      
                      <span className="text-xs text-gaming-text-secondary ml-2">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gaming-bg-dark border border-gaming-border rounded-md p-2 text-sm"
            disabled={!user || loading}
          />
          <button
            type="submit"
            className="bg-gaming-accent-blue text-white rounded-md p-2 hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!user || loading || !newMessage.trim()}
          >
            <Send size="sm" className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
