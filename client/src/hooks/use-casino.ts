import { useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { GameType } from "@shared/schema";

interface UseCasinoProps {
  gameType: GameType;
  initialBet?: number;
  minBet?: number;
  maxBet?: number;
}

export function useCasino({ 
  gameType, 
  initialBet = 100, 
  minBet = 50, 
  maxBet = 1000
}: UseCasinoProps) {
  const { player, updateBalance } = usePlayer();
  const { toast } = useToast();
  const { showNotification } = useNotification();
  
  const [currentBet, setCurrentBet] = useState(initialBet);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const increaseBet = (amount = 50) => {
    if (isProcessing) return;
    const newBet = Math.min(currentBet + amount, maxBet, player.balance);
    setCurrentBet(newBet);
  };
  
  const decreaseBet = (amount = 50) => {
    if (isProcessing) return;
    const newBet = Math.max(currentBet - amount, minBet);
    setCurrentBet(newBet);
  };
  
  const setMaximumBet = () => {
    if (isProcessing) return;
    setCurrentBet(Math.min(maxBet, player.balance));
  };
  
  const placeBet = async (): Promise<boolean> => {
    if (isProcessing) return false;
    
    if (player.balance < currentBet) {
      showNotification("Not enough credits to place this bet!");
      return false;
    }
    
    setIsProcessing(true);
    
    try {
      const success = await updateBalance(-currentBet);
      if (!success) {
        throw new Error("Failed to update balance");
      }
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place bet",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const recordGameResult = async (outcome: "win" | "loss" | "push", winAmount: number) => {
    try {
      await apiRequest("POST", "/api/games/history", {
        gameType,
        bet: currentBet,
        outcome,
        winAmount
      });
      
      if (winAmount > 0) {
        await updateBalance(winAmount);
        showNotification(`You won ${winAmount} credits!`);
      }
    } catch (error) {
      console.error("Failed to record game result:", error);
    }
  };
  
  return {
    currentBet,
    isProcessing,
    increaseBet,
    decreaseBet,
    setMaximumBet,
    placeBet,
    recordGameResult
  };
}
