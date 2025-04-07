import { useState, useEffect } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { SlotSymbol } from "@/types/game";

const SLOT_SYMBOLS: SlotSymbol[] = ["🍒", "🍊", "🍇", "🔔", "💎", "7️⃣"];
const SYMBOL_MULTIPLIERS: Record<SlotSymbol, number> = {
  "🍒": 25,
  "🍊": 50,
  "🍇": 100,
  "🔔": 250,
  "💎": 500,
  "7️⃣": 1000
};

export function SlotMachine() {
  const { player, updateBalance } = usePlayer();
  const { showNotification } = useNotification();
  
  const [currentBet, setCurrentBet] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelSymbols, setReelSymbols] = useState<SlotSymbol[]>(["🍒", "💎", "7️⃣"]);
  const [lastWin, setLastWin] = useState(0);

  const decreaseBet = () => {
    if (currentBet > 50) {
      setCurrentBet(currentBet - 50);
    }
  };

  const increaseBet = () => {
    if (currentBet < player.balance) {
      setCurrentBet(currentBet + 50);
    }
  };

  const setMaxBet = () => {
    setCurrentBet(Math.min(1000, player.balance));
  };

  const spin = async () => {
    if (isSpinning) return;
    
    if (player.balance < currentBet) {
      showNotification("Not enough credits to place this bet!");
      return;
    }
    
    // Deduct bet from balance
    await updateBalance(-currentBet);
    
    setIsSpinning(true);
    setLastWin(0);
    
    // Animate spinning
    const spinDuration = 2000;
    const spinInterval = 50;
    const animations = Math.floor(spinDuration / spinInterval);
    let currentAnimation = 0;
    
    const animationInterval = setInterval(() => {
      setReelSymbols([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ]);
      
      currentAnimation++;
      if (currentAnimation >= animations) {
        clearInterval(animationInterval);
        determineOutcome();
      }
    }, spinInterval);
  };

  const determineOutcome = async () => {
    // Determine final symbols
    const finalSymbols: SlotSymbol[] = [
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
    ];
    
    setReelSymbols(finalSymbols);
    
    // Check for wins
    let winAmount = 0;
    
    // All 3 symbols match
    if (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2]) {
      winAmount = currentBet * SYMBOL_MULTIPLIERS[finalSymbols[0]];
      showNotification(`You won ${winAmount} credits!`);
      
      // Add win to balance
      await updateBalance(winAmount);
      
      // Record game history
      await apiRequest("POST", "/api/games/history", {
        gameType: "slots",
        bet: currentBet,
        outcome: "win",
        winAmount: winAmount
      });
    } else {
      // Record loss
      await apiRequest("POST", "/api/games/history", {
        gameType: "slots",
        bet: currentBet,
        outcome: "loss",
        winAmount: 0
      });
    }
    
    setLastWin(winAmount);
    setIsSpinning(false);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-montserrat font-bold text-[#F8BF0C]">Fortune Spinner</h2>
        <div className="bg-[#331D5C] rounded-lg px-4 py-2">
          <span className="text-sm text-gray-300">Last Win:</span>
          <span className="text-[#F8BF0C] font-sans ml-2">{lastWin}</span>
        </div>
      </div>
      
      {/* Slot Machine */}
      <div className="bg-gradient-to-b from-[#331D5C] to-[#232131] rounded-xl p-6 shadow-lg">
        {/* Slot display area */}
        <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-6">
          <div className="flex justify-center space-x-2 sm:space-x-4">
            {/* Reels */}
            {reelSymbols.map((symbol, index) => (
              <div 
                key={`reel-${index}`} 
                className="reel bg-black w-20 sm:w-28 h-32 sm:h-40 flex items-center justify-center border-2 border-[#F8BF0C]"
              >
                <div className="reel-item text-4xl sm:text-5xl">{symbol}</div>
              </div>
            ))}
          </div>
          
          {/* Win line indicator */}
          <div className="relative h-2 mt-2">
            <div className="absolute inset-0 border-t-2 border-[#A12C2C] opacity-70"></div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <span className="text-gray-300 mr-3">Bet:</span>
            <div className="flex items-center bg-black bg-opacity-50 rounded-lg overflow-hidden">
              <button 
                onClick={decreaseBet}
                disabled={isSpinning || currentBet <= 50}
                className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
              >
                <i className="fas fa-minus"></i>
              </button>
              <span className="px-4 py-2 font-sans text-[#F8BF0C]">{currentBet}</span>
              <button 
                onClick={increaseBet}
                disabled={isSpinning || currentBet >= player.balance}
                className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <button 
            onClick={spin}
            disabled={isSpinning || player.balance < currentBet}
            className={`bg-gradient-to-r from-[#A12C2C] to-[#F8BF0C] hover:from-red-700 hover:to-yellow-500 text-white font-sans py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none ${
              isSpinning || player.balance < currentBet ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSpinning ? "SPINNING..." : "SPIN"}
          </button>
          
          <div className="flex items-center">
            <button 
              onClick={setMaxBet}
              disabled={isSpinning}
              className="bg-[#2E86DE] hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-3 font-sans text-sm disabled:opacity-50"
            >
              MAX BET
            </button>
            <button 
              className="bg-[#1A7A4C] hover:bg-green-700 text-white px-4 py-2 rounded-lg font-sans text-sm disabled:opacity-50"
              disabled={true}
            >
              AUTO
            </button>
          </div>
        </div>
      </div>
      
      {/* Paytable */}
      <div className="mt-6 bg-[#232131] bg-opacity-70 rounded-xl p-4">
        <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Paytable</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(SYMBOL_MULTIPLIERS).map(([symbol, multiplier], index) => (
            <div key={`paytable-${index}`} className="flex items-center">
              <div className="text-3xl mr-3">{symbol}{symbol}{symbol}</div>
              <span className="text-lg text-[#F8BF0C]">x{multiplier}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
