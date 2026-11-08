/**
 * Tahir Mehmood — Personal Portfolio Redesign
 * Modular, Accessible, and Lightweight Interactive Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // Flag JavaScript support
  document.documentElement.classList.add('js-loaded');

  /* ------------------------------------------------------------------------
     1. Scroll Progress Bar inside Floating Navbar Dock
     ------------------------------------------------------------------------ */
  const progressBar = document.getElementById('navbar-progress');
  const updateScrollProgress = () => {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  };

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  /* ------------------------------------------------------------------------
     2. Active Navigation Link Highlighting (IntersectionObserver)
     ------------------------------------------------------------------------ */
  const sections = document.querySelectorAll('main section[id]');
  const desktopLinks = document.querySelectorAll('.navbar-link');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -55% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          desktopLinks.forEach((link) => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${currentId}`);
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ------------------------------------------------------------------------
     3. Mobile Navigation Sheet / Drawer
     ------------------------------------------------------------------------ */
  const menuToggle = document.querySelector('.navbar-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
  const mobileCloseBtn = document.querySelector('.mobile-nav-close');

  if (menuToggle && mobileNav) {
    const toggleMobileNav = (open) => {
      const isOpen = open !== undefined ? open : !mobileNav.classList.contains('open');
      mobileNav.classList.toggle('open', isOpen);
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileNav(true);
    });

    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', () => toggleMobileNav(false));
    }

    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', () => toggleMobileNav(false));
    }

    // Close when clicking any mobile nav link
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => toggleMobileNav(false));
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        toggleMobileNav(false);
        menuToggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     4. Scroll Reveal Animations (Lightweight IntersectionObserver)
     ------------------------------------------------------------------------ */
  const revealElements = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && 'IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

    // Immediately reveal elements that are already within or near the initial viewport
    revealElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 50) {
        el.classList.add('visible');
      } else {
        revealObserver.observe(el);
      }
    });
  } else {
    // If reduced motion is requested or IntersectionObserver is unavailable
    revealElements.forEach((el) => el.classList.add('visible'));
  }

  /* ------------------------------------------------------------------------
     5. Dialog Modals (Tayyab CCTV Specifications)
     ------------------------------------------------------------------------ */
  const dialogTriggers = document.querySelectorAll('[data-dialog]');
  dialogTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const dialogId = trigger.getAttribute('data-dialog');
      const dialog = document.getElementById(dialogId);
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const allDialogs = document.querySelectorAll('.details-dialog');
  allDialogs.forEach((dialog) => {
    // Close button inside dialog
    const closeBtn = dialog.querySelector('.close-dialog-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        dialog.close();
      });
    }

    // Clean up scroll lock on dialog close
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
    });

    // Light dismiss: clicking on backdrop (outside the inner box)
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      const clickedOutside = (
        event.clientY < rect.top ||
        event.clientY > rect.bottom ||
        event.clientX < rect.left ||
        event.clientX > rect.right
      );
      if (clickedOutside) {
        dialog.close();
      }
    });
  });

  /* ------------------------------------------------------------------------
     6. Copy Email to Clipboard
     ------------------------------------------------------------------------ */
  const copyBtn = document.getElementById('copy-email-btn');
  if (copyBtn) {
    const copyLabel = copyBtn.querySelector('.copy-email-text');
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = 'tahirmehmood.dev@gmail.com';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          // Fallback using textarea for local/non-HTTPS environments
          const textArea = document.createElement('textarea');
          textArea.value = email;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          textArea.style.top = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }

        if (copyLabel) {
          const originalText = copyLabel.textContent;
          copyLabel.textContent = 'Copied!';
          copyBtn.classList.add('copied');

          setTimeout(() => {
            copyLabel.textContent = originalText;
            copyBtn.classList.remove('copied');
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    });
  }

  /* ------------------------------------------------------------------------
     7. Profile Photo Loading & Graceful Monogram Fallback
     ------------------------------------------------------------------------ */
  const profileImg = document.getElementById('profile-photo');
  const monogramPlaceholder = document.getElementById('portrait-placeholder');

  if (profileImg && monogramPlaceholder) {
    const showPhoto = () => {
      profileImg.style.display = 'block';
      monogramPlaceholder.classList.remove('visible');
    };

    const showFallback = () => {
      profileImg.style.display = 'none';
      monogramPlaceholder.classList.add('visible');
    };

    if (profileImg.complete && profileImg.naturalWidth > 0) {
      showPhoto();
    } else {
      profileImg.addEventListener('load', showPhoto);
      profileImg.addEventListener('error', showFallback);
    }
  }

  /* ------------------------------------------------------------------------
     8. Dynamic Copyright Year
     ------------------------------------------------------------------------ */
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------------
     9. Accessible Floating Back-to-Top Handler
     ------------------------------------------------------------------------ */
  const floatingBackToTop = document.getElementById('floating-back-to-top');

  const scrollToTop = (e) => {
    if (e) e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
    // Remove hash if URL had one, smoothly without jumping
    if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  };

  if (floatingBackToTop) {
    const toggleFloatingBtn = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > 320) {
        floatingBackToTop.classList.add('visible');
      } else {
        floatingBackToTop.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', toggleFloatingBtn, { passive: true });
    toggleFloatingBtn();

    floatingBackToTop.addEventListener('click', scrollToTop);
  }
});

