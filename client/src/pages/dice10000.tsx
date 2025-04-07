import React from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { GameType } from "@shared/schema";

// Helper function to convert dice values to Unicode dice characters
const getDiceCharacter = (value: number): string => {
  switch (value) {
    case 1: return "⚀";
    case 2: return "⚁";
    case 3: return "⚂";
    case 4: return "⚃";
    case 5: return "⚄";
    case 6: return "⚅";
    default: return "🎲";
  }
};

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
  
  // NOTE: getDiceCharacter is defined at the top of the file

  const calculateScore = (selectedDiceValues: number[]): number => {
    let score = 0;
    
    // Check if all six dice have the same value (auto-win condition)
    if (selectedDiceValues.length === 6) {
      const firstValue = selectedDiceValues[0];
      const allSame = selectedDiceValues.every(value => value === firstValue);
      if (allSame) {
        // Automatic win - 10,000 points!
        return 10000;
      }
    }
    
    // Check for straight (1-2-3-4-5-6)
    if (selectedDiceValues.length === 6) {
      const sortedValues = [...selectedDiceValues].sort((a, b) => a - b);
      if (
        sortedValues[0] === 1 &&
        sortedValues[1] === 2 &&
        sortedValues[2] === 3 &&
        sortedValues[3] === 4 &&
        sortedValues[4] === 5 &&
        sortedValues[5] === 6
      ) {
        return 1500; // Straight = 1500 points
      }
    }
    
    // Count occurrences of each dice value
    const counts: { [key: number]: number } = {};
    selectedDiceValues.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });
    
    // Process counts for scoring
    Object.entries(counts).forEach(([value, count]) => {
      const numValue = parseInt(value);
      
      // Check for three or more of a kind
      if (count >= 3) {
        if (numValue === 1) {
          // Three 1s = 1000 points
          score += 1000;
          // Additional 1s beyond the first three
          if (count > 3) {
            score += (count - 3) * 100; // Each additional 1 is worth 100
          }
        } else if (numValue === 5) {
          // Three 5s = 500 points
          score += 500;
          // Additional 5s beyond the first three
          if (count > 3) {
            score += (count - 3) * 50; // Each additional 5 is worth 50
          }
        } else {
          // Three of any other number = value * 100
          score += numValue * 100;
          
          // Four of a kind = double value
          if (count === 4) {
            score += numValue * 100; // Double the three-of-a-kind score
          }
          // Five of a kind = triple value
          else if (count === 5) {
            score += numValue * 200; // Triple the three-of-a-kind score
          }
          // Six of a kind (should be caught by all-same check above, but just in case)
          else if (count === 6) {
            score += numValue * 300; // Quadruple the three-of-a-kind score
          }
        }
      } 
      // Individual 1s and 5s
      else {
        if (numValue === 1) {
          score += count * 100; // Each 1 is worth 100 points
        } else if (numValue === 5) {
          score += count * 50; // Each 5 is worth 50 points
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
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-3xl font-montserrat font-bold text-[#F8BF0C] bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-transparent">
          10000 Dice Challenge
        </h2>
        <div className="flex space-x-3">
          <div className="bg-black bg-opacity-50 rounded-lg p-2 flex items-center">
            <span className="text-gray-300 mr-2">Balance:</span>
            <span className="text-[#F8BF0C] text-xl font-bold">{player.balance}</span>
            <span className="text-gray-300 ml-1">credits</span>
          </div>
        </div>
      </div>
      
      {/* Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-4 text-center shadow-lg border border-[#F8BF0C]">
          <h3 className="text-lg text-gray-300 mb-1">Total Score</h3>
          <div className="text-3xl font-bold text-[#F8BF0C]">{totalScore}</div>
          <div className="text-sm text-gray-400 mt-1">Goal: 10,000</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-4 text-center shadow-lg border border-[#F8BF0C]">
          <h3 className="text-lg text-gray-300 mb-1">Current Roll Score</h3>
          <div className="text-3xl font-bold text-[#F8BF0C]">
            {selectedDice.length > 0 
              ? calculateScore(selectedDice.map(index => dice[index])) 
              : score}
          </div>
          <div className="text-sm text-gray-400 mt-1">From selected dice</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-4 text-center shadow-lg border border-[#F8BF0C]">
          <h3 className="text-lg text-gray-300 mb-1">Roll Count</h3>
          <div className="text-3xl font-bold text-[#F8BF0C]">{rolls}</div>
          <div className="text-sm text-gray-400 mt-1">Keep rolling to score more!</div>
        </div>
      </div>
      
      {/* Dice Game */}
      <div className="bg-gradient-to-b from-[#331D5C] to-[#232131] rounded-xl p-6 shadow-lg">
        {gameState === "betting" ? (
          <div className="flex flex-col items-center justify-center py-8">
            <h3 className="text-2xl font-montserrat font-bold text-[#F8BF0C] mb-6">
              Ready to Roll?
            </h3>
            
            <div className="flex items-center bg-black bg-opacity-50 rounded-lg overflow-hidden mb-8">
              <span className="text-xl text-[#F8BF0C] font-bold px-4">BET:</span>
              <button 
                onClick={decreaseBet}
                className="bg-[#331D5C] hover:bg-purple-800 text-white px-5 py-4 focus:outline-none disabled:opacity-50 font-bold text-xl"
              >
                -
              </button>
              <span className="px-8 py-4 font-sans text-[#F8BF0C] text-2xl font-bold">{currentBet}</span>
              <button 
                onClick={increaseBet}
                className="bg-[#331D5C] hover:bg-purple-800 text-white px-5 py-4 focus:outline-none disabled:opacity-50 font-bold text-xl"
              >
                +
              </button>
            </div>
            
            <button 
              onClick={startGame}
              disabled={player.balance < currentBet}
              className={`bg-gradient-to-r from-[#A12C2C] to-[#F8BF0C] hover:from-red-700 hover:to-yellow-500 text-white font-sans py-4 px-12 rounded-lg text-xl shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none ${
                player.balance < currentBet ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span className="font-bold tracking-wider">ROLL THE DICE</span>
            </button>
          </div>
        ) : (
          <>
            {/* Dice display area */}
            <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-items-center">
                {dice.map((value, index) => (
                  <div 
                    key={`dice-${index}`} 
                    className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-lg cursor-pointer border-2 transition-all transform ${
                      selectedDice.includes(index) 
                        ? 'border-[#F8BF0C] bg-[#331D5C] scale-110 shadow-glow' 
                        : value === 0 
                          ? 'border-gray-700 bg-gray-800 opacity-30 cursor-not-allowed' 
                          : 'border-gray-700 bg-[#232131] hover:border-[#F8BF0C] hover:scale-105'
                    }`}
                    onClick={() => value > 0 && toggleDiceSelection(index)}
                  >
                    {value > 0 ? (
                      <div className="text-3xl font-bold text-white">
                        {getDiceCharacter(value)}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Used</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Game info */}
            <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6">
              {selectedDice.length > 0 ? (
                <div className="text-center">
                  <div className="text-lg text-gray-300">
                    Selected Dice Score: <span className="text-[#F8BF0C] font-bold">{calculateScore(selectedDice.map(index => dice[index]))}</span>
                  </div>
                  {selectedDice.length === 6 && calculateScore(selectedDice.map(index => dice[index])) === 10000 && (
                    <div className="mt-2 text-xl text-[#F8BF0C] font-bold animate-pulse">
                      Wow! You've got a winning combination!
                    </div>
                  )}
                  {selectedDice.length === 6 && calculateScore(selectedDice.map(index => dice[index])) === 1500 && (
                    <div className="mt-2 text-xl text-[#F8BF0C] font-bold">
                      Nice! You've got a straight (1-2-3-4-5-6)!
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-300">
                  Select dice to score points. Every 1 is worth 100 points, every 5 is worth 50 points.
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex justify-center space-x-6">
              <button 
                onClick={rollDice}
                disabled={gameState !== "rolling"}
                className="bg-gradient-to-r from-[#2E86DE] to-[#1A7A4C] hover:from-blue-700 hover:to-green-700 text-white font-sans py-3 px-8 rounded-lg text-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none disabled:opacity-50"
              >
                ROLL AGAIN
              </button>
              <button 
                onClick={bankScore}
                disabled={gameState !== "rolling" || selectedDice.length === 0}
                className="bg-gradient-to-r from-[#F8BF0C] to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-[#232131] font-bold font-sans py-3 px-8 rounded-lg text-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none disabled:opacity-50"
              >
                BANK SCORE
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Rules */}
      <div className="mt-6 bg-gradient-to-r from-[#331D5C] to-[#232131] rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C] bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-transparent">Game Rules</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-[#F8BF0C] mb-2 font-semibold">Basic Scoring</h4>
            <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
              <li>Goal: Be the first to score 10,000 points</li>
              <li>Each 1 = 100 points</li>
              <li>Each 5 = 50 points</li>
              <li>Three 1's = 1,000 points</li>
              <li>Three 5's = 500 points</li>
              <li>Three of a kind (except 1's and 5's) = value × 100</li>
              <li>Four of a kind = double the three-of-a-kind value</li>
              <li>Five of a kind = triple the three-of-a-kind value</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-[#F8BF0C] mb-2 font-semibold">Special Combinations</h4>
            <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
              <li><span className="text-[#F8BF0C] font-semibold">Straight (1-2-3-4-5-6):</span> 1,500 points</li>
              <li><span className="text-[#F8BF0C] font-semibold">Six of a kind:</span> Automatic win (10,000 points)</li>
              <li><span className="text-[#F8BF0C] font-semibold">No scoring dice:</span> Lose all unbanked points</li>
              <li><span className="text-[#F8BF0C] font-semibold">Bank your points:</span> Add to your total and continue</li>
              <li><span className="text-[#F8BF0C] font-semibold">All dice score:</span> Roll all 6 dice again</li>
            </ul>
            
            <div className="bg-black bg-opacity-30 rounded-lg p-3 mt-3">
              <p className="text-sm text-gray-300">
                <span className="text-[#F8BF0C]">Tip:</span> Choose your dice wisely! It's often better to bank a smaller score than risk losing everything.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}