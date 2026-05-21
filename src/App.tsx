import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NostrLoginProvider } from "@/hooks/useNostrLogin";
import { OwnerProfileProvider } from "@/hooks/useOwnerProfile";
import { ReactionsProvider } from "@/hooks/useReactions";
import Index from "./pages/Index";
import Release from "./pages/Release";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <NostrLoginProvider>
      <OwnerProfileProvider>
        <ReactionsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/r/:naddr" element={<Release />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ReactionsProvider>
      </OwnerProfileProvider>
    </NostrLoginProvider>
  );
}
