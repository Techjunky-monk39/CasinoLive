import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Slot from "@/pages/slot";
import Poker from "@/pages/poker";
import Blackjack from "@/pages/blackjack";
import Dice10000 from "@/pages/dice10000";
import Dice456 from "@/pages/dice456";
import Craps from "@/pages/craps";
import AuthPage from "@/pages/auth-page";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameNavigation from "@/components/layout/GameNavigation";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { Loader2 } from "lucide-react";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType, path?: string }) {
  const { player, isLoading } = usePlayer();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  return <Component />;
}

function Router() {
  const { isLoading } = usePlayer();
  
  return (
    <div className="min-h-screen flex flex-col bg-[#232131]">
      <Header />
      {!isLoading && <GameNavigation />}
      <div className="flex-grow">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={Home} />
          <Route path="/slots">
            <ProtectedRoute component={Slot} />
          </Route>
          <Route path="/poker">
            <ProtectedRoute component={Poker} />
          </Route>
          <Route path="/blackjack">
            <ProtectedRoute component={Blackjack} />
          </Route>
          <Route path="/dice10000">
            <ProtectedRoute component={Dice10000} />
          </Route>
          <Route path="/dice456">
            <ProtectedRoute component={Dice456} />
          </Route>
          <Route path="/craps">
            <ProtectedRoute component={Craps} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>
        <Router />
        <Toaster />
        <NotificationBanner />
      </PlayerProvider>
    </QueryClientProvider>
  );
}

export default App;
