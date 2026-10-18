import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Copy, RefreshCw, Star } from "lucide-react";
import { restaurant } from "../config/restaurant.config";
import "./ReviewPage.css";

const topics = [
  {
    title: "Taste of Food",
    icon: "✿",
    drafts: [
      "The taste of the food was the highlight of my visit. I really enjoyed my meal here.",
      "I especially enjoyed the food on my visit. The flavours made the meal memorable.",
    ],
  },
  {
    title: "Service",
    icon: "✧",
    drafts: [
      "I appreciated the service during my visit. It helped make the meal an enjoyable experience.",
      "The service stood out to me. I felt well looked after during my visit.",
    ],
  },
  {
    title: "Ambience",
    icon: "❋",
    drafts: [
      "I really enjoyed the ambience here. It was a lovely setting to sit down and enjoy a meal.",
      "The atmosphere was my favourite part of the visit. I enjoyed spending time here.",
    ],
  },
  {
    title: "Value for Money",
    icon: "◈",
    drafts: [
      "I felt my meal offered good value for money. I enjoyed the overall experience.",
      "The value for money stood out to me. I was happy with what I ordered.",
    ],
  },
  {
    title: "Staff",
    icon: "♡",
    drafts: [
      "I appreciated the staff during my visit. Their approach made me feel welcome.",
      "The staff helped make my visit enjoyable. I appreciated the way they looked after me.",
    ],
  },
  {
    title: "Family-Friendly Environment",
    icon: "❀",
    drafts: [
      "I enjoyed the family-friendly environment here. It was a comfortable place to spend time together over a meal.",
      "The welcoming environment made this an enjoyable place for a family visit.",
    ],
  },
  {
    title: "Cleanliness",
    icon: "✦",
    drafts: [
      "I appreciated the cleanliness during my visit. It helped make the dining experience comfortable.",
      "The clean surroundings stood out to me and added to my enjoyment of the visit.",
    ],
  },
];

export default function ReviewPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [round, setRound] = useState(0);
  const [status, setStatus] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const initial = useRef(true);
  const directLink = restaurant.google_review_link.trim();
  const destination = directLink || restaurant.maps_link;
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    heading.current?.focus();
  }, [selected]);
  async function copyAndGo() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    setStatus("");
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(draft.trim());
      setStatus("Copied. Opening Google…");
      window.location.assign(destination);
    } catch {
      setBusy(false);
      setCopyFailed(true);
      setStatus(
        "Your browser couldn’t copy the text. Select and copy your review below, then open Google.",
      );
      textarea.current?.focus();
      textarea.current?.select();
    }
  }
  return (
    <main className="review-page">
      <div className="review-panel">
        <header className="review-header">
          <a href="/" aria-label="Menuoir home">
            menuoir.
          </a>
          <a href="/">
            <ArrowLeft size={16} /> Back
          </a>
        </header>
        <section className="review-card">
          <span className="review-mark" aria-hidden="true">
            <Star size={25} strokeWidth={1.5} />
          </span>
          <p className="review-kicker">WRITE A GOOGLE REVIEW</p>
          <h1 ref={heading} tabIndex={-1}>
            {selected === null
              ? "What did you enjoy the most here?"
              : "Make it your own."}
          </h1>
          <p className="review-intro">
            {selected === null
              ? "Choose a highlight and we’ll suggest a few words to get you started."
              : "This is a suggested draft. Edit it so it reflects your own experience."}
          </p>
          {selected === null ? (
            <div className="review-topics">
              {topics.map((topic, i) => (
                <button
                  key={topic.title}
                  onClick={() => {
                    setSelected(i);
                    setDraft(topic.drafts[round % topic.drafts.length]);
                    setStatus("");
                    setCopyFailed(false);
                  }}
                >
                  <span aria-hidden="true">{topic.icon}</span>
                  {topic.title}
                  <ArrowUpRight size={17} />
                </button>
              ))}
            </div>
          ) : (
            <>
              <span className="review-topic-label">
                {topics[selected].title}
              </span>
              <label htmlFor="review-draft">Your review</label>
              <textarea
                id="review-draft"
                ref={textarea}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setStatus("");
                }}
                rows={7}
                maxLength={4000}
              />
              <p className="review-help">
                Paste your copied message into Google, choose your rating, and
                submit. Google may ask you to sign in.
              </p>
              {!directLink && (
                <p className="review-help">
                  The direct review link hasn’t been added yet. For now, Google
                  opens the restaurant listing; choose “Write a review” there.
                </p>
              )}
              <button
                className="review-primary"
                disabled={!draft.trim() || busy}
                onClick={copyAndGo}
              >
                <Copy size={17} />
                {busy ? "Opening Google…" : "Copy and Go to Google"}
                <ArrowUpRight size={17} />
              </button>
              <button
                className="review-secondary"
                disabled={busy}
                onClick={() => {
                  setSelected(null);
                  setRound(round + 1);
                  setStatus("");
                  setCopyFailed(false);
                }}
              >
                <RefreshCw size={16} /> Try a Different Option
              </button>
              <p role="status" className="review-status">
                {status}
              </p>
              {copyFailed && (
                <a className="review-fallback" href={destination}>
                  I’ve copied my review — open Google <ArrowUpRight size={15} />
                </a>
              )}
            </>
          )}
        </section>
        <p className="review-footer">
          Your honest feedback is welcome. Reviews are optional and don’t affect
          game rewards.
        </p>
      </div>
    </main>
  );
}
