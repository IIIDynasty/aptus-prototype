/* ============================================
   APTUS — SignalR Client for Real-Time Updates
   ============================================ */

let signalRConnection = null;
let currentJobId = null;

/**
 * Initialize SignalR connection
 */
async function initializeSignalR() {
  try {
    // Get connection info from negotiate endpoint
    const response = await fetch('/api/signalr/negotiate', {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to get SignalR connection info');
    }
    
    const connectionInfo = await response.json();
    
    // Create SignalR connection
    signalRConnection = new signalR.HubConnectionBuilder()
      .withUrl(connectionInfo.url, {
        accessTokenFactory: () => connectionInfo.accessToken
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          // Retry after 0, 2, 10, 30 seconds
          return [0, 2000, 10000, 30000][Math.min(retryContext.previousRetryCount, 3)];
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();
    
    // Set up event handlers
    setupSignalRHandlers();
    
    // Start connection
    await signalRConnection.start();
    console.log('✅ SignalR connected');
    
    return true;
    
  } catch (error) {
    console.error('❌ SignalR connection failed:', error);
    return false;
  }
}

/**
 * Set up SignalR event handlers
 */
function setupSignalRHandlers() {
  if (!signalRConnection) return;
  
  // Handle reconnecting
  signalRConnection.onreconnecting(error => {
    console.log('⏳ SignalR reconnecting...', error);
    showSignalRStatus('reconnecting');
  });
  
  // Handle reconnected
  signalRConnection.onreconnected(connectionId => {
    console.log('✅ SignalR reconnected', connectionId);
    showSignalRStatus('connected');
  });
  
  // Handle disconnected
  signalRConnection.onclose(error => {
    console.log('❌ SignalR disconnected', error);
    showSignalRStatus('disconnected');
  });
  
  // Listen for candidate scored event
  signalRConnection.on('candidateScored', (data) => {
    console.log('📊 Candidate scored:', data);
    handleCandidateScored(data);
  });
  
  // Listen for candidate updated event
  signalRConnection.on('candidateUpdated', (data) => {
    console.log('🔄 Candidate updated:', data);
    handleCandidateUpdated(data);
  });
  
  // Listen for new candidate event
  signalRConnection.on('newCandidate', (data) => {
    console.log('👤 New candidate:', data);
    handleNewCandidate(data);
  });
}

/**
 * Show SignalR connection status
 */
function showSignalRStatus(status) {
  const statusEl = document.getElementById('signalrStatus');
  if (!statusEl) return;
  
  if (status === 'connected') {
    statusEl.innerHTML = '<span style="color:var(--success);">●</span> Live';
    statusEl.style.display = 'flex';
  } else if (status === 'reconnecting') {
    statusEl.innerHTML = '<span style="color:var(--gold);">●</span> Reconnecting...';
    statusEl.style.display = 'flex';
  } else if (status === 'disconnected') {
    statusEl.innerHTML = '<span style="color:var(--danger);">●</span> Disconnected';
    statusEl.style.display = 'flex';
  }
}

/**
 * Join a job-specific group for updates
 */
async function joinJobGroup(jobId) {
  if (!signalRConnection || signalRConnection.state !== signalR.HubConnectionState.Connected) {
    console.warn('SignalR not connected, cannot join job group');
    return;
  }
  
  try {
    await signalRConnection.invoke('JoinJobGroup', jobId);
    currentJobId = jobId;
    console.log(`✅ Joined job group: ${jobId}`);
  } catch (error) {
    console.error('Failed to join job group:', error);
  }
}

/**
 * Leave current job group
 */
async function leaveJobGroup() {
  if (!signalRConnection || !currentJobId) return;
  
  try {
    await signalRConnection.invoke('LeaveJobGroup', currentJobId);
    console.log(`✅ Left job group: ${currentJobId}`);
    currentJobId = null;
  } catch (error) {
    console.error('Failed to leave job group:', error);
  }
}

/**
 * Handle candidate scored event
 */
function handleCandidateScored(data) {
  // Update candidate in rankings if visible
  if (typeof updateCandidateScores === 'function') {
    updateCandidateScores(data.candidateId, data.scores);
  }
  
  // Show notification
  if (typeof showToast === 'function') {
    showToast(`Candidate scored: ${data.scores.total}%`, 'success', '📊');
  }
}

/**
 * Handle candidate updated event
 */
function handleCandidateUpdated(data) {
  // Refresh rankings if on rankings page
  if (window.currentJobId === data.jobId && typeof renderRankings === 'function') {
    renderRankings(data.jobId);
  }
}

/**
 * Handle new candidate event
 */
function handleNewCandidate(data) {
  // Increment applicant count
  if (window.currentJobId === data.jobId) {
    const statEl = document.getElementById('stat-applicants');
    if (statEl) {
      const current = parseInt(statEl.textContent) || 0;
      statEl.textContent = current + 1;
    }
  }
  
  // Show notification
  if (typeof showToast === 'function') {
    showToast('New application received!', 'success', '👤');
  }
  
  // Refresh rankings
  if (window.currentJobId === data.jobId && typeof renderRankings === 'function') {
    setTimeout(() => renderRankings(data.jobId), 1000);
  }
}

/**
 * Disconnect SignalR
 */
async function disconnectSignalR() {
  if (signalRConnection) {
    await leaveJobGroup();
    await signalRConnection.stop();
    signalRConnection = null;
    console.log('✅ SignalR disconnected');
  }
}

// Auto-initialize on page load if in recruiter dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Initialize SignalR for recruiter view
  if (window.location.pathname === '/' || window.location.pathname.includes('/admin')) {
    setTimeout(() => {
      initializeSignalR().catch(err => {
        console.warn('SignalR initialization failed, will work without real-time updates');
      });
    }, 1000);
  }
});
