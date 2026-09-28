import { useEffect, useRef, useState } from "react";
import { Sprout } from "lucide-react";
import "./ProductReveal.css";

/** A brief entrance for an ordinary menu card, with no player or timeline. */
export function ProductReveal({ src, fallback, name }: { src: string; fallback: string; name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [entered, setEntered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);
  const [image, setImage] = useState(src);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <span ref={ref} className={`product-reveal ${entered && (loaded || failed) ? "is-revealed" : ""}`} aria-hidden="true">
      <span className="product-reveal-mask">
        <span className="product-reveal-leaf" />
        {failed || !image ? (
          <span className="no-photo"><Sprout /><span>{name}</span></span>
        ) : (
          <img
            className={image !== src ? "product-reveal-fallback" : ""}
            src={image}
            alt=""
            width="600"
            height="420"
            loading={entered ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (image !== fallback && fallback) setImage(fallback);
              else setFailed(true);
            }}
          />
        )}
      </span>
      <svg className="product-reveal-line" viewBox="0 0 100 30" fill="none"><path d="M2 26H55L80 5H94" pathLength="1" /><circle cx="96" cy="5" r="2" /></svg>
    </span>
  );
}
