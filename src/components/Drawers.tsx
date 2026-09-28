import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  Clock3,
  Heart,
  Instagram,
  Leaf,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ReceiptText,
  ShoppingBag,
  Trash2,
  Users,
  Wifi,
  X,
} from "lucide-react";
import type { Language, MenuItem, OrderLine } from "../types";
import type { Settings } from "../config/restaurant.config";
import {
  availability,
  currentLinePrice,
  localDescription,
  localName,
  money,
  orderMessage,
  whatsappLink,
} from "../lib/menu";
import { strings } from "../lib/i18n";
import { track } from "../lib/analytics";
import { DietMark } from "./MenuCard";
import { ReviewPrompt } from "./GuestActions";
export interface DrawerProps {
  kind: "item" | "order" | "info" | "book";
  item: MenuItem | null;
  items: MenuItem[];
  settings: Settings;
  lang: Language;
  order: OrderLine[];
  table: string;
  onClose: () => void;
  onAdd: (line: OrderLine) => void;
  onOrder: (lines: OrderLine[]) => void;
  onItem: (item: MenuItem) => void;
  saved: string[];
  onSave: (id: string) => void;
  onBill: () => void;
  reviewPrompt: boolean;
  onDismissReview: () => void;
}
export default function Drawers(props: DrawerProps) {
  const {
    kind,
    item,
    items,
    settings: s,
    lang,
    order,
    table,
    onClose,
    onAdd,
    onOrder,
    onItem,
    saved,
    onSave,
    onBill,
    reviewPrompt,
    onDismissReview,
  } = props;
  const ref = useRef<HTMLDialogElement>(null),
    t = strings(lang);
  const [variant, setVariant] = useState(
    item?.variants[0]?.name ?? (item?.half_price !== undefined ? "Full" : ""),
  );
  const [addons, setAddons] = useState<string[]>([]),
    [qty, setQty] = useState(1),
    [notes, setNotes] = useState(""),
    [tableNumber, setTableNumber] = useState(table),
    [copied, setCopied] = useState(false);
  const [, setMinute] = useState(0);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    const timer = setInterval(() => setMinute((v) => v + 1), 60000);
    return () => {
      clearInterval(timer);
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const unitPrice = item
    ? (item.variants.find((v) => v.name === variant)?.price ??
        (variant === "Half" ? item.half_price : item.price) ??
        item.price) +
      item.addons
        .filter((a) => addons.includes(a.name))
        .reduce((n, a) => n + a.price, 0)
    : 0;
  const status = item
    ? availability(item, new Date(), s.time_zone)
    : { ok: true, label: "" };
  if (
    item &&
    currentLinePrice(
      {
        key: "",
        itemId: item.id,
        name: item.name_en,
        variant,
        addons,
        qty,
        price: unitPrice,
      },
      item,
    ) === null
  ) {
    status.ok = false;
    status.label = "Options changed. Choose again.";
  }
  const title =
    kind === "item" && item
      ? localName(item, lang)
      : kind === "order"
        ? t.order
        : kind === "book"
          ? t.book
          : t.info;
  const subtotal = order.reduce((n, l) => n + l.qty * l.price, 0);
  const blocked = order.some((l) => {
    const i = items.find((i) => i.id === l.itemId);
    return (
      !i ||
      !availability(i, new Date(), s.time_zone).ok ||
      currentLinePrice(l, i) === null
    );
  });
  const assistance = (message: string) =>
    whatsappLink(
      s.whatsapp,
      `Hello ${s.name}, ${tableNumber ? `table ${tableNumber}: ` : ""}${message}`,
    );
  function adjust(key: string, change: number) {
    onOrder(
      order
        .map((l) =>
          l.key === key ? { ...l, qty: Math.min(99, l.qty + change) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  }
  function add() {
    if (!item || !status.ok) return;
    onAdd({
      key: JSON.stringify([item.id, variant, [...addons].sort()]),
      itemId: item.id,
      name: item.name_en,
      variant,
      addons: [...addons],
      price: unitPrice,
      qty,
    });
  }
  return (
    <dialog
      className={`drawer ${kind === "item" ? "item-drawer" : ""}`}
      ref={ref}
      aria-labelledby="drawer-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            onClose();
        }
      }}
    >
      <div className="drawer-top">
        <span className="eyebrow">
          {kind === "item" ? "A LITTLE SOMETHING DELICIOUS" : s.wordmark}
        </span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t.close}
          autoFocus
        >
          <X size={20} />
        </button>
      </div>
      {kind === "item" && item ? (
        <>
          {item.image && (
            <div className="detail-photo">
              <img
                src={item.image}
                alt={item.name_en}
                width="700"
                height="420"
              />
              <button
                className={`save-button ${saved.includes(item.id) ? "is-saved" : ""}`}
                aria-label="Save this dish"
                aria-pressed={saved.includes(item.id)}
                onClick={() => onSave(item.id)}
              >
                <Heart
                  size={19}
                  fill={saved.includes(item.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
          )}
          <div className="drawer-body">
            <div className="detail-meta">
              <DietMark type={item.veg_type} />
              <span>
                {item.veg_type === "nonveg"
                  ? "Non-vegetarian"
                  : item.veg_type === "egg"
                    ? "Contains egg"
                    : item.veg_type === "vegan"
                      ? "Vegan"
                      : item.veg_type === "jain"
                        ? "Jain"
                        : "Vegetarian"}
              </span>
              <span>
                <Users size={14} />
                {item.serves}
              </span>
            </div>
            <h2 id="drawer-title">{title}</h2>
            <p className="detail-description">{localDescription(item, lang)}</p>
            <strong className="detail-price">
              {money(item.price, s.currency)}
            </strong>
            {item.tags.includes("sharing") && (
              <p className="sharing-tag">
                <Users size={15} />
                Sharing platter · {item.serves}
              </p>
            )}
            {(item.variants.length > 0 || item.half_price !== undefined) && (
              <fieldset className="option-group">
                <legend>
                  Choose your {item.variants.length ? "option" : "portion"}
                </legend>
                {(item.variants.length
                  ? item.variants
                  : [
                      { name: "Full", price: item.price },
                      { name: "Half", price: item.half_price! },
                    ]
                ).map((v) => (
                  <label key={v.name}>
                    <input
                      type="radio"
                      name="variant"
                      checked={variant === v.name}
                      onChange={() => setVariant(v.name)}
                    />
                    <span>{v.name}</span>
                    <strong>{money(v.price, s.currency)}</strong>
                  </label>
                ))}
              </fieldset>
            )}
            {item.addons.length > 0 && (
              <fieldset className="option-group">
                <legend>
                  Make it yours <small>Optional</small>
                </legend>
                {item.addons.map((a) => (
                  <label key={a.name}>
                    <input
                      type="checkbox"
                      checked={addons.includes(a.name)}
                      onChange={() =>
                        setAddons((old) =>
                          old.includes(a.name)
                            ? old.filter((x) => x !== a.name)
                            : [...old, a.name],
                        )
                      }
                    />
                    <span>{a.name}</span>
                    <strong>+ {money(a.price, s.currency)}</strong>
                  </label>
                ))}
              </fieldset>
            )}
            <div className="allergen-note">
              <Leaf size={16} />
              <div>
                {item.allergens.length > 0 && (
                  <p>
                    <strong>Contains:</strong> {item.allergens.join(", ")}
                  </p>
                )}
                {item.calories !== undefined && (
                  <p>{item.calories} kcal per serving</p>
                )}
                <p>
                  Please tell our team about any allergies. Add-ons may change
                  dietary suitability.
                </p>
              </div>
            </div>
            {item.recommended_with.length > 0 && (
              <section className="upsell">
                <h3>Goes well with</h3>
                <div>
                  {item.recommended_with
                    .map((id) => items.find((i) => i.id === id))
                    .filter(
                      (i): i is MenuItem =>
                        !!i && availability(i, new Date(), s.time_zone).ok,
                    )
                    .map((i) => (
                      <button key={i.id} onClick={() => onItem(i)}>
                        {i.image && (
                          <img src={i.image} alt="" width="52" height="52" />
                        )}
                        <span>
                          {localName(i, lang)}
                          <small>{money(i.price, s.currency)}</small>
                        </span>
                        <Plus size={16} />
                      </button>
                    ))}
                </div>
              </section>
            )}
          </div>
          <div className="drawer-bottom">
            <div className="quantity">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty === 1}
              >
                <Minus size={16} />
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQty(Math.min(99, qty + 1))}
                disabled={qty === 99}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="primary-button"
              onClick={add}
              disabled={!status.ok}
            >
              {status.ok
                ? `${t.add} · ${money(unitPrice * qty, s.currency)}`
                : status.label}
              <ShoppingBag size={17} />
            </button>
          </div>
        </>
      ) : kind === "order" ? (
        <>
          <div className="drawer-body order-body">
            <h2 id="drawer-title">
              {title}
              <span className="order-title-icon">
                <ShoppingBag size={25} />
              </span>
            </h2>
            <p className="drawer-subtitle">A good meal starts right here.</p>
            {order.length === 0 ? (
              <div className="empty-order">
                <ShoppingBag size={42} strokeWidth={1} />
                <h3>{t.emptyOrder}</h3>
                <p>{t.emptyOrderSub}</p>
                <button className="primary-button" onClick={onClose}>
                  {t.continue}
                </button>
              </div>
            ) : (
              <>
                <div className="order-lines">
                  {order.map((l) => {
                    const i = items.find((i) => i.id === l.itemId);
                    const open = i
                      ? availability(i, new Date(), s.time_zone).ok &&
                        currentLinePrice(l, i) !== null
                      : false;
                    return (
                      <div className="order-line" key={l.key}>
                        {i?.image && (
                          <img src={i.image} alt="" width="66" height="76" />
                        )}
                        <div className="order-line-content">
                          <h3>{i ? localName(i, lang) : l.name}</h3>
                          {l.variant && <p>{l.variant}</p>}
                          {l.addons.length > 0 && <p>{l.addons.join(", ")}</p>}
                          {!open && (
                            <p className="unavailable-text">
                              Item or selected options unavailable. Remove to
                              continue.
                            </p>
                          )}
                          <div className="order-line-bottom">
                            <strong>
                              {money(l.price * l.qty, s.currency)}
                            </strong>
                            <div className="quantity">
                              <button
                                aria-label={`Decrease ${l.name}`}
                                onClick={() => adjust(l.key, -1)}
                              >
                                {l.qty === 1 ? (
                                  <Trash2 size={13} />
                                ) : (
                                  <Minus size={14} />
                                )}
                              </button>
                              <span>{l.qty}</span>
                              <button
                                aria-label={`Increase ${l.name}`}
                                onClick={() => adjust(l.key, 1)}
                                disabled={l.qty === 99}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <label className="form-field">
                  {t.table}
                  <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    maxLength={30}
                    placeholder="e.g. 5"
                  />
                </label>
                <label className="form-field">
                  {t.notes}
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Allergies, preferences, or a special request…"
                  />
                </label>
                <div className="order-total">
                  <span>{t.total}</span>
                  <strong>{money(subtotal, s.currency)}</strong>
                </div>
                <p className="order-disclaimer">
                  {s.show_sample_banner && "Sample prices. "}
                  {s.gst_note} Your order is confirmed only when the cafe
                  replies.
                </p>
              </>
            )}
            <div className="assistance-links">
              <a
                href={assistance("Could a waiter please come over?")}
                target="_blank"
                rel="noreferrer"
              >
                <Bell size={16} />
                {t.waiter}
              </a>
              <a
                href={assistance("Could we have our bill, please?")}
                onClick={onBill}
                target="_blank"
                rel="noreferrer"
              >
                <ReceiptText size={16} />
                {t.bill}
              </a>
            </div>
            {reviewPrompt && (
              <ReviewPrompt
                settings={s}
                lang={lang}
                onDismiss={onDismissReview}
              />
            )}
          </div>
          {order.length > 0 && (
            <div className="drawer-bottom">
              {blocked ? (
                <button className="primary-button" disabled>
                  Remove unavailable items to continue
                </button>
              ) : (
                <a
                  className="primary-button"
                  target="_blank"
                  rel="noreferrer"
                  href={whatsappLink(
                    s.whatsapp,
                    orderMessage(order, s.name, tableNumber, notes, s.currency),
                  )}
                  onClick={() =>
                    track("whatsapp_order", {
                      item_count: order.reduce((n, l) => n + l.qty, 0),
                      value: subtotal,
                      currency: s.currency,
                    })
                  }
                >
                  <MessageCircle size={18} />
                  {t.send}
                  <ArrowUpRight size={17} />
                </a>
              )}
            </div>
          )}
        </>
      ) : kind === "book" ? (
        <div className="drawer-body book-body">
          <div className="book-leaf">
            <Leaf size={35} strokeWidth={1} />
          </div>
          <h2 id="drawer-title">{title}</h2>
          <p>
            A table among the greens.
            <br />
            Good food. Your favourite people.
          </p>
          <a
            className="primary-button"
            href={whatsappLink(
              s.whatsapp,
              `Hello ${s.name}, I’d like to book a table. Please help me with available dates and times.`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} />
            Book on WhatsApp
            <ArrowUpRight size={17} />
          </a>
          <a
            className="secondary-button"
            href={`tel:${s.phone.replace(/[^+\d]/g, "")}`}
          >
            <Phone size={17} />
            {s.phone}
          </a>
          <p className="order-disclaimer">
            Send your preferred date, time and group size. The cafe will confirm
            availability directly.
          </p>
        </div>
      ) : (
        <div className="drawer-body info-body">
          <h2 id="drawer-title">{s.name}</h2>
          <p className="drawer-subtitle">{s.tagline}</p>
          <p>
            Come for the food. Stay for the garden, the gentle artificial rain,
            and the moments together. Continental, Asian and traditional
            Malayalee flavours, with live music and DJ nights.
          </p>
          <a
            className="info-row"
            href={s.maps_link}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin />
            <span>
              <strong>Visit the garden</strong>
              {s.address}
            </span>
            <ArrowUpRight size={17} />
          </a>
          {s.opening_hours && (
            <div className="info-row">
              <Clock3 />
              <span>
                <strong>Opening hours</strong>
                {s.opening_hours}
              </span>
            </div>
          )}
          <a
            className="info-row"
            href={`tel:${s.phone.replace(/[^+\d]/g, "")}`}
          >
            <Phone />
            <span>
              <strong>Call the cafe</strong>
              {s.phone}
            </span>
          </a>
          {s.wifi_name && (
            <div className="info-row">
              <Wifi />
              <span>
                <strong>{s.wifi_name}</strong>
                {s.wifi_password
                  ? `Password: ${s.wifi_password}`
                  : "Ask our team for the password"}
              </span>
              {s.wifi_password && (
                <button
                  className="icon-button"
                  aria-label="Copy Wi-Fi password"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(s.wifi_password)
                      .then(() => setCopied(true))
                      .catch(() => setCopied(false));
                  }}
                >
                  {copied ? <Check size={18} /> : <span>Copy</span>}
                </button>
              )}
            </div>
          )}
          <a
            className="info-row"
            href={s.instagram}
            target="_blank"
            rel="noreferrer"
          >
            <Instagram />
            <span>
              <strong>{t.tagAction}</strong>
              {s.instagram_handle}
            </span>
            <ArrowUpRight size={17} />
          </a>
          <a
            className="info-row"
            href={s.plants_shop_link}
            target="_blank"
            rel="noreferrer"
          >
            <Leaf />
            <span>
              <strong>Buy plants</strong>Bring a little green home.
            </span>
            <ArrowUpRight size={17} />
          </a>
          {s.facebook_link ? (
            <a
              className="info-row"
              href={s.facebook_link}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <strong>Facebook</strong>
                {s.facebook_name}
              </span>
              <ArrowUpRight size={17} />
            </a>
          ) : (
            <p className="facebook-name">
              Find us on Facebook: {s.facebook_name}
            </p>
          )}
          {s.event_title && s.event_link && (
            <a
              className="event-banner"
              href={s.event_link}
              target="_blank"
              rel="noreferrer"
            >
              <strong>{s.event_title}</strong>
              <span>{s.event_time}</span>
              <ArrowUpRight size={17} />
            </a>
          )}
          {s.google_review_link && (
            <a
              className="primary-button"
              href={s.google_review_link}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("review_click")}
            >
              Leave us a Google review
              <ArrowUpRight size={17} />
            </a>
          )}
          <div className="assistance-links">
            <a
              href={assistance("Could a waiter please come over?")}
              target="_blank"
              rel="noreferrer"
            >
              <Bell size={16} />
              {t.waiter}
            </a>
            <a
              href={assistance("Could we have our bill, please?")}
              onClick={onBill}
              target="_blank"
              rel="noreferrer"
            >
              <ReceiptText size={16} />
              {t.bill}
            </a>
          </div>
          {reviewPrompt && (
            <ReviewPrompt
              settings={s}
              lang={lang}
              onDismiss={onDismissReview}
            />
          )}
        </div>
      )}
    </dialog>
  );
}
