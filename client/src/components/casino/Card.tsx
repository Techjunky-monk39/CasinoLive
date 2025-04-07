import { useState, useEffect } from "react";
import { Card as CardType, Suit } from "@/types/game";

interface CardProps {
  card?: CardType;
  isFlipped?: boolean;
  onFlip?: () => void;
}

export function Card({ card, isFlipped = false, onFlip }: CardProps) {
  const [flipped, setFlipped] = useState(isFlipped);

  useEffect(() => {
    setFlipped(isFlipped);
  }, [isFlipped]);

  const handleClick = () => {
    if (onFlip) {
      onFlip();
    }
  };

  const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
      case Suit.HEARTS: return "♥";
      case Suit.DIAMONDS: return "♦";
      case Suit.CLUBS: return "♣";
      case Suit.SPADES: return "♠";
    }
  };

  const getSuitColor = (suit: Suit) => {
    return suit === Suit.HEARTS || suit === Suit.DIAMONDS
      ? "text-red-600"
      : "text-black";
  };

  return (
    <div className="card perspective-1000 w-[120px] h-[180px] sm:w-[120px] sm:h-[180px]">
      <div 
        className={`card-inner relative w-full h-full transition-transform duration-600 transform-style-preserve-3d ${
          flipped ? "rotate-y-180" : ""
        }`}
        onClick={handleClick}
      >
        <div className="card-front absolute w-full h-full backface-hidden flex items-center justify-center bg-[#331D5C] rounded-lg">
          <div className="text-[#F8BF0C] text-lg">
            <i className="fas fa-question"></i>
          </div>
        </div>
        
        {card && (
          <div className="card-back absolute w-full h-full backface-hidden bg-white text-[#232131] rounded-lg p-2 rotate-y-180">
            <div className="flex justify-between items-start">
              <span className={`${getSuitColor(card.suit)} font-bold`}>{card.rank}</span>
              <span className={`${getSuitColor(card.suit)} text-xl`}>{getSuitSymbol(card.suit)}</span>
            </div>
            <div className={`flex items-center justify-center h-16 text-3xl ${getSuitColor(card.suit)}`}>
              {getSuitSymbol(card.suit)}
            </div>
            <div className="flex justify-between items-end rotate-180">
              <span className={`${getSuitColor(card.suit)} font-bold`}>{card.rank}</span>
              <span className={`${getSuitColor(card.suit)} text-xl`}>{getSuitSymbol(card.suit)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
