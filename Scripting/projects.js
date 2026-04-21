var projectData = [
    {
        meta: 'WEB \u00b7 2026',
        title: 'Personal Portfolio',
        desc: 'Minimalist personal site with a WebGL caustics refraction shader as the background. Integrates the Hardcover GraphQL API via a Vercel serverless function to show what I\'m currently reading. Live forex statistics are parsed from cTrader CSV exports using PapaParse. Built from scratch with no frameworks.',
        tags: ['HTML', 'CSS', 'WebGL', 'GLSL', 'Vercel', 'PapaParse'],
        links: [
            { label: 'View Project \u2192', url: 'https://kriss.my', type: 'primary' },
            { label: 'Source Code', url: 'https://github.com/moen0', type: 'secondary' }
        ]
    },
    {
        meta: 'AI \u00b7 2026',
        title: 'Sentiment Analyzer',
        desc: 'An NLP pipeline that scores financial news articles for sentiment and correlates the output with short-term price movements on major forex pairs. Uses a fine-tuned transformer model for domain-specific language. Designed to feed signals into discretionary trading decisions.',
        tags: ['Python', 'PyTorch', 'Transformers', 'Pandas'],
        links: [
            { label: 'Source Code', url: '#', type: 'secondary' }
        ]
    },
    {
        meta: 'TOOLS \u00b7 2026',
        title: 'Trade Journal CLI',
        desc: 'A command-line tool that takes cTrader and FTMO CSV exports and generates detailed performance reports. Calculates win rate, profit factor, Sharpe ratio, expectancy, max drawdown, and per-symbol breakdowns. Outputs to terminal or markdown.',
        tags: ['Node.js', 'CLI', 'CSV'],
        links: [
            { label: 'Source Code', url: '#', type: 'secondary' }
        ]
    },
    {
        meta: 'OPEN SOURCE \u00b7 2025',
        title: 'Caustics.js',
        desc: 'A lightweight, drop-in WebGL shader that renders real-time caustics (light refraction through water) as a page background. Mouse-reactive with smooth interpolation. Theme-aware with warm and cool color modes. Renders at half resolution for performance.',
        tags: ['GLSL', 'JavaScript', 'WebGL'],
        links: [
            { label: 'Source Code', url: '#', type: 'secondary' }
        ]
    },
    {
        meta: 'WEB \u00b7 2025',
        title: 'Forex Dashboard',
        desc: 'Client-side trading statistics dashboard that parses cTrader CSV data in the browser. Displays equity curves, risk metrics, and per-instrument breakdowns. Styled with a minimal card-based layout matching the portfolio aesthetic. No backend required.',
        tags: ['PapaParse', 'Chart.js', 'CSS Grid', 'JavaScript'],
        links: [
            { label: 'View Project \u2192', url: 'forex.html', type: 'primary' },
            { label: 'Source Code', url: '#', type: 'secondary' }
        ]
    },
    {
        meta: 'AI \u00b7 2025',
        title: 'Price Predictor',
        desc: 'An LSTM-based recurrent neural network trained on historical tick data to predict short-term forex price direction. Preprocessing pipeline handles normalization, feature engineering, and sequence windowing. Experimental project exploring ML applications in trading.',
        tags: ['TensorFlow', 'Python', 'Keras', 'NumPy'],
        links: [
            { label: 'Source Code', url: '#', type: 'secondary' }
        ]
    }
];

// ── Filter Tabs ──
var filterBtns = document.querySelectorAll('.filter-btn');
var cards = document.querySelectorAll('.project-card');

filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        filterBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var filter = btn.dataset.filter;

        cards.forEach(function(card) {
            if (filter === 'all' || card.dataset.category === filter) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
});

var overlay = document.getElementById('modal-overlay');
var modalClose = document.getElementById('modal-close');

cards.forEach(function(card) {
    card.addEventListener('click', function() {
        var index = parseInt(card.dataset.index);
        var project = projectData[index];
        if (!project) return;

        document.getElementById('modal-meta').textContent = project.meta;
        document.getElementById('modal-title').textContent = project.title;
        document.getElementById('modal-desc').textContent = project.desc;

        var tagsEl = document.getElementById('modal-tags');
        tagsEl.innerHTML = '';
        project.tags.forEach(function(t) {
            var span = document.createElement('span');
            span.className = 'tag';
            span.textContent = t;
            tagsEl.appendChild(span);
        });

        var linksEl = document.getElementById('modal-links');
        linksEl.innerHTML = '';
        project.links.forEach(function(l) {
            var a = document.createElement('a');
            a.href = l.url;
            a.className = 'modal-link ' + l.type;
            a.textContent = l.label;
            if (l.url.startsWith('http')) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            linksEl.appendChild(a);
        });

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

modalClose.addEventListener('click', closeModal);
overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}