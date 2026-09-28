import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play, RotateCcw, Sprout, X } from "lucide-react";
import "@fontsource/anton/latin-400.css";
import type { Settings } from "../config/restaurant.config";
import type { Language, MenuItem } from "../types";
import { availability, localName, money } from "../lib/menu";
import { strings } from "../lib/i18n";
import "./NewRelease.css";

export default function NewRelease({
  items,
  settings,
  lang,
  onClose,
  onItem,
}: {
  items: MenuItem[];
  settings: Settings;
  lang: Language;
  onClose: () => void;
  onItem: (item: MenuItem) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
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
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
      query.removeEventListener("change", change);
    };
  }, []);
  useEffect(() => {
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
  }, [imageKey]);
  return (
    <dialog
      ref={ref}
      className="release-dialog"
      aria-labelledby="release-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="release-frame">
        <div className="release-toolbar">
          <span>
            <Sprout size={15} /> {t.newMenu}
          </span>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t.close}
          >
            <X size={20} />
          </button>
        </div>
        <div
          key={replay}
          dir="ltr"
          className={`release-poster ${ready ? "ready" : "loading"} ${paused ? "paused" : ""} ${reduced ? "reduced" : ""}`}
        >
          <h2 id="release-title" className="release-title">
            NEW
            <br />
            RELEASE
          </h2>
          <div className="release-brand">
            <Sprout size={35} strokeWidth={1.2} />
            <span>{settings.wordmark}</span>
          </div>
          <div className="release-track release-track-top" aria-hidden="true" />
          <div
            className="release-track release-track-bottom"
            aria-hidden="true"
          />
          {products.map(({ item, image, position }) => (
            <div key={item.id}>
              <img
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
              <button
                className={`release-label release-label-${position}`}
                onClick={() => onItem(item)}
                aria-label={`${t.details}: ${localName(item, lang)}`}
                dir={lang === "ar" ? "rtl" : "ltr"}
              >
                <strong>
                  {money(
                    item.variants[0]?.price ?? item.price,
                    settings.currency,
                  )}
                </strong>
                <span>{localName(item, lang)}</span>
                <small>
                  {availability(item, new Date(), settings.time_zone).ok ? (
                    <>
                      {t.details} <ArrowUpRight size={10} />
                    </>
                  ) : (
                    t.soldOut
                  )}
                </small>
              </button>
            </div>
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
    </dialog>
  );
}
