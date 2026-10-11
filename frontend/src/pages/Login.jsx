import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Seo } from "../components/Seo";
import { Logo } from "../components/site/Logo";
import { ControlTowerMockup } from "../components/site/mockups";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter any email and password to try the demo.");
      return;
    }
    login(email.trim());
    navigate("/app", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" data-testid="login-page">
      <Seo
        title="Log in - Haulage AI"
        description="Log in to the Haulage AI dashboard demo. Exceptions first, everything else handled."
      />
      <header className="mx-auto flex w-full max-w-[1200px] items-center px-5 py-5 md:px-8">
        <Logo testId="login-logo" />
      </header>
      <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-10 px-5 pb-16 md:px-8 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-md">
          <form onSubmit={onSubmit} noValidate data-testid="login-form" className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
            <h1 className="font-heading text-2xl font-bold">Log in to Haulage AI</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Demo build: any email and password works.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="login-email">Work email</Label>
                <Input
                  id="login-email"
                  data-testid="login-email"
                  type="email"
                  autoComplete="email"
                  className="h-11 rounded-xl border-input bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    data-testid="login-password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    className="h-11 rounded-xl border-input bg-background pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    data-testid="login-show-password"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <p className="mt-3 text-xs text-destructive" role="alert" data-testid="login-error">
                {error}
              </p>
            )}
            <button
              type="submit"
              data-testid="login-submit"
              className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Log in
            </button>
            <div className="mt-4 flex items-center justify-between text-sm">
              <a href="mailto:support@haulage.ai?subject=Password%20reset" data-testid="login-forgot" className="text-muted-foreground underline-offset-4 hover:underline">
                Forgot password
              </a>
              <a href="mailto:support@haulage.ai" data-testid="login-help" className="text-muted-foreground underline-offset-4 hover:underline">
                Need help?
              </a>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Haulage AI?{" "}
            <Link to="/contact" data-testid="login-book-demo-link" className="font-semibold text-heading underline-offset-4 hover:underline">
              Book a Demo
            </Link>
          </p>
        </div>
        <aside className="hidden lg:block" aria-label="Product preview">
          <ControlTowerMockup testId="login-product-panel" />
          <p className="mt-4 text-center font-heading text-lg font-bold text-heading">
            Exceptions first. Everything else handled.
          </p>
        </aside>
      </main>
      <footer className="border-t py-5" data-testid="login-footer">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 text-xs text-muted-foreground md:px-8">
          <Link to="/legal/privacy" className="hover:underline">Privacy Policy</Link>
          <Link to="/legal/terms" className="hover:underline">Terms</Link>
          <a href="mailto:support@haulage.ai" className="hover:underline">support@haulage.ai (Placeholder)</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
