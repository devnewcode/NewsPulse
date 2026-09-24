import logging
import feedparser
import trafilatura
import re
import html
from dateutil import parser as date_parser
from datetime import datetime, timezone, timedelta

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

FEEDS = [
    {"source": "BBC News", "url": "http://feeds.bbci.co.uk/news/rss.xml"},
    {"source": "NPR News", "url": "https://feeds.npr.org/1001/rss.xml"},
    {"source": "The Guardian", "url": "https://www.theguardian.com/world/rss"},
]

def parse_published_date(entry):
    # Handle different date fields across feeds
    date_str = (
        entry.get("published")
        or entry.get("pubDate")
        or entry.get("updated")
        or entry.get("created")
    )
    if date_str:
        try:
            dt = date_parser.parse(date_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            pass
    return datetime.now(timezone.utc)

def extract_summary(entry):
    summary = entry.get("summary") or entry.get("description") or ""
    if not summary and "content" in entry and len(entry["content"]) > 0:
        summary = entry["content"][0].get("value", "")

    # Strip raw HTML tags and entities (e.g. from The Guardian)
    clean = re.sub(r"<[^>]+>", "", summary)
    clean = html.unescape(clean)
    clean = clean.replace("Continue reading...", "").strip()
    return " ".join(clean.split()).strip()

def fetch_full_text(url):
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded, include_comments=False, include_tables=False)
            if text:
                return text.strip()
    except Exception:
        pass
    return ""

def fetch_feed_articles(feed_config, max_articles_per_feed=25):
    source_name = feed_config["source"]
    feed_url = feed_config["url"]
    logging.info(f"Fetching {source_name} feed...")

    articles = []
    try:
        feed = feedparser.parse(feed_url)
        now = datetime.now(timezone.utc)

        for entry in feed.entries[:max_articles_per_feed]:
            title = entry.get("title", "").strip()
            link = entry.get("link", "").strip()

            if not title or not link:
                continue

            pub_date = parse_published_date(entry)

            # Skip stale static promo links (e.g. app download links with old dates)
            if (now - pub_date).days > 7:
                continue

            articles.append({
                "title": title,
                "summary": extract_summary(entry),
                "source": source_name,
                "url": link,
                "publishedAt": pub_date,
            })
    except Exception as e:
        logging.error(f"Error reading {source_name}: {e}")

    return articles
