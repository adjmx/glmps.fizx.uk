import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NostrLoginProvider } from "@/hooks/useNostrLogin";
import { OwnerProfileProvider } from "@/hooks/useOwnerProfile";
import { ReactionsProvider } from "@/hooks/useReactions";
import { ReleaseEditorProvider } from "@/hooks/useReleaseEditor";
import Index from "./pages/Index";
import Release from "./pages/Release";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <NostrLoginProvider>
      <OwnerProfileProvider>
        <ReactionsProvider>
          <BrowserRouter>
            <ReleaseEditorProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/r/:naddr" element={<Release />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ReleaseEditorProvider>
          </BrowserRouter>
        </ReactionsProvider>
      </OwnerProfileProvider>
    </NostrLoginProvider>
  );
}
