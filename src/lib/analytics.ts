declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
export function track(event: string, properties: Record<string, unknown> = {}) {
  const id = import.meta.env.VITE_GA4_ID;
  if (!/^G-[A-Z0-9]+$/.test(id ?? "")) return;
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (..._args: unknown[]) {
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.append(script);
  }
  window.gtag("event", event, properties);
}
