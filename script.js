// ============================================
// PART 1: DRAW THE STOCK CHART
// ============================================

// Find the chart box on the page
const ctx = document.getElementById('stockChart').getContext('2d');

// Create a line chart
const stockChart = new Chart(ctx, {
    type: 'line', // Line chart (like in your sketch!)
    
    data: {
        // X-axis labels (months)
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        
        datasets: [
            {
                // GREEN LINE (rising stock)
                label: 'MSFT',
                data: [150, 180, 220, 260, 310, 380],
                borderColor: '#3fb950',  // Green
                backgroundColor: 'rgba(63, 185, 80, 0.1)',
                tension: 0.4, // Makes lines curved
                fill: true,
            },
            {
                // RED LINE (falling stock)
                label: 'RBLX',
                data: [80, 75, 65, 55, 45, 38],
                borderColor: '#f85149', // Red
                backgroundColor: 'rgba(248, 81, 73, 0.1)',
                tension: 0.4,
                fill: true,
            }
        ]
    },
    
    options: {
        responsive: true,
        maintainAspectRatio: false, // Fills the box
        plugins: {
            legend: {
                labels: { color: '#ffffff' } // White legend text
            }
        },
        scales: {
            x: {
                ticks: { color: '#8b949e' }, // Gray axis labels
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
// PART 2: LOAD NEWS ARTICLES
// ============================================

// This is a FREE news API - no payment needed for basic use
// Sign up at: https://newsapi.org (it's free!)
// Replace 'YOUR_API_KEY' with the key they give you

const NEWS_API_KEY = '57a041ed63ff4dd7a6ca991afb8ec31a';
const NEWS_URL = `https://newsapi.org/v2/everything?q=stocks+finance&apiKey=${NEWS_API_KEY}&pageSize=10`;

// This function fetches news from the internet
async function loadNews() {
    
    // Find the news box on our page
    const container = document.getElementById('news-container');
    
    try {
        // Go fetch the news (like opening a webpage)
        const response = await fetch(NEWS_URL);
        const data = await response.json();
        
        // Clear the "Loading..." text
        container.innerHTML = '';
        
        // Loop through each article
        data.articles.forEach(article => {
            
            // Create a news card for each article
            const card = document.createElement('div');
            card.className = 'news-card';
            
            // Fill the card with article info
            card.innerHTML = `
                <img 
                    class="news-thumbnail" 
                    src="${article.urlToImage || 'https://via.placeholder.com/80x60'}" 
                    alt="news image"
                    onerror="this.src='https://via.placeholder.com/80x60'"
                >
                <div class="news-text">
                    <h4>${article.title}</h4>
                    <p>${article.source.name}</p>
                </div>
            `;
            
            // Make it clickable (opens the article)
            card.onclick = () => window.open(article.url, '_blank');
            
            // Add the card to the page
            container.appendChild(card);
        });
        
    } catch (error) {
        // If something goes wrong, show this message
        container.innerHTML = '<p style="color: red;">Could not load news. Check your API key!</p>';
        console.log('Error:', error);
    }
}

// Run the function when page loads
loadNews();