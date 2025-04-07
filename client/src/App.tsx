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
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameNavigation from "@/components/layout/GameNavigation";
import { NotificationBanner } from "@/components/ui/notification-banner";
import { PlayerProvider } from "@/contexts/PlayerContext";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-[#232131]">
      <Header />
      <GameNavigation />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/slots" component={Slot} />
          <Route path="/poker" component={Poker} />
          <Route path="/blackjack" component={Blackjack} />
          <Route path="/dice10000" component={Dice10000} />
          <Route path="/dice456" component={Dice456} />
          <Route path="/craps" component={Craps} />
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
