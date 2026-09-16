/* ============================================================
   stocks4cas — News & insights page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    S4C.initNav("news");
    S4C.renderFooter();

    // Curated, illustrative headlines — deliberately undated so nothing here
    // implies a live feed. See the disclaimer in the page header.
    const articles = S4C_NEWS.CURATED;

    const list = document.getElementById("news-list");
    const insights = document.getElementById("insights");

    S4C_NEWS.renderNewsList(list, articles);
    S4C_NEWS.renderInsights(insights);

    document.getElementById("news-sort").addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        document.querySelectorAll("#news-sort button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const sort = btn.dataset.sort;
        let items = [...articles];
        if (sort === "positive") items = items.filter((a) => a.sentiment === "positive");
        if (sort === "negative") items = items.filter((a) => a.sentiment === "negative");
        S4C_NEWS.renderNewsList(list, items);
    });
});
