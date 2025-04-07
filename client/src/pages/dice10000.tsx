import React from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { GameType } from "@shared/schema";

export default function Dice10000() {
  const { player, updateBalance } = usePlayer();
  const { showNotification } = useNotification();
  
  const [currentBet, setCurrentBet] = React.useState(100);
  const [gameState, setGameState] = React.useState<"betting" | "rolling" | "finished">("betting");
  const [dice, setDice] = React.useState<number[]>([]);
  const [score, setScore] = React.useState<number>(0);
  const [totalScore, setTotalScore] = React.useState<number>(0);
  const [selectedDice, setSelectedDice] = React.useState<number[]>([]);
  const [rolls, setRolls] = React.useState<number>(0);
  
  const decreaseBet = () => {
    if (gameState !== "betting") return;
    if (currentBet > 50) {
      setCurrentBet(currentBet - 50);
    }
  };

  const increaseBet = () => {
    if (gameState !== "betting") return;
    if (currentBet < player.balance) {
      setCurrentBet(currentBet + 50);
    }
  };
  
  const startGame = async () => {
    if (gameState !== "betting") return;
    
    if (player.balance < currentBet) {
      showNotification("Not enough credits to place this bet!");
      return;
    }
    
    // Deduct bet from balance
    await updateBalance(-currentBet);
    
    // Reset game state
    setGameState("rolling");
    setDice([]);
    setScore(0);
    setTotalScore(0);
    setSelectedDice([]);
    setRolls(0);
    
    // Roll dice for the first time
    rollDice();
  };
  
  const rollDice = () => {
    if (gameState !== "rolling") return;

    // Generate 6 random dice
    const newDice = Array(6).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    setDice(newDice);
    setSelectedDice([]);
    setRolls(rolls + 1);
  };
  
  const toggleDiceSelection = (index: number) => {
    if (gameState !== "rolling") return;
    
    if (selectedDice.includes(index)) {
      setSelectedDice(selectedDice.filter(i => i !== index));
    } else {
      setSelectedDice([...selectedDice, index]);
    }
  };
  
  const bankScore = async () => {
    if (gameState !== "rolling" || selectedDice.length === 0) return;
    
    // Calculate score from selected dice
    const currentRollScore = calculateScore(selectedDice.map(index => dice[index]));
    const newTotalScore = totalScore + currentRollScore;
    setTotalScore(newTotalScore);
    setScore(currentRollScore);
    
    // Check if game is over
    if (newTotalScore >= 10000) {
      endGame(true);
    } else {
      // Remove selected dice and continue
      const newDice = [...dice];
      selectedDice.forEach(index => {
        newDice[index] = 0;
      });
      
      // If all dice have been used, get a new set
      if (newDice.every(d => d === 0)) {
        rollDice();
      } else {
        setDice(newDice);
        setSelectedDice([]);
      }
    }
  };
  
  const calculateScore = (selectedDiceValues: number[]): number => {
    let score = 0;
    
    // Count occurrences of each dice value
    const counts: { [key: number]: number } = {};
    selectedDiceValues.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });
    
    // Three or more of a kind
    Object.entries(counts).forEach(([value, count]) => {
      const numValue = parseInt(value);
      
      if (count >= 3) {
        // Three of a kind
        if (numValue === 1) {
          score += 1000; // Three 1s = 1000 points
        } else {
          score += numValue * 100; // Three of anything else = value * 100
        }
        
        // Additional dice beyond three of a kind
        if (count > 3) {
          if (numValue === 1) {
            score += (count - 3) * 100; // Additional 1s = 100 each
          } else if (numValue === 5) {
            score += (count - 3) * 50; // Additional 5s = 50 each
          }
        }
      } 
      // Single 1s and 5s
      else {
        if (numValue === 1) {
          score += count * 100; // 1s = 100 each
        } else if (numValue === 5) {
          score += count * 50; // 5s = 50 each
        }
      }
    });
    
    return score;
  };
  
  const endGame = async (isWin: boolean) => {
    setGameState("finished");
    
    const winAmount = isWin ? currentBet * 2 : 0;
    const outcome = isWin ? "win" : "loss";
    
    // Record game history
    await apiRequest("POST", "/api/games/history", {
      gameType: GameType.DICE_10000,
      bet: currentBet,
      outcome: outcome,
      winAmount: winAmount
    });
    
    if (isWin) {
      await updateBalance(winAmount);
      showNotification(`Congratulations! You've reached 10,000 points and won ${winAmount} credits!`);
    } else {
      showNotification("Game over! Better luck next time.");
    }
    
    // Reset game after a delay
    setTimeout(() => {
      setGameState("betting");
      setDice([]);
      setScore(0);
      setTotalScore(0);
      setSelectedDice([]);
      setRolls(0);
    }, 3000);
  };
  
  return (
    <main className="container mx-auto px-4 py-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-montserrat font-bold text-[#F8BF0C]">10000 Dice Game</h2>
        <div className="flex space-x-3">
          <div className="bg-[#331D5C] rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Total Score:</span>
            <span className="text-white font-sans ml-2">{totalScore}</span>
          </div>
          <div className="bg-[#331D5C] rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Current Score:</span>
            <span className="text-white font-sans ml-2">{score}</span>
          </div>
        </div>
      </div>
      
      {/* Dice Game */}
      <div className="bg-gradient-to-b from-[#331D5C] to-[#232131] rounded-xl p-6 shadow-lg">
        {/* Dice display area */}
        <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-items-center">
            {dice.map((value, index) => (
              <div 
                key={`dice-${index}`} 
                className={`w-16 h-16 flex items-center justify-center rounded-lg cursor-pointer border-2 ${
                  selectedDice.includes(index) 
                    ? 'border-[#F8BF0C] bg-[#331D5C]' 
                    : value === 0 
                      ? 'border-gray-700 bg-gray-800 opacity-30 cursor-not-allowed' 
                      : 'border-gray-700 bg-[#232131] hover:border-[#F8BF0C]'
                }`}
                onClick={() => value > 0 && toggleDiceSelection(index)}
              >
                {value > 0 ? (
                  <div className="text-2xl font-bold">{value}</div>
                ) : (
                  <div className="text-sm text-gray-500">Used</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {gameState === "betting" ? (
            <>
              <div className="flex items-center">
                <span className="text-gray-300 mr-3">Bet:</span>
                <div className="flex items-center bg-black bg-opacity-50 rounded-lg overflow-hidden">
                  <button 
                    onClick={decreaseBet}
                    className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <span className="px-4 py-2 font-sans text-[#F8BF0C]">{currentBet}</span>
                  <button 
                    onClick={increaseBet}
                    className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
              
              <button 
                onClick={startGame}
                disabled={player.balance < currentBet}
                className={`bg-gradient-to-r from-[#2E86DE] to-[#1A7A4C] hover:from-blue-700 hover:to-green-700 text-white font-sans py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none ${
                  player.balance < currentBet ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                START GAME
              </button>
            </>
          ) : (
            <>
              <div>
                <span className="text-gray-300 mr-3">Rolls:</span>
                <span className="text-white font-sans">{rolls}</span>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  onClick={rollDice}
                  disabled={gameState !== "rolling"}
                  className="bg-[#2E86DE] hover:bg-blue-700 text-white font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                >
                  ROLL AGAIN
                </button>
                <button 
                  onClick={bankScore}
                  disabled={gameState !== "rolling" || selectedDice.length === 0}
                  className="bg-[#F8BF0C] hover:bg-yellow-500 text-[#232131] font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                >
                  BANK SCORE
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Rules */}
      <div className="mt-6 bg-[#232131] bg-opacity-70 rounded-xl p-4">
        <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Game Rules</h3>
        <ul className="list-disc pl-5 text-gray-300 text-sm">
          <li>Goal: Be the first to score 10,000 points</li>
          <li>Each turn, roll six dice and select scoring dice</li>
          <li>Scoring: 1's = 100 points each, 5's = 50 points each</li>
          <li>Three of a kind: 1's = 1000, others = value × 100</li>
          <li>You must select at least one scoring die per roll</li>
          <li>Bank your score or roll again with remaining dice</li>
          <li>If you can't score, your turn ends and you lose all unbanked points</li>
        </ul>
      </div>
    </main>
  );
}