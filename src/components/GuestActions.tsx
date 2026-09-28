import { Bell, Languages, ReceiptText, Star, X } from "lucide-react";
import type { Language } from "../types";
import type { Settings } from "../config/restaurant.config";
import { strings } from "../lib/i18n";
import { whatsappLink } from "../lib/menu";
import { track } from "../lib/analytics";
export function ReviewPrompt({
  settings,
  lang,
  onDismiss,
}: {
  settings: Settings;
  lang: Language;
  onDismiss: () => void;
}) {
  const t = strings(lang);
  if (!settings.google_review_link) return null;
  return (
    <section className="review-prompt" aria-label={t.afterMeal}>
      <Star size={23} />
      <div>
        <h3>{t.afterMeal}</h3>
        <p>{t.reviewSub}</p>
      </div>
      <a
        href={settings.google_review_link}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("google_review_click")}
      >
        {t.review}
      </a>
      <button
        className="icon-button"
        onClick={onDismiss}
        aria-label={t.dismiss}
      >
        <X size={17} />
      </button>
    </section>
  );
}
export default function GuestActions({
  settings: s,
  lang,
  table,
  onLanguage,
  onBill,
}: {
  settings: Settings;
  lang: Language;
  table: string;
  onLanguage: (lang: Language) => void;
  onBill: () => void;
}) {
  const t = strings(lang);
  const assistance = (message: string) =>
    whatsappLink(
      s.whatsapp,
      `Hello ${s.name}, ${table ? `table ${table}: ` : ""}${message}`,
    );
  return (
    <div className="guest-actions">
      <div className="language-options" role="group" aria-label={t.language}>
        <Languages size={18} aria-hidden="true" />
        {(
          [
            ["en", "English"],
            ["ml", "മലയാളം"],
            ["hi", "हिन्दी"],
            ["ar", "العربية"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            lang={value}
            aria-pressed={lang === value}
            onClick={() => onLanguage(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="guest-assistance">
        <a
          href={assistance("Could a waiter please come over?")}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("waiter_request")}
        >
          <Bell size={16} />
          {t.waiter}
          <small>WhatsApp</small>
        </a>
        <a
          href={assistance("Could we have our bill, please?")}
          target="_blank"
          rel="noreferrer"
          onClick={onBill}
        >
          <ReceiptText size={16} />
          {t.bill}
        </a>
      </div>
    </div>
  );
}
