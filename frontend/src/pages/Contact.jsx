import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Mail, MessageCircle, Phone } from "lucide-react";
import { Seo } from "../components/Seo";
import { SiteLayout } from "../components/SiteLayout";
import { Section, Container, SectionHeading, PlaceholderChip, TextLink } from "../components/site/ui";
import { TrustBlock, Testimonial, FaqAccordion, PersonaChips } from "../components/site/blocks";
import { EmailToOrderThumb, VoiceThumb, MatchThumb, InboxThumb } from "../components/site/mockups";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CONTACT_FAQS, TESTIMONIALS } from "../content/site";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROLE_OPTIONS = [
  "Transport owner or fleet manager",
  "Shipper logistics head",
  "3PL or warehouse operator",
  "Finance",
  "Other",
];
const VOLUME_OPTIONS = ["Under 100 shipments", "100-500 shipments", "500-2,000 shipments", "2,000-10,000 shipments", "10,000+ shipments"];
const CHALLENGE_OPTIONS = [
  "Email data entry",
  "Status calls",
  "Empty return trips",
  "Chargebacks and billing errors",
  "Returns",
];
const LANG_OPTIONS = ["English", "Hindi", "Gujarati"];

const initialForm = {
  name: "",
  work_email: "",
  phone: "",
  company: "",
  role: "",
  monthly_volume: "",
  challenges: [],
  language: "English",
  message: "",
  consent: false,
};

