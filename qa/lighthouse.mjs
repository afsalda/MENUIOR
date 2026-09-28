import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: process.platform === "win32" ? "msedge" : undefined,
  headless: true,
  args: ["--remote-debugging-port=9223"],
});
try {
  const report = await lighthouse(
    process.env.QA_URL || "http://127.0.0.1:4174/",
    {
      port: 9223,
      output: "json",
      onlyCategories: ["performance", "accessibility", "seo"],
      logLevel: "error",
    },
  );
  await writeFile("qa/lighthouse.json", report.report);
  console.log(
    JSON.stringify(
      {
        scores: Object.fromEntries(
          Object.entries(report.lhr.categories).map(([key, value]) => [
            key,
            value.score * 100,
          ]),
        ),
        metrics: Object.fromEntries(
          [
            "first-contentful-paint",
            "largest-contentful-paint",
            "total-blocking-time",
            "cumulative-layout-shift",
          ].map((key) => [key, report.lhr.audits[key].displayValue]),
        ),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
