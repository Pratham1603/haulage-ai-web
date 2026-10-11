import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { ThemeProvider } from "@/theme";
import { AuthProvider, RequireAuth } from "@/auth";
import Home from "@/pages/Home";
import Product from "@/pages/Product";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import ComingNext from "@/pages/ComingNext";
import ModulePage from "@/pages/ModulePage";
import { MockProvider } from "@/mock/store";
import { AppShell } from "@/components/app/AppShell";
import ControlTower from "@/pages/app/ControlTower";
import Orders from "@/pages/app/Orders";
import Loads from "@/pages/app/Loads";
import Fleet from "@/pages/app/Fleet";
import Warehouse from "@/pages/app/Warehouse";
import Finance from "@/pages/app/Finance";
import Returns from "@/pages/app/Returns";
import Calls from "@/pages/app/Calls";
import Agents from "@/pages/app/Agents";

const COMING = [
  { path: "/solutions", title: "Solutions" },
  { path: "/solutions/transporters-fleet-owners", title: "For Transporters and Fleet Owners" },
  { path: "/solutions/shippers-brands", title: "For Shippers and Brands" },
  { path: "/solutions/3pls-warehouses", title: "For 3PLs and Warehouses" },
  { path: "/solutions/finance-teams", title: "For Finance Teams" },
  { path: "/how-it-works", title: "How It Works" },
  { path: "/case-study", title: "Case Study: 18 Pallets, Mumbai to Delhi" },
  { path: "/integrations", title: "Integrations" },
  { path: "/trust-security", title: "Trust and Security" },
  { path: "/pricing", title: "Pricing" },
  { path: "/resources", title: "Resources" },
  { path: "/resources/blog", title: "Blog" },
  { path: "/resources/blog/:slug", title: "Blog article" },
  { path: "/resources/roi-calculator", title: "ROI Calculator" },
  { path: "/resources/guides", title: "Guides" },
  { path: "/about", title: "About" },
  { path: "/legal/privacy", title: "Privacy Policy" },
  { path: "/legal/terms", title: "Terms of Service" },
];

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-center" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product" element={<Product />} />
            <Route path="/product/:slug" element={<ModulePage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/book-a-demo" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <MockProvider>
                    <AppShell />
                  </MockProvider>
                </RequireAuth>
              }
            >
              <Route index element={<ControlTower />} />
              <Route path="orders" element={<Orders />} />
              <Route path="loads" element={<Loads />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="warehouse" element={<Warehouse />} />
              <Route path="finance" element={<Finance />} />
              <Route path="returns" element={<Returns />} />
              <Route path="calls" element={<Calls />} />
              <Route path="agents" element={<Agents />} />
            </Route>
            {COMING.map((r) => (
              <Route key={r.path} path={r.path} element={<ComingNext title={r.title} />} />
            ))}
            <Route path="*" element={<ComingNext title="Page not found" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
