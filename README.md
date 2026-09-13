# Movie-Recommendation-Website
A movie recommendation web app built with Flask, using genre-based and user-based filtering

## How It Works

**Backend (`app.py`)**
- Loads a small built-in dataset of 20 movies (title + genre) and 15 simulated users with ratings
- `ContentBasedRecommender` — TF-IDF + cosine similarity over genres, to find movies similar to a chosen title
- `CollaborativeRecommender` — cosine similarity between users' rating patterns, to predict a user's rating for unseen movies
- Exposes two JSON API endpoints:
  - `GET /api/recommend/content?movie=<title>`
  - `GET /api/recommend/collaborative?user=<user>`

**Frontend (`templates/index.html`, `static/`)**
- A landing page explaining both recommendation methods
- A picker with two tabs: "By a movie I liked" and "By viewer profile"
- Dropdowns populated with the movie/user list from the backend
- Clicking "Find similar" / "Find picks" calls the API with `fetch()` and renders result cards with a similarity/predicted-rating badge

## Requirements

```bash
pip install flask pandas numpy scikit-learn
```

## How to Run

```bash
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

## Running It Without a Computer (Phone-Friendly)

Flask needs a live server, so use one of these, both usable from a phone browser:

- **Replit** (recommended): create a new Python Repl, add these 4 files keeping the same folder structure (`app.py`, `templates/index.html`, `static/style.css`, `static/script.js`), then hit **Run** — Replit gives you a live web link.
- **PythonAnywhere**: free tier that hosts small Flask apps directly from a browser-based file editor.

## Output

Opening the site shows a landing page explaining the two recommendation methods. Selecting a movie and tapping "Find similar" shows 6 genre-similar movies with a similarity score. Switching to a viewer profile and tapping "Find picks" shows 6 predicted movies with a predicted rating score, based on similar users.

## Using the Real MovieLens Dataset (Optional)

Swap `load_movies()` / `load_ratings()` in `app.py` for real data from [grouplens.org/datasets/movielens](https://grouplens.org/datasets/movielens/), pivoting `ratings.csv` into a user-item matrix with:
```python
ratings.pivot(index="userId", columns="movieId", values="rating")
```
