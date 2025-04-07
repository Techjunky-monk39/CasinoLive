// Card types
export enum Suit {
  HEARTS = "hearts",
  DIAMONDS = "diamonds",
  CLUBS = "clubs",
  SPADES = "spades"
}

export enum Rank {
  ACE = "A",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
  TEN = "10",
  JACK = "J",
  QUEEN = "Q",
  KING = "K"
}

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

// Slot machine types
export type SlotSymbol = "🍒" | "🍊" | "🍇" | "🔔" | "💎" | "7️⃣";

export interface SlotResult {
  symbols: SlotSymbol[];
  win: boolean;
  amount: number;
}

// Blackjack types
export interface BlackjackHand {
  cards: Card[];
  score: number;
}

export type BlackjackAction = "hit" | "stand" | "double";

export interface BlackjackState {
  playerHand: BlackjackHand;
  dealerHand: BlackjackHand;
  gameStatus: "bet" | "playing" | "playerBust" | "dealerBust" | "playerWin" | "dealerWin" | "push";
  currentBet: number;
}

// Poker types
export enum PokerHandRank {
  HIGH_CARD = "High Card",
  PAIR = "Pair",
  TWO_PAIR = "Two Pair",
  THREE_OF_A_KIND = "Three of a Kind",
  STRAIGHT = "Straight",
  FLUSH = "Flush",
  FULL_HOUSE = "Full House",
  FOUR_OF_A_KIND = "Four of a Kind",
  STRAIGHT_FLUSH = "Straight Flush",
  ROYAL_FLUSH = "Royal Flush"
}

export interface PokerHand {
  cards: Card[];
  rank: PokerHandRank;
}

export interface PokerState {
  communityCards: Card[];
  playerHand: Card[];
  gameStatus: "bet" | "preFlop" | "flop" | "turn" | "river" | "showdown";
  currentBet: number;
}

// Game common types
export interface GameInfo {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  players: number;
  tag?: {
    text: string;
    color: string;
  };
}
