# News Pulse — Topic-Clustered News Timeline

News Pulse is a full-stack news intelligence system that ingests live articles from major RSS feeds, extracts full article content, groups related stories across outlets using TF-IDF and Cosine Similarity, and renders them as an interactive time-span visual timeline.

---

## Project Links

- **Live Frontend**: [https://newspulse.vercel.app](https://newspulse.vercel.app) *(Update with your deployed Vercel URL)*
- **Live Backend API**: [https://newspulse-wj9w.onrender.com](https://newspulse-wj9w.onrender.com)
- **Video Walkthrough (2-3 mins)**: [Link to Loom / Unlisted YouTube Video](https://www.youtube.com/) *(Add your video link here)*

---


## News Sources Used

The scraper ingests live articles from three public news feeds:
1. **BBC News** (`http://feeds.bbci.co.uk/news/rss.xml`)
2. **NPR News** (`https://feeds.npr.org/1001/rss.xml`)
3. **The Guardian World** (`https://www.theguardian.com/world/rss`)

### How Inconsistencies & Edge Cases Are Handled
- **Varying Schema Fields**: RSS feeds use different tags (`<description>`, `<content:encoded>`, `<summary>`). The parser normalizes all fields into a single internal structure.
- **Inconsistent Dates**: Feeds format timestamps differently (RFC 822 vs ISO 8601). We use `python-dateutil` to parse all dates into timezone-aware UTC `datetime` objects.
- **Stale Promo Items**: Some feeds contain static app download links with dates from months ago (e.g., BBC app links from April). We filter out items older than 7 days so the timeline reflects the active news cycle.
- **Full Article Extraction**: Rather than relying only on short summaries, `trafilatura` downloads and extracts clean body text while discarding navigation and ads. Network timeouts, paywalls, and 404s are caught gracefully so the pipeline never crashes.
- **Deduplication**: MongoDB enforces a unique index on article `url`. Repeated scraper runs check existing URLs and only download/store new articles.

---

## Topic Grouping Approach (TF-IDF & Cosine Similarity)

### Why TF-IDF Was Chosen (Option B)
We implemented **Option B (TF-IDF + Cosine Similarity)** for topic clustering:
1. It automatically ignores common English filler words ("the", "said", "is", "reported") and emphasizes distinctive, high-information nouns and events ("Hurricane", "Polo", "OpenAI", "Gaza").
2. It calculates an exact mathematical similarity score ($0.0 \to 1.0$) between articles regardless of length differences.
3. It allows auto-generating meaningful cluster labels by picking the top-weighted TF-IDF terms across all articles in that cluster.

### Parameter Tuning & Thresholds
- **Text Representation**: We combine each article's `title` and `summary`.
- **N-gram Range**: `(1, 2)` (unigrams and bigrams) to capture multi-word entities like *"White House"* or *"Fighter Jet"*.
- **Similarity Threshold**: Settled on **`0.18`**. Through experimentation, a strict threshold of $0.30+$ kept identical stories in separate 1-article clusters due to different outlet vocabularies. A threshold of `0.18` successfully groups cross-outlet coverage (e.g., Hurricane Polo covered by both BBC and Guardian) while preventing unrelated stories from merging.
- **Cluster Label Generation**: The top 2 highest-weighted TF-IDF keywords form the topic label, with the central article title preserved as the representative headline.



### Limitations Observed
1. **Synonym Disconnect**: If two outlets report on the exact same event using completely different words with zero keyword overlap (e.g., *"Orbital spacecraft touchdown"* vs *"Rocket ocean splashdown"*), TF-IDF may place them in separate clusters.
2. **Generic Term Bleed**: Stories sharing broad political vocabulary (like *"President"* or *"Government"*) can occasionally show slight artificial similarity if headline summaries are very short.

---



## 💻 Local Setup & Execution

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (local `mongodb://127.0.0.1:27017` or MongoDB Atlas cloud URI)

### 1. Scraper Setup (Python)
```bash
cd scraper
pip install -r requirements.txt
python main.py
```

### 2. Backend Setup (Node.js)
```bash
cd backend
npm install
npm run dev
```
*(Backend runs at `http://localhost:5000`)*

### 3. Frontend Setup (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*(Frontend runs at `http://localhost:3000`)*

---

### Key API Endpoints:
- `GET /timeline` - Timeline data with active durations & intensities
- `GET /clusters` - List of topic clusters & time ranges
- `GET /clusters/:id` - Full cluster details with chronological articles
- `POST /ingest/trigger` & `GET /ingest/status/:jobId` - Asynchronous scraper trigger & polling

---

## 🌐 Deployment Overview (What Runs Where & Why)

- **Frontend (`/frontend`)**: Deployed to **Vercel** for fast edge CDN delivery and seamless React/Next.js hosting.
- **Backend API (`/backend`)**: Deployed to **Render** as a Node.js web service.
- **Database**: Hosted on **MongoDB Atlas** (M0 Free Tier) for reliable cloud storage shared between the backend and scraper.
