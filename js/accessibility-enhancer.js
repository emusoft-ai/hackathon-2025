// ============================================
// ACCESSIBILITY ENHANCER
// ARIA labels, keyboard navigation, focus management
// ============================================

(function() {
    'use strict';
    
    // Add ARIA labels to interactive elements
    function enhanceARIA() {
        // Navigation menu
        const mainMenu = document.querySelector('#mainmenu');
        if (mainMenu) {
            mainMenu.setAttribute('role', 'navigation');
            mainMenu.setAttribute('aria-label', 'Main navigation');
            
            const menuItems = mainMenu.querySelectorAll('a');
            menuItems.forEach((item, index) => {
                if (!item.getAttribute('aria-label')) {
                    item.setAttribute('aria-label', item.textContent.trim() + ' section');
                }
            });
        }
        
        // FAQ Accordion
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach((item, index) => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (question && answer) {
                const questionId = `faq-question-${index}`;
                const answerId = `faq-answer-${index}`;
                
                question.setAttribute('id', questionId);
                question.setAttribute('aria-expanded', 'false');
                question.setAttribute('aria-controls', answerId);
                question.setAttribute('role', 'button');
                question.setAttribute('tabindex', '0');
                
                answer.setAttribute('id', answerId);
                answer.setAttribute('aria-labelledby', questionId);
                answer.setAttribute('role', 'region');
                answer.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Buttons
        const buttons = document.querySelectorAll('.btn-main, .btn-line');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                button.setAttribute('aria-label', 'Button');
            }
        });
        
        // Images
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            if (!img.getAttribute('alt')) {
                const altText = img.src.split('/').pop().replace(/\.[^/.]+$/, '');
                img.setAttribute('alt', altText || 'Image');
            }
        });
    }
    
    // Enhance keyboard navigation (skip link disabled)
    function enhanceKeyboardNavigation() {
        // Skip to main content link kaldırıldı.
        // Sadece genel focus görünürlüğünü koruyoruz.
        const style = document.createElement('style');
        style.textContent = `
            *:focus-visible {
                outline: 3px solid #8b5cf6;
                outline-offset: 2px;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update FAQ ARIA states
    function updateFAQStates() {
        document.addEventListener('click', function(e) {
            const faqQuestion = e.target.closest('.faq-question');
            if (faqQuestion) {
                const faqItem = faqQuestion.closest('.faq-item');
                const answer = faqItem.querySelector('.faq-answer');
                const isActive = faqItem.classList.contains('active');
                
                faqQuestion.setAttribute('aria-expanded', isActive ? 'true' : 'false');
                if (answer) {
                    answer.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                }
            }
        });
    }
    
    // Announce dynamic content changes to screen readers
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            enhanceARIA();
            enhanceKeyboardNavigation();
            updateFAQStates();
        });
    } else {
        enhanceARIA();
        enhanceKeyboardNavigation();
        updateFAQStates();
    }
    
    // Export for use in other scripts
    window.announceToScreenReader = announceToScreenReader;
})();