const inputCls = "h-11 rounded-xl border-input bg-background";
const err = (errors, k) =>
  errors[k] ? <p className="mt-1 text-xs text-destructive" role="alert">{errors[k]}</p> : null;

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleChallenge = (c) =>
    setForm((f) => ({
      ...f,
      challenges: f.challenges.includes(c) ? f.challenges.filter((x) => x !== c) : [...f.challenges, c],
    }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.work_email)) e.work_email = "A valid work email is required.";
    if (form.phone.replace(/\D/g, "").length < 8) e.phone = "A valid phone or WhatsApp number is required.";
    if (!form.company.trim()) e.company = "Company name is required.";
    if (!form.role) e.role = "Please pick your role.";
    if (!form.consent) e.consent = "We need your consent to contact you.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, { ...form, monthly_volume: form.monthly_volume || null, message: form.message || null });
      setSubmitted({ ...form });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e2) {
      toast.error("Something went wrong. Please try again or WhatsApp us.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <Seo
        title="Book a Demo - Haulage AI"
        description="Book a free 30-minute walkthrough of Haulage AI, tailored to your lanes, in English, Hindi or Gujarati."
      />
      <Section className="pt-12 md:pt-20" data-testid="contact-hero">
        <Container className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl">See Haulage AI run your back office.</h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              A 30-minute walkthrough using your own sample email or shipment lane. We reply within one business day.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "No commitment, no credit card",
                "Tailored to your operation and lanes",
                "Hindi and Gujarati voice demo available",
              ].map((b) => (
                <li key={b} className="flex gap-3 text-base text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-ai" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div>
            {submitted ? (
              <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8" data-testid="contact-success">
                <CheckCircle2 className="h-10 w-10 text-status-ai" aria-hidden="true" />
                <h2 className="mt-4 font-heading text-2xl font-bold">You are booked.</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We will reply to <span className="font-medium text-foreground">{submitted.work_email}</span> within one
                  business day to confirm your slot.
                </p>
                <dl className="mt-5 space-y-2 rounded-xl border bg-surface p-4 text-sm">
                  {[
                    ["Name", submitted.name],
                    ["Company", submitted.company],
                    ["Phone", submitted.phone],
                    ["Role", submitted.role],
                    ["Monthly volume", submitted.monthly_volume || "Not shared"],
                    ["Challenges", submitted.challenges.length ? submitted.challenges.join(", ") : "Not shared"],
                    ["Preferred language", submitted.language],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center">
                  <CalendarDays className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium text-heading">Calendar embed placeholder</p>
                  <p className="text-xs text-muted-foreground">Pick a time slot here once scheduling is connected.</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-6">
                  <TextLink to="/case-study" testId="success-case-study-link">
                    Read the Mumbai to Delhi case study
                  </TextLink>
                  <TextLink to="/product" testId="success-platform-link">
                    Explore the platform
                  </TextLink>
                </div>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                noValidate
                data-testid="contact-form"
                className="rounded-xl border bg-card p-6 shadow-sm md:p-8"
              >
                <h2 className="font-heading text-xl font-bold">Book your demo</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="cf-name">Full name *</Label>
                    <Input id="cf-name" data-testid="cf-name" className={inputCls} value={form.name}
                      onChange={(e) => set("name", e.target.value)} autoComplete="name" aria-invalid={!!errors.name} />
                    {err(errors, "name")}
                  </div>
                  <div>
                    <Label htmlFor="cf-email">Work email *</Label>
                    <Input id="cf-email" data-testid="cf-email" type="email" className={inputCls} value={form.work_email}
                      onChange={(e) => set("work_email", e.target.value)} autoComplete="email" aria-invalid={!!errors.work_email} />
                    {err(errors, "work_email")}
                  </div>
                  <div>
                    <Label htmlFor="cf-phone">Phone or WhatsApp number *</Label>
                    <Input id="cf-phone" data-testid="cf-phone" type="tel" className={inputCls} value={form.phone}
                      onChange={(e) => set("phone", e.target.value)} autoComplete="tel" aria-invalid={!!errors.phone} />
                    {err(errors, "phone")}
                  </div>
                  <div>
                    <Label htmlFor="cf-company">Company name *</Label>
                    <Input id="cf-company" data-testid="cf-company" className={inputCls} value={form.company}
                      onChange={(e) => set("company", e.target.value)} autoComplete="organization" aria-invalid={!!errors.company} />
                    {err(errors, "company")}
                  </div>
                  <div>
                    <Label>Your role *</Label>
                    <Select value={form.role} onValueChange={(v) => set("role", v)}>
                      <SelectTrigger data-testid="cf-role" className={inputCls} aria-label="Your role">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r} data-testid={`cf-role-${r.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {err(errors, "role")}
                  </div>
                  <div>
                    <Label>Monthly shipment volume</Label>
                    <Select value={form.monthly_volume} onValueChange={(v) => set("monthly_volume", v)}>
                      <SelectTrigger data-testid="cf-volume" className={inputCls} aria-label="Monthly shipment volume">
                        <SelectValue placeholder="Select a range" />
                      </SelectTrigger>
                      <SelectContent>
                        {VOLUME_OPTIONS.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium text-heading">Biggest challenge (pick any)</legend>
                  <div className="mt-2 flex flex-wrap gap-2" data-testid="cf-challenges">
                    {CHALLENGE_OPTIONS.map((c) => {
                      const on = form.challenges.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-pressed={on}
                          data-testid={`cf-challenge-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          onClick={() => toggleChallenge(c)}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                            on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="mt-4">
                  <Label>Preferred language</Label>
                  <Select value={form.language} onValueChange={(v) => set("language", v)}>
                    <SelectTrigger data-testid="cf-language" className={inputCls} aria-label="Preferred language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANG_OPTIONS.map((l) => (
                        <SelectItem key={l} value={l} data-testid={`cf-language-${l.toLowerCase()}`}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4">
                  <Label htmlFor="cf-message">Anything else? (optional)</Label>
                  <Textarea id="cf-message" data-testid="cf-message" rows={3} className="rounded-xl border-input bg-background"
                    value={form.message} onChange={(e) => set("message", e.target.value)} />
                </div>
                <div className="mt-4 flex items-start gap-2.5">
                  <Checkbox id="cf-consent" data-testid="cf-consent" checked={form.consent}
                    onCheckedChange={(v) => set("consent", v === true)} aria-invalid={!!errors.consent} />
                  <Label htmlFor="cf-consent" className="text-xs font-normal leading-relaxed text-muted-foreground">
                    I agree to be contacted about my demo request and understand that demo calls may be recorded for
                    quality, per the call recording policy. *
                  </Label>
                </div>
                {err(errors, "consent")}
                <button
                  type="submit"
                  data-testid="cf-submit"
                  disabled={submitting}
                  className="mt-5 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Booking..." : "Book my demo"}
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">We reply within one business day.</p>
              </form>
            )}
          </div>
        </Container>
      </Section>

      <Section tint>
        <Container>
          <SectionHeading title="What happens next" testId="contact-next-steps" />
          <ol className="grid gap-5 sm:grid-cols-3">
            {[
              { t: "You book", d: "Two minutes. Pick your language and tell us your biggest challenge." },
              { t: "We tailor the demo", d: "We use a sample email or lane you share, so the demo looks like your operation." },
              { t: "30-minute walkthrough", d: "Live walkthrough and a clear next-step plan. No commitment." },
            ].map((s, i) => (
              <li key={s.t} className="rounded-xl border bg-card p-6 shadow-sm">
                <span className="font-heading text-2xl font-bold text-muted-foreground/40">{i + 1}</span>
                <h3 className="mt-2 text-base font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title="What you will see" sub="Four short demos, straight from the platform." testId="contact-see-heading" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: "/product/back-office-automation", label: "Email-to-order in seconds", V: EmailToOrderThumb },
              { to: "/product/voice-ai", label: "A Hindi or Gujarati voice call", V: VoiceThumb },
              { to: "/product/freight-capacity-matching", label: "A truck match that fills spare pallet space", V: MatchThumb },
              { to: "/product/control-tower", label: "A live exception inbox", V: InboxThumb },
            ].map(({ to, label, V }) => (
              <Link key={to} to={to} className="group block" data-testid={`see-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <V />
                <p className="mt-3 text-sm font-semibold text-heading group-hover:underline">{label}</p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section tint>
        <Container>
          <SectionHeading title="Who this is for" testId="contact-personas-heading" />
          <PersonaChips />
        </Container>
      </Section>

      <TrustBlock />

      <Section>
        <Container>
          <PlaceholderChip />
          <div className="mt-4 flex flex-wrap items-center gap-4" data-testid="contact-logo-row">
            {["TransIndia", "Bhiwandi Freight", "Narela Logistics", "Western Carriers"].map((n) => (
              <div key={n} className="flex h-10 items-center rounded-xl border px-4 text-xs font-semibold text-muted-foreground">
                {n}
              </div>
            ))}
          </div>
          <div className="mt-10 max-w-3xl">
            <Testimonial {...TESTIMONIALS[1]} testId="contact-testimonial" />
          </div>
        </Container>
      </Section>

      <FaqAccordion items={CONTACT_FAQS} />

      <Section tint>
        <Container>
          <SectionHeading title="Other ways to reach us" testId="contact-alt-heading" />
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <MessageCircle className="h-5 w-5 text-heading" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold">WhatsApp us</h3>
              <p className="mt-1 text-sm text-muted-foreground">Fastest reply during working hours.</p>
              <a href="https://wa.me/912200000000" target="_blank" rel="noreferrer" data-testid="contact-whatsapp-btn"
                className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                WhatsApp us
              </a>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <Mail className="h-5 w-5 text-heading" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold">Email</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <a href="mailto:hello@haulage.ai" className="underline-offset-4 hover:underline">hello@haulage.ai</a> (Placeholder)
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <Phone className="h-5 w-5 text-heading" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold">Phone</h3>
              <p className="mt-1 text-sm text-muted-foreground">+91 22 0000 0000 (Placeholder)</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Office: 4th Floor, Trade View, Lower Parel, Mumbai 400013 (Placeholder address).
          </p>
        </Container>
      </Section>
    </SiteLayout>
  );
};

export default Contact;
