import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

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
  logout: () => Promise<void>;
  isLoading: boolean;
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
  updateBalance: async () => false,
  logout: async () => {},
  isLoading: false
});

export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player>(defaultPlayer);
  const { toast } = useToast();

  // Initial loading state
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  
  // Check current user session
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Update player state when user data changes
  useEffect(() => {
    if (!isLoading && userData) {
      setPlayer({
        id: userData.id,
        username: userData.username,
        balance: userData.balance,
        isLoggedIn: true
      });
    }
  }, [userData, isLoading]);

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

  const logout = async (): Promise<void> => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setPlayer(defaultPlayer);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };

  return (
    <PlayerContext.Provider value={{ player, setPlayer, updateBalance, logout, isLoading }}>
      {children}
    </PlayerContext.Provider>
  );
}
