// ============================================
// PERFORMANCE OPTIMIZER
// Lazy loading, image optimization, and performance enhancements
// ============================================

(function() {
    'use strict';
    
    // Lazy load images
    function lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    // Optimize video loading
    function optimizeVideos() {
        const videos = document.querySelectorAll('video[data-video-src]');
        videos.forEach(video => {
            // Add loading="lazy" attribute
            video.setAttribute('loading', 'lazy');
            video.setAttribute('preload', 'metadata');
            
            // Pause videos when not in viewport
            if ('IntersectionObserver' in window) {
                const videoObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            if (video.paused) {
                                video.play().catch(() => {
                                    // Autoplay blocked, that's okay
                                });
                            }
                        } else {
                            if (!video.paused) {
                                video.pause();
                            }
                        }
                    });
                }, {
                    threshold: 0.5
                });
                
                videoObserver.observe(video);
            }
        });
    }
    
    // Debounce function for scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Optimize scroll performance
    function optimizeScroll() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // Scroll-based animations here
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Preload critical resources
    function preloadCriticalResources() {
        const criticalImages = [
            'images/logo-emusoft.png',
            'images/sponsor-cyprus.webp',
            'images/sponsor-califorian.webp'
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            lazyLoadImages();
            optimizeVideos();
            optimizeScroll();
            preloadCriticalResources();
        });
    } else {
        lazyLoadImages();
        optimizeVideos();
        optimizeScroll();
        preloadCriticalResources();
    }
})();

