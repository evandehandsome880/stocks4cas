// ============================================
// PART 1: STOCK CHART (unchanged, still works)
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
// PART 2: NEWS via RSS FEEDS
// ============================================

// These are RSS feeds converted to JSON
// rss2json.com is a FREE service, no signup needed
// and has NO CORS issues!

const RSS_FEEDS = [
    // Reuters Business News
    'https://feeds.reuters.com/reuters/businessNews',
    // CNBC Finance
    'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
    // Yahoo Finance (backup)
    'https://finance.yahoo.com/news/rssindex'
];

// We use rss2json as our middleman
const RSS2JSON_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ✅ This works because rss2json.com ALLOWS
// requests from browsers (has CORS headers)


async function loadNews() {
    const container = document.getElementById('news-container');
    container.innerHTML = '<p style="color: #8b949e;">Loading news...</p>';

    try {
        // Try each feed until one works
        let articles = [];

        for (let feed of RSS_FEEDS) {
            try {
                const response = await fetch(RSS2JSON_URL + encodeURIComponent(feed));
                
                if (!response.ok) continue; // Try next feed

                const data = await response.json();

                // Check if we got articles
                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    articles = data.items;
                    break; // Stop trying feeds, we got data!
                }

            } catch (feedError) {
                console.log('Feed failed, trying next...', feedError);
                continue; // Try next feed
            }
        }

        // If ALL feeds failed, show mock news
        if (articles.length === 0) {
            loadMockNews();
            return;
        }

        // Clear loading message
        container.innerHTML = '';

        // Show only first 10 articles
        articles.slice(0, 10).forEach(article => {
            const card = document.createElement('div');
            card.className = 'news-card';

            // Safely get each piece of data
            const title   = article.title       || 'No title';
            const source  = article.author      || 'Finance News';
            const image   = article.thumbnail   || article.enclosure?.link 
                            || 'https://placehold.co/80x60/30363d/ffffff?text=📰';
            const url     = article.link        || '#';

            // Format the date nicely
            const date = article.pubDate 
                ? new Date(article.pubDate).toLocaleDateString() 
                : '';

            card.innerHTML = `
                <img 
                    class="news-thumbnail" 
                    src="${image}" 
                    alt="news thumbnail"
                    onerror="this.src='https://placehold.co/80x60/30363d/ffffff?text=📰'"
                >
                <div class="news-text">
                    <h4>${title}</h4>
                    <p>${source} ${date ? '• ' + date : ''}</p>
                </div>
            `;

            card.onclick = () => window.open(url, '_blank');
            container.appendChild(card);
        });

    } catch (error) {
        console.error('News loading failed:', error);
        // If everything fails, show mock news
        loadMockNews();
    }
}


// ============================================
// PART 3: MOCK NEWS (Emergency Backup)
// ============================================
// This runs if ALL real news sources fail
// So your page never looks broken!

function loadMockNews() {
    const container = document.getElementById('news-container');
    container.innerHTML = '';

    const mockArticles = [
        {
            title: "Markets rally as Fed signals rate cuts ahead",
            source: "Reuters",
            emoji: "📈",
            color: "3fb950",
            url: "https://reuters.com"
        },
        {
            title: "Microsoft stock hits all-time high after AI announcement",
            source: "CNBC",
            emoji: "💹",
            color: "58a6ff",
            url: "https://cnbc.com"
        },
        {
            title: "Roblox shares drop 5% after earnings miss",
            source: "Bloomberg",
            emoji: "📉",
            color: "f85149",
            url: "https://bloomberg.com"
        },
        {
            title: "Oil prices surge amid Middle East tensions",
            source: "Financial Times",
            emoji: "🛢️",
            color: "d29922",
            url: "https://ft.com"
        },
        {
            title: "Crypto market sees $2B inflow this week",
            source: "CoinDesk",
            emoji: "₿",
            color: "3fb950",
            url: "https://coindesk.com"
        }
    ];

    mockArticles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'news-card';

        card.innerHTML = `
            <img 
                class="news-thumbnail" 
                src="https://placehold.co/80x60/${article.color}/ffffff?text=${article.emoji}"
                alt="news"
            >
            <div class="news-text">
                <h4>${article.title}</h4>
                <p>${article.source} • Demo Mode</p>
            </div>
        `;

        card.onclick = () => window.open(article.url, '_blank');
        container.appendChild(card);
    });

    // Tell user they're seeing demo content
    const notice = document.createElement('p');
    notice.style.cssText = 'color: #8b949e; font-size: 11px; margin-top: 10px; text-align: center;';
    notice.textContent = '⚠️ Showing demo news - live feed temporarily unavailable';
    container.appendChild(notice);
}


// ============================================
// START EVERYTHING
// ============================================

// Load news when page opens
loadNews();

// Refresh news every 5 minutes automatically
setInterval(loadNews, 5 * 60 * 1000);
