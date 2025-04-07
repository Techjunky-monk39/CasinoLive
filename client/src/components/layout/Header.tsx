import { usePlayer } from "@/contexts/PlayerContext";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { player, setPlayer } = usePlayer();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/auth/me");
        const data = await response.json();
        
        if (data) {
          setPlayer({
            id: data.id,
            username: data.username,
            balance: data.balance,
            isLoggedIn: true
          });
        } else {
          setPlayer({
            id: 0,
            username: "Guest",
            balance: 5000,
            isLoggedIn: false
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <header className="bg-[#331D5C] shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-[#F8BF0C] font-montserrat font-bold text-2xl sm:text-3xl">Royal Flush Casino</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-[#232131] rounded-full px-4 py-2 flex items-center">
            <i className="fas fa-coins text-[#F8BF0C] mr-2"></i>
            <span className="font-sans">
              {isLoading ? "Loading..." : player.balance}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="hidden sm:inline-block font-medium mr-2">{player.username}</span>
            <div className="w-10 h-10 rounded-full bg-[#F8BF0C] flex items-center justify-center text-[#331D5C]">
              <i className="fas fa-user"></i>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
