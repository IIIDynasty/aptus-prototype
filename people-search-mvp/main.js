// WhoGPT Agents — Landing Page Controller
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Hero Search Elements
  const heroSearchInput     = document.getElementById('heroSearchInput');
  const heroSearchBtn       = document.getElementById('heroSearchBtn');
  const heroAddCriteriaBtn  = document.getElementById('heroAddCriteriaBtn');
  const heroActiveCriteria  = document.getElementById('heroActiveCriteria');
  const heroCriteriaDropdown = document.getElementById('heroCriteriaDropdown');
  const heroCriteriaCloseBtn = document.getElementById('heroCriteriaCloseBtn');
  const heroCustomCriteriaInput = document.getElementById('heroCustomCriteriaInput');
  const heroAddCustomCritBtn = document.getElementById('heroAddCustomCritBtn');
  const heroCritPills       = document.querySelectorAll('.hero-crit-pill');
  const exampleChips        = document.querySelectorAll('.example-chip');

  let heroActiveCriteriaList = [];

  const renderHeroCriteria = () => {
    if (!heroActiveCriteria) return;
    heroActiveCriteria.innerHTML = '';
    heroActiveCriteriaList.forEach((crit, index) => {
      const tag = document.createElement('div');
      tag.className = 'active-criterion-tag';
      tag.innerHTML = `
        <span>${crit}</span>
        <button type="button" class="remove-criterion-btn" data-index="${index}">✕</button>
      `;
      heroActiveCriteria.appendChild(tag);
    });

    heroActiveCriteria.querySelectorAll('.remove-criterion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        heroActiveCriteriaList.splice(idx, 1);
        renderHeroCriteria();
      });
    });
  };

  const addHeroCriterion = (text) => {
    const val = (text || '').trim();
    if (!val) return;
    if (!heroActiveCriteriaList.includes(val)) {
      heroActiveCriteriaList.push(val);
      renderHeroCriteria();
    }
    if (heroCustomCriteriaInput) heroCustomCriteriaInput.value = '';
    if (heroCriteriaDropdown) heroCriteriaDropdown.style.display = 'none';
    if (heroAddCriteriaBtn) heroAddCriteriaBtn.classList.remove('active');
  };

  if (heroAddCriteriaBtn) {
    heroAddCriteriaBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = heroCriteriaDropdown.style.display === 'block';
      heroCriteriaDropdown.style.display = isOpen ? 'none' : 'block';
      heroAddCriteriaBtn.classList.toggle('active', !isOpen);
      if (!isOpen && heroCustomCriteriaInput) {
        setTimeout(() => heroCustomCriteriaInput.focus(), 50);
      }
    });
  }

  if (heroCriteriaCloseBtn) {
    heroCriteriaCloseBtn.addEventListener('click', () => {
      if (heroCriteriaDropdown) heroCriteriaDropdown.style.display = 'none';
      if (heroAddCriteriaBtn) heroAddCriteriaBtn.classList.remove('active');
    });
  }

  if (heroAddCustomCritBtn && heroCustomCriteriaInput) {
    heroAddCustomCritBtn.addEventListener('click', () => {
      addHeroCriterion(heroCustomCriteriaInput.value);
    });
    heroCustomCriteriaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addHeroCriterion(heroCustomCriteriaInput.value);
      }
    });
  }

  heroCritPills.forEach(pill => {
    pill.addEventListener('click', () => {
      addHeroCriterion(pill.getAttribute('data-crit'));
    });
  });

  document.addEventListener('click', (e) => {
    if (heroCriteriaDropdown && heroCriteriaDropdown.style.display === 'block') {
      if (!heroCriteriaDropdown.contains(e.target) && !heroAddCriteriaBtn.contains(e.target)) {
        heroCriteriaDropdown.style.display = 'none';
        heroAddCriteriaBtn.classList.remove('active');
      }
    }
  });

  // --- Navigate to Sourcing Studio with query and criteria ---
  const goToSearch = (query) => {
    const q = (query || '').trim();
    if (!q) {
      openWaitlistWithQuery();
      return;
    }
    const critParam = heroActiveCriteriaList.length > 0 
      ? `&criteria=${encodeURIComponent(JSON.stringify(heroActiveCriteriaList))}` 
      : '';
    window.location.href = `/search.html?q=${encodeURIComponent(q)}${critParam}`;
  };

  // --- Search Bar Listeners (redirect, don't run search here) ---
  if (heroSearchBtn) {
    heroSearchBtn.addEventListener('click', () => {
      const query = heroSearchInput ? heroSearchInput.value : '';
      goToSearch(query);
    });
  }

  if (heroSearchInput) {
    heroSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goToSearch(heroSearchInput.value);
      }
    });
  }

  // Example chips → redirect to search page
  exampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query') || chip.textContent.trim();
      goToSearch(query);
    });
  });

  // Waitlist Modal
  const waitlistModal     = document.getElementById('waitlistModal');
  const closeModalBtn     = document.getElementById('closeModalBtn');
  const modalFormView     = document.getElementById('modalFormView');
  const modalSuccessView  = document.getElementById('modalSuccessView');
  const waitlistForm      = document.getElementById('waitlistForm');
  const successDoneBtn    = document.getElementById('successDoneBtn');
  const queryPreviewGroup = document.getElementById('queryPreviewGroup');
  const modalQueryPreview = document.getElementById('modalQueryPreview');

  // Video Modal
  const videoModal        = document.getElementById('videoModal');
  const playVideoTrigger  = document.getElementById('playVideoTrigger');
  const closeVideoModalBtn = document.getElementById('closeVideoModalBtn');
  const videoToWaitlistBtn = document.getElementById('videoToWaitlistBtn');

  // Info Modal (Privacy / Terms)
  const infoModal        = document.getElementById('infoModal');
  const closeInfoModalBtn = document.getElementById('closeInfoModalBtn');
  const privacyBtn       = document.getElementById('privacyBtn');
  const termsBtn         = document.getElementById('termsBtn');
  const infoModalTitle   = document.getElementById('infoModalTitle');
  const infoModalContent = document.getElementById('infoModalContent');

  // Navigation & Hero CTAs
  const navWaitlistBtn      = document.getElementById('navWaitlistBtn');
  const heroWaitlistBtn     = document.getElementById('heroWaitlistBtn');
  const navDemoBtn          = document.getElementById('navDemoBtn');
  const problemsWaitlistBtn = document.getElementById('problemsWaitlistBtn');
  const finalCtaBtn         = document.getElementById('finalCtaBtn');

  // --- Modal Helpers ---
  const openModal = (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.add('is-active');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.remove('is-active');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // --- Waitlist Modal Logic ---
  const openWaitlistWithQuery = (queryText = '') => {
    modalFormView.style.display  = 'block';
    modalSuccessView.style.display = 'none';

    const cleanQuery = (queryText || '').trim();
    if (cleanQuery) {
      queryPreviewGroup.style.display = 'block';
      modalQueryPreview.textContent   = `"${cleanQuery}"`;
    } else {
      queryPreviewGroup.style.display = 'none';
      modalQueryPreview.textContent   = '';
    }

    openModal(waitlistModal);
    setTimeout(() => {
      const firstInput = document.getElementById('fullName');
      if (firstInput) firstInput.focus();
    }, 150);
  };

  if (navWaitlistBtn)      navWaitlistBtn.addEventListener('click', () => openWaitlistWithQuery());
  if (heroWaitlistBtn)     heroWaitlistBtn.addEventListener('click', () => openWaitlistWithQuery());
  if (problemsWaitlistBtn) problemsWaitlistBtn.addEventListener('click', () => openWaitlistWithQuery());
  if (finalCtaBtn)         finalCtaBtn.addEventListener('click', () => openWaitlistWithQuery());
  if (closeModalBtn)       closeModalBtn.addEventListener('click', () => closeModal(waitlistModal));
  if (successDoneBtn)      successDoneBtn.addEventListener('click', () => closeModal(waitlistModal));

  // --- Video Modal Controls ---
  if (playVideoTrigger) {
    playVideoTrigger.addEventListener('click', () => openModal(videoModal));
    playVideoTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(videoModal); }
    });
  }
  if (navDemoBtn) {
    navDemoBtn.addEventListener('click', () => {
      const demoSec = document.getElementById('demo');
      if (demoSec) demoSec.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (closeVideoModalBtn) closeVideoModalBtn.addEventListener('click', () => closeModal(videoModal));
  if (videoToWaitlistBtn) {
    videoToWaitlistBtn.addEventListener('click', () => {
      closeModal(videoModal);
      openWaitlistWithQuery();
    });
  }

  // --- Legal / Policy Modals ---
  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
      infoModalTitle.textContent = 'Privacy Policy';
      infoModalContent.innerHTML = `
        <p><strong>WhoGPT Privacy Commitment</strong></p>
        <p style="margin-top: 0.5rem;">We value recruiter and candidate confidentiality. All early-access submissions, queries, and contact requests are securely maintained solely for platform testing, invitation notifications, and product research.</p>
        <p style="margin-top: 0.5rem;">For full details or questions, please email <a href="mailto:contact@whogpt.ai" style="color: #5776F8; font-weight: 600;">contact@whogpt.ai</a>.</p>
      `;
      openModal(infoModal);
    });
  }
  if (termsBtn) {
    termsBtn.addEventListener('click', () => {
      infoModalTitle.textContent = 'Terms of Service';
      infoModalContent.innerHTML = `
        <p><strong>WhoGPT Early Access Terms</strong></p>
        <p style="margin-top: 0.5rem;">Access to WhoGPT Agents preview builds and algorithmic candidate insights is provided on an invite-only basis for evaluation and feedback.</p>
        <p style="margin-top: 0.5rem;">Official terms and licensing agreements will be distributed to confirmed cohort participants prior to account provisioning.</p>
      `;
      openModal(infoModal);
    });
  }
  if (closeInfoModalBtn) closeInfoModalBtn.addEventListener('click', () => closeModal(infoModal));

  // Close modals on backdrop click
  [waitlistModal, videoModal, infoModal].forEach(modal => {
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
  });

  // Close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(waitlistModal);
      closeModal(videoModal);
      closeModal(infoModal);
    }
  });

  // --- Waitlist Form Submission ---
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const waitlistRecord = {
        fullName:      document.getElementById('fullName')?.value || '',
        workEmail:     document.getElementById('workEmail')?.value || '',
        companyName:   document.getElementById('companyName')?.value || '',
        recruiterType: document.getElementById('recruiterType')?.value || '',
        industryFocus: document.getElementById('industryFocus')?.value || '',
        capturedQuery: modalQueryPreview?.textContent || '',
        timestamp:     new Date().toISOString()
      };

      try {
        const stored = JSON.parse(localStorage.getItem('whogpt_waitlist') || '[]');
        stored.push(waitlistRecord);
        localStorage.setItem('whogpt_waitlist', JSON.stringify(stored));
        console.log('[WhoGPT Waitlist Signup Recorded]:', waitlistRecord);
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      modalFormView.style.display  = 'none';
      modalSuccessView.style.display = 'block';
    });
  }

  console.log('🚀 [WhoGPT Agents] Landing page initialized.');
});
