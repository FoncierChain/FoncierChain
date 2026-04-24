
const box = document.getElementById('firefly-box');
for (let i = 0; i < 60; i++) {
    const f = document.createElement('div');
    f.className = 'firefly';
    f.style.left = Math.random() * 100 + '%';
    f.style.top = Math.random() * 100 + '%';
    f.style.setProperty('--move-x', (Math.random() * 400 - 200) + 'px');
    f.style.setProperty('--move-y', (Math.random() * 400 - 200) + 'px');
    f.style.animationDuration = (Math.random() * 10 + 8) + 's';
    f.style.animationDelay = (Math.random() * 5) + 's';
    box.appendChild(f);
}

particlesJS("particles-js", {
    "particles": {
        "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#10b981" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5, "random": true, "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false } },
        "size": { "value": 3, "random": true },
        "line_linked": { "enable": false },
        "move": { "enable": true, "speed": 1, "direction": "none", "random": true, "out_mode": "out" }
    },
    "interactivity": {
        "events": { "onhover": { "enable": true, "mode": "bubble" } },
        "modes": { "bubble": { "distance": 200, "size": 5, "duration": 2, "opacity": 0.8 } }
    },
    "retina_detect": true
});

const scrollRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        // Lazy load images and background images only once
        if (entry.isIntersecting) {
            const lazyImages = entry.target.querySelectorAll('[data-src]');
            lazyImages.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });

            const lazyBgImages = entry.target.querySelectorAll('[data-bg-src]');
            lazyBgImages.forEach(bg => {
                if (bg.dataset.bgSrc) {
                    bg.style.backgroundImage = `url(${bg.dataset.bgSrc})`;
                    bg.removeAttribute('data-bg-src');
                }
            });
        }

        // Toggle animation class
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        } else {
            entry.target.classList.remove('is-visible');
        }
    });
}, { threshold: 0.15 });

// Apply stagger effect and observe elements
document.querySelectorAll('[data-scroll-reveal]').forEach(element => {
    const staggerContainer = element.closest('[data-stagger]');
    if (staggerContainer) {
        const index = Array.from(element.parentElement.children).indexOf(element);
        const delay = index * 100; // 100ms delay between staggered items
        element.style.transitionDelay = `${delay}ms`;
    }
    scrollRevealObserver.observe(element);
});

// --- 1. Simulateur de Recherche ---
const searchInput = document.getElementById('search-input-field');
const btnSearch = document.getElementById('btn-search-simulate');
const loadingBox = document.getElementById('search-loading');
const resultCard = document.getElementById('search-result-card');
const suggestionChips = document.querySelectorAll('.suggestion-chip');
const resultTitle = document.getElementById('result-title');

function simulateSearch(query) {
    if (!query) return;
    
    // Hide previous result
    resultCard.style.display = 'none';
    resultCard.style.opacity = '0';
    resultCard.style.transform = 'translateY(20px)';
    
    // Show Loading
    loadingBox.style.display = 'flex';
    
    // Fake delay 1.5s
    setTimeout(() => {
        loadingBox.style.display = 'none';
        
        // Update Title
        if(resultTitle) resultTitle.innerText = query;
        
        // Show result with animation
        resultCard.style.display = 'block';
        
        // trigger animation
        setTimeout(() => {
            resultCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            resultCard.style.opacity = '1';
            resultCard.style.transform = 'translateY(0)';
        }, 50);
        
    }, 1500);
}

if(btnSearch && searchInput) {
    btnSearch.addEventListener('click', () => {
        simulateSearch(searchInput.value.trim());
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            simulateSearch(searchInput.value.trim());
        }
    });
}

suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
        if(searchInput) searchInput.value = chip.innerText;
        simulateSearch(chip.innerText);
    });
});

// --- 2. Compteurs Dynamiques (Count-Up) ---
const speed = 200; // Plus le chiffre est bas, plus c'est lent
const counters = document.querySelectorAll('.counter-animate');

const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const targetText = counter.getAttribute('data-count');
            const target = parseFloat(targetText);
            const suffix = counter.getAttribute('data-suffix') || '';
            const prefix = counter.getAttribute('data-prefix') || '';
            
            // Vérifie si le format inclut une décimale
            const isFloat = targetText.includes('.');

            let current = 0;
            // On divise par 60 pour définir l'incrément (environ 1 seconde à 60fps)
            const increment = target / 60;

            const updateCount = () => {
                current += increment;

                if (current < target) {
                    if (isFloat) {
                        counter.innerText = prefix + current.toFixed(1).replace('.', ',') + suffix;
                    } else {
                        counter.innerText = prefix + Math.ceil(current) + suffix;
                    }
                    requestAnimationFrame(updateCount);
                } else {
                    // Fin de l'animation, on force la valeur finale avec formatage
                    if (isFloat) {
                        counter.innerText = prefix + target.toFixed(1).replace('.', ',') + suffix;
                    } else {
                        counter.innerText = prefix + target + suffix;
                    }
                }
            };
            
            updateCount();
            observer.unobserve(counter);
        }
    });
}, { threshold: 0.5 }); // Déclenche quand 50% de l'élément est visible

counters.forEach(counter => {
    counterObserver.observe(counter);
});

// --- 3. Theme Switcher (Clair/Sombre) ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

// Vérifier la préférence sauvegardée
const currentTheme = localStorage.getItem('foncier-theme');
if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeIcon) themeIcon.className = 'fas fa-moon';
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('foncier-theme', 'dark');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('foncier-theme', 'light');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
        }
    });
}
