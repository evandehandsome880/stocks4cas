/* ============================================================
   stocks4cas — Prerequisites page
   Draws the three teaching shapes from the generated LESSONS bundle.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    S4C.initNav("prerequisites");
    S4C.renderFooter();

    const canvas = document.getElementById("shapes-chart");
    const note = document.getElementById("shapes-note");
    const lessons = S4C.getLessons();

    const explain = (html) => { if (note) note.innerHTML = html; };

    if (!lessons || !lessons.shapes || !lessons.shapes.length) {
        explain('The paths are not loaded. Run <span class="mono">python simulate.py</span> to generate them.');
        return;
    }

    const TITLES = { climb: "Climbing", choppy: "Choppy", snap: "Snap back" };

    explain(
        `Three paths from <span class="mono">simulate.py</span>, each sixty days long and each starting at ` +
        `100. They come from the same price model as the simulated market (seed ${lessons.seed}), and they are ` +
        `illustrative rather than real.`
    );

    if (typeof Chart === "undefined" || !canvas) {
        explain('The chart is drawn with Chart.js, which needs an internet connection here. The three shapes are described underneath.');
        return;
    }

    const labels = lessons.shapes[0].points.map((_, i) => i + 1);

    const draw = () => {
        const base = S4C.chartBase();
        const faint = S4C.palette().faint;

        new Chart(canvas.getContext("2d"), {
            type: "line",
            data: {
                labels,
                datasets: lessons.shapes.map((s, i) => ({
                    label: TITLES[s.key] || s.key,
                    data: s.points,
                    borderColor: S4C.chartColor(i),
                    backgroundColor: "transparent",
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.25,
                })),
            },
            options: {
                ...base,
                scales: {
                    x: { ...base.scales.x, title: { display: true, text: "day", color: faint } },
                    y: { ...base.scales.y, title: { display: true, text: "index, 100 at the start", color: faint } },
                },
            },
        });
    };

    // A canvas does not repaint when a font finishes loading, so wait for it.
    S4C.whenFontsReady(draw);
});
