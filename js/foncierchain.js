
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
                    const lazyImage = entry.target.querySelector('[data-src]');
                    if (lazyImage && lazyImage.dataset.src) {
                        lazyImage.src = lazyImage.dataset.src;
                        lazyImage.removeAttribute('data-src');
                    }
                    const lazyBgImage = entry.target.querySelector('[data-bg-src]');
                    if (lazyBgImage && lazyBgImage.dataset.bgSrc) {
                        lazyBgImage.style.backgroundImage = `url(${lazyBgImage.dataset.bgSrc})`;
                        lazyBgImage.removeAttribute('data-bg-src');
                    }
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
