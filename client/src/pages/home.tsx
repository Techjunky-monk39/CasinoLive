import { Link } from "wouter";
import { CasinoGame } from "@/components/casino/CasinoGame";
import { GameInfo } from "@/types/game";

const FEATURED_GAMES: GameInfo[] = [
  {
    id: "slots",
    name: "Fortune Spinner",
    description: "Spin the reels and match symbols to win big! Features wild multipliers and free spin bonuses.",
    imageSrc: "https://images.unsplash.com/photo-1605418575103-41586a8921c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80",
    players: 243,
    tag: {
      text: "Popular",
      color: "[#A12C2C]"
    }
  },
  {
    id: "poker",
    name: "Texas Hold'em Poker",
    description: "Test your poker skills against the dealer. Make the best hand possible to win the pot!",
    imageSrc: "https://images.unsplash.com/photo-1622553970339-c4f9d27f3066?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80",
    players: 178,
    tag: {
      text: "New",
      color: "[#1A7A4C]"
    }
  },
  {
    id: "blackjack",
    name: "Classic Blackjack",
    description: "Get as close to 21 as possible without going over. Beat the dealer's hand to win!",
    imageSrc: "https://images.unsplash.com/photo-1601371095262-e14780ef7080?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300&q=80",
    players: 315,
    tag: {
      text: "Hot",
      color: "[#F8BF0C]"
    }
  }
];

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-6 text-white">
      <h2 className="text-3xl font-montserrat font-bold mb-6 text-[#F8BF0C]">Welcome to Royal Flush Casino</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURED_GAMES.map((game) => (
          <CasinoGame key={game.id} game={game} />
        ))}
      </div>
      
      {/* Promotions Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-montserrat font-bold mb-4 text-white">Promotions & Bonuses</h2>
        <div className="bg-[#331D5C] bg-opacity-40 rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-[#F8BF0C] mb-2">Welcome Bonus Package</h3>
            <p className="text-gray-200 mb-4">Get up to 5,000 bonus credits on your first three days of play!</p>
            <button className="bg-[#F8BF0C] hover:bg-yellow-500 text-[#232131] font-sans py-2 px-6 rounded-lg transition-colors duration-300">
              Claim Now
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#F8BF0C] opacity-10 rounded-full"></div>
          <div className="absolute top-10 right-10 text-6xl text-[#F8BF0C] opacity-20">
            <i className="fas fa-gift"></i>
          </div>
        </div>
      </div>
    </main>
  );
}
