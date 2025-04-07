import { useState } from "react";
import { Card as CardComponent } from "./Card";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { Card, Suit, Rank, PokerHandRank } from "@/types/game";
import { generateDeck, shuffleDeck, dealCards } from "@/lib/card-utils";

const HAND_RANKINGS = [
  { name: PokerHandRank.ROYAL_FLUSH, description: "A, K, Q, J, 10 (same suit)" },
  { name: PokerHandRank.STRAIGHT_FLUSH, description: "5 consecutive (same suit)" },
  { name: PokerHandRank.FOUR_OF_A_KIND, description: "4 cards of same rank" },
  { name: PokerHandRank.FULL_HOUSE, description: "3 of a kind + a pair" },
  { name: PokerHandRank.FLUSH, description: "5 cards of same suit" },
  { name: PokerHandRank.STRAIGHT, description: "5 consecutive cards" },
  { name: PokerHandRank.THREE_OF_A_KIND, description: "3 cards of same rank" },
  { name: PokerHandRank.TWO_PAIR, description: "2 different pairs" },
  { name: PokerHandRank.PAIR, description: "2 cards of same rank" },
  { name: PokerHandRank.HIGH_CARD, description: "Highest card in hand" }
];

export function PokerTable() {
  const { player, updateBalance } = usePlayer();
  const { showNotification } = useNotification();
  
  const [currentBet, setCurrentBet] = useState(200);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [handRank, setHandRank] = useState<PokerHandRank | null>(null);
  
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  
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

  const dealHand = async () => {
    if (gameInProgress) return;
    
    if (player.balance < currentBet) {
      showNotification("Not enough credits to place this bet!");
      return;
    }
    
    // Deduct bet from balance
    await updateBalance(-currentBet);
    setGameInProgress(true);
    
    // Generate a deck and shuffle it
    const deck = shuffleDeck(generateDeck());
    
    // Deal 2 cards to player
    const playerHand = dealCards(deck, 2);
    setPlayerCards(playerHand);
    
    // Deal 5 community cards
    const communityHand = dealCards(deck, 5);
    setCommunityCards(communityHand);
    
    // Determine a random poker hand (simplified for demo)
    const randomHandIndex = Math.floor(Math.random() * 6); // 0-5 for better hands
    setHandRank(HAND_RANKINGS[randomHandIndex].name);
    
    // Determine win amount based on hand rank (simplified)
    let winMultiplier = 0;
    let outcome: "win" | "loss" = "loss";
    
    switch (randomHandIndex) {
      case 0: // Royal Flush
        winMultiplier = 100;
        outcome = "win";
        break;
      case 1: // Straight Flush
        winMultiplier = 50;
        outcome = "win";
        break;
      case 2: // Four of a Kind
        winMultiplier = 25;
        outcome = "win";
        break;
      case 3: // Full House
        winMultiplier = 10;
        outcome = "win";
        break;
      case 4: // Flush
        winMultiplier = 6;
        outcome = "win";
        break;
      case 5: // Straight
        winMultiplier = 4;
        outcome = "win";
        break;
      default:
        winMultiplier = 0;
        outcome = "loss";
    }
    
    const winAmount = currentBet * winMultiplier;
    
    // Record game history
    await apiRequest("POST", "/api/games/history", {
      gameType: "poker",
      bet: currentBet,
      outcome: outcome,
      winAmount: winAmount
    });
    
    if (winAmount > 0) {
      setTimeout(() => {
        showNotification(`You won ${winAmount} credits with a ${HAND_RANKINGS[randomHandIndex].name}!`);
        updateBalance(winAmount);
      }, 1000);
    }
    
    // Reset game state after a delay
    setTimeout(() => {
      setGameInProgress(false);
      setCommunityCards([]);
      setPlayerCards([]);
      setHandRank(null);
    }, 5000);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-montserrat font-bold text-[#F8BF0C]">Texas Hold'em Poker</h2>
        <div className="bg-[#331D5C] rounded-lg px-4 py-2">
          <span className="text-sm text-gray-300">Hand:</span>
          <span className="text-white font-sans ml-2">{handRank || "Waiting to deal..."}</span>
        </div>
      </div>
      
      {/* Poker Table */}
      <div className="bg-[#1A7A4C] rounded-xl p-6 shadow-lg relative overflow-hidden">
        {/* Table design elements */}
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-20 bg-white opacity-10 rounded-full"></div>
        
        {/* Community Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-montserrat mb-3 text-center text-white">Community Cards</h3>
          <div className="flex justify-center flex-wrap space-x-2 sm:space-x-4">
            {gameInProgress ? (
              communityCards.map((card, index) => (
                <CardComponent 
                  key={`community-${index}`} 
                  card={card} 
                  isFlipped={true} 
                />
              ))
            ) : (
              Array(5).fill(0).map((_, index) => (
                <CardComponent key={`community-empty-${index}`} />
              ))
            )}
          </div>
        </div>
        
        {/* Player Hand */}
        <div>
          <h3 className="text-lg font-montserrat mb-3 text-center text-white">Your Hand</h3>
          <div className="flex justify-center space-x-4">
            {gameInProgress ? (
              playerCards.map((card, index) => (
                <CardComponent 
                  key={`player-${index}`} 
                  card={card} 
                  isFlipped={true} 
                />
              ))
            ) : (
              Array(2).fill(0).map((_, index) => (
                <CardComponent key={`player-empty-${index}`} />
              ))
            )}
          </div>
        </div>
        
        {/* Control Panel */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center">
            <span className="text-white mr-3">Bet:</span>
            <div className="flex items-center bg-black bg-opacity-30 rounded-lg overflow-hidden">
              <button 
                onClick={decreaseBet}
                disabled={gameInProgress}
                className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
              >
                <i className="fas fa-minus"></i>
              </button>
              <span className="px-4 py-2 font-sans text-[#F8BF0C]">{currentBet}</span>
              <button 
                onClick={increaseBet}
                disabled={gameInProgress}
                className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={dealHand}
              disabled={gameInProgress || player.balance < currentBet}
              className="bg-[#2E86DE] hover:bg-blue-700 text-white font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
              DEAL
            </button>
            <button 
              className="bg-[#A12C2C] hover:bg-red-700 text-white font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
              disabled={true}
            >
              FOLD
            </button>
            <button 
              className="bg-[#F8BF0C] hover:bg-yellow-500 text-[#232131] font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
              disabled={true}
            >
              CALL
            </button>
            <button 
              className="bg-[#1A7A4C] hover:bg-green-700 text-white font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
              disabled={true}
            >
              RAISE
            </button>
          </div>
        </div>
      </div>
      
      {/* Information Panel */}
      <div className="mt-6 bg-[#232131] bg-opacity-70 rounded-xl p-4">
        <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Hand Rankings</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
          {HAND_RANKINGS.map((rank, index) => (
            <div key={index} className="bg-[#331D5C] bg-opacity-30 p-2 rounded">
              <div className="font-bold text-white">{rank.name}</div>
              <div className="text-gray-300">{rank.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
