import React from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { GameType } from "@shared/schema";

type BetType = "pass" | "dontPass" | "field" | "hardway";
type GamePhase = "comeOut" | "point" | "result";

interface BetInfo {
  type: BetType;
  amount: number;
  active: boolean;
}

export default function Craps() {
  const { player, updateBalance } = usePlayer();
  const { showNotification } = useNotification();
  
  const [dice, setDice] = React.useState<[number, number]>([1, 1]);
  const [gamePhase, setGamePhase] = React.useState<GamePhase>("comeOut");
  const [point, setPoint] = React.useState<number | null>(null);
  const [bets, setBets] = React.useState<BetInfo[]>([]);
  const [selectedBetType, setSelectedBetType] = React.useState<BetType>("pass");
  const [betAmount, setBetAmount] = React.useState(100);
  const [totalBet, setTotalBet] = React.useState(0);
  const [rolling, setRolling] = React.useState(false);
  
  const decreaseBet = () => {
    if (betAmount > 50) {
      setBetAmount(betAmount - 50);
    }
  };

  const increaseBet = () => {
    if (betAmount < player.balance) {
      setBetAmount(betAmount + 50);
    }
  };
  
  const placeBet = async () => {
    if (player.balance < betAmount) {
      showNotification("Not enough credits to place this bet!");
      return;
    }
    
    // Check if bet of this type already exists
    const existingBetIndex = bets.findIndex(bet => bet.type === selectedBetType);
    
    let newBets = [...bets];
    if (existingBetIndex >= 0) {
      // Update existing bet
      newBets[existingBetIndex].amount += betAmount;
    } else {
      // Add new bet
      newBets.push({
        type: selectedBetType,
        amount: betAmount,
        active: true
      });
    }
    
    setBets(newBets);
    
    // Deduct bet from balance
    await updateBalance(-betAmount);
    
    // Update total bet
    setTotalBet(totalBet + betAmount);
    
    showNotification(`Placed a ${selectedBetType} bet of ${betAmount} credits.`);
  };
  
  const rollDice = async () => {
    if (rolling || bets.length === 0) return;
    
    setRolling(true);
    
    // Animate dice rolling
    const rollInterval = setInterval(() => {
      setDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
    }, 100);
    
    // Stop rolling after 2 seconds
    setTimeout(() => {
      clearInterval(rollInterval);
      
      // Generate final dice values
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      setDice([die1, die2]);
      
      // Process the roll
      processRoll(die1, die2);
      
      setRolling(false);
    }, 2000);
  };
  
  const processRoll = async (die1: number, die2: number) => {
    const sum = die1 + die2;
    
    if (gamePhase === "comeOut") {
      // Come out roll
      if (sum === 7 || sum === 11) {
        // Natural - Pass bets win, Don't Pass bets lose
        resolveBets(sum, true);
        showNotification(`Natural ${sum}! Pass bets win.`);
      } else if (sum === 2 || sum === 3 || sum === 12) {
        // Craps - Pass bets lose, Don't Pass bets win (except 12 is a push)
        resolveBets(sum, false);
        showNotification(`Craps ${sum}! Pass bets lose.`);
      } else {
        // Point is established
        setPoint(sum);
        setGamePhase("point");
        showNotification(`Point is ${sum}.`);
      }
    } else if (gamePhase === "point") {
      // Point phase
      if (sum === point) {
        // Point is made - Pass bets win, Don't Pass bets lose
        resolveBets(sum, true);
        showNotification(`Point ${sum} is made! Pass bets win.`);
        resetGame();
      } else if (sum === 7) {
        // Seven out - Pass bets lose, Don't Pass bets win
        resolveBets(sum, false);
        showNotification(`Seven out! Pass bets lose.`);
        resetGame();
      } else {
        // Field bets are resolved, game continues
        resolveFieldBets(sum);
        showNotification(`Roll is ${sum}. Continue shooting for point ${point}.`);
      }
    }
    
    // Process field bets regardless of phase
    resolveFieldBets(sum);
    
    // Process hardway bets
    if (die1 === die2 && (sum === 4 || sum === 6 || sum === 8 || sum === 10)) {
      resolveHardwayBets(sum, true);
    }
  };
  
  const resolveBets = async (roll: number, passWins: boolean) => {
    let winnings = 0;
    const newBets = bets.filter(bet => bet.active).map(bet => {
      let result = { ...bet, active: true };
      
      if (bet.type === "pass") {
        if (passWins) {
          winnings += bet.amount * 2; // Original bet + winnings
          result.active = false;
        } else {
          result.active = false;
        }
      } else if (bet.type === "dontPass") {
        if (!passWins) {
          // Don't pass bets push on 12 in come out roll
          if (gamePhase === "comeOut" && roll === 12) {
            winnings += bet.amount; // Return original bet
            showNotification("Don't Pass bets push on 12.");
          } else {
            winnings += bet.amount * 2; // Original bet + winnings
          }
          result.active = false;
        } else {
          result.active = false;
        }
      }
      
      return result;
    }).filter(bet => bet.active);
    
    setBets(newBets);
    
    if (winnings > 0) {
      await updateBalance(winnings);
      
      // Record game history
      await apiRequest("POST", "/api/games/history", {
        gameType: GameType.CRAPS,
        bet: totalBet,
        outcome: "win",
        winAmount: winnings
      });
      
      setTotalBet(0);
    } else if (newBets.length === 0) {
      // All bets resolved with no winnings
      await apiRequest("POST", "/api/games/history", {
        gameType: GameType.CRAPS,
        bet: totalBet,
        outcome: "loss",
        winAmount: 0
      });
      
      setTotalBet(0);
    }
  };
  
  const resolveFieldBets = async (roll: number) => {
    let winnings = 0;
    const newBets = [...bets];
    
    newBets.forEach((bet, index) => {
      if (bet.type === "field" && bet.active) {
        if (roll === 2 || roll === 12) {
          // Field bets pay 2:1 on 2 or 12
          winnings += bet.amount * 3; // Original bet + double winnings
          newBets[index].active = false;
        } else if (roll === 3 || roll === 4 || roll === 9 || roll === 10 || roll === 11) {
          // Field bets pay 1:1 on 3, 4, 9, 10, 11
          winnings += bet.amount * 2; // Original bet + winnings
          newBets[index].active = false;
        } else {
          // Field bets lose on 5, 6, 7, 8
          newBets[index].active = false;
        }
      }
    });
    
    setBets(newBets.filter(bet => bet.active));
    
    if (winnings > 0) {
      await updateBalance(winnings);
      showNotification(`Field bet wins! You won ${winnings} credits.`);
    }
  };
  
  const resolveHardwayBets = async (roll: number, isHardway: boolean) => {
    if (!isHardway) return;
    
    let winnings = 0;
    const newBets = [...bets];
    
    newBets.forEach((bet, index) => {
      if (bet.type === "hardway" && bet.active) {
        // Hardway bets pay 7:1 for 4 or 10, 9:1 for 6 or 8
        if (roll === 4 || roll === 10) {
          winnings += bet.amount * 8; // Original bet + 7x winnings
        } else if (roll === 6 || roll === 8) {
          winnings += bet.amount * 10; // Original bet + 9x winnings
        }
        newBets[index].active = false;
      }
    });
    
    setBets(newBets.filter(bet => bet.active));
    
    if (winnings > 0) {
      await updateBalance(winnings);
      showNotification(`Hardway ${roll} hits! You won ${winnings} credits.`);
    }
  };
  
  const resetGame = () => {
    setGamePhase("comeOut");
    setPoint(null);
  };
  
  return (
    <main className="container mx-auto px-4 py-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-montserrat font-bold text-[#F8BF0C]">Street Craps</h2>
        <div className="flex space-x-3">
          <div className="bg-[#331D5C] rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Phase:</span>
            <span className="text-white font-sans ml-2">{gamePhase === "comeOut" ? "Come Out" : `Point ${point}`}</span>
          </div>
          <div className="bg-[#331D5C] rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Total Bet:</span>
            <span className="text-white font-sans ml-2">{totalBet}</span>
          </div>
        </div>
      </div>
      
      {/* Craps Table */}
      <div className="bg-[#1A7A4C] rounded-xl p-6 shadow-lg relative overflow-hidden">
        {/* Table design elements */}
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-20 bg-white opacity-10 rounded-full"></div>
        
        {/* Dice Area */}
        <div className="mb-8 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <div className="w-20 h-20 flex items-center justify-center bg-white text-[#232131] rounded-lg text-4xl font-bold shadow-lg">
              {dice[0]}
            </div>
            <div className="w-20 h-20 flex items-center justify-center bg-white text-[#232131] rounded-lg text-4xl font-bold shadow-lg">
              {dice[1]}
            </div>
          </div>
          <div className="text-white text-2xl font-bold">
            {dice[0] + dice[1]}
          </div>
        </div>
        
        {/* Bet Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <h3 className="text-xl font-montserrat mb-3 text-center text-white">Place Your Bet</h3>
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <span className="text-white mr-3">Amount:</span>
                  <div className="flex items-center bg-black bg-opacity-30 rounded-lg overflow-hidden">
                    <button 
                      onClick={decreaseBet}
                      className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <span className="px-4 py-2 font-sans text-[#F8BF0C]">{betAmount}</span>
                    <button 
                      onClick={increaseBet}
                      className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
                <button 
                  onClick={placeBet}
                  disabled={player.balance < betAmount}
                  className="bg-[#F8BF0C] hover:bg-yellow-500 text-[#232131] font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                >
                  PLACE BET
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setSelectedBetType("pass")}
                  className={`py-2 px-4 rounded-lg font-sans transition-colors duration-200 ${
                    selectedBetType === "pass" 
                      ? "bg-[#2E86DE] text-white" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Pass Line
                </button>
                <button 
                  onClick={() => setSelectedBetType("dontPass")}
                  className={`py-2 px-4 rounded-lg font-sans transition-colors duration-200 ${
                    selectedBetType === "dontPass" 
                      ? "bg-[#A12C2C] text-white" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Don't Pass
                </button>
                <button 
                  onClick={() => setSelectedBetType("field")}
                  className={`py-2 px-4 rounded-lg font-sans transition-colors duration-200 ${
                    selectedBetType === "field" 
                      ? "bg-[#1A7A4C] text-white" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Field
                </button>
                <button 
                  onClick={() => setSelectedBetType("hardway")}
                  className={`py-2 px-4 rounded-lg font-sans transition-colors duration-200 ${
                    selectedBetType === "hardway" 
                      ? "bg-[#F8BF0C] text-[#232131]" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Hardway
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <h3 className="text-xl font-montserrat mb-3 text-center text-white">Active Bets</h3>
            <div className="h-48 overflow-auto">
              {bets.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {bets.map((bet, index) => (
                    <div key={`bet-${index}`} className="py-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          bet.type === "pass" ? "bg-[#2E86DE]" : 
                          bet.type === "dontPass" ? "bg-[#A12C2C]" : 
                          bet.type === "field" ? "bg-[#1A7A4C]" : 
                          "bg-[#F8BF0C]"
                        }`}></div>
                        <span className="capitalize">{bet.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <div className="text-[#F8BF0C]">{bet.amount}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No active bets
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <button 
                onClick={rollDice}
                disabled={rolling || bets.length === 0}
                className={`bg-gradient-to-r from-[#2E86DE] to-[#1A7A4C] hover:from-blue-700 hover:to-green-700 text-white font-sans py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none ${
                  rolling || bets.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {rolling ? "ROLLING..." : "ROLL DICE"}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rules */}
      <div className="mt-6 bg-[#232131] bg-opacity-70 rounded-xl p-4">
        <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Game Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <h4 className="font-bold mb-1 text-white">Pass Line Bet</h4>
            <ul className="list-disc pl-5">
              <li>Wins on 7 or 11 on come out roll</li>
              <li>Loses on 2, 3, or 12 on come out roll</li>
              <li>If any other number (4, 5, 6, 8, 9, 10), that becomes the "point"</li>
              <li>Once a point is established, pass bets win if the point is rolled before a 7</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-1 text-white">Don't Pass Bet</h4>
            <ul className="list-disc pl-5">
              <li>Opposite of pass line - wins when pass line loses</li>
              <li>Wins on 2, 3 on come out roll</li>
              <li>Pushes on 12 on come out roll</li>
              <li>Loses on 7, 11 on come out roll</li>
              <li>Once a point is established, don't pass bets win if 7 is rolled before the point</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-1 text-white">Field Bet</h4>
            <ul className="list-disc pl-5">
              <li>One-roll bet that wins if 2, 3, 4, 9, 10, 11, 12 is rolled</li>
              <li>Pays 1:1 on 3, 4, 9, 10, 11</li>
              <li>Pays 2:1 on 2 or 12</li>
              <li>Loses on 5, 6, 7, 8</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-1 text-white">Hardway Bet</h4>
            <ul className="list-disc pl-5">
              <li>Bet that a specific even number will be rolled as a double (both dice show the same value)</li>
              <li>Pays 7:1 on hard 4 or hard 10</li>
              <li>Pays 9:1 on hard 6 or hard 8</li>
              <li>Loses if the number is rolled "easy" (not as doubles) or if a 7 is rolled</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}