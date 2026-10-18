import { Heart, Plus, Leaf, Users, Flame, Coffee } from "lucide-react";
import type { Language, MenuItem } from "../types";
import { availability, localDescription, localName, money } from "../lib/menu";
import { strings } from "../lib/i18n";
import { ProductReveal } from "./ProductReveal";
export function DietMark({ type }: { type: MenuItem["veg_type"] }) {
  const label = {
    veg: "Vegetarian",
    nonveg: "Non-vegetarian",
    egg: "Contains egg",
    vegan: "Vegan",
    jain: "Jain",
  }[type];
  return (
    <span
      className={`diet-mark ${type}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <i />
    </span>
  );
}
export function MenuCard({
  item,
  lang,
  currency,
  saved,
  onSave,
  onOpen,
  featured = false,
  revealImage,
  timezone,
}: {
  item: MenuItem;
  lang: Language;
  currency: string;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  featured?: boolean;
  revealImage?: string;
  timezone: string;
}) {
  const t = strings(lang),
    status = availability(item, new Date(), timezone);
  const label = revealImage !== undefined ? t.newMenu : item.tags.includes("bestseller")
    ? t.bestseller
    : item.tags.includes("chef")
      ? t.chefPick
      : item.tags.includes("new")
        ? t.newMenu
        : item.tags.includes("sharing")
          ? t.sharing
          : item.tags.includes("combo")
            ? t.combo
            : "";
  return (
    <article
      className={`menu-card ${featured ? "featured-card" : ""} ${revealImage !== undefined ? `new-product-card new-product-${item.id}` : ""} ${!status.ok ? "unavailable" : ""} ${!item.image ? "text-card" : ""}`}
    >
      <div className="card-photo">
        <button
          className="photo-open"
          onClick={onOpen}
          aria-label={`${t.details}: ${localName(item, lang)}`}
          tabIndex={-1}
        >
          {revealImage !== undefined ? (
            <ProductReveal key={revealImage} src={revealImage} fallback={item.image} name={localName(item, lang)} />
          ) : item.image ? (
            <img
              src={item.image}
              alt={item.name_en}
              width="600"
              height="420"
              loading="lazy"
              decoding="async"
              onLoad={(e) => e.currentTarget.classList.add("loaded")}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="no-photo">
              {item.category === "coffee" ? <Coffee /> : <Leaf />}
              <span>{item.name_en}</span>
            </div>
          )}
        </button>
        {label && (
          <span
            className={`dish-badge ${revealImage !== undefined || item.tags.includes("new") ? "floral" : ""}`}
          >
            {item.tags.includes("chef") && revealImage === undefined && <Leaf size={11} />} {label}
          </span>
        )}
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          onClick={onSave}
          aria-label={`${saved ? "Remove from" : "Save to"} favourites: ${localName(item, lang)}`}
          aria-pressed={saved}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
        {!status.ok && (
          <span className="unavailable-label">{item.sold_out ? t.soldOut : status.label}</span>
        )}
      </div>
      <div className="card-content">
        <div className="dish-meta">
          <DietMark type={item.veg_type} />
          <span>
            {item.veg_type === "vegan"
              ? "Plant-based"
              : item.veg_type === "jain"
                ? "Jain"
                : item.veg_type === "egg"
                  ? "Contains egg"
                  : item.veg_type === "nonveg"
                    ? "Non-veg"
                    : "Vegetarian"}
          </span>
          {item.spice > 0 && (
            <span
              className="spice"
              role="img"
              aria-label={`Spice level ${item.spice} of 3`}
            >
              {Array.from({ length: item.spice }, (_, i) => (
                <Flame size={12} key={i} />
              ))}
            </span>
          )}
        </div>
        <h3>
          <button onClick={onOpen}>{localName(item, lang)}</button>
        </h3>
        <p dir="auto">{localDescription(item, lang)}</p>
        <div className="card-bottom">
          <div>
            <strong>
              {money(item.variants[0]?.price ?? item.price, currency)}
            </strong>
            {item.serves && (
              <span className="serves">
                <Users size={12} />
                {item.serves}
              </span>
            )}
          </div>
          <button
            className="add-button"
            onClick={onOpen}
            disabled={!status.ok}
            aria-label={`${t.add} ${localName(item, lang)}`}
          >
            {t.add}
            <Plus size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
