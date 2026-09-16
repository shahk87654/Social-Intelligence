import { delay } from "./base.js";

const DELAY = parseInt(process.env.REQUEST_DELAY_MS || "2500", 10);

async function hitLoginWall(page) {
  return Boolean(await page.$('a[href="/accounts/login/"]') || page.url().includes("/accounts/login"));
}

/**
 * Instagram serves almost nothing to logged-out visitors: no keyword
 * search, and hashtag/profile pages show only a handful of thumbnails
 * behind a "log in to see more" wall. `targets` here should be public
 * hashtags (e.g. "#aramcopakistan") or profile handles. Anything requiring
 * login (full captions, comment counts, older posts) is out of reach
 * without violating the "no login" constraint, so this returns whatever
 * the logged-out view exposes and stops there.
 */
export async function search(keyword, targets, { browser }) {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  });

  const found = [];
  const list = targets && targets.length ? targets : [];

  if (list.length === 0) {
    await page.close();
    return { posts: [], note: "No target hashtags/profiles provided; logged-out Instagram exposes no keyword search at all. See README." };
  }

  for (const target of list) {
    try {
      const handle = target.replace("#", "").replace(/^@/, "");
      const url = target.startsWith("#")
        ? `https://www.instagram.com/explore/tags/${encodeURIComponent(handle)}/`
        : `https://www.instagram.com/${encodeURIComponent(handle)}/`;

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (await hitLoginWall(page)) continue;

      await delay(1000);

      const rawPosts = await page.evaluate(() => {
        const anchors = [...document.querySelectorAll('a[href*="/p/"]')];
        return anchors.slice(0, 24).map((a) => {
          const img = a.querySelector("img");
          return {
            postUrl: new URL(a.getAttribute("href"), location.origin).href,
            content: img ? img.getAttribute("alt") : null,
          };
        });
      });

      for (const r of rawPosts) {
        if (!r.content || !r.content.toLowerCase().includes(keyword.toLowerCase())) continue;
        found.push({
          platform: "instagram",
          postUrl: r.postUrl,
          authorName: target.startsWith("#") ? null : handle,
          authorUrl: target.startsWith("#") ? null : `https://www.instagram.com/${handle}/`,
          content: r.content,
          postDate: null, // not exposed on the logged-out grid view
          likes: 0,        // not exposed on the logged-out grid view
          comments: 0,
          shares: 0,
        });
      }
    } catch (err) {
      console.error(`[instagram] failed on ${target}:`, err.message);
    }
    await delay(DELAY);
  }

  await page.close();
  return { posts: found };
}
