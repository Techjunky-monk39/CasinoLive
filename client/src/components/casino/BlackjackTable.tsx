import { useState } from "react";
import { Card as CardComponent } from "./Card";
import { usePlayer } from "@/contexts/PlayerContext";
import { useNotification } from "@/components/ui/notification-banner";
import { apiRequest } from "@/lib/queryClient";
import { Card, Suit, Rank, BlackjackAction, BlackjackState } from "@/types/game";
import { generateDeck, shuffleDeck, dealCards, calculateBlackjackScore } from "@/lib/card-utils";

export function BlackjackTable() {
  const { player, updateBalance } = usePlayer();
  const { showNotification } = useNotification();
  
  const [currentBet, setCurrentBet] = useState(150);
  const [gameState, setGameState] = useState<BlackjackState>({
    playerHand: { cards: [], score: 0 },
    dealerHand: { cards: [], score: 0 },
    gameStatus: "bet",
    currentBet: 150
  });
  const [deck, setDeck] = useState<Card[]>([]);
  
  const decreaseBet = () => {
    if (gameState.gameStatus !== "bet") return;
    if (currentBet > 50) {
      setCurrentBet(currentBet - 50);
    }
  };

  const increaseBet = () => {
    if (gameState.gameStatus !== "bet") return;
    if (currentBet < player.balance) {
      setCurrentBet(currentBet + 50);
    }
  };

  const dealCards = async () => {
    if (gameState.gameStatus !== "bet") return;
    
    if (player.balance < currentBet) {
      showNotification("Not enough credits to place this bet!");
      return;
    }
    
    // Deduct bet from balance
    await updateBalance(-currentBet);
    
    // Generate a new shuffled deck
    const newDeck = shuffleDeck(generateDeck());
    setDeck(newDeck);
    
    // Deal initial cards
    const playerCards = [newDeck.pop()!, newDeck.pop()!];
    const dealerCards = [newDeck.pop()!, { ...newDeck.pop()!, faceUp: false }];
    
    const playerScore = calculateBlackjackScore(playerCards);
    const dealerScore = calculateBlackjackScore([dealerCards[0]]); // Only count visible card
    
    setGameState({
      playerHand: { cards: playerCards, score: playerScore },
      dealerHand: { cards: dealerCards, score: dealerScore },
      gameStatus: "playing",
      currentBet: currentBet
    });
    
    // Check for blackjack
    if (playerScore === 21) {
      setTimeout(() => standAction(), 1000);
    }
  };

  const hitAction = async () => {
    if (gameState.gameStatus !== "playing") return;
    
    // Deal another card to player
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const updatedPlayerCards = [...gameState.playerHand.cards, newCard];
    const playerScore = calculateBlackjackScore(updatedPlayerCards);
    
    setDeck(newDeck);
    setGameState({
      ...gameState,
      playerHand: { cards: updatedPlayerCards, score: playerScore }
    });
    
    // Check if player busts
    if (playerScore > 21) {
      const updatedState = {
        ...gameState,
        playerHand: { cards: updatedPlayerCards, score: playerScore },
        gameStatus: "playerBust"
      };
      setGameState(updatedState);
      
      // Record game history
      await apiRequest("POST", "/api/games/history", {
        gameType: "blackjack",
        bet: currentBet,
        outcome: "loss",
        winAmount: 0
      });
      
      showNotification("Busted! You went over 21.");
      
      // Reset game after delay
      setTimeout(() => {
        setGameState({
          playerHand: { cards: [], score: 0 },
          dealerHand: { cards: [], score: 0 },
          gameStatus: "bet",
          currentBet: currentBet
        });
      }, 3000);
    }
  };

  const standAction = async () => {
    if (gameState.gameStatus !== "playing") return;
    
    // Flip dealer's hidden card
    const dealerCards = [
      ...gameState.dealerHand.cards.slice(0, 1),
      { ...gameState.dealerHand.cards[1], faceUp: true }
    ];
    let dealerScore = calculateBlackjackScore(dealerCards);
    
    // Dealer draws until 17 or higher
    let newDeck = [...deck];
    while (dealerScore < 17 && newDeck.length > 0) {
      const newCard = newDeck.pop()!;
      dealerCards.push(newCard);
      dealerScore = calculateBlackjackScore(dealerCards);
    }
    
    setDeck(newDeck);
    
    // Determine game outcome
    let outcome: "win" | "loss" | "push" = "loss";
    let gameStatus: BlackjackState["gameStatus"] = "dealerWin";
    let winAmount = 0;
    const playerScore = gameState.playerHand.score;
    
    if (dealerScore > 21) {
      outcome = "win";
      gameStatus = "dealerBust";
      winAmount = currentBet * 2;
      showNotification("Dealer busts! You win!");
    } else if (playerScore > dealerScore) {
      outcome = "win";
      gameStatus = "playerWin";
      winAmount = currentBet * 2;
      showNotification("You win!");
    } else if (playerScore === dealerScore) {
      outcome = "push";
      gameStatus = "push";
      winAmount = currentBet;
      showNotification("Push! Bet returned.");
    } else {
      showNotification("Dealer wins!");
    }
    
    // Update game state
    setGameState({
      playerHand: gameState.playerHand,
      dealerHand: { cards: dealerCards, score: dealerScore },
      gameStatus: gameStatus,
      currentBet: currentBet
    });
    
    // Record game history
    await apiRequest("POST", "/api/games/history", {
      gameType: "blackjack",
      bet: currentBet,
      outcome: outcome,
      winAmount: winAmount
    });
    
    // Add winnings to balance if applicable
    if (winAmount > 0) {
      await updateBalance(winAmount);
    }
    
    // Reset game after delay
    setTimeout(() => {
      setGameState({
        playerHand: { cards: [], score: 0 },
        dealerHand: { cards: [], score: 0 },
        gameStatus: "bet",
        currentBet: currentBet
      });
    }, 3000);
  };

  const doubleDownAction = async () => {
    if (gameState.gameStatus !== "playing" || gameState.playerHand.cards.length !== 2) return;
    
    if (player.balance < currentBet) {
      showNotification("Not enough credits to double down!");
      return;
    }
    
    // Double the bet
    await updateBalance(-currentBet);
    const doubleBet = currentBet * 2;
    
    // Deal one more card to player
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const updatedPlayerCards = [...gameState.playerHand.cards, newCard];
    const playerScore = calculateBlackjackScore(updatedPlayerCards);
    
    setDeck(newDeck);
    setGameState({
      ...gameState,
      playerHand: { cards: updatedPlayerCards, score: playerScore },
      currentBet: doubleBet
    });
    
    // Check if player busts
    if (playerScore > 21) {
      const updatedState = {
        ...gameState,
        playerHand: { cards: updatedPlayerCards, score: playerScore },
        gameStatus: "playerBust",
        currentBet: doubleBet
      };
      setGameState(updatedState);
      
      // Record game history
      await apiRequest("POST", "/api/games/history", {
        gameType: "blackjack",
        bet: doubleBet,
        outcome: "loss",
        winAmount: 0
      });
      
      showNotification("Busted! You went over 21.");
      
      // Reset game after delay
      setTimeout(() => {
        setGameState({
          playerHand: { cards: [], score: 0 },
          dealerHand: { cards: [], score: 0 },
          gameStatus: "bet",
          currentBet: currentBet
        });
      }, 3000);
    } else {
      // Stand after double down
      setTimeout(() => standAction(), 500);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-montserrat font-bold text-[#F8BF0C]">Classic Blackjack</h2>
        <div className="flex space-x-3">
          <div className="bg-[#331D5C] rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Dealer:</span>
            <span className="text-white font-sans ml-2">{gameState.dealerHand.score}</span>
          </div>
          <div className="bg-[#331D5C] rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Player:</span>
            <span className="text-white font-sans ml-2">{gameState.playerHand.score}</span>
          </div>
        </div>
      </div>
      
      {/* Blackjack Table */}
      <div className="bg-[#1A7A4C] rounded-xl p-6 shadow-lg relative overflow-hidden">
        {/* Table design elements */}
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-20 bg-white opacity-10 rounded-full"></div>
        
        {/* Dealer's Hand */}
        <div className="mb-10">
          <h3 className="text-lg font-montserrat mb-3 text-white">Dealer's Hand</h3>
          <div className="flex space-x-2 sm:space-x-4">
            {gameState.gameStatus === "bet" ? (
              // Empty dealer hand
              Array(2).fill(0).map((_, index) => (
                <CardComponent key={`dealer-empty-${index}`} />
              ))
            ) : (
              // Dealer cards
              gameState.dealerHand.cards.map((card, index) => (
                <CardComponent 
                  key={`dealer-${index}`} 
                  card={card} 
                  isFlipped={card.faceUp !== false} 
                />
              ))
            )}
          </div>
        </div>
        
        {/* Player's Hand */}
        <div className="mb-8">
          <h3 className="text-lg font-montserrat mb-3 text-white">Your Hand</h3>
          <div className="flex space-x-2 sm:space-x-4">
            {gameState.gameStatus === "bet" ? (
              // Empty player hand
              Array(2).fill(0).map((_, index) => (
                <CardComponent key={`player-empty-${index}`} />
              ))
            ) : (
              // Player cards
              gameState.playerHand.cards.map((card, index) => (
                <CardComponent 
                  key={`player-${index}`} 
                  card={card} 
                  isFlipped={true} 
                />
              ))
            )}
          </div>
        </div>
        
        {/* Control Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <span className="text-white mr-3">Bet:</span>
            <div className="flex items-center bg-black bg-opacity-30 rounded-lg overflow-hidden">
              <button 
                onClick={decreaseBet}
                disabled={gameState.gameStatus !== "bet"}
                className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
              >
                <i className="fas fa-minus"></i>
              </button>
              <span className="px-4 py-2 font-sans text-[#F8BF0C]">{currentBet}</span>
              <button 
                onClick={increaseBet}
                disabled={gameState.gameStatus !== "bet"}
                className="bg-[#331D5C] hover:bg-purple-800 text-white px-3 py-2 focus:outline-none disabled:opacity-50"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={dealCards}
              disabled={gameState.gameStatus !== "bet" || player.balance < currentBet}
              className="bg-[#2E86DE] hover:bg-blue-700 text-white font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
              DEAL
            </button>
            <button 
              onClick={hitAction}
              disabled={gameState.gameStatus !== "playing"}
              className="bg-[#F8BF0C] hover:bg-yellow-500 text-[#232131] font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
              HIT
            </button>
            <button 
              onClick={standAction}
              disabled={gameState.gameStatus !== "playing"}
              className="bg-[#A12C2C] hover:bg-red-700 text-white font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
              STAND
            </button>
            <button 
              onClick={doubleDownAction}
              disabled={gameState.gameStatus !== "playing" || 
                      gameState.playerHand.cards.length !== 2 || 
                      player.balance < currentBet}
              className="bg-[#1A7A4C] hover:bg-green-700 text-white font-sans py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
              DOUBLE
            </button>
          </div>
        </div>
      </div>
      
      {/* Game Rules */}
      <div className="mt-6 bg-[#232131] bg-opacity-70 rounded-xl p-4">
        <h3 className="text-xl font-montserrat font-semibold mb-3 text-[#F8BF0C]">Blackjack Rules</h3>
        <ul className="list-disc pl-5 text-gray-300 text-sm">
          <li>Goal: Get a hand value as close to 21 as possible without exceeding it</li>
          <li>Card Values: Number cards = face value, Face cards (J,Q,K) = 10, Ace = 1 or 11</li>
          <li>Blackjack: An Ace with a 10, J, Q, or K pays 3:2</li>
          <li>Dealer must hit on 16 or less and stand on 17 or more</li>
          <li>Doubling down: Double your bet after receiving your first two cards, but you only get one more card</li>
        </ul>
      </div>
    </div>
  );
}
