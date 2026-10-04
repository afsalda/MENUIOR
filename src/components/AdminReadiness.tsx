import { ArrowUpRight, ImagePlus, Languages, MessageCircle, Star, Utensils } from "lucide-react";
import type { LiveMenu } from "../lib/admin";
import type { MenuItem } from "../types";

const translated = (item: MenuItem) =>
  ["ml", "hi", "ar"].every((lang) =>
    Boolean(item[`name_${lang}` as keyof MenuItem]) &&
    (!item.desc_en || Boolean(item[`desc_${lang}` as keyof MenuItem])),
  );

export function matchesFeatureFilter(item: MenuItem, filter: string) {
  switch (filter) {
    case "sold": return item.sold_out;
    case "hidden": return !item.available;
    case "bestseller": return item.tags.includes("bestseller");
    case "photo": return !item.image;
    case "translations": return !translated(item);
    case "upsells": return item.recommended_with.length > 0;
    default: return true;
  }
}

export function AdminReadiness({ menu, onFilter, onSettings }: {
  menu: LiveMenu;
  onFilter: (filter: string) => void;
  onSettings: () => void;
}) {
  const count = (filter: string) => menu.items.filter((item) => matchesFeatureFilter(item, filter)).length;
  const complete = menu.items.length - count("translations");
  const cards = [
    { icon: Languages, label: "Four-language menu", value: `${complete}/${menu.items.length} dishes`, hint: "English · മലയാളം · हिन्दी · العربية", action: "Review missing translations", run: () => onFilter("translations") },
    { icon: ImagePlus, label: "Dish photos", value: `${menu.items.length - count("photo")}/${menu.items.length} dishes`, hint: "Upload approved photos in the dish editor.", action: "Find dishes needing photos", run: () => onFilter("photo") },
    { icon: Star, label: "Bestsellers", value: `${count("bestseller")} tagged`, hint: "Choose the dishes you want to spotlight.", action: "Manage bestsellers", run: () => onFilter("bestseller") },
    { icon: Utensils, label: "Upsell suggestions", value: `${count("upsells")} dishes`, hint: "Pair a dish with a drink, side or dessert.", action: "Manage paired dishes", run: () => onFilter("upsells") },
    { icon: MessageCircle, label: "WhatsApp & waiter", value: menu.settings.whatsapp ? "Number configured" : "Needs a number", hint: "Guests review and send their own requests.", action: "Edit WhatsApp number", run: onSettings },
    { icon: Star, label: "After-meal reviews", value: menu.settings.google_review_link ? "Prompt enabled" : "Needs a review link", hint: "Appears after a guest requests the bill.", action: "Manage Google review link", run: onSettings },
  ];
  return (
    <section className="admin-readiness" aria-labelledby="readiness-title">
      <div className="admin-readiness-heading">
        <h2 id="readiness-title">Guest experience</h2>
        <p>Saved menu · revision {menu.revision}{menu.updatedAt ? ` · ${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(menu.updatedAt)} IST` : ""}</p>
      </div>
      <div className="admin-feature-grid">
        {cards.map(({ icon: Icon, label, value, hint, action, run }) => (
          <button key={label} className="admin-feature glass-panel" onClick={run} aria-label={action}>
            <span className="admin-feature-label"><Icon size={18} aria-hidden="true" />{label}<ArrowUpRight size={15} aria-hidden="true" /></span>
            <strong>{value}</strong>
            <span>{hint}</span>
          </button>
        ))}
      </div>
      <p className="admin-help">Translation coverage checks saved text. Review copy with fluent speakers before launch. Blank translations use English.</p>
    </section>
  );
}
