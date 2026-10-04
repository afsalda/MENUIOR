import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Coffee,
  Heart,
  Instagram,
  Leaf,
  MapPin,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Soup,
  Sprout,
  Sun,
  Utensils,
  Wine,
  CakeSlice,
  X,
  Music2,
  Share2,
  Settings2,
} from "lucide-react";
import {
  defaultSettings,
  restaurant,
  themes,
  type Theme,
} from "./config/restaurant.config";
import type { Language, MenuData, MenuItem, OrderLine } from "./types";
import {
  cachedMenu,
  getMenu,
  localName,
  money,
  readStorage,
  writeStorage,
  currentLinePrice,
} from "./lib/menu";
import { track } from "./lib/analytics";
import { strings } from "./lib/i18n";
import { LeafArt } from "./components/LeafArt";
import { MenuCard } from "./components/MenuCard";
import GuestActions, { ReviewPrompt } from "./components/GuestActions";
const Drawers = lazy(() => import("./components/Drawers"));
const icons = {
  coffee: Coffee,
  glass: Wine,
  salad: Sprout,
  pasta: Utensils,
  soup: Soup,
  leaf: Leaf,
  cake: CakeSlice,
};
const prefix = `menure:${restaurant.id}:`;
export default function App() {
  const [data, setData] = useState<MenuData>(
    () =>
      cachedMenu() ?? { items: [], settings: defaultSettings, updatedAt: 0 },
  );
  const [loading, setLoading] = useState(!data.items.length),
    [source, setSource] = useState(""),
    [loadError, setLoadError] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    const l = readStorage<Language>(prefix + "lang", "en");
    return ["en", "ml", "hi", "ar"].includes(l) ? l : "en";
  });
  const [dark, setDark] = useState(() => readStorage(prefix + "dark", false));
  const [saved, setSaved] = useState<string[]>(() => {
    const s = readStorage<unknown>(prefix + "saved", []);
    return Array.isArray(s) ? s.filter((x) => typeof x === "string") : [];
  });
  const [orderDraft, setOrder] = useState<OrderLine[]>([]);
  const order = orderDraft.map((line) => ({
    ...line,
    price:
      currentLinePrice(
        line,
        data.items.find((item) => item.id === line.itemId),
      ) ?? line.price,
  }));
  const [reviewPrompt, setReviewPrompt] = useState(false);
  const [search, setSearch] = useState(""),
    [veg, setVeg] = useState(false),
    [spicy, setSpicy] = useState(false),
    [savedOnly, setSavedOnly] = useState(false),
    [maxPrice, setMaxPrice] = useState(0),
    [filters, setFilters] = useState(false);
  const [active, setActive] = useState("favourites");
  const [drawer, setDrawer] = useState<
      "item" | "order" | "info" | "book" | null
    >(null),
    [selected, setSelected] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState("");
  const [, setMinute] = useState(0);
  const s = data.settings,
    t = strings(lang);
  const requested = new URLSearchParams(window.location.search).get("theme");
  const theme = themes.includes(requested as Theme)
    ? requested!
    : restaurant.theme;
  const table = (
    new URLSearchParams(window.location.search).get("table") ?? ""
  ).slice(0, 30);
  const count = order.reduce((n, l) => n + l.qty, 0),
    total = order.reduce((n, l) => n + l.qty * l.price, 0);
  const filtering = !!(search || veg || spicy || savedOnly || maxPrice);
  const visible = data.items.filter(
    (i) =>
      i.available &&
      (!search ||
        [localName(i, lang), i.name_en, i[`desc_${lang}`], i.desc_en]
          .join(" ")
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())) &&
      (!veg || ["veg", "vegan", "jain"].includes(i.veg_type)) &&
      (!spicy || i.spice >= 2) &&
      (!savedOnly || saved.includes(i.id)) &&
      (!maxPrice || i.price <= maxPrice),
  );
  const featured = s.featured_ids
    .split("|")
    .map((id) => visible.find((i) => i.id === id.trim()))
    .filter((i): i is MenuItem => !!i);
  const releaseImages = [
    s.release_image_1,
    s.release_image_2,
    s.release_image_3,
    s.release_image_4,
  ];
  const newProducts = s.show_new_release
    ? [...new Set(s.release_item_ids.split("|").map((id) => id.trim()))]
        .slice(0, 4)
        .flatMap((id, index) => {
          const item = visible.find((dish) => dish.id === id);
          return item
            ? [{ item, image: releaseImages[index] || item.image }]
            : [];
        })
    : [];
  const showNewProducts = !filtering && newProducts.length > 0;
  useEffect(() => {
    let cancelled = false;
    let busy = false;
    async function refresh(refreshOnly = false) {
      if (busy || (refreshOnly && document.hidden)) return;
      busy = true;
      try {
        const status = await getMenu((d) => {
          if (!cancelled) {
            setData(d);
            setLoading(false);
            setLoadError(false);
          }
        }, refreshOnly);
        if (!cancelled) setSource(status);
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      } finally {
        busy = false;
      }
    }
    void refresh();
    const update = () => {
      void refresh(true);
    };
    const timer = setInterval(update, 3000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    writeStorage(prefix + "lang", lang);
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = dark ? "dark" : "light";
    writeStorage(prefix + "dark", dark);
  }, [theme, dark]);
  useEffect(() => {
    document.title = `${s.name} · ${t.menu}`;
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
  }, [s.name, t.menu]);
  useEffect(() => {
    const timer = setInterval(() => setMinute((v) => v + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (intersecting[0])
          setActive(intersecting[0].target.id.replace("section-", ""));
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: 0 },
    );
    document
      .querySelectorAll(".menu-section")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, search, veg, spicy, savedOnly, maxPrice, showNewProducts]);
  function toggleSave(id: string) {
    const next = saved.includes(id)
      ? saved.filter((x) => x !== id)
      : [...saved, id];
    setSaved(next);
    writeStorage(prefix + "saved", next);
  }
  function openItem(item: MenuItem) {
    setSelected(item);
    setDrawer("item");
    track("item_view", {
      item_id: item.id,
      item_name: item.name_en,
      item_category: item.category,
    });
  }
  function requestBill() {
    setReviewPrompt(true);
    track("bill_request");
  }
  function changeLanguage(value: Language) {
    setLang(value);
    track("language_change", { language: value });
  }
  function addLine(line: OrderLine) {
    setOrder((old) => {
      const found = old.find((l) => l.key === line.key);
      return found
        ? old.map((l) =>
            l.key === line.key
              ? { ...l, qty: Math.min(99, l.qty + line.qty) }
              : l,
          )
        : [...old, line];
    });
    setDrawer(null);
    setToast(`${line.name} added to your order`);
    track("add_to_order", { item_id: line.itemId, quantity: line.qty });
  }
  function scrollCategory(id: string) {
    document.getElementById(`section-${id}`)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    setActive(id);
  }
  function clear() {
    setSearch("");
    setVeg(false);
    setSpicy(false);
    setSavedOnly(false);
    setMaxPrice(0);
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: s.name, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setToast("Menu link copied");
      }
    } catch {
      setToast("Share this menu using the address in your browser.");
    }
  }
  const categoryName = (c: (typeof restaurant.categories)[number]) =>
    lang === "en" ? c.name : c[lang];
  const mobileCategoryName = (c: (typeof restaurant.categories)[number]) => {
    if (lang !== "en") return categoryName(c);
    if (c.id === "coffee") return "Coffee";
    if (c.id === "mocktails") return "Mocktails";
    if (c.id === "malayalee") return "Malayalee";
    return c.name;
  };
  const card = (item: MenuItem, feat = false, revealImage?: string) => (
    <MenuCard
      key={item.id}
      item={item}
      featured={feat}
      revealImage={revealImage}
      lang={lang}
      currency={s.currency}
      saved={saved.includes(item.id)}
      onSave={() => toggleSave(item.id)}
      onOpen={() => openItem(item)}
      timezone={s.time_zone}
    />
  );
  return (
    <>
      <a className="skip-link" href="#menu-content">
        Skip to menu
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a href="#" className="brand">
            {s.logo_url ? (
              <img src={s.logo_url} alt={s.name} />
            ) : (
              <>
                <span className="brand-icon">
                  <Sprout size={34} strokeWidth={1.3} />
                </span>
                <span className="wordmark">
                  {s.wordmark}
                  <small> GARDEN & CAFE</small>
                </span>
              </>
            )}
          </a>
          <nav className="header-nav" aria-label="Main navigation">
            <a className="nav-current" href="#menu-content">
              {t.menu}
            </a>
            <button onClick={() => setDrawer("info")}>{t.garden}</button>
            <a href={s.maps_link} target="_blank" rel="noreferrer">
              {t.find}
              <ArrowUpRight size={13} />
            </a>
          </nav>
          <div className="header-actions">
            <a className="admin-entry" href="?admin=1">
              <Settings2 size={17} />
              <span>Admin</span>
            </a>
            <label className="language-select">
              <span className="sr-only">{t.language}</span>
              <select
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value as Language);
                  track("language_change", { language: e.target.value });
                }}
              >
                <option value="en">English</option>
                <option value="ml">മലയാളം</option>
                <option value="hi">हिन्दी</option>
                <option value="ar">العربية</option>
              </select>
            </label>
            <button
              className="icon-button mode-button"
              onClick={() => setDark(!dark)}
              aria-label={t.dark}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="header-order" onClick={() => setDrawer("order")}>
              <ShoppingBag size={17} />
              <span>{t.order}</span>
              <b>{count}</b>
            </button>
          </div>
        </div>
      </header>
      <main className="page-shell">
        <section className="hero" aria-label={s.tagline}>
          <div className="rain" aria-hidden="true">
            {Array.from({ length: 22 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${i * 4.7}%`,
                  animationDelay: `${-i * 0.27}s`,
                  animationDuration: `${1.4 + (i % 4) * 0.3}s`,
                }}
              />
            ))}
          </div>
          <LeafArt className="hero-leaf" />
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> {s.address}
            </span>
            <h1 dir="auto">
              {s.hero_title.split("\n").map((line, i) => (
                <span key={line} className={i === 1 ? "italic" : ""}>
                  {line}
                </span>
              ))}
            </h1>
            <p dir="auto">{s.hero_description}</p>
            <div className="hero-foot">
              <span>
                <Sprout size={14} />
                {s.tagline}
              </span>
              <button onClick={() => setDrawer("book")}>
                {t.book}
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="photo-orbit">
              <img
                className="hero-food"
                src={s.hero_food_image}
                alt="Garden menu inspiration"
                width="400"
                height="400"
              />
              <img
                className="hero-drink"
                src={s.hero_image}
                alt="Cafe menu inspiration"
                width="300"
                height="380"
              />
              <div className="hero-seal">
                <Sprout size={22} />
                <span style={{ whiteSpace: "pre-line" }}>{s.hero_seal}</span>
              </div>
            </div>
          </div>
        </section>
        {s.show_sample_banner && (
          <p className="sample-banner">
            <span className="sample-label">A LITTLE HEADS-UP</span>
            <span>{lang === "en" ? s.sample_banner : t.sample}</span>
            <Leaf size={13} />
          </p>
        )}
        <GuestActions
          settings={s}
          lang={lang}
          table={table}
          onLanguage={changeLanguage}
          onBill={requestBill}
        />
        {reviewPrompt && (
          <ReviewPrompt
            settings={s}
            lang={lang}
            onDismiss={() => setReviewPrompt(false)}
          />
        )}
        {s.event_title && s.event_link && (
          <a
            className="event-banner"
            href={s.event_link}
            target="_blank"
            rel="noreferrer"
          >
            <Music2 size={19} />
            <strong>{s.event_title}</strong>
            <span>{s.event_time}</span>
            <ArrowUpRight size={18} />
          </a>
        )}
        {s.todays_special && (
          <div className="special-banner">
            <Leaf size={17} />
            <strong>Today’s special</strong>
            <span>{s.todays_special}</span>
          </div>
        )}
        <div className="menu-layout" id="menu-content">
          <aside className="sidebar">
            <div className="sidebar-sticky">
              <p className="eyebrow sidebar-label">{t.categories}</p>
              <nav className="category-list" aria-label={t.categories}>
                {showNewProducts && (
                  <button
                    className={active === "new" ? "active" : ""}
                    aria-current={active === "new" ? "location" : undefined}
                    onClick={() => scrollCategory("new")}
                  >
                    <Leaf size={18} />
                    <span>{t.newMenu}</span>
                    <small>{newProducts.length}</small>
                  </button>
                )}
                {!filtering && (
                  <button
                    className={active === "favourites" ? "active" : ""}
                    aria-current={
                      active === "favourites" ? "location" : undefined
                    }
                    onClick={() => scrollCategory("favourites")}
                  >
                    <Sprout size={18} />
                    <span>{t.favourites}</span>
                    <ChevronRight size={13} />
                  </button>
                )}
                {restaurant.categories.map((c) => {
                  const Icon = icons[c.icon as keyof typeof icons],
                    n = visible.filter((i) => i.category === c.id).length;
                  return (
                    <button
                      key={c.id}
                      className={active === c.id ? "active" : ""}
                      aria-current={active === c.id ? "location" : undefined}
                      disabled={!n}
                      onClick={() => scrollCategory(c.id)}
                    >
                      <Icon size={18} />
                      <span>{categoryName(c)}</span>
                      <small>{n}</small>
                    </button>
                  );
                })}
              </nav>
              <div className="sidebar-line" />
              <button
                className={`saved-nav ${savedOnly ? "active" : ""}`}
                aria-pressed={savedOnly}
                onClick={() => setSavedOnly(!savedOnly)}
              >
                <Heart size={17} />
                {t.saved}
                <small>{saved.length}</small>
              </button>
              <a
                className="plant-card"
                href={s.plants_shop_link}
                target="_blank"
                rel="noreferrer"
              >
                <LeafArt className="plant-art" />
                <Sprout size={26} strokeWidth={1.2} />
                <h3>{t.plants}</h3>
                <span>
                  {t.buy}
                  <ArrowUpRight size={14} />
                </span>
              </a>
              <p className="sidebar-caption">
                Good food.
                <br />
                Better together.
              </p>
            </div>
          </aside>
          <div className="menu-main">
            <div className="menu-heading">
              <div>
                <span className="eyebrow">{s.menu_eyebrow}</span>
                <h2>{t.explore}</h2>
                <p>{t.exploreSub}</p>
              </div>
              <span className="table-label">
                <Utensils size={14} />
                {table ? `Table ${table}` : "Made to be shared"}
              </span>
            </div>
            <div className="menu-toolbar">
              <div className="search-box">
                <Search size={19} />
                <input
                  type="search"
                  placeholder={t.search}
                  aria-label={t.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="icon-button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
              <button
                className={`filter-button ${filters || spicy || maxPrice ? "selected" : ""}`}
                aria-expanded={filters}
                onClick={() => setFilters(!filters)}
              >
                <SlidersHorizontal size={16} />
                {t.filters}
                {(spicy || maxPrice > 0) && <span className="filter-dot" />}
              </button>
              <button
                className={`veg-filter ${veg ? "selected" : ""}`}
                role="switch"
                aria-checked={veg}
                onClick={() => setVeg(!veg)}
              >
                <span className="switch">
                  <i />
                </span>
                {t.veg}
              </button>
            </div>
            {filters && (
              <div className="filter-panel">
                <button
                  className={`pill ${spicy ? "selected" : ""}`}
                  aria-pressed={spicy}
                  onClick={() => setSpicy(!spicy)}
                >
                  🌶 {t.spicy}
                </button>
                <button
                  className={`pill ${savedOnly ? "selected" : ""}`}
                  aria-pressed={savedOnly}
                  onClick={() => setSavedOnly(!savedOnly)}
                >
                  <Heart size={14} />
                  {t.saved}
                </button>
                <label>
                  {t.price}
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                  >
                    <option value="0">{t.allPrices}</option>
                    <option value="200">₹200</option>
                    <option value="300">₹300</option>
                    <option value="500">₹500</option>
                  </select>
                </label>
                <button className="text-button" onClick={clear}>
                  {t.clear}
                </button>
              </div>
            )}
            <nav className="mobile-categories" aria-label="Jump to category">
              {showNewProducts && (
                <button
                  className={active === "new" ? "active" : ""}
                  onClick={() => scrollCategory("new")}
                >
                  {lang === "en" ? "New" : t.newMenu}
                </button>
              )}
              {!filtering && (
                <button
                  className={active === "favourites" ? "active" : ""}
                  onClick={() => scrollCategory("favourites")}
                >
                  {lang === "en" ? "Favs" : t.favourites}
                </button>
              )}
              {restaurant.categories.map((c) => (
                <button
                  key={c.id}
                  className={active === c.id ? "active" : ""}
                  onClick={() => scrollCategory(c.id)}
                >
                  {mobileCategoryName(c)}
                </button>
              ))}
            </nav>
            {loading ? (
              <div className="skeleton-grid" aria-label={t.loading}>
                {[1, 2, 3].map((i) => (
                  <div className="skeleton-card" key={i} />
                ))}
              </div>
            ) : loadError ? (
              <div className="empty-state">
                <Leaf />
                <h3>The menu couldn’t load.</h3>
                <p>Please reconnect and try again.</p>
                <button onClick={() => location.reload()}>Retry</button>
              </div>
            ) : (
              <>
                {showNewProducts && (
                  <section
                    className="menu-section new-products-section"
                    id="section-new"
                    aria-labelledby="new-products-heading"
                  >
                    <div className="section-heading" id="new-on-menu">
                      <div>
                        <h2 id="new-products-heading">
                          <Leaf size={20} />
                          {t.newMenu}
                          <span className="section-count">
                            {newProducts.length}
                          </span>
                        </h2>
                        <p>{t.newProductsSub}</p>
                      </div>
                    </div>
                    <div className="new-products-grid">
                      {newProducts.map(({ item, image }) =>
                        card(item, true, image),
                      )}
                    </div>
                  </section>
                )}
                {!filtering && featured.length > 0 && (
                  <section
                    className="menu-section featured-section"
                    id="section-favourites"
                  >
                    <div className="section-heading">
                      <div>
                        <h2>
                          <Sprout size={20} />
                          {t.favourites}
                        </h2>
                        <p>{t.favouritesSub}</p>
                      </div>
                      <span className="handwritten">
                        a little love on every plate
                      </span>
                    </div>
                    <div className="featured-grid">
                      {featured.map((i) => card(i, true))}
                    </div>
                  </section>
                )}
                {visible.length === 0 ? (
                  <div className="empty-state">
                    <Search />
                    <h3>{t.empty}</h3>
                    <p>{t.emptySub}</p>
                    <button onClick={clear}>{t.clear}</button>
                  </div>
                ) : (
                  restaurant.categories.map((c) => {
                    const items = visible.filter((i) => i.category === c.id);
                    const Icon = icons[c.icon as keyof typeof icons];
                    return (
                      items.length > 0 && (
                        <section
                          className="menu-section"
                          id={`section-${c.id}`}
                          key={c.id}
                        >
                          <div className="section-heading">
                            <div>
                              <h2>
                                <Icon size={21} />
                                {categoryName(c)}
                                <span className="section-count">
                                  {items.length}
                                </span>
                              </h2>
                              <p dir="auto">{c.description}</p>
                            </div>
                          </div>
                          <div className="dish-grid">
                            {items.map((i) => card(i))}
                          </div>
                        </section>
                      )
                    );
                  })
                )}
              </>
            )}
            <a
              className="plant-card mobile-plant-card"
              href={s.plants_shop_link}
              target="_blank"
              rel="noreferrer"
            >
              <LeafArt className="plant-art" />
              <Sprout size={26} strokeWidth={1.2} />
              <h3>{t.plants}</h3>
              <span>
                {t.buy}
                <ArrowUpRight size={14} />
              </span>
            </a>
            <div className="instagram-card">
              <Instagram size={28} strokeWidth={1.3} />
              <div>
                <h3>{t.tag}</h3>
                <p>
                  {t.tagAction}{" "}
                  <a href={s.instagram} target="_blank" rel="noreferrer">
                    {s.instagram_handle}
                  </a>
                </p>
              </div>
              <a
                className="icon-button"
                href={s.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label={s.instagram_handle}
              >
                <ArrowUpRight size={22} />
              </a>
            </div>
            <p className="menu-note">
              {s.photo_note} {s.gst_note}
            </p>
          </div>
        </div>
        <footer className="site-footer">
          <a href="#" className="footer-brand">
            <Sprout size={24} />
            {s.wordmark}
          </a>
          <span>{s.address}</span>
          <div>
            <button onClick={() => setDrawer("info")}>{t.info}</button>
            <button onClick={share}>
              <Share2 size={14} />
              {t.share}
            </button>
          </div>
          <small>Thoughtfully served with Menure</small>
        </footer>
      </main>
      <nav className="mobile-bottom" aria-label="Quick actions">
        <button
          onClick={() =>
            document.getElementById("menu-content")?.scrollIntoView()
          }
        >
          <Menu size={20} />
          <span>{t.menu}</span>
        </button>
        <button
          aria-pressed={savedOnly}
          onClick={() => {
            setSavedOnly(!savedOnly);
            document.getElementById("menu-content")?.scrollIntoView();
          }}
        >
          <Heart size={20} />
          <span>{t.saved}</span>
        </button>
        <button onClick={() => setDrawer("book")}>
          <Utensils size={20} />
          <span>{t.book}</span>
        </button>
        <button onClick={() => setDrawer("order")}>
          <span className="bag-icon">
            <ShoppingBag size={20} />
            {count > 0 && <b>{count}</b>}
          </span>
          <span>{t.order}</span>
        </button>
      </nav>
      {count > 0 && drawer !== "order" && (
        <button className="floating-order" onClick={() => setDrawer("order")}>
          <span className="order-count">{count}</span>
          <span>{t.view}</span>
          <strong>{money(total, s.currency)}</strong>
          <ChevronRight size={18} />
        </button>
      )}
      {source === "saved" && (
        <span className="offline-note">Showing your saved menu</span>
      )}
      <div className="toast" role="status" aria-live="polite">
        {toast && (
          <>
            <Check size={16} />
            {toast}
          </>
        )}
      </div>
      {drawer && (
        <Suspense
          fallback={
            <div className="drawer-loading" role="status">
              Opening…
            </div>
          }
        >
          <Drawers
            key={drawer === "item" ? selected?.id : drawer}
            kind={drawer}
            item={
              selected &&
              (data.items.find((item) => item.id === selected.id) ?? {
                ...selected,
                available: false,
              })
            }
            items={data.items}
            settings={s}
            lang={lang}
            order={order}
            table={table}
            onClose={() => setDrawer(null)}
            onAdd={addLine}
            onOrder={setOrder}
            onItem={openItem}
            saved={saved}
            onSave={toggleSave}
            onBill={requestBill}
            reviewPrompt={reviewPrompt}
            onDismissReview={() => setReviewPrompt(false)}
          />
        </Suspense>
      )}
    </>
  );
}
