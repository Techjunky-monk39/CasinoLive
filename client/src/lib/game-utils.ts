import { SlotSymbol } from "@/types/game";

// Slot machine utility functions
export const SLOT_SYMBOLS: SlotSymbol[] = ["🍒", "🍊", "🍇", "🔔", "💎", "7️⃣"];

export const SLOT_PAYOUTS: Record<SlotSymbol, number> = {
  "🍒": 25,
  "🍊": 50,
  "🍇": 100,
  "🔔": 250,
  "💎": 500,
  "7️⃣": 1000
};

export function getRandomSlotSymbol(): SlotSymbol {
  const index = Math.floor(Math.random() * SLOT_SYMBOLS.length);
  return SLOT_SYMBOLS[index];
}

export function calculateSlotWin(symbols: SlotSymbol[], bet: number): number {
  // Check if all symbols match
  if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    return bet * SLOT_PAYOUTS[symbols[0]];
  }
  
  // No win
  return 0;
}

// Animation utility functions
export function animateValue(
  start: number, 
  end: number, 
  duration: number, 
  callback: (value: number) => void
): void {
  let startTimestamp: number | null = null;
  const step = (timestamp: number) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    callback(value);
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      callback(end);
    }
  };
  
  window.requestAnimationFrame(step);
}

// Random number utility functions
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
