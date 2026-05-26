// ============================================
// PART 1: DRAW THE STOCK CHART
// ============================================

const ctx = document.getElementById('stockChart').getContext('2d');

const stockChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'MSFT',
                data: [150, 180, 220, 260, 310, 380],
                borderColor: '#3fb950',
                backgroundColor: 'rgba(63, 185, 80, 0.1)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'RBLX',
                data: [80, 75, 65, 55, 45, 38],
                borderColor: '#f85149',
                backgroundColor: 'rgba(248, 81, 73, 0.1)',
                tension: 0.4,
                fill: true,
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#ffffff' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#8b949e' },
                grid: { color: '#30363d' }
            },
            y: {
                ticks: { color: '#8b949e' },
                grid: { color: '#30363d' }
            }
        }
    }
});


// ============================================
// PART 2: LOAD NEWS (FIXED VERSION)
// ============================================

async function loadNews() {
    const container = document.getElementById('news-container');
    
    // Show loading state
    container.innerHTML = '<p style="color: #8b949e;">Loading news...</p>';

    try {
        // ✅ Using GNews API instead - works in browsers!
        // FREE: 100 requests/day, no credit card
        // Sign up at: https://gnews.io
        const API_KEY = 'd1fcd8418f0534643fd33f84178aacf8';
        const url = `https://gnews.io/api/v4/search?q=stocks&lang=en&token=${API_KEY}`;

        const response = await fetch(url);

        // ✅ Check if request actually succeeded
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // ✅ Check if articles exist before forEach
        if (!data.articles || data.articles.length === 0) {
            container.innerHTML = '<p style="color: #8b949e;">No articles found.</p>';
            return;
        }

        // Clear loading text
        container.innerHTML = '';

        // Loop through articles safely
        data.articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'news-card';

            // ✅ Safely handle missing data with fallbacks
            const title = article.title || 'No title available';
            const source = article.source?.name || 'Unknown source';
            const image = article.image || 'https://placehold.co/80x60/30363d/ffffff?text=News';
            const url = article.url || '#';

            card.innerHTML = `
                <img 
                    class="news-thumbnail" 
                    src="${image}" 
                    alt="news"
                    onerror="this.src='https://placehold.co/80x60/30363d/ffffff?text=News'"
                >
                <div class="news-text">
                    <h4>${title}</h4>
                    <p>${source}</p>
                </div>
            `;

            card.onclick = () => window.open(url, '_blank');
            container.appendChild(card);
        });

    } catch (error) {
        // ✅ Detailed error message so you know what went wrong
        console.error('Full error:', error);
        container.innerHTML = `
            <div style="color: #f85149; padding: 10px;">
                <p>⚠️ Could not load news</p>
                <p style="font-size: 12px; margin-top: 5px;">
                    Reason: ${error.message}
                </p>
            </div>
        `;
    }
}

loadNews();
