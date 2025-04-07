import { usePlayer } from "@/contexts/PlayerContext";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { player, logout, isLoading } = usePlayer();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/auth');
  };

  return (
    <header className="bg-[#331D5C] shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="text-[#F8BF0C] font-montserrat font-bold text-2xl sm:text-3xl hover:text-white transition duration-200 cursor-pointer">
              Royal Flush Casino
            </div>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-[#232131] rounded-full px-4 py-2 flex items-center">
            <i className="fas fa-coins text-[#F8BF0C] mr-2"></i>
            <span className="font-sans">
              {isLoading ? "Loading..." : player.balance}
            </span>
          </div>
          
          {player.isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2 hover:bg-[#232131] rounded-full">
                  <span className="hidden sm:inline-block font-medium">{player.username}</span>
                  <div className="w-10 h-10 rounded-full bg-[#F8BF0C] flex items-center justify-center text-[#331D5C]">
                    <i className="fas fa-user"></i>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt mr-2"></i> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-gradient-to-r from-[#F8BF0C] to-yellow-600 text-[#232131] font-bold hover:from-yellow-500 hover:to-yellow-700"
            >
              Login / Register
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
