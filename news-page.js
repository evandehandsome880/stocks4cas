/* ============================================================
   stocks4cas — News page
   Renders the RSS snapshot (news-data.js) with the publishers' own
   dates and links, plus our clearly-labelled commentary.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    S4C.initNav("news");
    S4C.renderFooter();

    const list = document.getElementById("news-list");
    const note = document.getElementById("news-note");
    const insights = document.getElementById("insights");
    const snapshot = S4C.getNews();

    S4C_NEWS.renderInsights(insights);

    if (!snapshot || !snapshot.articles || !snapshot.articles.length) {
        if (note) {
            note.innerHTML = `No news snapshot found. Run <span class="mono">python fetch_news.py</span> to pull the current headlines.`;
        }
        S4C_NEWS.renderArticles(list, []);
        return;
    }

    S4C_NEWS.renderNote(note, snapshot);

    const articles = snapshot.articles.slice().sort((a, b) => (a.published < b.published ? 1 : -1));
    let sort = "newest";

    const render = () => {
        let items = articles.slice();
        if (sort === "source") {
            items.sort((a, b) => a.source.localeCompare(b.source) || (a.published < b.published ? 1 : -1));
        }
        S4C_NEWS.renderArticles(list, items);
    };

    const controls = document.getElementById("news-sort");
    if (controls) {
        controls.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;
            controls.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            sort = btn.dataset.sort;
            render();
        });
    }

    render();
});
