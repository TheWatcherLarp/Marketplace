import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import CreateCharacter from "./pages/CreateCharacter";
import CharacterInventory from "./pages/CharacterInventory";
import Marketplace from "./pages/Marketplace";
import HomePage from "./pages/HomePage";
import BranchMembers from "./pages/BranchMembers";
import TheRecentlyDead from "./pages/TheRecentlyDead";
import LocalMarketplace from "./pages/LocalMarketplace";
import Blacksmith from "./pages/Blacksmith"; // Import the new Blacksmith page
import { SessionContextProvider } from "./components/SessionContextProvider";

const queryClient = new QueryClient();

// Determine the base path for React Router based on the GitHub Pages URL
// This should match the repository name if deployed to a subpath
const basename = "/Marketplace"; 

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={basename}>
        <SessionContextProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-character" element={<CreateCharacter />} />
            <Route path="/character-inventory" element={<CharacterInventory />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/branch-members" element={<BranchMembers />} />
            <Route path="/the-recently-dead" element={<TheRecentlyDead />} />
            <Route path="/local-marketplace" element={<LocalMarketplace />} />
            <Route path="/blacksmith" element={<Blacksmith />} /> {/* New route for Blacksmith */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;