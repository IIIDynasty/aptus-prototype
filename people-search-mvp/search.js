// WhoGPT Agents — Sourcing Studio Controller
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentCandidates = [];
  let selectedCandidate = null;
  let activeCriteria = [];
  let currentStructuredParams = null;
  const revealedContactsCache = new Map();

  // Search Bar Elements
  const studioSearchInput     = document.getElementById('studioSearchInput');
  const studioSearchBtn       = document.getElementById('studioSearchBtn');
  const studioSearchLabel     = document.getElementById('studioSearchBtnLabel');
  const studioAddCriteriaBtn  = document.getElementById('studioAddCriteriaBtn');
  const studioActiveCriteria  = document.getElementById('studioActiveCriteria');
  const criteriaDropdown      = document.getElementById('criteriaDropdown');
  const criteriaCloseBtn      = document.getElementById('criteriaCloseBtn');
  const customCriteriaInput   = document.getElementById('customCriteriaInput');
  const addCustomCritBtn      = document.getElementById('addCustomCritBtn');
  const critPillSugs          = document.querySelectorAll('.crit-pill-sug');

  // Page-level States
  const studioIdleState       = document.getElementById('studioIdleState');
  const studioLoader          = document.getElementById('studioLoader');
  const studioResultsArea     = document.getElementById('studioResultsArea');
  const studioErrorState      = document.getElementById('studioErrorState');
  const studioErrorMsg        = document.getElementById('studioErrorMsg');

  // Results Header
  const studioResultsTitle    = document.getElementById('studioResultsTitle');
  const studioMetaIndustry    = document.getElementById('studioMetaIndustry');
  const studioMetaLocation    = document.getElementById('studioMetaLocation');

  // Candidates Grid
  const studioCandidatesGrid  = document.getElementById('studioCandidatesGrid');

  // Candidate Drawer Elements
  const candidateDrawerBackdrop   = document.getElementById('candidateDrawerBackdrop');
  const closeDrawerBtn            = document.getElementById('closeDrawerBtn');
  const drawerAvatar              = document.getElementById('drawerAvatar');
  const drawerCandidateName       = document.getElementById('drawerCandidateName');
  const drawerCandidateRoleCompany = document.getElementById('drawerCandidateRoleCompany');
  const drawerCandidateLocation   = document.getElementById('drawerCandidateLocation');
  const drawerLinkedinLink        = document.getElementById('drawerLinkedinLink');
  const drawerTalentMatchBadge    = document.getElementById('drawerTalentMatchBadge');
  const drawerTalentMatchDesc     = document.getElementById('drawerTalentMatchDesc');
  const drawerOpportunitySignalBadge = document.getElementById('drawerOpportunitySignalBadge');
  const drawerOpportunitySignalDesc  = document.getElementById('drawerOpportunitySignalDesc');
  const drawerSignalEvidenceText  = document.getElementById('drawerSignalEvidenceText');
  const drawerSignalSourceCitation = document.getElementById('drawerSignalSourceCitation');
  const drawerSalaryRange         = document.getElementById('drawerSalaryRange');
  const drawerSalarySource        = document.getElementById('drawerSalarySource');
  const drawerSalaryDate          = document.getElementById('drawerSalaryDate');
  const drawerSalaryDisclaimer    = document.getElementById('drawerSalaryDisclaimer');
  const drawerTimeline            = document.getElementById('drawerTimeline');
  const drawerEducation           = document.getElementById('drawerEducation');
  const drawerSkills              = document.getElementById('drawerSkills');
  const drawerRevealEmailBtn      = document.getElementById('drawerRevealEmailBtn');
  const drawerContactPromptView   = document.getElementById('drawerContactPromptView');
  const drawerContactLoadingView  = document.getElementById('drawerContactLoadingView');
  const drawerContactResultView   = document.getElementById('drawerContactResultView');
  const drawerRevealedEmail       = document.getElementById('drawerRevealedEmail');
  const drawerEmailConfidence     = document.getElementById('drawerEmailConfidence');
  const drawerMailtoLink          = document.getElementById('drawerMailtoLink');
  const drawerCopyEmailBtn        = document.getElementById('drawerCopyEmailBtn');

  // New Drawer Elements (Tabs, Signals Grid, Summary)
  const drawerTabBtns             = document.querySelectorAll('.drawer-tab-btn');
  const drawerTabPanes            = document.querySelectorAll('.drawer-tab-pane');
  const drawerSignalsGrid         = document.getElementById('drawerSignalsGrid');
  const drawerMoreSignalsBtn      = document.getElementById('drawerMoreSignalsBtn');
  const drawerMoreSignalsLabel    = document.getElementById('drawerMoreSignalsLabel');
  const drawerExtraSignalsGrid    = document.getElementById('drawerExtraSignalsGrid');
  const drawerTenureSnapshot      = document.getElementById('drawerTenureSnapshot');
  const drawerAiWhyOpenBtn        = document.getElementById('drawerAiWhyOpenBtn');
  const drawerAiSummaryCard       = document.getElementById('drawerAiSummaryCard');
  const drawerAiSummaryText       = document.getElementById('drawerAiSummaryText');
  const drawerQuickEmailBtn       = document.getElementById('drawerQuickEmailBtn');
  const drawerQuickPhoneBtn       = document.getElementById('drawerQuickPhoneBtn');

  // Example chips on idle state
  const studioExampleChips = document.querySelectorAll('.studio-chip');

  // ── UI State Helpers ──────────────────────────────────────────
  const showState = (stateName) => {
    studioIdleState.style.display   = stateName === 'idle'    ? 'flex' : 'none';
    studioLoader.style.display      = stateName === 'loading' ? 'flex' : 'none';
    studioResultsArea.style.display = stateName === 'results' ? 'block' : 'none';
    studioErrorState.style.display  = stateName === 'error'   ? 'flex' : 'none';
  };

  const openDrawer = () => {
    candidateDrawerBackdrop.classList.add('is-active');
    candidateDrawerBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    candidateDrawerBackdrop.classList.remove('is-active');
    candidateDrawerBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  closeDrawerBtn.addEventListener('click', closeDrawer);
  candidateDrawerBackdrop.addEventListener('click', (e) => {
    if (e.target === candidateDrawerBackdrop) closeDrawer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // ── Criteria Management ──────────────────────────────────────
  const renderCriteriaTags = () => {
    studioActiveCriteria.innerHTML = '';
    activeCriteria.forEach((crit, index) => {
      const tag = document.createElement('div');
      tag.className = 'active-criterion-tag';
      tag.innerHTML = `
        <span>${crit}</span>
        <button type="button" class="remove-criterion-btn" data-index="${index}" aria-label="Remove criterion">✕</button>
      `;
      studioActiveCriteria.appendChild(tag);
    });

    // Wire remove buttons
    studioActiveCriteria.querySelectorAll('.remove-criterion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        activeCriteria.splice(idx, 1);
        renderCriteriaTags();
      });
    });
  };

  const addCriterion = (criterionText) => {
    const text = (criterionText || '').trim();
    if (!text) return;
    if (!activeCriteria.includes(text)) {
      activeCriteria.push(text);
      renderCriteriaTags();
    }
    if (customCriteriaInput) customCriteriaInput.value = '';
    if (criteriaDropdown) criteriaDropdown.style.display = 'none';
    if (studioAddCriteriaBtn) studioAddCriteriaBtn.classList.remove('active');
  };

  if (studioAddCriteriaBtn) {
    studioAddCriteriaBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = criteriaDropdown.style.display === 'block';
      criteriaDropdown.style.display = isOpen ? 'none' : 'block';
      studioAddCriteriaBtn.classList.toggle('active', !isOpen);
      if (!isOpen && customCriteriaInput) {
        setTimeout(() => customCriteriaInput.focus(), 50);
      }
    });
  }

  if (criteriaCloseBtn) {
    criteriaCloseBtn.addEventListener('click', () => {
      criteriaDropdown.style.display = 'none';
      studioAddCriteriaBtn.classList.remove('active');
    });
  }

  if (addCustomCritBtn && customCriteriaInput) {
    addCustomCritBtn.addEventListener('click', () => {
      addCriterion(customCriteriaInput.value);
    });
    customCriteriaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCriterion(customCriteriaInput.value);
      }
    });
  }

  critPillSugs.forEach(pill => {
    pill.addEventListener('click', () => {
      const val = pill.getAttribute('data-crit');
      addCriterion(val);
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (criteriaDropdown && criteriaDropdown.style.display === 'block') {
      if (!criteriaDropdown.contains(e.target) && !studioAddCriteriaBtn.contains(e.target)) {
        criteriaDropdown.style.display = 'none';
        studioAddCriteriaBtn.classList.remove('active');
      }
    }
  });

  // ── Main Search Function ──────────────────────────────────────
  const executeCandidateSearch = async (prompt) => {
    const cleanPrompt = (prompt || '').trim();
    if (!cleanPrompt) return;

    // Update URL without reloading (for shareable links)
    const url = new URL(window.location);
    url.searchParams.set('q', cleanPrompt);
    if (activeCriteria.length > 0) {
      url.searchParams.set('criteria', JSON.stringify(activeCriteria));
    } else {
      url.searchParams.delete('criteria');
    }
    window.history.replaceState({}, '', url);

    // Sync search bar with query
    if (studioSearchInput) studioSearchInput.value = cleanPrompt;

    showState('loading');
    studioSearchLabel.textContent = 'Searching…';
    studioSearchBtn.disabled = true;

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          criteria: activeCriteria
        })
      });

      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);

      const data = await response.json();
      currentCandidates = data.candidates || [];
      currentStructuredParams = data.structuredParams || {};

      // Update header
      studioResultsTitle.textContent = `${currentCandidates.length} Right-Fit Candidate${currentCandidates.length !== 1 ? 's' : ''} Found`;
      if (data.structuredParams) {
        studioMetaIndustry.textContent = data.structuredParams.industry || 'Multi-Industry';
        studioMetaLocation.textContent = data.structuredParams.targetLocation || 'Nigeria';
      }

      renderCandidateCards(currentCandidates);
      showState('results');
    } catch (err) {
      console.error('[Search Error]:', err);
      studioErrorMsg.textContent = err.message || 'Unable to fetch profiles right now. Please try again.';
      showState('error');
    } finally {
      studioSearchLabel.textContent = 'Search';
      studioSearchBtn.disabled = false;
    }
  };

  // ── Render Candidate Cards (Matching Juicebox Reference Design) ──
  const renderCandidateCards = (candidates) => {
    studioCandidatesGrid.innerHTML = '';

    if (!candidates || candidates.length === 0) {
      studioCandidatesGrid.innerHTML = `
        <div style="padding:2.5rem; text-align:center; background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0;">
          <h4 style="font-size:1.1rem; color:#0B0F19; font-weight:700; margin:0 0 0.35rem;">No Candidates Matched Strict Filters</h4>
          <p style="color:#64748B; font-size:0.88rem; margin:0;">Try broadening your role title, industry, or target location in Nigeria.</p>
        </div>
      `;
      return;
    }

    candidates.forEach((candidate, index) => {
      const talentRating  = candidate.evaluations?.talentMatch?.rating || 'Medium';
      const signalRating  = candidate.evaluations?.opportunitySignal?.rating || 'No observed signal';
      const signalTitle   = candidate.evaluations?.opportunitySignal?.signalTitle || '';
      const signalEvidence = candidate.evaluations?.opportunitySignal?.evidenceExplanation || '';
      const salaryFormatted = candidate.salaryBenchmark?.monthlyRangeFormatted || 'Insufficient salary data';
      const educationSummary = candidate.evaluations?.educationSummary || 'Higher Education in Nigeria';
      const criteriaMatches = candidate.evaluations?.criteriaMatches || [];

      // Safe LinkedIn URL
      const linkedinHref = candidate.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(candidate.fullName + ' Nigeria')}`;

      // Check if user explicitly asked for multi-country experience in prompt or criteria
      const promptText = (studioSearchInput?.value || '').toLowerCase();
      const userAskedMultiCountry = activeCriteria.some(c => /country|cross-border|regional|pan-african/i.test(c)) ||
        /multi-country|cross-border|regional|pan-african/i.test(promptText);

      // Contextual Footer Market Signal (suppress multi-country unless requested)
      let footerSignalText = '';
      let footerSignalTooltip = '';

      if (signalTitle && (!/multi-country/i.test(signalTitle) || userAskedMultiCountry)) {
        footerSignalText = signalTitle;
        footerSignalTooltip = signalEvidence;
      } else if (candidate.evaluations?.likelyToSwitch?.topSignals?.[0]) {
        const topSig = candidate.evaluations.likelyToSwitch.topSignals[0];
        footerSignalText = `${topSig.title}: ${topSig.subtitle}`;
        footerSignalTooltip = topSig.detail || '';
      }

      const signalBadgeHtml = footerSignalText ? `
        <span class="footer-market-signal" title="${footerSignalTooltip}">
          ⚡ ${footerSignalText}
        </span>
      ` : '';

      const card = document.createElement('div');
      card.className = 'candidate-card-live';
      card.setAttribute('data-candidate-index', index);

      card.innerHTML = `
        <!-- Top Header Row -->
        <div class="card-header-row">
          <div class="card-header-left">
            <input type="checkbox" class="candidate-card-check" id="check_${candidate.id || index}" title="Select candidate" />
            <h3 class="candidate-card-name">${candidate.fullName}</h3>
            <div class="candidate-links-group">
              <a href="${linkedinHref}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" title="Open LinkedIn Profile">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>
              ${candidate.githubUrl ? `
                <a href="${candidate.githubUrl}" target="_blank" rel="noopener noreferrer" class="social-icon-btn" title="Open GitHub Profile">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#24292F">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                  </svg>
                </a>
              ` : ''}
              <button type="button" class="social-icon-btn inspect-profile-btn" data-candidate-index="${index}" title="Open Full Profile Drawer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="card-header-actions">
            <button type="button" class="card-action-btn inspect-profile-btn" data-candidate-index="${index}" title="Inspect Profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button type="button" class="card-shortlist-btn" data-candidate-index="${index}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Shortlist</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Role & Company Row -->
        <div class="card-bullet-row">
          <div class="bullet-circle-icon company-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div class="bullet-text">
            <strong>${candidate.currentTitle}</strong> at <strong>${candidate.currentCompany}</strong> • ${candidate.location}
          </div>
        </div>

        <!-- Education Row -->
        <div class="card-bullet-row">
          <div class="bullet-circle-icon edu-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#1E293B">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <div class="bullet-text">
            ${educationSummary}
          </div>
        </div>

        <!-- Criteria & Skill Evidence Section (3-Tier Status Badges) -->
        <div class="card-criteria-section">
          ${criteriaMatches.map(item => {
            const status = item.status || 'green';
            let iconSvg = '';
            if (status === 'green') {
              iconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="#15803D"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
            } else if (status === 'orange') {
              iconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
            } else {
              iconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
            }
            return `
              <div class="criteria-row-item">
                <span class="criteria-status-badge status-${status}">
                  ${iconSvg}
                  ${item.badge}
                </span>
                <span class="criteria-desc-text">${item.text}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Bottom Details Bar -->
        <div class="card-footer-toolbar">
          <div class="footer-signals-group">
            <span class="footer-salary-tag">
              ₦ Sourced Band: <strong>${salaryFormatted}</strong>
            </span>
            ${signalBadgeHtml}
          </div>
          <div class="footer-actions-group">
            <button type="button" class="btn btn-outline btn-sm inspect-profile-btn" data-candidate-index="${index}">
              Inspect Full Profile
            </button>
            <button type="button" class="btn btn-primary btn-sm reveal-contact-btn" data-candidate-index="${index}">
              Reveal Available Email
            </button>
          </div>
        </div>
      `;
      studioCandidatesGrid.appendChild(card);
    });

    // Wire card button listeners
    document.querySelectorAll('.inspect-profile-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-candidate-index'), 10);
        showCandidateDrawer(candidates[idx]);
      });
    });

    document.querySelectorAll('.reveal-contact-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-candidate-index'), 10);
        await handleContactReveal(candidates[idx], btn);
      });
    });

    document.querySelectorAll('.card-shortlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShortlisted = btn.classList.toggle('shortlisted');
        btn.querySelector('span').textContent = isShortlisted ? 'Shortlisted ✓' : 'Shortlist';
        btn.style.color = isShortlisted ? '#15803D' : '';
        btn.style.borderColor = isShortlisted ? '#86EFAC' : '';
        btn.style.background = isShortlisted ? '#F0FDF4' : '';
      });
    });
  };

  // ── Drawer Tab Switching ──────────────────────────────────────
  const switchDrawerTab = (tabId) => {
    drawerTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    drawerTabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
  };

  drawerTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) switchDrawerTab(targetTab);
    });
  });

  // Wire AI Why Open Button
  if (drawerAiWhyOpenBtn && drawerAiSummaryCard) {
    drawerAiWhyOpenBtn.addEventListener('click', () => {
      const isVisible = drawerAiSummaryCard.style.display !== 'none';
      drawerAiSummaryCard.style.display = isVisible ? 'none' : 'block';
    });
  }

  // Wire More Signals Button
  if (drawerMoreSignalsBtn && drawerExtraSignalsGrid) {
    drawerMoreSignalsBtn.addEventListener('click', () => {
      const isExpanded = drawerExtraSignalsGrid.style.display === 'grid';
      drawerExtraSignalsGrid.style.display = isExpanded ? 'none' : 'grid';
      const arrowSvg = drawerMoreSignalsBtn.querySelector('svg');
      if (arrowSvg) {
        arrowSvg.style.transform = isExpanded ? 'none' : 'rotate(180deg)';
      }
    });
  }

  // Wire Quick Contact Card Buttons
  if (drawerQuickEmailBtn) {
    drawerQuickEmailBtn.addEventListener('click', async () => {
      switchDrawerTab('tabContact');
      if (selectedCandidate) {
        const cacheKey = selectedCandidate.id || `${selectedCandidate.firstName}_${selectedCandidate.lastName}`;
        if (!revealedContactsCache.has(cacheKey)) {
          await handleContactReveal(selectedCandidate, null);
        }
      }
    });
  }

  if (drawerQuickPhoneBtn) {
    drawerQuickPhoneBtn.addEventListener('click', () => {
      drawerQuickPhoneBtn.textContent = 'Enterprise Only';
      drawerQuickPhoneBtn.style.borderColor = '#F59E0B';
      drawerQuickPhoneBtn.style.color = '#B45309';
      setTimeout(() => {
        drawerQuickPhoneBtn.textContent = 'Reveal Phone Number';
        drawerQuickPhoneBtn.style.borderColor = '';
        drawerQuickPhoneBtn.style.color = '';
      }, 2500);
    });
  }

  // ── Show Candidate Profile Drawer ─────────────────────────────
  const renderDrawerOverviewSignals = (candidate) => {
    const likely = candidate.evaluations?.likelyToSwitch || {};
    const topSignals = likely.topSignals || [];
    const additionalSignals = likely.additionalSignals || [];

    if (drawerSignalsGrid) {
      if (topSignals.length === 0) {
        drawerSignalsGrid.innerHTML = `
          <div style="grid-column:1/-1; padding:1.25rem; background:#F8FAFC; border-radius:8px; border:1px solid #E2E8F0; text-align:center; color:#64748B; font-size:0.86rem;">
            No immediate switching trigger detected. Standard career mobility considerations apply.
          </div>
        `;
      } else {
        drawerSignalsGrid.innerHTML = topSignals.map(sig => `
          <div class="signal-card-box ${sig.variant === 'gold' ? 'variant-gold' : 'variant-green'}" title="${sig.detail || ''}">
            <div class="signal-card-title">${sig.title}</div>
            <div class="signal-card-subtitle">${sig.subtitle}</div>
          </div>
        `).join('');
      }
    }

    // Additional Signals (+N more signals)
    if (drawerMoreSignalsBtn && drawerExtraSignalsGrid) {
      drawerExtraSignalsGrid.style.display = 'none';
      const arrowSvg = drawerMoreSignalsBtn.querySelector('svg');
      if (arrowSvg) arrowSvg.style.transform = 'none';

      if (additionalSignals.length > 0) {
        drawerMoreSignalsBtn.style.display = 'inline-flex';
        if (drawerMoreSignalsLabel) {
          drawerMoreSignalsLabel.textContent = `+${additionalSignals.length} more signal${additionalSignals.length > 1 ? 's' : ''}`;
        }
        drawerExtraSignalsGrid.innerHTML = additionalSignals.map(sig => `
          <div class="signal-card-box ${sig.variant === 'gold' ? 'variant-gold' : 'variant-green'}" title="${sig.detail || ''}">
            <div class="signal-card-title">${sig.title}</div>
            <div class="signal-card-subtitle">${sig.subtitle}</div>
          </div>
        `).join('');
      } else {
        drawerMoreSignalsBtn.style.display = 'none';
        drawerExtraSignalsGrid.innerHTML = '';
      }
    }

    // Experience Snapshot
    if (drawerTenureSnapshot) {
      const curTen = likely.currentTenureFormatted || '1 yrs 4 mos';
      const totExp = likely.totalExpFormatted || '5 yrs 2 mos';
      drawerTenureSnapshot.textContent = `Current Tenure: ${curTen} | Total Exp: ${totExp}`;
    }

    // AI Opportunity Briefing Card
    if (drawerAiSummaryCard && drawerAiSummaryText) {
      drawerAiSummaryCard.style.display = 'none';
      drawerAiSummaryText.textContent = likely.aiSummary || `${candidate.fullName} demonstrates active career mobility aligned with recent Nigerian industry compensation and advancement shifts.`;
    }
  };

  const showCandidateDrawer = async (candidate) => {
    if (!candidate) return;
    selectedCandidate = candidate;

    // Reset to Overview Tab
    switchDrawerTab('tabOverview');

    const initials = (candidate.fullName || 'TA')
      .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    if (drawerAvatar) drawerAvatar.textContent = initials;
    if (drawerCandidateName) drawerCandidateName.textContent = candidate.fullName;
    if (drawerCandidateRoleCompany) {
      drawerCandidateRoleCompany.textContent = `${candidate.currentTitle} • ${candidate.currentCompany}`;
    }
    if (drawerCandidateLocation) drawerCandidateLocation.textContent = candidate.location;

    // LinkedIn URL in drawer
    if (drawerLinkedinLink) {
      drawerLinkedinLink.href = candidate.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(candidate.fullName + ' Nigeria')}`;
    }

    // Open drawer immediately
    openDrawer();

    // ── On-Demand Loading of Likely to be Interested Signals ────────
    if (!candidate.evaluations?.likelyToSwitch) {
      if (drawerSignalsGrid) {
        drawerSignalsGrid.innerHTML = `
          <div style="grid-column:1/-1; padding:1.75rem; text-align:center; color:#64748B; font-size:0.88rem;">
            <div class="spinner-ring" style="width:22px; height:22px; margin:0 auto 0.6rem; border-width:2px;"></div>
            Revealing career signals...
          </div>
        `;
      }
      try {
        const resp = await fetch('/api/candidate-signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate, searchContext: currentStructuredParams })
        });
        const data = await resp.json();
        if (data.likelyToSwitch) {
          candidate.evaluations = candidate.evaluations || {};
          candidate.evaluations.likelyToSwitch = data.likelyToSwitch;
        }
      } catch (err) {
        console.warn('Could not fetch candidate signals:', err);
      }
    }

    // Render Tab 1 Signals Grid & Briefing
    renderDrawerOverviewSignals(candidate);

    // ── Tab 2: Dual Assessment, Salary & Career History ───────────
    const talentRating = candidate.evaluations?.talentMatch?.rating || 'Medium';
    if (drawerTalentMatchBadge) {
      drawerTalentMatchBadge.textContent = talentRating;
      drawerTalentMatchBadge.className = `assessment-rating-badge ${talentRating.toLowerCase() === 'high' ? 'text-green' : ''}`;
    }
    if (drawerTalentMatchDesc) {
      drawerTalentMatchDesc.textContent = candidate.evaluations?.talentMatch?.rationale ||
        'Evaluates functional skills, direct/transferable industry, cross-sector mobility, and regional exposure.';
    }

    const signalRating = candidate.evaluations?.opportunitySignal?.rating || 'No observed signal';
    const isSignalActive = signalRating.toLowerCase().includes('high') || signalRating.toLowerCase().includes('medium');
    if (drawerOpportunitySignalBadge) {
      drawerOpportunitySignalBadge.textContent = signalRating;
      drawerOpportunitySignalBadge.className = `assessment-rating-badge ${isSignalActive ? 'text-blue' : ''}`;
    }
    if (drawerOpportunitySignalDesc) {
      drawerOpportunitySignalDesc.textContent = candidate.evaluations?.opportunitySignal?.signalTitle || 'Market Intelligence';
    }
    if (drawerSignalEvidenceText) {
      drawerSignalEvidenceText.textContent = candidate.evaluations?.opportunitySignal?.evidenceExplanation || 'Insufficient public market signal.';
    }
    if (drawerSignalSourceCitation) {
      drawerSignalSourceCitation.textContent = `Source: ${candidate.evaluations?.opportunitySignal?.sourceCitation || 'Public Data Audit'}`;
    }

    // Salary Benchmark
    const sb = candidate.salaryBenchmark;
    if (drawerSalaryRange) {
      if (sb && sb.status === 'available') {
        drawerSalaryRange.textContent = sb.monthlyRangeFormatted || '₦2,500,000 - ₦4,000,000 / month';
        if (drawerSalarySource) drawerSalarySource.textContent = sb.source || 'Public Compensation Benchmark';
        if (drawerSalaryDate) drawerSalaryDate.textContent = sb.date ? `Recorded: ${sb.date}` : '';
        if (drawerSalaryDisclaimer) drawerSalaryDisclaimer.textContent = sb.disclaimer || 'Public market estimate. Actual compensation varies by employer.';
      } else {
        drawerSalaryRange.textContent = 'Insufficient salary data';
        if (drawerSalarySource) drawerSalarySource.textContent = 'WhoGPT Benchmark Table';
        if (drawerSalaryDate) drawerSalaryDate.textContent = 'Q1 2025';
        if (drawerSalaryDisclaimer) drawerSalaryDisclaimer.textContent = 'Salary figures are withheld until verified Nigerian compensation data is recorded.';
      }
    }

    // Career History Timeline
    const expList = candidate.experience || [];
    if (drawerTimeline) {
      drawerTimeline.innerHTML = expList.length > 0
        ? expList.map(exp => `
            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <h5 class="timeline-role">${exp.title}</h5>
                <p class="timeline-company">${exp.company} ${exp.companyDomain ? `(${exp.companyDomain})` : ''}</p>
                <span class="timeline-period">${exp.startDate || ''} – ${exp.endDate || 'Present'}</span>
                ${exp.summary ? `<p style="font-size:0.8rem; color:#64748B; margin-top:0.35rem;">${exp.summary}</p>` : ''}
              </div>
            </div>
          `).join('')
        : '<p style="color:#64748B; font-size:0.88rem;">No previous positions listed.</p>';
    }

    // Education
    const eduList = candidate.education || [];
    if (drawerEducation) {
      drawerEducation.innerHTML = eduList.length > 0
        ? eduList.map(edu => `
            <div class="education-item">
              <h5>${edu.degree}${edu.major ? ` in ${edu.major}` : ''}</h5>
              <p style="color:#64748B; font-size:0.8rem;">${edu.school} (${edu.startYear} - ${edu.endYear})</p>
            </div>
          `).join('')
        : '<p style="color:#64748B; font-size:0.88rem;">Higher education in Nigeria</p>';
    }

    // Skills
    const skillsList = candidate.skills || [];
    if (drawerSkills) {
      drawerSkills.innerHTML = skillsList.length > 0
        ? skillsList.map(s => `<span class="skill-tag">${s}</span>`).join('')
        : '<p style="color:#64748B; font-size:0.88rem;">Skills assessed via experience track record.</p>';
    }

    // ── Tab 3: Reset or show cached Hunter.io contact view ────────
    const cacheKey = candidate.id || `${candidate.firstName}_${candidate.lastName}`;
    if (revealedContactsCache.has(cacheKey)) {
      showRevealedContactInDrawer(revealedContactsCache.get(cacheKey));
    } else {
      if (drawerContactPromptView) drawerContactPromptView.style.display = 'block';
      if (drawerContactLoadingView) drawerContactLoadingView.style.display = 'none';
      if (drawerContactResultView) drawerContactResultView.style.display = 'none';
    }

    openDrawer();
  };

  // ── Hunter.io Contact Reveal Handlers ─────────────────────────
  const showRevealedContactInDrawer = (contactData) => {
    drawerContactPromptView.style.display  = 'none';
    drawerContactLoadingView.style.display = 'none';
    drawerContactResultView.style.display  = 'block';

    if (contactData.status === 'found' && contactData.email) {
      drawerRevealedEmail.textContent = contactData.email;
      drawerEmailConfidence.textContent = contactData.confidence ? `${contactData.confidence}% Confidence` : 'Verified';
      drawerMailtoLink.href = `mailto:${contactData.email}`;
      drawerMailtoLink.style.display = 'inline-flex';
      drawerCopyEmailBtn.style.display = 'inline-flex';
      drawerCopyEmailBtn.onclick = () => {
        navigator.clipboard.writeText(contactData.email);
        drawerCopyEmailBtn.textContent = 'Copied!';
        setTimeout(() => drawerCopyEmailBtn.textContent = 'Copy Email', 2000);
      };
    } else {
      drawerRevealedEmail.textContent = 'No verified email found for this candidate domain.';
      drawerEmailConfidence.textContent = 'Unverified';
      drawerMailtoLink.style.display = 'none';
      drawerCopyEmailBtn.style.display = 'none';
    }
  };

  const handleContactReveal = async (candidate, triggerBtn) => {
    if (!candidate) return;
    const cacheKey = candidate.id || `${candidate.firstName}_${candidate.lastName}`;

    if (revealedContactsCache.has(cacheKey)) {
      showCandidateDrawer(candidate);
      return;
    }

    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.textContent = 'Revealing…';
    }

    // If drawer is currently open for this candidate, show loading state in drawer
    if (selectedCandidate && selectedCandidate.id === candidate.id) {
      drawerContactPromptView.style.display  = 'none';
      drawerContactLoadingView.style.display = 'block';
      drawerContactResultView.style.display  = 'none';
    }

    try {
      const response = await fetch('/api/reveal-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          domain: candidate.companyDomain,
          companyName: candidate.currentCompany
        })
      });

      const data = await response.json();
      revealedContactsCache.set(cacheKey, data);

      if (triggerBtn) {
        if (data.status === 'found' && data.email) {
          triggerBtn.textContent = `✓ ${data.email}`;
          triggerBtn.classList.remove('btn-primary');
          triggerBtn.classList.add('btn-outline');
        } else {
          triggerBtn.textContent = 'Email Not Found';
        }
      }

      showCandidateDrawer(candidate);
    } catch (err) {
      console.error('[Reveal Error]:', err);
      if (triggerBtn) {
        triggerBtn.textContent = 'Reveal Failed';
        triggerBtn.disabled = false;
      }
    }
  };

  // Wire Drawer Contact Reveal Button
  if (drawerRevealEmailBtn) {
    drawerRevealEmailBtn.addEventListener('click', async () => {
      if (selectedCandidate) {
        await handleContactReveal(selectedCandidate, null);
      }
    });
  }

  // ── Search Triggers ───────────────────────────────────────────
  if (studioSearchBtn && studioSearchInput) {
    studioSearchBtn.addEventListener('click', () => {
      executeCandidateSearch(studioSearchInput.value);
    });

    studioSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeCandidateSearch(studioSearchInput.value);
      }
    });
  }

  // Example Chips on Idle Page
  studioExampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (studioSearchInput) studioSearchInput.value = query;
      executeCandidateSearch(query);
    });
  });

  // ── Auto-fire on load if ?q= URL parameter is present ─────────
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q');
  const initialCriteria = params.get('criteria');

  if (initialCriteria) {
    try {
      const parsed = JSON.parse(initialCriteria);
      if (Array.isArray(parsed)) {
        activeCriteria = parsed;
        renderCriteriaTags();
      }
    } catch (e) {
      console.warn('Could not parse criteria param');
    }
  }

  if (initialQuery && initialQuery.trim()) {
    studioSearchInput.value = initialQuery.trim();
    executeCandidateSearch(initialQuery.trim());
  } else {
    showState('idle');
  }
});
