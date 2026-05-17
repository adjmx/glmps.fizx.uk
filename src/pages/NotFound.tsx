import { Link } from "react-router-dom";
import Nav from "@/components/Nav";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container max-w-3xl py-12">
        <h1 className="text-2xl font-semibold mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-6">not on the map.</p>
        <Link
          to="/"
          className="text-[11px] font-mono text-primary hover:underline"
        >
          ← discography
        </Link>
      </main>
    </div>
  );
}
