const MOVIES = [
  { id: 1,  title: "The Matrix",          genres: "Action Sci-Fi",               color: "#2E3440" },
  { id: 2,  title: "Inception",           genres: "Action Sci-Fi Thriller",      color: "#1B2A4A" },
  { id: 3,  title: "Interstellar",        genres: "Sci-Fi Drama Adventure",      color: "#0F3460" },
  { id: 4,  title: "The Dark Knight",     genres: "Action Crime Drama",          color: "#1A1A2E" },
  { id: 5,  title: "Toy Story",           genres: "Animation Family Comedy",     color: "#F4A300" },
  { id: 6,  title: "Finding Nemo",        genres: "Animation Family Adventure",  color: "#0077B6" },
  { id: 7,  title: "The Notebook",        genres: "Romance Drama",               color: "#8B2635" },
  { id: 8,  title: "Titanic",             genres: "Romance Drama",               color: "#3A2E4D" },
  { id: 9,  title: "The Conjuring",       genres: "Horror Thriller",             color: "#1B1B1B" },
  { id: 10, title: "Get Out",             genres: "Horror Thriller Mystery",     color: "#4A0E0E" },
  { id: 11, title: "The Hangover",        genres: "Comedy",                      color: "#F4A300" },
  { id: 12, title: "Superbad",            genres: "Comedy",                      color: "#F4A300" },
  { id: 13, title: "Avengers: Endgame",   genres: "Action Sci-Fi Adventure",     color: "#B22222" },
  { id: 14, title: "Iron Man",            genres: "Action Sci-Fi",               color: "#B22222" },
  { id: 15, title: "La La Land",          genres: "Romance Musical Drama",       color: "#6A0572" },
  { id: 16, title: "Whiplash",            genres: "Drama Music",                 color: "#3A2E4D" },
  { id: 17, title: "Shrek",               genres: "Animation Comedy Family",     color: "#2E8B57" },
  { id: 18, title: "Up",                  genres: "Animation Family Adventure",  color: "#2E8B57" },
  { id: 19, title: "It",                  genres: "Horror",                      color: "#1B1B1B" },
  { id: 20, title: "A Quiet Place",       genres: "Horror Thriller Sci-Fi",      color: "#1A1A2E" },
];

const USERS = Array.from({ length: 15 }, (_, i) => `User${i + 1}`);

const RATINGS = [
  [4,null,3,5,5,null,null,null,null,5,null,null,5,2,null,null,4,null,null,null],
  [null,5,null,1,1,null,3,null,4,null,null,4,null,null,null,null,3,null,1,2],
  [4,null,null,2,2,1,null,null,null,4,null,4,null,5,3,1,null,2,4,null],
  [null,4,5,null,null,4,2,null,null,null,1,5,null,2,5,null,null,null,4,4],
  [5,1,5,5,null,1,null,null,null,null,null,null,3,null,null,3,5,null,2,1],
  [null,1,4,null,null,5,3,4,3,3,1,3,5,3,1,5,2,null,1,2],
  [2,4,5,null,null,null,null,null,5,null,3,null,4,null,null,3,4,null,2,null],
  [1,5,4,4,4,4,4,null,null,4,1,1,null,1,3,null,null,5,1,null],
  [null,null,null,1,3,null,4,3,1,4,null,null,2,4,null,2,3,null,5,1],
  [1,null,1,2,2,4,5,1,1,3,2,null,null,2,null,3,null,1,5,4],
  [null,3,1,null,4,3,null,3,null,null,3,null,3,2,3,3,4,4,1,null],
  [2,1,null,4,1,1,2,2,null,null,2,1,null,4,null,null,null,null,5,5],
  [null,1,1,3,null,null,null,null,null,3,null,null,null,null,null,3,null,null,2,2],
  [null,null,null,1,4,1,4,null,5,4,null,1,1,4,3,null,5,null,3,3],
  [null,null,null,null,null,5,4,5,3,4,3,1,null,null,null,null,null,null,4,1],
];

const ALL_GENRES = [...new Set(MOVIES.flatMap((m) => m.genres.split(" ")))];

function genreVector(genreString) {
  const tokens = new Set(genreString.split(" "));
  return ALL_GENRES.map((g) => (tokens.has(g) ? 1 : 0));
}

function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

