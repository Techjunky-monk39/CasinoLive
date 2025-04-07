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
              <a className={`${isActive("/")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center`}>
                <i className="fas fa-home mr-2"></i>
                <span className="whitespace-nowrap">Lobby</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/slots">
              <a className={`${isActive("/slots")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center`}>
                <i className="fas fa-dice mr-2"></i>
                <span className="whitespace-nowrap">Slots</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/poker">
              <a className={`${isActive("/poker")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center`}>
                <i className="fas fa-crown mr-2"></i>
                <span className="whitespace-nowrap">Poker</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/blackjack">
              <a className={`${isActive("/blackjack")} rounded-lg px-4 py-2 font-montserrat font-semibold flex items-center`}>
                <i className="fas fa-spade mr-2"></i>
                <span className="whitespace-nowrap">Blackjack</span>
              </a>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
