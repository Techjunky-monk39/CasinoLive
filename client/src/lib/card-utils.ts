import { Card, Suit, Rank, PokerHandRank } from "@/types/game";

// Create a full deck of cards
export function generateDeck(): Card[] {
  const deck: Card[] = [];
  
  const suits = Object.values(Suit);
  const ranks = Object.values(Rank);
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        faceUp: true
      });
    }
  }
  
  return deck;
}

// Shuffle the deck using Fisher-Yates algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Deal n cards from the deck
export function dealCards(deck: Card[], count: number): Card[] {
  const cards: Card[] = [];
  
  for (let i = 0; i < count; i++) {
    if (deck.length > 0) {
      const card = deck.pop();
      if (card) {
        cards.push(card);
      }
    }
  }
  
  return cards;
}

// Calculate blackjack hand score
export function calculateBlackjackScore(cards: Card[]): number {
  let score = 0;
  let aceCount = 0;
  
  for (const card of cards) {
    if (!card.faceUp) continue;
    
    switch (card.rank) {
      case Rank.ACE:
        score += 11;
        aceCount++;
        break;
      case Rank.KING:
      case Rank.QUEEN:
      case Rank.JACK:
      case Rank.TEN:
        score += 10;
        break;
      default:
        score += parseInt(card.rank) || 0;
    }
  }
  
  // Adjust for aces if needed
  while (score > 21 && aceCount > 0) {
    score -= 10; // Convert an ace from 11 to 1
    aceCount--;
  }
  
  return score;
}

// Check if a poker hand is a flush (all same suit)
export function isFlush(cards: Card[]): boolean {
  const firstSuit = cards[0].suit;
  return cards.every(card => card.suit === firstSuit);
}

// Check if a poker hand is a straight (sequential ranks)
export function isStraight(cards: Card[]): boolean {
  // Convert ranks to values for easier comparison
  const rankValues: Record<Rank, number> = {
    [Rank.ACE]: 1, // Ace can be 1 or 14
    [Rank.TWO]: 2,
    [Rank.THREE]: 3,
    [Rank.FOUR]: 4,
    [Rank.FIVE]: 5,
    [Rank.SIX]: 6,
    [Rank.SEVEN]: 7,
    [Rank.EIGHT]: 8,
    [Rank.NINE]: 9,
    [Rank.TEN]: 10,
    [Rank.JACK]: 11,
    [Rank.QUEEN]: 12,
    [Rank.KING]: 13
  };
  
  const values = cards.map(card => rankValues[card.rank]);
  values.sort((a, b) => a - b);
  
  // Check for regular straight
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i-1] + 1) {
      // Check for A-5 straight
      if (
        i === values.length - 1 && 
        values[0] === 1 && 
        values[1] === 10 && 
        values[2] === 11 && 
        values[3] === 12 && 
        values[4] === 13
      ) {
        return true;
      }
      return false;
    }
  }
  
  return true;
}

// Get poker hand rank
export function getPokerHandRank(cards: Card[]): PokerHandRank {
  if (cards.length !== 5) {
    return PokerHandRank.HIGH_CARD;
  }
  
  const isHandFlush = isFlush(cards);
  const isHandStraight = isStraight(cards);
  
  // Royal flush
  if (
    isHandFlush && 
    isHandStraight && 
    cards.some(card => card.rank === Rank.ACE) && 
    cards.some(card => card.rank === Rank.KING)
  ) {
    return PokerHandRank.ROYAL_FLUSH;
  }
  
  // Straight flush
  if (isHandFlush && isHandStraight) {
    return PokerHandRank.STRAIGHT_FLUSH;
  }
  
  // Count rank frequencies
  const rankCounts: Record<string, number> = {};
  for (const card of cards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }
  
  const counts = Object.values(rankCounts);
  
  // Four of a kind
  if (counts.includes(4)) {
    return PokerHandRank.FOUR_OF_A_KIND;
  }
  
  // Full house
  if (counts.includes(3) && counts.includes(2)) {
    return PokerHandRank.FULL_HOUSE;
  }
  
  // Flush
  if (isHandFlush) {
    return PokerHandRank.FLUSH;
  }
  
  // Straight
  if (isHandStraight) {
    return PokerHandRank.STRAIGHT;
  }
  
  // Three of a kind
  if (counts.includes(3)) {
    return PokerHandRank.THREE_OF_A_KIND;
  }
  
  // Two pair
  if (counts.filter(count => count === 2).length === 2) {
    return PokerHandRank.TWO_PAIR;
  }
  
  // Pair
  if (counts.includes(2)) {
    return PokerHandRank.PAIR;
  }
  
  // High card
  return PokerHandRank.HIGH_CARD;
}
