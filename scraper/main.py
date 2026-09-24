import os
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

from scraper import FEEDS, fetch_feed_articles, fetch_full_text
from clusterer import group_articles_by_topic

# Load .env from local or backend folder
env_file = Path(__file__).parent / ".env"
if not env_file.exists():
    env_file = Path(__file__).parent.parent / "backend" / ".env"
load_dotenv(dotenv_path=env_file)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/newspulse")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def run_pipeline():
    logging.info("Starting NewsPulse ingestion and clustering...")

    try:
        # Use certifi for cloud MongoDB Atlas SSL connections
        if "mongodb+srv" in MONGODB_URI:
            import certifi
            client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=8000)
        else:
            client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
    except Exception as e:
        logging.error(f"Cannot connect to MongoDB at {MONGODB_URI}: {e}")
        sys.exit(1)

    db = client["newspulse"]
    articles_col = db["articles"]
    clusters_col = db["clusters"]

    # Fetch from the 3 feeds
    raw_articles = []
    for feed_cfg in FEEDS:
        raw_articles.extend(fetch_feed_articles(feed_cfg, max_articles_per_feed=25))

    # Skip duplicates by checking URL
    existing_urls = set(doc["url"] for doc in articles_col.find({}, {"url": 1}))

    new_articles = []
    for art in raw_articles:
        if art["url"] in existing_urls:
            continue
        art["fullText"] = fetch_full_text(art["url"])
        art["clusterId"] = None
        art["createdAt"] = datetime.now(timezone.utc)
        new_articles.append(art)
        existing_urls.add(art["url"])

    if new_articles:
        articles_col.insert_many(new_articles)
        logging.info(f"Saved {len(new_articles)} new articles to MongoDB.")

    # Cluster all stored articles
    # Only consider articles from the last 7 days for the timeline
    all_articles = list(articles_col.find({"publishedAt": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0) - __import__('datetime').timedelta(days=7)}}))
    if not all_articles:
        all_articles = list(articles_col.find())

    clusters = group_articles_by_topic(all_articles, similarity_threshold=0.18)
    logging.info(f"Grouped {len(all_articles)} articles into {len(clusters)} topic clusters.")

    # Save clusters and link back to articles
    clusters_col.delete_many({})

    for cluster in clusters:
        doc = {
            "label": cluster["label"],
            "representativeHeadline": cluster["representativeHeadline"],
            "startTime": cluster["startTime"],
            "endTime": cluster["endTime"],
            "articleCount": cluster["articleCount"],
            "sources": cluster["sources"],
            "keywords": cluster["keywords"],
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
        res = clusters_col.insert_one(doc)
        article_ids = [a["_id"] for a in cluster["articles"]]
        articles_col.update_many({"_id": {"$in": article_ids}}, {"$set": {"clusterId": res.inserted_id}})

    logging.info("Done.")

if __name__ == "__main__":
    run_pipeline()
