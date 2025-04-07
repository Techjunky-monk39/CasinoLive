import { Link, useLocation } from "wouter";

export default function GameNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path ? "bg-[#232131] bg-opacity-60" : "hover:bg-[#232131] hover:bg-opacity-60";
  };

  return (
    <nav className="bg-[#331D5C] bg-opacity-80 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <ul className="flex overflow-x-auto space-x-1 sm:space-x-4 py-2 no-scrollbar">
          <li>
            <Link href="/">
              <div className={`${isActive("/")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center text-white cursor-pointer`}>
                <i className="fas fa-home mr-2"></i>
                <span className="whitespace-nowrap">Lobby</span>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/slots">
              <div className={`${isActive("/slots")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center text-white cursor-pointer`}>
                <i className="fas fa-dice mr-2"></i>
                <span className="whitespace-nowrap">Slots</span>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/poker">
              <div className={`${isActive("/poker")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center text-white cursor-pointer`}>
                <i className="fas fa-crown mr-2"></i>
                <span className="whitespace-nowrap">Poker</span>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/blackjack">
              <div className={`${isActive("/blackjack")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center text-white cursor-pointer`}>
                <i className="fas fa-spade mr-2"></i>
                <span className="whitespace-nowrap">Blackjack</span>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/dice10000">
              <div className={`${isActive("/dice10000")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center text-white cursor-pointer`}>
                <i className="fas fa-dice-six mr-2"></i>
                <span className="whitespace-nowrap">10000 Dice</span>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/dice456">
              <div className={`${isActive("/dice456")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center text-white cursor-pointer`}>
                <i className="fas fa-dice-three mr-2"></i>
                <span className="whitespace-nowrap">456 Game</span>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/craps">
              <div className={`${isActive("/craps")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center text-white cursor-pointer`}>
                <i className="fas fa-dice-d20 mr-2"></i>
                <span className="whitespace-nowrap">Craps</span>
              </div>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
