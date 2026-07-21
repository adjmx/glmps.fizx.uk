import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { NostrLoginProvider } from "@/hooks/useNostrLogin";
import { OwnerProfileProvider } from "@/hooks/useOwnerProfile";
import { ReactionsProvider } from "@/hooks/useReactions";
import Index from "./pages/Index";
import Release from "./pages/Release";
import Stats from "./pages/Stats";
import Current from "./pages/Current";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <ThemeProvider>
      <NostrLoginProvider>
      <OwnerProfileProvider>
        <ReactionsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/current" element={<Current />} />
              <Route path="/r/:naddr" element={<Release />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ReactionsProvider>
      </OwnerProfileProvider>
    </NostrLoginProvider>
    </ThemeProvider>
  );
}
