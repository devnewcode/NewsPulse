import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def group_articles_by_topic(articles, similarity_threshold=0.18):
    if not articles:
        return []

    # Combine title and summary for TF-IDF feature extraction
    corpus = [f"{a.get('title', '')} {a.get('summary', '')}" for a in articles]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=2500,
        min_df=1
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)
    feature_names = np.array(vectorizer.get_feature_names_out())

    # Pairwise cosine similarity matrix
    sim_matrix = cosine_similarity(tfidf_matrix)

    n = len(articles)
    visited = [False] * n
    clusters = []

    for i in range(n):
        if visited[i]:
            continue

        cluster_indices = [i]
        visited[i] = True

        for j in range(i + 1, n):
            if not visited[j]:
                # Check similarity against articles already in this cluster
                sim = max(sim_matrix[idx][j] for idx in cluster_indices)
                if sim >= similarity_threshold:
                    cluster_indices.append(j)
                    visited[j] = True

        cluster_articles = [articles[idx] for idx in cluster_indices]

        # Top keywords for naming the cluster
        tfidf_sum = np.asarray(tfidf_matrix[cluster_indices].sum(axis=0)).flatten()
        top_indices = tfidf_sum.argsort()[::-1][:3]
        top_keywords = [feature_names[idx].title() for idx in top_indices if tfidf_sum[idx] > 0]

        timestamps = [a["publishedAt"] for a in cluster_articles]
        start_time = min(timestamps)
        end_time = max(timestamps)
        sources = list(set(a["source"] for a in cluster_articles))
        rep_headline = cluster_articles[0].get("title", "")

        label = " / ".join(top_keywords[:2]) if top_keywords else rep_headline[:40]

        clusters.append({
            "label": label,
            "representativeHeadline": rep_headline,
            "startTime": start_time,
            "endTime": end_time,
            "articleCount": len(cluster_articles),
            "sources": sources,
            "keywords": top_keywords,
            "articles": cluster_articles,
        })

    clusters.sort(key=lambda c: c["startTime"], reverse=True)
    return clusters
