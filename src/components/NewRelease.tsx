import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play, RotateCcw, Sprout } from "lucide-react";
import "@fontsource/anton/latin-400.css";
import type { Settings } from "../config/restaurant.config";
import type { Language, MenuItem } from "../types";
import { availability, localDescription, localName, money } from "../lib/menu";
import { strings } from "../lib/i18n";
import { track } from "../lib/analytics";
import "./NewRelease.css";

export default function NewRelease({
  items,
  settings,
  lang,
  onItem,
}: {
  items: MenuItem[];
  settings: Settings;
  lang: Language;
  onItem: (item: MenuItem) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  const [ended, setEnded] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const t = strings(lang);
  const products = settings.release_item_ids
    .split("|")
    .slice(0, 4)
    .map((id, index) => ({
      item: items.find((item) => item.id === id.trim() && item.available),
      image: [
        settings.release_image_1,
        settings.release_image_2,
        settings.release_image_3,
        settings.release_image_4,
      ][index],
      position: index + 1,
    }))
    .filter(
      (p): p is { item: MenuItem; image: string; position: number } => !!p.item,
    );
  const imageKey = products.map((p) => p.image || p.item.image).join("|");
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    let tracked = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        setInView(visible);
        if (visible) {
          setEntered(true);
          if (!tracked) {
            track("new_release_view");
            tracked = true;
          }
        }
      },
      { threshold: 0.25 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", change);
    };
  }, []);
  useEffect(() => {
    if (!entered) return;
    let cancelled = false;
    const assets = imageKey
      .split("|")
      .filter(Boolean)
      .map((src) => {
        const image = new Image();
        image.src = src;
        return image.decode();
      });
    Promise.allSettled([...assets, document.fonts.load("16px Anton")]).then(
      () => {
        if (!cancelled) setReady(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [imageKey, entered]);
  return (
    <section
      ref={ref}
      id="new-on-menu"
      className="release-section"
      aria-labelledby="release-heading"
    >
      <div className="release-frame">
        <header className="release-section-heading">
          <h2 id="release-heading">
            <Sprout size={19} />
            {t.newMenu}
          </h2>
          <p>{t.releaseSub}</p>
        </header>
        <div
          key={replay}
          dir="ltr"
          className={`release-poster ${ready ? "ready" : "loading"} ${paused || !inView ? "paused" : ""} ${reduced ? "reduced" : ""}`}
        >
          <p className="release-title" aria-hidden="true">
            NEW
            <br />
            RELEASE
          </p>
          <div className="release-brand">
            <Sprout size={35} strokeWidth={1.2} />
            <span>{settings.wordmark}</span>
          </div>
          {(["top", "bottom"] as const).map((side) => (
            <div
              className={`release-mask release-mask-${side}`}
              key={side}
              aria-hidden="true"
            >
              <div className={`release-track release-track-${side}`} />
              {products
                .filter(({ position }) =>
                  side === "top"
                    ? [1, 4].includes(position)
                    : [2, 3].includes(position),
                )
                .map(({ item, image, position }) => (
                  <img
                    key={item.id}
                    className={`release-product release-product-${position}`}
                    src={image || item.image}
                    alt=""
                    onError={(e) => {
                      if (e.currentTarget.dataset.fallback) {
                        e.currentTarget.style.visibility = "hidden";
                        return;
                      }
                      e.currentTarget.dataset.fallback = "true";
                      e.currentTarget.src = item.image;
                      e.currentTarget.classList.add("release-photo-fallback");
                    }}
                  />
                ))}
            </div>
          ))}
          {products.map(({ item, position }) => (
            <button
              key={item.id}
              className={`release-label release-label-${position}`}
              onClick={() => onItem(item)}
              aria-label={`${t.details}: ${localName(item, lang)}`}
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <svg
                className="release-callout"
                viewBox="0 0 70 14"
                fill="none"
                aria-hidden="true"
              >
                <path d="M1 12H43L57 3H65" pathLength="1" />
                <circle cx="67" cy="3" r="2" />
              </svg>
              <strong>
                {money(
                  item.variants[0]?.price ?? item.price,
                  settings.currency,
                )}
              </strong>
              <span className="release-dish-name">
                {localName(item, lang)} <ArrowUpRight size={10} />
              </span>
              <span className="release-description">
                {localDescription(item, lang)}
              </span>
              <small>
                {availability(item, new Date(), settings.time_zone).ok ? (
                  <>
                    <span className="sr-only">{t.details}</span>
                  </>
                ) : (
                  t.soldOut
                )}
              </small>
            </button>
          ))}
          <div className="release-signoff">
            <strong>{settings.name}</strong>
            <span>{settings.address}</span>
          </div>
          {!ready && (
            <span className="release-preparing" role="status">
              {t.loading}
            </span>
          )}
          <div
            className="release-timer"
            aria-hidden="true"
            onAnimationEnd={() => setEnded(true)}
          />
        </div>
        <div className="release-controls">
          {!reduced && (
            <button
              onClick={() => {
                if (ended) {
                  setReplay((r) => r + 1);
                  setEnded(false);
                  setPaused(false);
                } else setPaused(!paused);
              }}
            >
              {ended ? (
                <RotateCcw size={15} />
              ) : paused ? (
                <Play size={15} />
              ) : (
                <Pause size={15} />
              )}
              {ended ? t.replay : paused ? t.play : t.pause}
            </button>
          )}
          {!reduced && !ended && (
            <button
              onClick={() => {
                setReplay((r) => r + 1);
                setPaused(false);
              }}
            >
              <RotateCcw size={15} />
              {t.replay}
            </button>
          )}
          <span>
            {settings.show_sample_banner ? t.sample : settings.photo_note}
          </span>
        </div>
      </div>
    </section>
  );
}
