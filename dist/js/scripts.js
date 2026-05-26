/*!
* Start Bootstrap - Creative v7.0.7 (https://startbootstrap.com/theme/creative)
* Copyright 2013-2026 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-creative/blob/master/LICENSE)
*/
//
// Scripts
//

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) return;
        navbarCollapsible.classList.toggle('navbar-shrink', window.scrollY !== 0);
    };
    navbarShrink();
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    }

    // Collapse responsive navbar when a nav link is clicked
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    document.querySelectorAll('#navbarResponsive .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // Scroll-triggered fade-up animations with IntersectionObserver
    const fadeEls = document.querySelectorAll('.fade-up');
    if (fadeEls.length > 0) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if ('IntersectionObserver' in window && !prefersReduced) {
            // Pre-assign stagger delays based on sibling index within parent
            fadeEls.forEach(el => {
                const siblings = [...el.parentNode.querySelectorAll('.fade-up')];
                el.dataset.stagger = siblings.indexOf(el) * 0.12;
            });

            const observer = new IntersectionObserver(entries => {
                entries.filter(e => e.isIntersecting).forEach(entry => {
                    entry.target.style.transitionDelay = `${entry.target.dataset.stagger || 0}s`;
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

            fadeEls.forEach(el => observer.observe(el));
        } else {
            fadeEls.forEach(el => el.classList.add('in-view'));
        }
    }

    // Contact form — Formspree (primary) + Resend email via /api/contact (secondary, best-effort)
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async event => {
            event.preventDefault();
            event.stopPropagation();

            if (!contactForm.checkValidity()) {
                contactForm.classList.add('was-validated');
                return;
            }

            const submitBtn = document.querySelector('#submitButton');
            const formSuccess = document.querySelector('#formSuccess');
            const formError = document.querySelector('#formError');

            submitBtn.disabled = true;
            submitBtn.innerHTML =
                '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending…';
            formSuccess.classList.add('d-none');
            formError.classList.add('d-none');

            const payload = {
                name: contactForm.querySelector('[name="name"]').value.trim(),
                email: contactForm.querySelector('[name="email"]').value.trim(),
                message: contactForm.querySelector('[name="message"]').value.trim(),
            };

            try {
                // Primary: submit to Formspree (works in dev and production)
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { Accept: 'application/json' },
                });

                if (response.ok) {
                    // Secondary: also send via Resend on Render — silent fail in local dev
                    fetch('/api/contact', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                        headers: { 'Content-Type': 'application/json' },
                    }).catch(() => {});

                    formSuccess.classList.remove('d-none');
                    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    contactForm.reset();
                    contactForm.classList.remove('was-validated');
                } else {
                    formError.classList.remove('d-none');
                }
            } catch (_) {
                formError.classList.remove('d-none');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Message';
            }
        });
    }

});
