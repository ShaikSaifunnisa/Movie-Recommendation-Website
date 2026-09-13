const tabs = document.querySelectorAll(".tab");
const panelContent = document.getElementById("panel-content");
const panelCollab = document.getElementById("panel-collab");
const results = document.getElementById("results");

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

document.getElementById("btn-content").addEventListener("click", async () => {
  const movie = document.getElementById("movie-select").value;
  results.innerHTML = '<p class="empty-state">Finding matches…</p>';
  const res = await fetch(`/api/recommend/content?movie=${encodeURIComponent(movie)}`);
  const data = await res.json();
  renderResults(data.recommendations, "match");
});

document.getElementById("btn-collab").addEventListener("click", async () => {
  const user = document.getElementById("user-select").value;
  results.innerHTML = '<p class="empty-state">Finding picks…</p>';
  const res = await fetch(`/api/recommend/collaborative?user=${encodeURIComponent(user)}`);
  const data = await res.json();
  renderResults(data.recommendations, "predicted");
});
