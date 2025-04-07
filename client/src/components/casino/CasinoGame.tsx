import { Link } from "wouter";
import { GameInfo } from "@/types/game";

interface CasinoGameProps {
  game: GameInfo;
}

export function CasinoGame({ game }: CasinoGameProps) {
  return (
    <div className="bg-gradient-to-br from-[#331D5C] to-[#232131] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
      <div className="relative">
        <img 
          src={game.imageSrc} 
          alt={game.name} 
          className="w-full h-48 object-cover" 
        />
        {game.tag && (
          <div className={`absolute top-0 right-0 bg-${game.tag.color} text-white m-2 px-2 py-1 rounded-md text-sm font-sans`}>
            {game.tag.text}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-montserrat font-bold mb-2">{game.name}</h3>
        <p className="text-gray-300 text-sm mb-3">{game.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-users text-[#F8BF0C] mr-1"></i>
            <span className="text-sm text-gray-300">{game.players} playing</span>
          </div>
          <Link href={`/${game.id}`}>
            <button className="bg-[#2E86DE] hover:bg-blue-600 text-white font-sans py-2 px-4 rounded-lg transition-colors duration-300">
              Play Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
