"""
Movie Recommendation System - Web App (Flask backend)
--------------------------------------------------------
Serves a web page where a user can pick a movie or a user profile and get
recommendations back, using the same content-based and collaborative
filtering logic as the standalone script version.

Requirements:
    pip install flask pandas numpy scikit-learn

Run:
    python app.py

Then open http://127.0.0.1:5000 in your browser.
"""

from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)


# ---------------------------------------------------------------------------
# 1. Sample dataset (movies + genres, and user ratings)
# ---------------------------------------------------------------------------
def load_movies():
    data = {
        "movieId": list(range(1, 21)),
        "title": [
            "The Matrix", "Inception", "Interstellar", "The Dark Knight",
            "Toy Story", "Finding Nemo", "The Notebook", "Titanic",
            "The Conjuring", "Get Out", "The Hangover", "Superbad",
            "Avengers: Endgame", "Iron Man", "La La Land", "Whiplash",
            "Shrek", "Up", "It", "A Quiet Place",
        ],
        "genres": [
            "Action Sci-Fi", "Action Sci-Fi Thriller", "Sci-Fi Drama Adventure",
            "Action Crime Drama", "Animation Family Comedy", "Animation Family Adventure",
            "Romance Drama", "Romance Drama", "Horror Thriller", "Horror Thriller Mystery",
            "Comedy", "Comedy", "Action Sci-Fi Adventure", "Action Sci-Fi",
            "Romance Musical Drama", "Drama Music", "Animation Comedy Family",
            "Animation Family Adventure", "Horror", "Horror Thriller Sci-Fi",
        ],
        "poster_color": [
            "#2E3440", "#1B2A4A", "#0F3460", "#1A1A2E", "#F4A300", "#0077B6",
            "#8B2635", "#3A2E4D", "#1B1B1B", "#4A0E0E", "#F4A300", "#F4A300",
            "#B22222", "#B22222", "#6A0572", "#3A2E4D", "#2E8B57", "#2E8B57",
            "#1B1B1B", "#1A1A2E",
        ],
    }
    return pd.DataFrame(data)


def load_ratings():
    np.random.seed(42)
    n_users = 15
    n_movies = 20

    ratings = np.random.randint(1, 6, size=(n_users, n_movies)).astype(float)
    mask = np.random.rand(n_users, n_movies) < 0.4
    ratings[mask] = np.nan

    ratings_df = pd.DataFrame(
        ratings,
        index=[f"User{i+1}" for i in range(n_users)],
        columns=list(range(1, n_movies + 1)),
    )
    return ratings_df


MOVIES = load_movies()
RATINGS = load_ratings()


# ---------------------------------------------------------------------------
# 2. Content-based filtering
# ---------------------------------------------------------------------------
class ContentBasedRecommender:
    def __init__(self, movies_df):
        self.movies = movies_df.reset_index(drop=True)
        self.vectorizer = TfidfVectorizer()
        self.genre_matrix = self.vectorizer.fit_transform(self.movies["genres"])
        self.similarity = cosine_similarity(self.genre_matrix)

    def recommend(self, movie_title, top_n=6):
        if movie_title not in self.movies["title"].values:
            return []
        idx = self.movies[self.movies["title"] == movie_title].index[0]
        scores = list(enumerate(self.similarity[idx]))
        scores = sorted(scores, key=lambda x: x[1], reverse=True)
        scores = [s for s in scores if s[0] != idx][:top_n]
        return [
            {
                "title": self.movies.iloc[i]["title"],
                "genres": self.movies.iloc[i]["genres"],
                "score": round(float(score), 3),
                "color": self.movies.iloc[i]["poster_color"],
            }
            for i, score in scores
        ]


# ---------------------------------------------------------------------------
# 3. Collaborative filtering
# ---------------------------------------------------------------------------
class CollaborativeRecommender:
    def __init__(self, ratings_df, movies_df):
        self.ratings = ratings_df
        self.movies = movies_df.set_index("movieId")
        filled = self.ratings.fillna(0)
        self.user_similarity = cosine_similarity(filled)
        self.user_sim_df = pd.DataFrame(
            self.user_similarity, index=self.ratings.index, columns=self.ratings.index
        )

    def recommend(self, user, top_n=6, n_similar_users=3):
        if user not in self.ratings.index:
            return []

        similar_users = (
            self.user_sim_df[user].drop(user).sort_values(ascending=False).head(n_similar_users)
        )
        similar_ratings = self.ratings.loc[similar_users.index]
        weights = similar_users.values.reshape(-1, 1)
        weighted_scores = (similar_ratings.fillna(0).values * weights).sum(axis=0)
        weight_totals = (~similar_ratings.isna()).values.T.dot(weights).flatten()
        weight_totals[weight_totals == 0] = 1e-9

        predicted_scores = pd.Series(weighted_scores / weight_totals, index=self.ratings.columns)
        already_rated = self.ratings.loc[user].dropna().index
        predicted_scores = predicted_scores.drop(already_rated, errors="ignore")

        top_ids = predicted_scores.sort_values(ascending=False).head(top_n).index
        return [
            {
                "title": self.movies.loc[mid, "title"],
                "genres": self.movies.loc[mid, "genres"],
                "score": round(float(predicted_scores[mid]), 2),
                "color": self.movies.loc[mid, "poster_color"],
            }
            for mid in top_ids
        ]


content_recommender = ContentBasedRecommender(MOVIES)
collab_recommender = CollaborativeRecommender(RATINGS, MOVIES)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def home():
    return render_template(
        "index.html",
        movies=MOVIES["title"].tolist(),
        users=RATINGS.index.tolist(),
    )


@app.route("/api/recommend/content")
def api_content():
    movie_title = request.args.get("movie", "")
    results = content_recommender.recommend(movie_title)
    return jsonify({"movie": movie_title, "recommendations": results})


@app.route("/api/recommend/collaborative")
def api_collaborative():
    user = request.args.get("user", "")
    results = collab_recommender.recommend(user)
    return jsonify({"user": user, "recommendations": results})


if __name__ == "__main__":
    app.run(debug=True)
