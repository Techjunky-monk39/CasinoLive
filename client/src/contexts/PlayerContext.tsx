import { createContext, useState, useContext, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: number;
  username: string;
  balance: number;
  isLoggedIn: boolean;
}

interface PlayerContextType {
  player: Player;
  setPlayer: (player: Player) => void;
  updateBalance: (amount: number) => Promise<boolean>;
}

const defaultPlayer: Player = {
  id: 0,
  username: "Guest",
  balance: 5000,
  isLoggedIn: false
};

const PlayerContext = createContext<PlayerContextType>({
  player: defaultPlayer,
  setPlayer: () => {},
  updateBalance: async () => false
});

export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player>(defaultPlayer);
  const { toast } = useToast();

  const updateBalance = async (amount: number): Promise<boolean> => {
    try {
      // For guest players, just update the local balance
      if (!player.isLoggedIn) {
        const newBalance = player.balance + amount;
        
        if (newBalance < 0) {
          toast({
            title: "Insufficient funds",
            description: "You don't have enough credits for this action",
            variant: "destructive"
          });
          return false;
        }
        
        setPlayer({ ...player, balance: newBalance });
        return true;
      }
      
      // For logged in players, update via the API
      const response = await apiRequest("POST", "/api/games/update-balance", { amount });
      const data = await response.json();
      
      setPlayer({
        ...player,
        balance: data.balance
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <PlayerContext.Provider value={{ player, setPlayer, updateBalance }}>
      {children}
    </PlayerContext.Provider>
  );
}
