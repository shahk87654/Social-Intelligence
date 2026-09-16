import { parseCount, delay } from "./base.js";

const DELAY = parseInt(process.env.REQUEST_DELAY_MS || "2500", 10);

// A block/login wall is the expected outcome for logged-out FB most of the
// time. We detect it and bail cleanly rather than trying to work around it.
async function hitLoginWall(page) {
  const url = page.url();
  if (url.includes("/login")) return true;
  const hasLoginForm = await page.$("form[action*='login']");
  return Boolean(hasLoginForm);
}

async function extractPostsFromCurrentPage(page, keyword, sourceUrl) {
  return page.evaluate(
    ({ keyword, sourceUrl }) => {
      const results = [];
      // Facebook's public markup is obfuscated/class-hashed and changes
      // often. This targets role="article" blocks, which has been the
      // most stable anchor for individual post containers.
      const articles = document.querySelectorAll('[role="article"]');
      articles.forEach((el) => {
        const text = el.innerText || "";
        if (!text.toLowerCase().includes(keyword.toLowerCase())) return;

        const link = el.querySelector('a[href*="/posts/"], a[href*="/videos/"], a[href*="story_fbid"]');
        const postUrl = link ? link.href : sourceUrl;

        const authorEl = el.querySelector('h2 a, h3 a, strong a');
        const authorName = authorEl ? authorEl.innerText.trim() : null;
        const authorUrl = authorEl ? authorEl.href : null;
        const groupEl = el.querySelector('a[href*="/groups/"]');
        const groupName = groupEl ? groupEl.innerText.trim() : null;
        const groupUrl = groupEl ? groupEl.href : null;

        const timeEl = el.querySelector("abbr[data-utime], time");
        const postDate = timeEl
          ? timeEl.getAttribute("data-utime")
            ? new Date(parseInt(timeEl.getAttribute("data-utime"), 10) * 1000).toISOString()
            : timeEl.getAttribute("datetime") || null
          : null;

        // Reaction/comment/share counts sit in aria-labels on FB's UI.
        const reactionEl = el.querySelector('[aria-label*="reaction"], [aria-label*="Like"]');
        const commentEl = [...el.querySelectorAll("span, a")].find((n) =>
          /comment/i.test(n.getAttribute("aria-label") || "")
        );
        const shareEl = [...el.querySelectorAll("span, a")].find((n) =>
          /share/i.test(n.getAttribute("aria-label") || "")
        );

        results.push({
          postUrl,
          authorName,
          authorUrl,
          groupName,
          groupUrl,
          content: text.slice(0, 5000),
          postDate,
          likesRaw: reactionEl ? reactionEl.getAttribute("aria-label") : null,
          commentsRaw: commentEl ? commentEl.getAttribute("aria-label") : null,
          sharesRaw: shareEl ? shareEl.getAttribute("aria-label") : null,
        });
      });
      return results;
    },
    { keyword, sourceUrl }
  );
}

/**
 * targets: array of public Facebook Page URLs (e.g. a company's own Page).
 * Keyword search across all of Facebook while logged out is essentially
 * blocked, so this scraper is Page-scoped: it visits each target's public
 * timeline and keeps posts whose text matches the keyword.
 */
export async function search(keyword, targets, { browser }) {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  });

  const found = [];
  const pagesToVisit = targets && targets.length ? targets : [];

  if (pagesToVisit.length === 0) {
    await page.close();
    return { posts: [], note: "No target Facebook Pages provided; logged-out keyword search is not reliably available. See README." };
  }

  for (const target of pagesToVisit) {
    try {
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (await hitLoginWall(page)) {
        continue; // don't try to work around it, just skip this target
      }
      // Scroll a little to trigger lazy-loaded posts
      for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, 2000);
        await delay(800);
      }
      const rawPosts = await extractPostsFromCurrentPage(page, keyword, target);
      for (const r of rawPosts) {
        found.push({
          platform: "facebook",
          postUrl: r.postUrl,
          authorName: r.authorName,
          authorUrl: r.authorUrl,
          groupName: r.groupName,
          groupUrl: r.groupUrl,
          content: r.content,
          postDate: r.postDate,
          likes: parseCount(r.likesRaw),
          comments: parseCount(r.commentsRaw),
          shares: parseCount(r.sharesRaw),
        });
      }
    } catch (err) {
      // one bad target shouldn't kill the whole run
      console.error(`[facebook] failed on ${target}:`, err.message);
    }
    await delay(DELAY);
  }

  await page.close();
  return { posts: found };
}
