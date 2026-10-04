import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChefHat,
  ExternalLink,
  ImagePlus,
  Languages,
  Leaf,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { restaurant, type Settings } from "../config/restaurant.config";
import { adminRequest, uploadPhoto, type LiveMenu } from "../lib/admin";
import { money, safeUrl } from "../lib/menu";
import type { Language, MenuItem, Option } from "../types";
import { AdminReadiness, matchesFeatureFilter } from "./AdminReadiness";
import "./Admin.css";

const languageNames = {
  en: "English",
  ml: "മലയാളം",
  hi: "हिन्दी",
  ar: "العربية",
};
const blankItem = (): MenuItem => ({
  id: "",
  category: "coffee",
  name_en: "",
  name_ml: "",
  name_hi: "",
  name_ar: "",
  desc_en: "",
  desc_ml: "",
  desc_hi: "",
  desc_ar: "",
  price: 0,
  variants: [],
  addons: [],
  image: "",
  veg_type: "veg",
  spice: 0,
  tags: ["new"],
  allergens: [],
  available: true,
  sold_out: false,
  available_from: "",
  available_to: "",
  recommended_with: [],
  serves: "Serves 1",
});
type Analytics = {
  dishes: { itemId: string; views: number; lastViewed: number }[];
  daily: { day: string; views: number }[];
  since: number;
};
export default function Admin() {
  const [session, setSession] = useState<{
    owner: boolean;
    signedIn: boolean;
  } | null>(null);
  const [menu, setMenu] = useState<LiveMenu | null>(null);
  const [tab, setTab] = useState<"menu" | "settings" | "analytics">("menu");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<MenuItem | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  async function load() {
    setError("");
    try {
      const current = await adminRequest<{ owner: boolean; signedIn: boolean }>(
        "/api/session",
      );
      setSession(current);
      if (current.owner)
        setMenu(await adminRequest<LiveMenu>("/api/admin/menu"));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
    document.documentElement.dataset.theme = "garden";
    document.documentElement.dataset.mode = "light";
    document.title = "Owner studio · Fress Trees";
    void load();
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (tab !== "analytics" || !session?.owner) return;
    let stopped = false;
    adminRequest<Analytics>("/api/admin/analytics")
      .then((data) => {
        if (!stopped) setAnalytics(data);
      })
      .catch((e) => {
        if (!stopped) setError(e.message);
      });
    return () => {
      stopped = true;
    };
  }, [tab, session?.owner]);
  async function saveItem(item: MenuItem) {
    if (!menu) return;
    setBusy(true);
    setError("");
    try {
      const data = await adminRequest<LiveMenu>(
        item.id
          ? `/api/admin/items/${encodeURIComponent(item.id)}`
          : "/api/admin/items",
        item.id ? "PATCH" : "POST",
        { revision: menu.revision, item },
      );
      setMenu(data);
      setNotice("Saved. Open menus update within 3 seconds.");
      setEdit(null);
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const filtered =
    menu?.items.filter(
      (i) =>
        (category === "all" || i.category === category) &&
        matchesFeatureFilter(i, filter) &&
        i.name_en.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a href="/" className="admin-brand">
          <Leaf size={25} />
          <span>
            fress trees<small>OWNER STUDIO</small>
          </span>
        </a>
        <a className="admin-preview" href="/" target="_blank" rel="noreferrer">
          View menu <ExternalLink size={16} />
        </a>
      </header>
      {!session?.owner ? (
        <main className="admin-access glass-panel">
          <ShieldCheck size={38} />
          <h1>Your garden, your menu.</h1>
          <p>
            Manage dishes, prices and availability with the cafe owner’s
            account.
          </p>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          {session ? (
            <>
              <a
                className="admin-primary"
                href="/signin-with-chatgpt?return_to=%2F%3Fadmin%3D1"
                target="_top"
              >
                Sign in with ChatGPT
              </a>
              {session.signedIn && (
                <p>This account does not have owner access.</p>
              )}
            </>
          ) : error ? (
            <button className="admin-primary" onClick={() => void load()}>
              Try again
            </button>
          ) : (
            <p role="status">Checking owner access…</p>
          )}
          <a href="/" className="admin-back">
            <ArrowLeft size={16} />
            Back to the menu
          </a>
        </main>
      ) : (
        <main className="admin-workspace">
          <div className="admin-intro">
            <div>
              <span className="admin-eyebrow">A LITTLE CARE, EVERY DAY</span>
              <h1>Your menu, in your hands.</h1>
              <p>
                Update a price. Bring a dish back. Make someone’s next
                favourite.
              </p>
            </div>
            <span className="owner-badge">
              <ShieldCheck size={16} />
              Owner access
            </span>
          </div>
          <nav className="admin-tabs" aria-label="Admin sections">
            {(
              [
                ["menu", ChefHat, "Menu items"],
                ["settings", Settings2, "Settings"],
                ["analytics", BarChart3, "Dish views"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                aria-current={tab === id ? "page" : undefined}
                className={tab === id ? "active" : ""}
                onClick={() => {
                  setTab(id);
                  setError("");
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
          {error && (
            <div className="admin-error" role="alert">
              <p>{error}</p>
              <button onClick={() => void load()}>Reload latest menu</button>
            </div>
          )}
          {notice && (
            <div className="admin-notice" role="status">
              <Check size={18} />
              {notice}
            </div>
          )}
          {!menu ? (
            <p role="status">Loading your menu…</p>
          ) : tab === "menu" ? (
            <>
              <div className="admin-stats">
                <div>
                  <strong>{menu.items.length}</strong>
                  <span>Dishes</span>
                </div>
                <div>
                  <strong>
                    {
                      menu.items.filter((i) => i.available && !i.sold_out)
                        .length
                    }
                  </strong>
                  <span>In stock</span>
                </div>
                <div>
                  <strong>{menu.items.filter((i) => i.sold_out).length}</strong>
                  <span>Sold out</span>
                </div>
                <div>
                  <strong>3 sec</strong>
                  <span>Guest refresh</span>
                </div>
              </div>
              <AdminReadiness
                menu={menu}
                onFilter={(value) => {
                  setFilter(value);
                  setCategory("all");
                  setSearch("");
                }}
                onSettings={() => setTab("settings")}
              />
              <div className="admin-menu-tools">
                <label className="admin-search">
                  <Search size={18} />
                  <input
                    type="search"
                    aria-label="Search dishes"
                    placeholder="Find a dish…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {restaurant.categories.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Availability filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All dishes</option>
                  <option value="sold">Sold out</option>
                  <option value="hidden">Hidden</option>
                  <option value="bestseller">Bestsellers</option>
                  <option value="photo">Needs a photo</option>
                  <option value="translations">Needs translations</option>
                  <option value="upsells">Has upsell suggestions</option>
                </select>
                <button
                  className="admin-primary"
                  onClick={() => setEdit(blankItem())}
                >
                  <Plus size={17} />
                  Add dish
                </button>
              </div>
              <div className="admin-item-list">
                {filtered.map((item) => (
                  <QuickDish
                    key={`${item.id}-${menu.revision}`}
                    item={item}
                    busy={busy}
                    onEdit={() => setEdit(structuredClone(item))}
                    onSave={saveItem}
                  />
                ))}
              </div>
              {!filtered.length && (
                <div className="admin-empty">No dishes match your search.</div>
              )}
            </>
          ) : tab === "settings" ? (
            <SettingsEditor
              key={menu.revision}
              settings={menu.settings}
              items={menu.items}
              busy={busy}
              onSave={async (settings) => {
                setBusy(true);
                setError("");
                try {
                  const result = await adminRequest<LiveMenu>(
                    "/api/admin/settings",
                    "PATCH",
                    { revision: menu.revision, settings },
                  );
                  setMenu(result);
                  setNotice("Settings saved. Your guest menu is updating.");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : (
            <section className="admin-analytics glass-panel">
              <div className="admin-section-title">
                <div>
                  <h2>What catches their eye?</h2>
                  <p>
                    Dish detail opens in the last 30 days. Owner previews are
                    excluded.
                  </p>
                </div>
                <button
                  className="admin-secondary"
                  onClick={async () => {
                    try {
                      setAnalytics(
                        await adminRequest<Analytics>("/api/admin/analytics"),
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Refresh views
                </button>
              </div>
              {!analytics ? (
                <p role="status">Loading dish views…</p>
              ) : (
                <>
                  <div className="analytics-total">
                    <strong>
                      {analytics.dishes.reduce((sum, d) => sum + d.views, 0)}
                    </strong>
                    <span>Guest dish views</span>
                  </div>
                  {!analytics.dishes.length && (
                    <p className="admin-empty">
                      No guest dish views yet. Counts will appear when guests
                      open a dish.
                    </p>
                  )}
                  <div className="analytics-list">
                    {[...menu.items]
                      .sort(
                        (a, b) =>
                          (analytics.dishes.find((d) => d.itemId === b.id)
                            ?.views || 0) -
                          (analytics.dishes.find((d) => d.itemId === a.id)
                            ?.views || 0),
                      )
                      .map((item) => {
                        const views =
                          analytics.dishes.find((d) => d.itemId === item.id)
                            ?.views || 0;
                        const max = Math.max(
                          1,
                          ...analytics.dishes.map((d) => d.views),
                        );
                        return (
                          <div className="analytics-row" key={item.id}>
                            <span>{item.name_en}</span>
                            <strong>{views}</strong>
                            <div className="analytics-bar">
                              <i style={{ width: `${(views / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <p className="admin-help">
                    Counts are opens, not unique people or orders. No guest
                    names, phone numbers, order notes or tracking cookies are
                    stored for these reports.
                  </p>
                </>
              )}
            </section>
          )}
          {edit && menu && (
            <DishEditor
              item={edit}
              items={menu.items}
              busy={busy}
              onClose={() => setEdit(null)}
              onSave={saveItem}
            />
          )}
        </main>
      )}
    </div>
  );
}

function QuickDish({
  item,
  busy,
  onEdit,
  onSave,
}: {
  item: MenuItem;
  busy: boolean;
  onEdit: () => void;
  onSave: (item: MenuItem) => Promise<void>;
}) {
  const [price, setPrice] = useState(
    String(item.variants[0]?.price ?? item.price),
  );
  const changed = price !== String(item.variants[0]?.price ?? item.price);
  return (
    <article
      className={`admin-dish glass-panel ${!item.available ? "is-hidden" : ""}`}
    >
      <div className="admin-dish-photo">
        {item.image ? (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        ) : (
          <Leaf />
        )}
      </div>
      <div className="admin-dish-name">
        <h2>{item.name_en}</h2>
        <span>
          {restaurant.categories.find((c) => c.id === item.category)?.name}
        </span>
        <div className="admin-tags">
          {!item.available && <b>Hidden</b>}
          {item.tags.includes("bestseller") && <b>Bestseller</b>}
          {item.tags.includes("new") && <b>New</b>}
        </div>
      </div>
      <form
        className="admin-price"
        onSubmit={(e) => {
          e.preventDefault();
          const next = { ...item, price: Number(price) };
          if (item.variants.length) {
            next.price = item.price;
            next.variants = item.variants.map((v, n) =>
              n ? v : { ...v, price: Number(price) },
            );
          }
          void onSave(next).catch(() => {});
        }}
      >
        <label htmlFor={`price-${item.id}`}>
          {item.variants[0] ? `${item.variants[0].name} · ₹` : "Price · ₹"}
        </label>
        <div>
          <input
            id={`price-${item.id}`}
            type="number"
            min="0"
            max="100000"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !changed}
            aria-label={`Save price for ${item.name_en}`}
          >
            Save
          </button>
        </div>
      </form>
      <button
        className={`stock-toggle ${item.sold_out ? "sold" : ""}`}
        role="switch"
        aria-checked={item.sold_out}
        aria-label={`Sold out: ${item.name_en}`}
        disabled={busy}
        onClick={() =>
          void onSave({ ...item, sold_out: !item.sold_out }).catch(() => {})
        }
      >
        <span className="stock-track">
          <i />
        </span>
        {item.sold_out ? "Sold out" : "In stock"}
      </button>
      <button className="admin-edit" onClick={onEdit}>
        Edit dish
      </button>
    </article>
  );
}

function DishEditor({
  item,
  items,
  busy,
  onClose,
  onSave,
}: {
  item: MenuItem;
  items: MenuItem[];
  busy: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => Promise<void>;
}) {
  const [draft, setDraft] = useState(item);
  const [lang, setLang] = useState<Language>("en");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dialog] = useState(() => ({
    current: null as HTMLDialogElement | null,
  }));
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [dialog]);
  function field<K extends keyof MenuItem>(key: K, value: MenuItem[K]) {
    setDraft((old) => ({ ...old, [key]: value }));
  }
  function optionList(key: "variants" | "addons", title: string) {
    return (
      <fieldset className="admin-option-list">
        <legend>{title}</legend>
        {draft[key].map((option, index) => (
          <div key={index}>
            <input
              aria-label={`${title} ${index + 1} name`}
              placeholder="Name"
              required
              value={option.name}
              onChange={(e) =>
                field(
                  key,
                  draft[key].map((v, i) =>
                    i === index ? { ...v, name: e.target.value } : v,
                  ),
                )
              }
            />
            <input
              aria-label={`${title} ${index + 1} price`}
              type="number"
              min="0"
              max="100000"
              step="0.01"
              required
              value={option.price}
              onChange={(e) =>
                field(
                  key,
                  draft[key].map((v, i) =>
                    i === index ? { ...v, price: Number(e.target.value) } : v,
                  ),
                )
              }
            />
            <button
              type="button"
              aria-label={`Remove ${title} ${index + 1}`}
              onClick={() =>
                field(
                  key,
                  draft[key].filter((_, i) => i !== index),
                )
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          className="admin-text-button"
          type="button"
          onClick={() => field(key, [...draft[key], { name: "", price: 0 }])}
        >
          <Plus size={15} />
          Add {title.toLowerCase()}
        </button>
      </fieldset>
    );
  }
  return (
    <dialog
      ref={(node) => {
        dialog.current = node;
      }}
      className="admin-dialog"
      aria-labelledby="edit-dish-title"
      onCancel={(e) => {
        if (busy || uploading) e.preventDefault();
        else onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await onSave(draft);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <div className="admin-dialog-heading">
          <div>
            <span className="admin-eyebrow">MENU ITEM</span>
            <h2 id="edit-dish-title">
              {item.id ? "Edit dish" : "Add a new dish"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close dish editor"
            disabled={busy || uploading}
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="admin-dialog-body">
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <div className="admin-photo-editor">
            <div>
              {safeUrl(draft.image, true) ? (
                <img src={draft.image} alt="Dish preview" />
              ) : (
                <ImagePlus size={36} />
              )}
            </div>
            <div>
              <label>
                Photo URL
                <input
                  type="text"
                  value={draft.image}
                  onChange={(e) => field("image", e.target.value)}
                  placeholder="https://… or upload below"
                />
              </label>
              <label className="admin-upload">
                <ImagePlus size={17} />
                {uploading ? "Uploading…" : "Upload photo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading || busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    setError("");
                    try {
                      field("image", await uploadPhoto(file));
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
              <small>JPG, PNG or WebP · up to 5 MB</small>
            </div>
          </div>
          <div className="admin-language-tabs" aria-label="Edit language">
            {(Object.keys(languageNames) as Language[]).map((code) => (
              <button
                type="button"
                key={code}
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
              >
                <Languages size={14} />
                {languageNames[code]}
              </button>
            ))}
          </div>
          <label>
            Dish name · {languageNames[lang]}
            <input
              required={lang === "en"}
              maxLength={160}
              dir={lang === "ar" ? "rtl" : "auto"}
              value={draft[`name_${lang}`]}
              onChange={(e) => field(`name_${lang}`, e.target.value)}
            />
          </label>
          <label>
            Description · {languageNames[lang]}
            <textarea
              rows={3}
              maxLength={2000}
              dir={lang === "ar" ? "rtl" : "auto"}
              value={draft[`desc_${lang}`]}
              onChange={(e) => field(`desc_${lang}`, e.target.value)}
            />
          </label>
          <p className="admin-help">
            Empty translations use English. Add your own translated names and
            descriptions.
          </p>
          <div className="admin-field-grid">
            <label>
              Category
              <select
                value={draft.category}
                onChange={(e) => field("category", e.target.value)}
              >
                {restaurant.categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Base price · ₹
              <input
                type="number"
                min="0"
                max="100000"
                step="0.01"
                required
                value={draft.price}
                onChange={(e) => field("price", Number(e.target.value))}
              />
            </label>
            <label>
              Serves
              <input
                value={draft.serves}
                onChange={(e) => field("serves", e.target.value)}
                placeholder="Serves 2–3"
              />
            </label>
            <label>
              Diet
              <select
                value={draft.veg_type}
                onChange={(e) =>
                  field("veg_type", e.target.value as MenuItem["veg_type"])
                }
              >
                {[
                  ["veg", "Vegetarian"],
                  ["vegan", "Vegan"],
                  ["nonveg", "Non-vegetarian"],
                  ["egg", "Contains egg"],
                  ["jain", "Jain"],
                ].map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Half-portion price · ₹
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.half_price ?? ""}
                onChange={(e) =>
                  field(
                    "half_price",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </label>
            <label>
              Spice level
              <select
                value={draft.spice}
                onChange={(e) => field("spice", Number(e.target.value))}
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {["Mild", "Light", "Medium", "Hot"][n]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="admin-checks">
            <legend>Availability & tags</legend>
            {(
              [
                ["available", "Visible on the menu"],
                ["sold_out", "Sold out"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(e) => field(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
            {[
              ["bestseller", "Bestseller"],
              ["new", "New"],
              ["chef", "Chef’s pick"],
              ["sharing", "Sharing platter"],
            ].map(([tag, label]) => (
              <label key={tag}>
                <input
                  type="checkbox"
                  checked={draft.tags.includes(tag)}
                  onChange={(e) =>
                    field(
                      "tags",
                      e.target.checked
                        ? [...draft.tags, tag]
                        : draft.tags.filter((t) => t !== tag),
                    )
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
          <div className="admin-field-grid">
            <label>
              Available from
              <input
                type="time"
                value={draft.available_from}
                onChange={(e) => field("available_from", e.target.value)}
              />
            </label>
            <label>
              Available until
              <input
                type="time"
                value={draft.available_to}
                onChange={(e) => field("available_to", e.target.value)}
              />
            </label>
          </div>
          <label>
            Allergens (comma separated)
            <input
              value={draft.allergens.join(", ")}
              onChange={(e) =>
                field(
                  "allergens",
                  e.target.value.split(",").map((v) => v.trim()),
                )
              }
            />
          </label>
          {optionList("variants", "Sizes")}
          {optionList("addons", "Extras")}
          <fieldset className="admin-pairings">
            <legend>Goes well with · up to 8 suggestions</legend>
            <div>
              {items
                .filter((i) => i.id !== draft.id && i.available)
                .map((i) => (
                  <label key={i.id}>
                    <input
                      type="checkbox"
                      checked={draft.recommended_with.includes(i.id)}
                      disabled={
                        !draft.recommended_with.includes(i.id) &&
                        draft.recommended_with.length >= 8
                      }
                      onChange={(e) =>
                        field(
                          "recommended_with",
                          e.target.checked
                            ? [...draft.recommended_with, i.id]
                            : draft.recommended_with.filter(
                                (id) => id !== i.id,
                              ),
                        )
                      }
                    />
                    {i.name_en}
                  </label>
                ))}
            </div>
          </fieldset>
        </div>
        <footer className="admin-dialog-footer">
          <button
            type="button"
            className="admin-secondary"
            disabled={busy || uploading}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-primary"
            disabled={busy || uploading}
          >
            {busy ? "Saving…" : "Save dish"}
            <Check size={17} />
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function SettingsEditor({
  settings,
  items,
  busy,
  onSave,
}: {
  settings: Settings;
  items: MenuItem[];
  busy: boolean;
  onSave: (s: Settings) => Promise<void>;
}) {
  const [draft, setDraft] = useState(settings);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const input = (key: keyof Settings, label: string, placeholder = "") => (
    <label key={key}>
      {label}
      <input
        value={String(draft[key])}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
    </label>
  );
  return (
    <form
      className="admin-settings"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(draft);
      }}
    >
      <section className="glass-panel admin-settings-card">
        <h2>After the meal</h2>
        <p>
          Guests see a neutral Google review invitation after choosing “Request
          bill”.
        </p>
        {input(
          "google_review_link",
          "Google review link",
          "Paste the cafe’s Google review URL",
        )}
        {draft.google_review_link ? (
          <a
            className="admin-text-button"
            href={safeUrl(draft.google_review_link)}
            target="_blank"
            rel="noreferrer"
          >
            Preview review destination <ExternalLink size={15} />
          </a>
        ) : (
          <span className="setting-status">
            Add a review link to enable the prompt.
          </span>
        )}
      </section>
      <section className="glass-panel admin-settings-card">
        <h2>Booking & social</h2>
        <div className="admin-field-grid">
          {input("phone", "Booking phone")}
          {input("whatsapp", "WhatsApp number", "Country code + number")}
          {input("maps_link", "Location link")}
          {input("instagram", "Instagram URL")}
          {input("instagram_handle", "Instagram handle")}
          {input("plants_shop_link", "Plants shop link")}
        </div>
      </section>
      <section className="glass-panel admin-settings-card">
        <h2>Live events</h2>
        <p>The event banner appears when a title and booking link are set.</p>
        <div className="admin-field-grid">
          {input("event_title", "Event title", "Live music in the garden")}
          {input("event_time", "Date and time")}
        </div>
        {input("event_link", "Event booking / DJ form link")}
      </section>
      <section className="glass-panel admin-settings-card">
        <h2>New products & highlights</h2>
        <label className="admin-check-label">
          <input
            type="checkbox"
            checked={draft.show_new_release}
            onChange={(e) => set("show_new_release", e.target.checked)}
          />
          Show new products
        </label>
        <p>
          Choose up to four products. Transparent PNG or WebP photos suit the
          floating cards.
        </p>
        {[0, 1, 2, 3].map((index) => (
          <div className="admin-field-grid" key={index}>
            <label>
              Product {index + 1}
              <select
                value={draft.release_item_ids.split("|")[index] || ""}
                onChange={(e) => {
                  const selected = [0, 1, 2, 3].map(
                    (n) => draft.release_item_ids.split("|")[n] || "",
                  );
                  selected[index] = e.target.value;
                  set("release_item_ids", selected.join("|"));
                }}
              >
                <option value="">None</option>
                {items
                  .filter((i) => i.available)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name_en}
                    </option>
                  ))}
              </select>
            </label>
            {input(
              `release_image_${index + 1}` as keyof Settings,
              `Product ${index + 1} cutout URL`,
              "Leave blank to use the dish photo",
            )}
          </div>
        ))}
      </section>
      <section className="glass-panel admin-settings-card">
        <h2>Cafe details & sample notice</h2>
        <div className="admin-field-grid">
          {input("name", "Cafe name")}
          {input("opening_hours", "Opening hours")}
          {input("logo_url", "Logo URL")}
          {input("address", "Address")}
        </div>
        <label className="admin-check-label">
          <input
            type="checkbox"
            checked={draft.show_sample_banner}
            onChange={(e) => set("show_sample_banner", e.target.checked)}
          />
          Show “Sample menu – prices not final”
        </label>
        {input("photo_note", "Photo note")}
      </section>
      <div className="admin-settings-save">
        <span>Changes apply to the shared guest menu.</span>
        <button className="admin-primary" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
          <Check size={18} />
        </button>
      </div>
    </form>
  );
}
