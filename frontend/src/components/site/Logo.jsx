import { Link } from "react-router-dom";
import { Route } from "lucide-react";

export const LogoMark = ({ className = "" }) => (
  <span
    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground ${className}`}
    aria-hidden="true"
  >
    <Route className="h-4 w-4" />
  </span>
);

export const Logo = ({ dark = false, testId = "logo" }) => (
  <Link to="/" data-testid={testId} className="inline-flex items-center gap-2" aria-label="Haulage AI home">
    <LogoMark />
    <span className={`font-heading text-lg font-bold ${dark ? "text-footer-foreground" : "text-heading"}`}>
      Haulage AI
    </span>
  </Link>
);
