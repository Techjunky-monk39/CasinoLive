import React from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { GameType } from "@shared/schema";

export default function Dice456() {
  const { player, updateBalance } = usePlayer();
  const { showNotification } = useNotification();
  
  const [currentBet, setCurrentBet] = React.useState(200);
  const [gameState, setGameState] = React.useState<"betting" | "choosing" | "result">("betting");
  const [prediction, setPrediction] = React.useState<"odd" | "even" | null>(null);
  const [diceResult, setDiceResult] = React.useState<number[]>([]);
  const [result, setResult] = React.useState<"win" | "loss" | null>(null);
  
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
    
    // Move to choosing phase
    setGameState("choosing");
    setPrediction(null);
    setDiceResult([]);
    setResult(null);
  };
  
  const makePrediction = (choice: "odd" | "even") => {
    if (gameState !== "choosing") return;
    
    setPrediction(choice);
    
    // Roll the dice after a slight delay for suspense
    setTimeout(() => {
      rollDice(choice);
    }, 1000);
  };
  
  const rollDice = async (choice: "odd" | "even") => {
    // Roll 3 dice
    const dice = Array(3).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    setDiceResult(dice);
    
    // Calculate sum and determine if odd or even
    const sum = dice.reduce((total, val) => total + val, 0);
    const isEven = sum % 2 === 0;
    const outcome = isEven ? "even" : "odd";
    
    // Determine win or loss
    const playerWins = choice === outcome;
    setResult(playerWins ? "win" : "loss");
    
    // Update game state
    setGameState("result");
    
    // Handle outcome
    const winAmount = playerWins ? currentBet * 2 : 0;
    
    // Record game history
    await apiRequest("POST", "/api/games/history", {
      gameType: GameType.DICE_456,
      bet: currentBet,
      outcome: playerWins ? "win" : "loss",
      winAmount: winAmount
    });
    
    if (playerWins) {
      await updateBalance(winAmount);
      showNotification(`Congratulations! You guessed correctly and won ${winAmount} credits!`);
    } else {
      showNotification("Wrong guess! Try again.");
    }
    
    // Reset game after a delay
    setTimeout(() => {
      setGameState("betting");
    }, 3000);
  };
  
  return (
    <main className="container mx-auto px-4 py-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-montserrat font-bold text-[#F8BF0C]">456 Dice Challenge</h2>
        {gameState === "result" && (
          <div className={`bg-${result === "win" ? "[#1A7A4C]" : "[#A12C2C]"} rounded-lg px-6 py-2`}>
            <span className="text-lg font-bold text-white">
              {result === "win" ? "YOU WIN!" : "YOU LOSE!"}
            </span>
          </div>
        )}
      </div>
      
      {/* Dice Game */}
      <div className="bg-gradient-to-b from-[#331D5C] to-[#232131] rounded-xl p-6 shadow-lg">
        {/* Game area */}
        <div className="bg-black bg-opacity-50 rounded-lg p-8 mb-6 flex flex-col items-center">
          {gameState === "betting" && (
            <div className="text-center mb-6">
              <h3 className="text-xl font-montserrat font-semibold text-[#F8BF0C] mb-4">Prepare for the Challenge</h3>
              <p className="text-gray-300 max-w-lg mx-auto">
                In this high-stakes game inspired by Korean survival games, 
                you must predict whether the sum of three dice will be odd or even.
                Choose wisely - your virtual life depends on it!
              </p>
            </div>
          )}
          
          {gameState === "choosing" && (
            <div className="text-center mb-6">
              <h3 className="text-xl font-montserrat font-semibold text-[#F8BF0C] mb-4">Make Your Prediction</h3>
              <p className="text-gray-300 mb-4">Will the sum of the dice be odd or even?</p>
              <div className="flex space-x-8 mt-4">
                <button 
                  onClick={() => makePrediction("odd")}
                  className="bg-[#A12C2C] hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300"
                >
                  ODD
                </button>
                <button 
                  onClick={() => makePrediction("even")}
                  className="bg-[#1A7A4C] hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300"
                >
                  EVEN
                </button>
              </div>
            </div>
          )}
          
          {gameState !== "betting" && (
            <div className="flex items-center justify-center space-x-6 my-6">
              {diceResult.length > 0 ? 
                diceResult.map((value, index) => (
                  <div 
                    key={`dice-${index}`} 
                    className="w-20 h-20 flex items-center justify-center bg-white text-[#232131] rounded-xl text-4xl font-bold shadow-lg"
                  >
                    {value}
                  </div>
                )) : 
                Array(3).fill(0).map((_, index) => (
                  <div 
                    key={`dice-placeholder-${index}`} 
                    className="w-20 h-20 flex items-center justify-center bg-[#331D5C] rounded-xl border-2 border-dashed border-gray-500"
                  >
                    <span className="text-gray-400">?</span>
                  </div>
                ))
              }
            </div>
          )}
          
          {diceResult.length > 0 && (
            <div className="text-center mt-4">
              <div className="text-lg">
                Sum: <span className="text-[#F8BF0C] font-bold text-xl">
                  {diceResult.reduce((total, val) => total + val, 0)}
                </span>
              </div>
              <div className="text-lg mt-1">
                Result: <span className="text-[#F8BF0C] font-bold">
                  {diceResult.reduce((total, val) => total + val, 0) % 2 === 0 ? "EVEN" : "ODD"}
                </span>
              </div>
              <div className="text-lg mt-1">
                Your prediction: <span className={`font-bold ${prediction === "odd" ? "text-[#A12C2C]" : "text-[#1A7A4C]"}`}>
                  {prediction?.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Controls */}
        {gameState === "betting" && (
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
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
              className={`bg-gradient-to-r from-[#A12C2C] to-[#F8BF0C] hover:from-red-700 hover:to-yellow-500 text-white font-sans py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none ${
                player.balance < currentBet ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              START CHALLENGE
            </button>
          </div>
        )}
      </div>
      
      {/* Rules */}
      <div className="mt-6 bg-[#232131] bg-opacity-70 rounded-xl p-4">
        <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Game Rules</h3>
        <ul className="list-disc pl-5 text-gray-300 text-sm">
          <li>Place your bet and predict whether the sum of three dice will be odd or even</li>
          <li>Three dice will be rolled, and their sum will determine the outcome</li>
          <li>If your prediction is correct, you win double your bet</li>
          <li>If your prediction is incorrect, you lose your bet</li>
          <li>The odds are approximately 50/50, but fortune favors the bold!</li>
        </ul>
      </div>
    </main>
  );
}