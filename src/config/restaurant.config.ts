export const themes = [
  "garden",
  "noir-cafe",
  "spice-kitchen",
  "grand-hotel",
] as const;
export type Theme = (typeof themes)[number];
export const restaurant = {
  id: "fress-trees",
  theme: "garden" as Theme,
  name: "Menuoir",
  wordmark: "menuoir",
  tagline: "Kochi’s prettiest garden cafe",
  hero_title: "Good food.\nA little closer to nature.",
  hero_description:
    "Coffee, conversations & a little garden magic. Find your favourite, settle in and stay a while.",
  logo_url: "",
  hero_image: "brand/demo/iced-coffee.webp",
  hero_food_image: "brand/demo/garden-salad.webp",
  hero_seal: "A LITTLE GREEN.\nA LOT OF FLAVOUR.",
  menu_eyebrow: "THE MENUOIR MENU",
  featured_ids: "alfredo|watermelon|greek-salad",
  show_new_release: true,
  release_item_ids: "alfredo|greek-salad|iced-latte|watermelon",
  release_image_1: "brand/release/pasta.webp",
  release_image_2: "brand/release/salad.webp",
  release_image_3: "brand/release/latte.webp",
  release_image_4: "brand/release/mocktail.webp",
  phone: "+91 77360 03337",
  whatsapp: "917736003337",
  address: "Edapally, Kochi, Kerala",
  maps_link: "https://maps.app.goo.gl/J87vJZjUy9Nd2A6z6",
  instagram: "https://www.instagram.com/fresstrees/",
  instagram_reward_posts: ["", "", ""],
  instagram_handle: "@fresstrees",
  facebook_name: "",
  facebook_link: "",
  plants_shop_link: "https://www.instagram.com/ecogreenearth/",
  google_review_link: "",
  wifi_name: "",
  wifi_password: "",
  opening_hours: "",
  currency: "INR",
  gst_note: "Please confirm final prices and applicable taxes with our team.",
  show_sample_banner: true,
  sample_banner: "Sample menu – prices not final",
  photo_note:
    "Photos are illustrative. Your plate may look a little different.",
  todays_special: "",
  event_title: "",
  event_time: "",
  event_link: "",
  time_zone: "Asia/Kolkata",
  qr: { base_url: "http://localhost:4173/", tables: 12 },
  categories: [
    {
      id: "coffee",
      name: "Coffee & Beverages",
      ml: "കോഫിയും പാനീയങ്ങളും",
      hi: "कॉफ़ी और पेय",
      ar: "القهوة والمشروبات",
      description: "A good day starts with a great cup.",
      icon: "coffee",
    },
    {
      id: "mocktails",
      name: "Mocktails & Shakes",
      ml: "മോക്ക്ടെയിലും ഷേക്കും",
      hi: "मॉकटेल और शेक",
      ar: "الموكتيلات والميلك شيك",
      description: "A little colour. A lot of refreshment.",
      icon: "glass",
    },
    {
      id: "starters",
      name: "Starters",
      ml: "സ്റ്റാർട്ടറുകൾ",
      hi: "स्टार्टर",
      ar: "المقبلات",
      description: "Little plates to get the conversation going.",
      icon: "salad",
    },
    {
      id: "continental",
      name: "Continental",
      ml: "കോണ്ടിനെന്റൽ",
      hi: "कॉन्टिनेंटल",
      ar: "الأطباق القارية",
      description: "Comfort food, with a garden state of mind.",
      icon: "pasta",
    },
    {
      id: "asian",
      name: "Asian",
      ml: "ഏഷ്യൻ",
      hi: "एशियाई",
      ar: "الأطباق الآسيوية",
      description: "Big flavours from a little further afield.",
      icon: "soup",
    },
    {
      id: "malayalee",
      name: "Malayalee Specials",
      ml: "നാടൻ വിഭവങ്ങൾ",
      hi: "केरल स्पेशल",
      ar: "أطباق كيرالا الخاصة",
      description: "A little taste of home, here in Kochi.",
      icon: "leaf",
    },
    {
      id: "desserts",
      name: "Desserts",
      ml: "മധുരപലഹാരങ്ങൾ",
      hi: "मिठाइयाँ",
      ar: "الحلويات",
      description: "There’s always room for a sweet ending.",
      icon: "cake",
    },
  ],
};
export type Settings = Omit<
  typeof restaurant,
  "categories" | "qr" | "id" | "theme"
>;
export const defaultSettings: Settings = restaurant;

// Preserve existing demo data while updating legacy display defaults.
export function menuoirSettings(settings: Settings): Settings {
  return {
    ...settings,
    name:
      settings.name === "Fress Trees Garden & Cafe" ? "Menuoir" : settings.name,
    wordmark:
      settings.wordmark === "fress trees" ? "menuoir" : settings.wordmark,
    menu_eyebrow:
      settings.menu_eyebrow === "THE FRESS TREES MENU"
        ? "THE MENUOIR MENU"
        : settings.menu_eyebrow,
    facebook_name:
      settings.facebook_name === "Fresstrees" ? "" : settings.facebook_name,
  };
}