const GENRE_VECTORS = MOVIES.map((m) => genreVector(m.genres));

function recommendByContent(movieTitle, topN = 6) {
  const idx = MOVIES.findIndex((m) => m.title === movieTitle);
  if (idx === -1) return [];

  const scores = MOVIES.map((m, i) => ({
    movie: m,
    score: i === idx ? -1 : cosineSim(GENRE_VECTORS[idx], GENRE_VECTORS[i]),
  }));

  return scores
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => ({ ...s.movie, score: s.score.toFixed(3) }));
}

function userVector(row) {
  return row.map((v) => (v === null ? 0 : v));
}

function recommendByCollaborative(userName, topN = 6, nSimilar = 3) {
  const userIdx = USERS.indexOf(userName);
  if (userIdx === -1) return [];

  const targetVec = userVector(RATINGS[userIdx]);

  const similarities = RATINGS.map((row, i) =>
    i === userIdx ? -1 : cosineSim(targetVec, userVector(row))
  );

  const topSimilarIdx = similarities
    .map((s, i) => ({ i, s }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, nSimilar);

  const numMovies = MOVIES.length;
  const weightedScores = new Array(numMovies).fill(0);
  const weightTotals = new Array(numMovies).fill(0);

  topSimilarIdx.forEach(({ i, s }) => {
    RATINGS[i].forEach((rating, movieIdx) => {
      if (rating !== null) {
        weightedScores[movieIdx] += rating * s;
        weightTotals[movieIdx] += s;
      }
    });
  });

  const predictions = MOVIES.map((m, movieIdx) => {
    const alreadyRated = RATINGS[userIdx][movieIdx] !== null;
    const predicted = weightTotals[movieIdx] > 0
      ? weightedScores[movieIdx] / weightTotals[movieIdx]
      : 0;
    return { movie: m, predicted, alreadyRated };
  });

  return predictions
    .filter((p) => !p.alreadyRated)
    .sort((a, b) => b.predicted - a.predicted)
    .slice(0, topN)
    .map((p) => ({ ...p.movie, score: p.predicted.toFixed(2) }));
}

const movieSelect = document.getElementById("movie-select");
const userSelect = document.getElementById("user-select");
const results = document.getElementById("results");
const tabs = document.querySelectorAll(".tab");
const panelContent = document.getElementById("panel-content");
const panelCollab = document.getElementById("panel-collab");

MOVIES.forEach((m) => {
  const opt = document.createElement("option");
  opt.value = m.title;
  opt.textContent = m.title;
  movieSelect.appendChild(opt);
});

USERS.forEach((u) => {
  const opt = document.createElement("option");
  opt.value = u;
  opt.textContent = u;
  userSelect.appendChild(opt);
});

const EMPTY_STATE = '<p class="empty-state">Your recommendations will appear here.</p>';

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    if (tab.dataset.mode === "content") {
      panelContent.classList.remove("hidden");
      panelCollab.classList.add("hidden");
    } else {
      panelCollab.classList.remove("hidden");
      panelContent.classList.add("hidden");
    }
    results.innerHTML = EMPTY_STATE;
  });
});

function renderResults(items, scoreLabel) {
  if (!items || items.length === 0) {
    results.innerHTML = '<p class="empty-state">No recommendations found.</p>';
    return;
  }

  results.innerHTML = items
    .map((m) => {
      const genrePills = m.genres
        .split(" ")
        .map((g) => `<span class="genre-pill">${g}</span>`)
        .join("");

      return `
      <div class="movie-card">
        <div class="poster" style="background:${m.color}2e;">
          <span class="poster-initial" style="color:${m.color}">${m.title.charAt(0)}</span>
          <span class="poster-score">${scoreLabel} ${m.score}</span>
        </div>
        <div class="card-body">
          <p class="card-title">${m.title}</p>
          <div class="card-genres">${genrePills}</div>
        </div>
      </div>`;
    })
    .join("");
}

document.getElementById("btn-content").addEventListener("click", () => {
  const movie = movieSelect.value;
  const recs = recommendByContent(movie);
  renderResults(recs, "match");
});

document.getElementById("btn-collab").addEventListener("click", () => {
  const user = userSelect.value;
  const recs = recommendByCollaborative(user);
  renderResults(recs, "predicted");
});
