import { Navbar } from "../components/site/Navbar";
import { Footer } from "../components/site/Footer";

export const SiteLayout = ({ children }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
