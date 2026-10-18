import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/lora/latin-400.css";
import "@fontsource/lora/latin-500.css";
import "@fontsource/lora/latin-400-italic.css";
import "./styles.css";
import "./glass.css";
const Admin = React.lazy(() => import("./components/Admin"));
const App = React.lazy(() => import("./App"));
const Landing = React.lazy(() => import("./components/Landing"));
const GamesPage = React.lazy(() => import("./components/GamesPage"));
const ReviewPage = React.lazy(() => import("./components/ReviewPage"));
const params = new URLSearchParams(location.search);
const requestedAdmin =
  location.pathname === "/admin" || params.get("admin") === "1";
const requestedMenu =
  location.pathname === "/menu" ||
  params.get("menu") === "1" ||
  params.has("table");
const requestedGames = params.get("games") === "1";
const requestedReview = params.get("review") === "1";
if (requestedAdmin) document.title = "Owner studio · Menuoir";
else if (requestedMenu) document.title = "Menu · Menuoir";
else if (requestedGames) document.title = "Games · Menuoir";
else if (requestedReview) document.title = "Review · Menuoir";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <React.Suspense
      fallback={
        <p className="app-loading" role="status">
          Opening Menuoir…
        </p>
      }
    >
      {requestedAdmin ? (
        <Admin />
      ) : requestedMenu ? (
        <App />
      ) : requestedGames ? (
        <GamesPage />
      ) : requestedReview ? (
        <ReviewPage />
      ) : (
        <Landing />
      )}
    </React.Suspense>
  </React.StrictMode>,
);
if ("serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
