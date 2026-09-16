/* ============================================================
   stocks4cas — the guessing game
   Five rounds from the generated LESSONS bundle. Twenty closes are
   visible, and the twenty-first is the one the player has to call.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    S4C.initNav("play");
    S4C.renderFooter();

    const SHOWN = 20;
    const DEFAULT_SUMMARY = "Five rounds, and then a word about what a score means.";

    const el = {
        chart: document.getElementById("game-chart"),
        round: document.getElementById("game-round"),
        hint: document.getElementById("game-hint"),
        feedback: document.getElementById("game-feedback"),
        score: document.getElementById("game-score"),
        summary: document.getElementById("game-summary"),
        pips: document.getElementById("game-pips"),
        higher: document.getElementById("guess-higher"),
        lower: document.getElementById("guess-lower"),
        next: document.getElementById("game-next"),
        restart: document.getElementById("game-restart"),
    };

    const lessons = S4C.getLessons();
    const rounds = (lessons && lessons.rounds) || [];

    if (!el.chart || !rounds.length) {
        el.hint.textContent = "The rounds are not loaded.";
        el.feedback.innerHTML = 'Run <span class="mono">simulate.py</span> to generate them.';
        return;
    }

    let index = 0;
    let answered = false;
    let results = [];

    const money = (v) => v.toFixed(2);
    const scoreOf = () => results.filter((r) => r === true).length;
    const playedOf = () => results.filter((r) => r !== undefined).length;

    // Chance that a fair coin reaches at least `k` right out of `n`, so the
    // score can be compared with luck rather than with a feeling.
    const coinTail = (n, k) => {
        const choose = (a, b) => {
            let out = 1;
            for (let i = 1; i <= b; i++) out = (out * (a - b + i)) / i;
            return out;
        };
        let hits = 0;
        for (let i = k; i <= n; i++) hits += choose(n, i);
        return hits / Math.pow(2, n);
    };

    // A plain SVG line. The scale covers all twenty-one points, so revealing
    // the last one does not redraw the picture.
    const sparkline = (values, revealed) => {
        const w = 600;
        const h = 240;
        const pad = 12;
        const min = Math.min.apply(null, values);
        const max = Math.max.apply(null, values);
        const span = (max - min) || 1;
        const x = (i) => pad + (i / (values.length - 1)) * (w - pad * 2);
        const y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);
        const points = (revealed ? values : values.slice(0, SHOWN))
            .map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1))
            .join(" ");
        const dot = revealed
            ? `<rect class="now" x="${(x(values.length - 1) - 3).toFixed(1)}" y="${(y(values[values.length - 1]) - 3).toFixed(1)}" width="6" height="6"></rect>`
            : "";
        return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"></polyline>
            ${dot}
        </svg>`;
    };

    const renderPips = () => {
        el.pips.innerHTML = rounds.map((_, i) => {
            let cls = "";
            if (results[i] === true) cls = "right";
            else if (results[i] === false) cls = "wrong";
            else if (i === index) cls = "done";
            return `<div class="pip ${cls}"></div>`;
        }).join("");
    };

    const finish = () => {
        const right = scoreOf();
        const played = playedOf();
        const flat = results.filter((r) => r === null).length;
        const pct = Math.round(coinTail(played, right) * 100);

        el.summary.innerHTML =
            `You called ${right} of ${played}. A fair coin reaches that score or better about ${pct}% of ` +
            `the time, so a short run of right calls is weak evidence of skill. Anyone showing you their ` +
            `good rounds has had some like these, and rarely shows the rest.` +
            (flat ? " One round ended flat, so it counted for neither side." : "");
    };

    const render = () => {
        const values = rounds[index].points;
        const shownLast = values[SHOWN - 1];
        const actual = values[SHOWN];
        const isLast = index === rounds.length - 1;

        el.chart.innerHTML = sparkline(values, answered);
        el.round.textContent = `Round ${index + 1} of ${rounds.length}`;
        el.hint.innerHTML = answered
            ? `The hidden close was <strong>${money(actual)}</strong>.`
            : `Twenty closes, the last at <strong>${money(shownLast)}</strong>. The next one is hidden.`;
        el.higher.disabled = answered;
        el.lower.disabled = answered;
        el.next.hidden = !answered || isLast;
        el.restart.hidden = !(answered && isLast);
        el.score.textContent = `${scoreOf()} of ${playedOf()}`;
        renderPips();
        if (answered && isLast) finish();
    };

    const answer = (call) => {
        if (answered) return;

        const values = rounds[index].points;
        const shownLast = values[SHOWN - 1];
        const actual = values[SHOWN];
        const moved = actual === shownLast ? "flat" : (actual > shownLast ? "higher" : "lower");
        const change = shownLast ? Math.abs(((actual - shownLast) / shownLast) * 100).toFixed(2) : "0.00";

        answered = true;

        if (moved === "flat") {
            results[index] = null;
            el.feedback.innerHTML =
                `The next close was ${money(actual)}, the same as the last one shown, so this round ` +
                `counts for neither side.`;
        } else if (call === moved) {
            results[index] = true;
            el.feedback.innerHTML =
                `<span class="up">Called it.</span> The next close was ${money(actual)}, ${change}% ` +
                `${moved} than ${money(shownLast)}.`;
        } else {
            results[index] = false;
            el.feedback.innerHTML =
                `<span class="down">Not this time.</span> The next close was ${money(actual)}, ${change}% ` +
                `${moved} than ${money(shownLast)}.`;
        }

        render();
    };

    el.higher.addEventListener("click", () => answer("higher"));
    el.lower.addEventListener("click", () => answer("lower"));

    el.next.addEventListener("click", () => {
        index += 1;
        answered = false;
        el.feedback.innerHTML = "";
        render();
    });

    el.restart.addEventListener("click", () => {
        index = 0;
        answered = false;
        results = [];
        el.feedback.innerHTML = "";
        el.summary.innerHTML = DEFAULT_SUMMARY;
        render();
    });

    render();
});
