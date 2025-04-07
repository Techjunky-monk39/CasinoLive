import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Slot from "@/pages/slot";
import Poker from "@/pages/poker";
import Blackjack from "@/pages/blackjack";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameNavigation from "@/components/layout/GameNavigation";
import { NotificationBanner } from "@/components/ui/notification-banner";

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
      <Router />
      <Toaster />
      <NotificationBanner />
    </QueryClientProvider>
  );
}

export default App;
