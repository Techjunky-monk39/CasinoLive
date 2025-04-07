import React, { useState, useEffect } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { GameType } from "@shared/schema";
import { ChatBox } from "@/components/casino/ChatBox";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for the dice combination rank
type DiceCombination = {
  name: string;
  value: number;
  isAutoWin: boolean;
  isAutoLose: boolean;
  description: string;
};

// Game mode options
type GameMode = "computer" | "passplay" | "multiplayer";
type DifficultyMode = "unlimited" | "three-rolls" | "one-roll";

export default function Dice456() {
  const { player, updateBalance } = usePlayer();
  const { showNotification } = useNotification();
  
  const [currentBet, setCurrentBet] = React.useState(200);
  const [gameState, setGameState] = React.useState<"betting" | "rolling" | "waitingForPlayer2" | "waitingForPlayer2Reroll" | "result">("betting");
  const [diceResult, setDiceResult] = React.useState<number[]>([]);
  const [playerCombination, setPlayerCombination] = React.useState<DiceCombination | null>(null);
  const [computerDiceResult, setComputerDiceResult] = React.useState<number[]>([]);
  const [computerCombination, setComputerCombination] = React.useState<DiceCombination | null>(null);
  const [result, setResult] = React.useState<"win" | "loss" | "push" | null>(null);
  const [rolling, setRolling] = React.useState(false);
  const [gameMode, setGameMode] = React.useState<GameMode>("computer");
  const [difficultyMode, setDifficultyMode] = React.useState<DifficultyMode>("unlimited");
  const [currentPlayer, setCurrentPlayer] = React.useState<1 | 2>(1);
  const [player1Combination, setPlayer1Combination] = React.useState<DiceCombination | null>(null);
  const [player2Combination, setPlayer2Combination] = React.useState<DiceCombination | null>(null);
  const [player1DiceResult, setPlayer1DiceResult] = React.useState<number[]>([]);
  const [player2DiceResult, setPlayer2DiceResult] = React.useState<number[]>([]);
  const [rollCount, setRollCount] = React.useState(0);
  
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
  
  // Function to evaluate dice combination and assign a rank
  const evaluateDiceCombination = (dice: number[]): DiceCombination => {
    const sortedDice = [...dice].sort((a, b) => a - b);
    const diceString = sortedDice.join("");
    
    // Check for 456 (automatic win)
    // We need to check the actual values in the array, not just the sorted string
    // The sorted string approach won't work since we're sorting the values
    const has4 = dice.includes(4);
    const has5 = dice.includes(5);
    const has6 = dice.includes(6);
    
    if (has4 && has5 && has6) {
      return {
        name: "456",
        value: 1000,
        isAutoWin: true,
        isAutoLose: false,
        description: "The highest combination - Automatic win!"
      };
    }
    
    // Check for 123 (automatic loss)
    // We need to check the actual values in the array, not just the sorted string
    const has1 = dice.includes(1);
    const has2 = dice.includes(2);
    const has3 = dice.includes(3);
    
    if (has1 && has2 && has3) {
      return {
        name: "123",
        value: 0,
        isAutoWin: false,
        isAutoLose: true,
        description: "The lowest combination - Automatic loss!"
      };
    }
    
    // Check for triples
    if (sortedDice[0] === sortedDice[1] && sortedDice[1] === sortedDice[2]) {
      const value = sortedDice[0] * 100;
      return {
        name: `Triple ${sortedDice[0]}s`,
        value: value,
        isAutoWin: false,
        isAutoLose: false,
        description: `Triple ${sortedDice[0]}s - Ranked by value (${value} points)`
      };
    }
    
    // Check for doubles (find the outlier)
    if (sortedDice[0] === sortedDice[1]) {
      return {
        name: `Double ${sortedDice[0]}s with ${sortedDice[2]}`,
        value: sortedDice[2],
        isAutoWin: false,
        isAutoLose: false,
        description: `Doubles with outlier ${sortedDice[2]} (${sortedDice[2]} points)`
      };
    }
    
    if (sortedDice[1] === sortedDice[2]) {
      return {
        name: `Double ${sortedDice[1]}s with ${sortedDice[0]}`,
        value: sortedDice[0],
        isAutoWin: false,
        isAutoLose: false,
        description: `Doubles with outlier ${sortedDice[0]} (${sortedDice[0]} points)`
      };
    }
    
    if (sortedDice[0] === sortedDice[2]) {
      return {
        name: `Double ${sortedDice[0]}s with ${sortedDice[1]}`,
        value: sortedDice[1],
        isAutoWin: false,
        isAutoLose: false,
        description: `Doubles with outlier ${sortedDice[1]} (${sortedDice[1]} points)`
      };
    }
    
    // If no pattern is found, should roll again
    return {
      name: "No pairs",
      value: 0,
      isAutoWin: false,
      isAutoLose: false,
      description: "No pairs - must roll again"
    };
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
    setDiceResult([]);
    setPlayerCombination(null);
    setComputerDiceResult([]);
    setComputerCombination(null);
    setResult(null);
    setRollCount(0); // Reset roll count for each new game
    
    // Start rolling player's dice
    rollPlayerDice();
  };
  
  const rollPlayerDice = () => {
    setRolling(true);
    
    // Increment roll count for limited re-rolls
    setRollCount(prev => prev + 1);
    
    // Animate dice rolling
    const rollInterval = setInterval(() => {
      setDiceResult([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
    }, 100);
    
    // Stop rolling after 2 seconds
    setTimeout(() => {
      clearInterval(rollInterval);
      
      // Generate final dice values
      const finalDice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];
      setDiceResult(finalDice);
      
      // Evaluate the combination
      const combination = evaluateDiceCombination(finalDice);
      setPlayerCombination(combination);
      
      // If it's an auto-lose, end the game immediately
      if (combination.isAutoLose) {
        endGame("loss");
      } 
      // If it's an auto-win, end the game immediately
      else if (combination.isAutoWin) {
        endGame("win");
      }
      // If there's no pair (need to re-roll)
      else if (combination.name === "No pairs") {
        // Handle different re-roll modes
        if (difficultyMode === "one-roll") {
          // In one-roll mode, no re-rolls allowed - move to computer's turn
          showNotification("No pairs - no re-rolls allowed in Cutthroatish mode!");
          setTimeout(() => {
            rollComputerDice();
          }, 1000);
        } 
        else if (difficultyMode === "three-rolls" && rollCount >= 3) {
          // In three-rolls mode, limited to 3 re-rolls
          showNotification("No pairs - but you've used all 3 re-rolls!");
          setTimeout(() => {
            rollComputerDice();
          }, 1000);
        }
        else {
          // In unlimited mode or within three-roll limit
          showNotification("No pairs - rolling again!");
          setTimeout(() => {
            rollPlayerDice(); // Re-roll player's dice
          }, 1000);
        }
      }
      // Otherwise, roll the computer's dice
      else {
        setTimeout(() => {
          rollComputerDice();
        }, 1000);
      }
      
      setRolling(false);
    }, 2000);
  };
  
  // Separate function for computer mode and pass-and-play mode for player 2
  const rollComputerDice = () => {
    // For pass and play mode, don't auto roll - wait for player 2 to press button
    if (gameMode === "passplay") {
      setGameState("waitingForPlayer2");
      showNotification("Pass the device to Player 2 for their turn");
      return;
    }
    
    // Regular computer AI opponent mode
    // Animate computer dice rolling
    const rollInterval = setInterval(() => {
      setComputerDiceResult([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
    }, 100);
    
    // Stop rolling after 2 seconds
    setTimeout(() => {
      clearInterval(rollInterval);
      
      // Generate final dice values
      const finalDice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];
      setComputerDiceResult(finalDice);
      
      // Evaluate the combination
      const combination = evaluateDiceCombination(finalDice);
      setComputerCombination(combination);
      
      // Compare the combinations to determine the winner
      if (combination.isAutoWin) {
        // Computer has 456
        endGame("loss");
      } else if (combination.isAutoLose) {
        // Computer has 123
        endGame("win");
      } else if (combination.name === "No pairs") {
        // Handle different re-roll modes for computer too
        if (difficultyMode === "one-roll") {
          // In one-roll mode, no re-rolls allowed
          showNotification("Opponent has no pairs - no re-rolls in Cutthroatish mode!");
          // Computer loses due to no valid combination
          endGame("win");
        }
        else if (difficultyMode === "three-rolls" && rollCount >= 3) {
          // In three-rolls mode, limited to 3 re-rolls
          showNotification("Opponent has no pairs - they've used all 3 re-rolls!");
          // Computer loses due to no valid combination after 3 tries
          endGame("win");
        }
        else {
          // In unlimited mode or within roll limit
          showNotification("Opponent has no pairs - they roll again!");
          setTimeout(() => {
            rollComputerDice(); // Re-roll computer's dice
          }, 1000);
        }
      } else if (playerCombination && combination.value > playerCombination.value) {
        // Computer has higher value
        endGame("loss");
      } else if (playerCombination && combination.value < playerCombination.value) {
        // Player has higher value
        endGame("win");
      } else {
        // It's a tie - both players should roll again
        showNotification("It's a tie! Both players will roll again.");
        setTimeout(() => {
          // Clear current dice results
          setDiceResult([]);
          setComputerDiceResult([]);
          setPlayerCombination(null);
          setComputerCombination(null);
          
          // Start new round with player 1 rolling first
          setGameState("rolling");
          rollPlayerDice();
        }, 1500);
      }
    }, 2000);
  };
  
  // Special function for player 2 in pass-and-play mode
  const rollPlayer2Dice = () => {
    setRolling(true);
    
    // Animate dice rolling
    const rollInterval = setInterval(() => {
      setComputerDiceResult([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
    }, 100);
    
    // Stop rolling after 2 seconds
    setTimeout(() => {
      clearInterval(rollInterval);
      
      // Generate final dice values
      const finalDice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];
      setComputerDiceResult(finalDice);
      
      // Evaluate the combination
      const combination = evaluateDiceCombination(finalDice);
      setComputerCombination(combination);
      
      // Compare the combinations to determine the winner
      if (combination.isAutoWin) {
        // Player 2 has 456
        endGame("loss");
      } else if (combination.isAutoLose) {
        // Player 2 has 123
        endGame("win");
      } else if (combination.name === "No pairs") {
        // Handle different re-roll modes
        if (difficultyMode === "one-roll") {
          // In one-roll mode, no re-rolls allowed
          showNotification("Player 2 has no pairs - no re-rolls in Cutthroatish mode!");
          // Player 2 loses due to no valid combination
          endGame("win");
        }
        else if (difficultyMode === "three-rolls" && rollCount >= 3) {
          // In three-rolls mode, limited to 3 re-rolls
          showNotification("Player 2 has no pairs - they've used all 3 re-rolls!");
          // Player 2 loses due to no valid combination after 3 tries
          endGame("win");
        }
        else {
          // In unlimited mode or within roll limit
          showNotification("Player 2 has no pairs - they need to roll again!");
          setGameState("waitingForPlayer2Reroll");
        }
      } else if (playerCombination && combination.value > playerCombination.value) {
        // Player 2 has higher value
        endGame("loss");
      } else if (playerCombination && combination.value < playerCombination.value) {
        // Player 1 has higher value
        endGame("win");
      } else {
        // It's a tie - both players should roll again
        showNotification("It's a tie! Both players will roll again.");
        setTimeout(() => {
          // Clear current dice results
          setDiceResult([]);
          setComputerDiceResult([]);
          setPlayerCombination(null);
          setComputerCombination(null);
          
          // Start new round with player 1 rolling first
          setGameState("rolling");
          rollPlayerDice();
        }, 1500);
      }
      
      setRolling(false);
    }, 2000);
  };
  
  const endGame = async (outcome: "win" | "loss" | "push") => {
    setResult(outcome);
    setGameState("result");
    
    // With the new tie handling rules, we shouldn't have "push" outcomes anymore
    // but keeping this code intact in case other game logic still references it
    const winAmount = outcome === "win" ? currentBet * 2 : 
                      outcome === "push" ? currentBet : 0;
    
    // Record game history
    try {
      await apiRequest("POST", "/api/games/history", {
        gameType: GameType.DICE_456,
        bet: currentBet,
        outcome: outcome,
        winAmount: winAmount
      });
    } catch (error) {
      console.error("Failed to record game history:", error);
    }
    
    if (outcome === "win") {
      await updateBalance(winAmount);
      showNotification(`Congratulations! You won ${winAmount} credits!`);
    } else if (outcome === "push") {
      await updateBalance(currentBet);
      showNotification("It's a push! Your bet has been returned.");
    } else {
      showNotification("You lost! Better luck next time.");
    }
    
    // Reset game after a delay
    setTimeout(() => {
      setGameState("betting");
    }, 5000);
  };
  
  return (
    <main className="container mx-auto px-4 py-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-montserrat font-bold text-[#F8BF0C] bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-transparent">456 Dice Challenge</h2>
        <div className="flex items-center space-x-3">
          <div className="bg-black bg-opacity-50 rounded-lg p-2 flex items-center">
            <span className="text-gray-300 mr-2">Balance:</span>
            <span className="text-[#F8BF0C] text-xl font-bold">{player.balance}</span>
            <span className="text-gray-300 ml-1">credits</span>
          </div>
          {gameState === "result" && result && (
            <div className={`rounded-lg px-6 py-2 ${
              result === "win" ? "bg-[#1A7A4C]" : 
              result === "loss" ? "bg-[#A12C2C]" : 
              "bg-[#2E86DE]"
            }`}>
              <span className="text-lg font-bold text-white">
                {result === "win" ? "YOU WIN!" : result === "loss" ? "YOU LOSE!" : "PUSH!"}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Top Controls - Roll Button Area */}
      {gameState === "betting" && (
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-4 mb-4 shadow-lg border border-[#F8BF0C]">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-xl text-[#F8BF0C] font-bold">BET:</span>
              <div className="flex items-center bg-black bg-opacity-70 rounded-lg overflow-hidden">
                <button 
                  onClick={decreaseBet}
                  className="bg-[#331D5C] hover:bg-purple-800 text-white px-4 py-3 focus:outline-none disabled:opacity-50 font-bold text-lg"
                >
                  -
                </button>
                <span className="px-6 py-3 font-sans text-[#F8BF0C] text-xl font-bold">{currentBet}</span>
                <button 
                  onClick={increaseBet}
                  className="bg-[#331D5C] hover:bg-purple-800 text-white px-4 py-3 focus:outline-none disabled:opacity-50 font-bold text-lg"
                >
                  +
                </button>
              </div>
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
        </div>
      )}
      
      {/* Game Settings */}
      {gameState === "betting" && (
        <div className="mb-6 bg-[#331D5C] rounded-xl p-4 shadow-lg">
          <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Game Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Game Mode Selection */}
            <div>
              <h4 className="text-[#F8BF0C] mb-2 font-semibold">Game Mode</h4>
              <Tabs defaultValue="computer" onValueChange={(value) => setGameMode(value as GameMode)} className="w-full">
                <TabsList className="grid grid-cols-3 mb-2">
                  <TabsTrigger value="computer">vs Computer</TabsTrigger>
                  <TabsTrigger value="passplay">Pass & Play</TabsTrigger>
                  <TabsTrigger value="multiplayer">Multiplayer</TabsTrigger>
                </TabsList>
                <div className="text-xs text-gray-300 mt-1">
                  {gameMode === "computer" && "Play against the computer AI"}
                  {gameMode === "passplay" && "Play with a friend on the same device"}
                  {gameMode === "multiplayer" && "Play with others on different devices"}
                </div>
              </Tabs>
            </div>
            
            {/* Difficulty Selection */}
            <div>
              <h4 className="text-[#F8BF0C] mb-2 font-semibold">Re-roll Rules</h4>
              <Select defaultValue="unlimited" onValueChange={(value) => setDifficultyMode(value as DifficultyMode)}>
                <SelectTrigger className="w-full bg-[#232131] border-[#F8BF0C] text-white">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-[#232131] border-[#F8BF0C] text-white">
                  <SelectGroup>
                    <SelectLabel>Difficulty Options</SelectLabel>
                    <SelectItem value="unlimited">Unlimited Re-rolls</SelectItem>
                    <SelectItem value="three-rolls">Maximum 3 Re-rolls</SelectItem>
                    <SelectItem value="one-roll">Cutthroatish</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-300 mt-1">
                {difficultyMode === "unlimited" && "Players can re-roll indefinitely when no pairs are rolled"}
                {difficultyMode === "three-rolls" && "Players have a maximum of 3 re-rolls per turn"}
                {difficultyMode === "one-roll" && "Cutthroat mode - no re-rolls allowed. Roll once and hope for the best!"}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Dice Game */}
      <div className="bg-gradient-to-b from-[#331D5C] to-[#232131] rounded-xl p-6 shadow-lg">
        {/* Game area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Player Side */}
          <div className="bg-black bg-opacity-50 rounded-lg p-6 flex flex-col items-center">
            <h3 className="text-xl font-montserrat font-semibold text-[#F8BF0C] mb-4">Your Roll</h3>
            
            <div className="flex items-center justify-center space-x-4 my-4">
              {diceResult.length > 0 ? 
                diceResult.map((value, index) => (
                  <div 
                    key={`dice-${index}`} 
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white text-[#232131] rounded-xl text-3xl md:text-4xl font-bold shadow-lg"
                  >
                    {value}
                  </div>
                )) : 
                Array(3).fill(0).map((_, index) => (
                  <div 
                    key={`dice-placeholder-${index}`} 
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-[#331D5C] rounded-xl border-2 border-dashed border-gray-500"
                  >
                    <span className="text-gray-400">?</span>
                  </div>
                ))
              }
            </div>
            
            {playerCombination && (
              <div className="text-center mt-2 bg-[#331D5C] bg-opacity-50 p-3 rounded-lg w-full">
                <div className="text-lg">
                  <span className="text-[#F8BF0C] font-bold">
                    {playerCombination.name}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {playerCombination.description}
                </div>
              </div>
            )}
          </div>
          
          {/* Computer Side */}
          <div className="bg-black bg-opacity-50 rounded-lg p-6 flex flex-col items-center">
            <h3 className="text-xl font-montserrat font-semibold text-[#A12C2C] mb-4">Opponent's Roll</h3>
            
            <div className="flex items-center justify-center space-x-4 my-4">
              {computerDiceResult.length > 0 ? 
                computerDiceResult.map((value, index) => (
                  <div 
                    key={`comp-dice-${index}`} 
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white text-[#232131] rounded-xl text-3xl md:text-4xl font-bold shadow-lg"
                  >
                    {value}
                  </div>
                )) : 
                Array(3).fill(0).map((_, index) => (
                  <div 
                    key={`comp-dice-placeholder-${index}`} 
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-[#331D5C] rounded-xl border-2 border-dashed border-gray-500"
                  >
                    <span className="text-gray-400">?</span>
                  </div>
                ))
              }
            </div>
            
            {computerCombination && (
              <div className="text-center mt-2 bg-[#331D5C] bg-opacity-50 p-3 rounded-lg w-full">
                <div className="text-lg">
                  <span className="text-[#A12C2C] font-bold">
                    {computerCombination.name}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {computerCombination.description}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Game message */}
        {gameState === "betting" && (
          <div className="text-center mb-6">
            <h3 className="text-xl font-montserrat font-semibold text-[#F8BF0C] mb-2">
              Welcome to the 456 Dice Challenge
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              In this high-stakes game inspired by Korean survival games,
              you'll roll three dice and compete against an opponent.
              The combination 4-5-6 is the highest and 1-2-3 is the lowest.
              Will luck be on your side?
            </p>
          </div>
        )}
        
        {/* Result message */}
        {gameState === "result" && result && (
          <div className={`text-center mb-6 p-4 rounded-lg ${
            result === "win" ? "bg-[#1A7A4C]" : 
            result === "loss" ? "bg-[#A12C2C]" : 
            "bg-[#2E86DE]"
          } bg-opacity-20`}>
            <h3 className="text-xl font-montserrat font-semibold text-[#F8BF0C] mb-2">
              {result === "win" 
                ? "Victory!" 
                : result === "loss" 
                  ? "Defeat!" 
                  : "Push!"}
            </h3>
            <p className="text-gray-300">
              {result === "win" 
                ? playerCombination?.isAutoWin 
                  ? "You rolled the perfect 4-5-6 combination! Automatic win!"
                  : computerCombination?.isAutoLose
                    ? "Your opponent rolled the dreaded 1-2-3. Automatic win for you!"
                    : "Your combination outranked your opponent's roll!"
                : result === "loss"
                  ? playerCombination?.isAutoLose
                    ? "You rolled 1-2-3. Automatic loss!"
                    : computerCombination?.isAutoWin
                      ? "Your opponent rolled the perfect 4-5-6. Automatic win for them!"
                      : "Your opponent's combination outranked your roll!"
                  : "You and your opponent rolled combinations of equal value!"}
            </p>
          </div>
        )}
        
        {/* Player 2 Turn Button - Only shown in Pass & Play Mode */}
        {gameState === "waitingForPlayer2" && (
          <div className="text-center mb-6 p-8 rounded-lg bg-gradient-to-r from-[#A12C2C] to-purple-900 border-2 border-[#F8BF0C]">
            <h3 className="text-2xl font-montserrat font-bold text-[#F8BF0C] mb-4">
              Player 2's Turn
            </h3>
            <p className="text-gray-200 mb-6">
              Player 1 has rolled their dice. Now it's Player 2's turn to roll!
            </p>
            <button 
              onClick={rollPlayer2Dice}
              className="bg-gradient-to-r from-[#F8BF0C] to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-4 px-12 rounded-lg text-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              PLAYER 2 - ROLL THE DICE
            </button>
          </div>
        )}
        
        {/* Player 2 Re-roll Button - Only shown when Player 2 needs to re-roll */}
        {gameState === "waitingForPlayer2Reroll" && (
          <div className="text-center mb-6 p-8 rounded-lg bg-gradient-to-r from-[#A12C2C] to-purple-900 border-2 border-[#F8BF0C]">
            <h3 className="text-2xl font-montserrat font-bold text-[#F8BF0C] mb-4">
              Player 2 - No Pairs!
            </h3>
            <p className="text-gray-200 mb-6">
              You rolled no pairs, which means you need to roll again.
            </p>
            <button 
              onClick={rollPlayer2Dice}
              className="bg-gradient-to-r from-[#F8BF0C] to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-4 px-12 rounded-lg text-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              PLAYER 2 - ROLL AGAIN
            </button>
          </div>
        )}
        
        {/* Game Stats */}
        {(gameState === "rolling" || gameState === "waitingForPlayer2" || gameState === "waitingForPlayer2Reroll") && (
          <div className="text-center mb-6 p-4 rounded-lg bg-black bg-opacity-30">
            <div className="text-md text-gray-300">
              <span className="text-[#F8BF0C] font-bold mr-2">Current Bet:</span>
              <span className="text-white">{currentBet} credits</span>
              
              {difficultyMode === "three-rolls" && (
                <span className="ml-6 text-[#F8BF0C] font-bold mr-2">
                  Re-rolls: <span className="text-white">{rollCount}/3</span>
                </span>
              )}
              
              {gameMode === "passplay" && (
                <span className="ml-6 text-[#F8BF0C] font-bold mr-2">
                  Mode: <span className="text-white">Pass & Play</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Box - Only visible in multiplayer mode */}
      {gameMode === "multiplayer" && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#232131] bg-opacity-70 rounded-xl p-4">
            <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Game Information</h3>
            <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4">
              <p className="text-gray-300">
                You are playing in multiplayer mode. Share this game ID with your friends to play together:
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <div className="bg-[#331D5C] rounded-lg px-4 py-2 text-[#F8BF0C] font-mono font-bold">
                  GAME-{player.id}-{Math.floor(Math.random() * 9000 + 1000)}
                </div>
                <button className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 rounded-lg">
                  Copy
                </button>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              In multiplayer mode, players take turns rolling the dice. The game automatically handles turn transitions and score tracking.
              You can communicate with other players using the chat box.
            </p>
          </div>
          <div className="lg:col-span-1 h-[400px]">
            <ChatBox gameId={`dice456-${player.id}`} />
          </div>
        </div>
      )}
      
      {/* Rules */}
      <div className="mt-6 bg-[#232131] bg-opacity-70 rounded-xl p-4">
        <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Game Rules</h3>
        <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
          <li><span className="text-[#F8BF0C] font-semibold">Objective:</span> Roll a better combination than your opponent</li>
          <li><span className="text-[#F8BF0C] font-semibold">456 is the highest:</span> Rolling 4-5-6 in any order is an automatic win</li>
          <li><span className="text-[#F8BF0C] font-semibold">123 is the lowest:</span> Rolling 1-2-3 in any order is an automatic loss</li>
          <li><span className="text-[#F8BF0C] font-semibold">Triples:</span> Three of the same number (666 is best, then 555, 444, 333, 222, 111)</li>
          <li><span className="text-[#F8BF0C] font-semibold">Doubles:</span> If you roll two of the same number, the third number is your score</li>
          <li><span className="text-[#F8BF0C] font-semibold">No Pairs:</span> If you roll three different numbers (not 123 or 456), you must roll again</li>
          <li><span className="text-[#F8BF0C] font-semibold">Highest wins:</span> The player with the higher-ranked combination wins</li>
          <li><span className="text-[#F8BF0C] font-semibold">Ties:</span> If both players have the same combination value, both will roll again</li>
          <li><span className="text-[#F8BF0C] font-semibold">Winnings:</span> If you win, you get double your bet</li>
        </ul>
      </div>
    </main>
  );
}