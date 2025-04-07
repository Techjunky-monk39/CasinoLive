import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface ChatBoxProps {
  gameId?: string;
  onClose?: () => void;
}

export function ChatBox({ gameId, onClose }: ChatBoxProps) {
  const { player } = usePlayer();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      sender: 'System',
      text: 'Welcome to the game chat! Connect with other players here.',
      timestamp: new Date(),
      isSystem: true,
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      // Join specific game room if gameId provided
      if (gameId) {
        ws.send(JSON.stringify({
          type: 'join',
          gameId,
          username: player.username,
        }));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: data.username,
            text: data.message,
            timestamp: new Date(),
          }]);
        } 
        else if (data.type === 'system') {
          setMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            sender: 'System',
            text: data.message,
            timestamp: new Date(),
            isSystem: true,
          }]);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        sender: 'System',
        text: 'Error connecting to chat server',
        timestamp: new Date(),
        isSystem: true,
      }]);
    };
    
    setSocket(ws);
    
    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [gameId, player.username]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    
    try {
      socket.send(JSON.stringify({
        type: 'chat',
        gameId,
        username: player.username,
        message: newMessage.trim(),
      }));
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col bg-gradient-to-b from-purple-900 to-[#232131] rounded-lg border border-purple-700 h-full w-full shadow-lg">
      <div className="flex justify-between items-center p-3 border-b border-purple-700">
        <h3 className="text-lg font-bold text-[#F8BF0C]">
          Game Chat {gameId ? `- Room ${gameId}` : ''}
        </h3>
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-grow p-3 max-h-[300px]">
        <div className="space-y-2">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`relative p-2 rounded-lg ${
                msg.isSystem
                  ? 'bg-blue-900 bg-opacity-30 border border-blue-800'
                  : msg.sender === player.username
                    ? 'bg-purple-800 bg-opacity-50 border border-purple-700'
                    : 'bg-gray-800 bg-opacity-50 border border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`font-bold ${
                  msg.isSystem 
                    ? 'text-blue-300' 
                    : msg.sender === player.username 
                      ? 'text-[#F8BF0C]' 
                      : 'text-green-400'
                }`}>
                  {msg.sender}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-sm text-white mt-1">{msg.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-purple-700">
        <div className="flex space-x-2">
          <Input 
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow bg-gray-900 border-purple-700 focus:border-[#F8BF0C]"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim() || !socket}
            className="bg-[#F8BF0C] hover:bg-yellow-600 text-black"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}