/* ═══════════════════════════════════════════════════════
   OneSignal SaaS Monitor — Shared JavaScript
   ═══════════════════════════════════════════════════════ */

/* ─── VIEW SWITCHING ─────────────────────────────────── */
function showView(viewKey) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(viewKey + '-view');
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    const isActive = btn.dataset.view === viewKey;
    btn.classList.toggle('active',   isActive);
    btn.classList.toggle('white-bg', !isActive);
  });
}

/* ─── UNREAD COUNT SYNC ──────────────────────────────── */
function syncUnreadCount() {
  const count = document.querySelectorAll('.status-dot.unread').length;
  const badge = document.getElementById('badge-email');
  if (badge) badge.textContent = count + ' unread email' + (count !== 1 ? 's' : '');
}

/* ─── OVERVIEW: FILTER PILL LOGIC ───────────────────── */
const _activeSections = new Set();

function initOverviewFilters() {
  document.querySelectorAll('.today-badge[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section;
      if (_activeSections.has(sec)) {
        _activeSections.delete(sec);
        btn.classList.add('filter-off');
      } else {
        _activeSections.add(sec);
        btn.classList.remove('filter-off');
      }
      applyOverviewFilter();
    });
  });
}

function applyOverviewFilter() {
  const calCard  = document.getElementById('ov-section-calendar');
  const emCard   = document.getElementById('ov-section-email');
  const showAll  = _activeSections.size === 0;
  const showBoth = _activeSections.size === 2;

  if (calCard) calCard.style.display = (showAll || showBoth || _activeSections.has('calendar')) ? '' : 'none';
  if (emCard)  emCard.style.display  = (showAll || showBoth || _activeSections.has('email'))    ? '' : 'none';
}

/* ─── CALENDAR: ARROW NAV ────────────────────────────── */
const DAY_WIDTH = 262;

function initCalendarArrows() {
  const grid = document.querySelector('.cal-grid-scroll');
  if (!grid) return;
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    grid.scrollBy({ left: -DAY_WIDTH, behavior: 'smooth' });
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    grid.scrollBy({ left: DAY_WIDTH, behavior: 'smooth' });
  });
}

/* ─── CALENDAR: FILTER TABS ──────────────────────────── */
function initCalendarFilters() {
  const calWrap = document.getElementById('calendarWrap');
  if (!calWrap) return;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.filter === 'custom') {
        openModal('custom-range-modal');
        return;
      }
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calWrap.classList.toggle('hide-events', btn.dataset.filter === 'last7');
    });
  });
}

/* ─── EMAIL: FILTER TABS ─────────────────────────────── */
function initEmailFilters() {
  document.querySelectorAll('.ftab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.textContent.trim();
      document.querySelectorAll('.email-row').forEach(row => {
        const isArchived = row.dataset.archived === 'true';
        if (filter === 'Archive') {
          row.style.display = isArchived ? '' : 'none';
        } else if (filter === 'Unread') {
          const dot = row.querySelector('.status-dot');
          row.style.display = (!isArchived && dot && dot.classList.contains('unread')) ? '' : 'none';
        } else if (filter === 'Important') {
          row.style.display = (!isArchived && row.dataset.important === 'true') ? '' : 'none';
        } else if (filter === 'Sent') {
          row.style.display = (!isArchived && row.dataset.sent === 'true') ? '' : 'none';
        } else {
          // All — exclude archived
          row.style.display = isArchived ? 'none' : '';
        }
      });
    });
  });
}

/* ─── EMAIL: RIGHT-CLICK CONTEXT MENU ───────────────── */
function initEmailContextMenu() {
  const listPanel = document.querySelector('.email-list-panel');
  if (!listPanel) return;
  listPanel.addEventListener('contextmenu', (e) => {
    const row = e.target.closest('.email-row');
    if (!row) return;
    e.preventDefault();
    selectEmail(row);
    const menu = document.getElementById('action-menu');
    if (!menu) return;
    menu.style.visibility = 'hidden';
    menu.classList.add('open');
    menu.style.top  = e.clientY + 'px';
    menu.style.left = Math.min(e.clientX, window.innerWidth - menu.offsetWidth - 8) + 'px';
    menu.style.visibility = '';
    _menuOpen = true;
  });
}

/* ─── EMAIL: ROW SELECTION + MARK AS READ ────────────── */
function selectEmail(row) {
  document.querySelectorAll('.email-row').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
  const dot = row.querySelector('.status-dot');
  if (dot && dot.classList.contains('unread')) {
    dot.classList.remove('unread');
    const activeTab = document.querySelector('.ftab.active');
    if (activeTab && activeTab.textContent.trim() === 'Unread') {
      row.style.display = 'none';
    }
  }
  syncUnreadCount();
}

/* ─── MODAL: OPEN / CLOSE ────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function handleOverlayClick(event, id) {
  if (event.target === event.currentTarget) closeModal(id);
}

/* ─── EMAIL: COMPOSE FORMATTING ─────────────────────── */
function execFormat(cmd) {
  document.getElementById('compose-area')?.focus();
  document.execCommand(cmd, false, null);
  updateFormatButtons();
}

function updateFormatButtons() {
  const cmds = { 'fmt-bold': 'bold', 'fmt-italic': 'italic', 'fmt-underline': 'underline' };
  Object.entries(cmds).forEach(([id, cmd]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const isActive = document.queryCommandState(cmd);
    btn.classList.toggle('fmt-active', isActive);
    // remove muted tint when active
    if (isActive) btn.classList.remove('muted');
    else if (id !== 'fmt-bold') btn.classList.add('muted');
  });
}

/* ─── EMAIL: ENTER KEY SENDS, SHIFT+ENTER NEW LINE ──── */
function initComposeKeydown() {
  const area = document.getElementById('compose-area');
  if (!area) return;
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendEmail();
    }
    // Shift+Enter: allow default browser behavior (new line in contenteditable)
  });
  // Update formatting button states on selection change
  area.addEventListener('keyup', updateFormatButtons);
  area.addEventListener('mouseup', updateFormatButtons);
}

/* ─── EMAIL: FONT FAMILY DROPDOWN ────────────────────── */
function toggleToolbarDropdown(id, event) {
  event.stopPropagation();
  const dd = document.getElementById(id);
  if (!dd) return;
  // close all other dropdowns first
  document.querySelectorAll('.toolbar-dropdown').forEach(d => {
    if (d.id !== id) d.classList.remove('open');
  });
  dd.classList.toggle('open');
}

function setFontFamily(family, item) {
  event.stopPropagation();
  const area = document.getElementById('compose-area');
  if (area) { area.focus(); document.execCommand('fontName', false, family); }
  document.getElementById('font-family-label').textContent = family;
  document.querySelectorAll('#font-family-dd .toolbar-dd-item').forEach(i => i.classList.remove('selected'));
  item.classList.add('selected');
  document.getElementById('font-family-dd').classList.remove('open');
}

function setFontSize(size, item) {
  event.stopPropagation();
  const area = document.getElementById('compose-area');
  if (area) {
    area.focus();
    // execCommand fontSize uses 1-7 scale; we use a span workaround
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      if (!range.collapsed) {
        const span = document.createElement('span');
        span.style.fontSize = size;
        range.surroundContents(span);
      } else {
        area.style.fontSize = size;
      }
    } else {
      area.style.fontSize = size;
    }
  }
  document.getElementById('font-size-label').textContent = size;
  document.querySelectorAll('#font-size-dd .toolbar-dd-item').forEach(i => i.classList.remove('selected'));
  item.classList.add('selected');
  document.getElementById('font-size-dd').classList.remove('open');
}

/* ─── EMAIL: SIMULATE REPLY ──────────────────────────── */
const REPLIES = [
  "Got it, thanks for the update!",
  "Sounds good. I'll review and get back to you.",
  "Perfect, I'll make the changes accordingly.",
  "Thank you! Is there anything else you need from me?",
  "Understood. I'll prepare the updated version by EOD.",
  "Great, let's touch base after the call.",
  "Noted. I'll loop in the team on this.",
  "Confirmed — I'll send the revised draft shortly."
];

function simulateReply() {
  const thread = document.getElementById('conversation-thread');
  if (!thread) return;

  // Typing indicator
  const typing = document.createElement('div');
  typing.className = 'thread-msg';
  typing.id = 'typing-indicator';
  typing.innerHTML =
    '<div class="thread-av" style="background:#2e8cff;">SJ</div>' +
    '<div class="thread-bubble typing-bubble">···</div>';
  thread.appendChild(typing);
  thread.scrollTop = thread.scrollHeight;

  setTimeout(() => {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();

    const reply   = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    const now     = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg     = document.createElement('div');
    msg.className = 'thread-msg';
    msg.innerHTML =
      '<div class="thread-av" style="background:#2e8cff;">SJ</div>' +
      '<div class="thread-bubble">' + reply +
      '<div class="thread-ts">' + timeStr + '</div></div>';
    thread.appendChild(msg);
    thread.scrollTop = thread.scrollHeight;
  }, 1800);
}

/* ─── EMAIL: SEND REPLY / FORWARD ───────────────────── */
function sendEmail() {
  const area = document.getElementById('compose-area');
  if (!area) return;

  // ── FORWARD MODE ──────────────────────────────────────
  if (_forwardMode) {
    const to = document.getElementById('fwd-to')?.value.trim() || '';
    if (!to) {
      showToast('Please enter a recipient');
      document.getElementById('fwd-to')?.focus();
      return;
    }
    // Check there is at least some body text beyond the quote
    // (innerText of the area includes the quote, so any content qualifies)
    const list     = document.querySelector('.email-list-panel');
    const firstRow = list?.querySelector('.email-row');
    if (list && firstRow) {
      const initials = to.split(/[\s@]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FW';
      const sentRow  = document.createElement('div');
      sentRow.className    = 'email-row';
      sentRow.dataset.sent = 'true';
      sentRow.setAttribute('onclick', 'selectEmail(this)');
      sentRow.innerHTML =
        '<div class="status-dot"></div>' +
        '<div class="email-avatar" style="background:#253471;">ST</div>' +
        '<div class="email-meta">' +
          '<div class="email-sender">You → ' + to + '</div>' +
          '<div class="email-subject">' + _forwardSubject + '</div>' +
        '</div>';
      list.insertBefore(sentRow, firstRow);
    }
    exitForwardMode();
    showToast('Forwarded to ' + to);
    return;
  }

  // ── REPLY MODE (default) ──────────────────────────────
  const text = area.innerText?.trim() || '';
  if (!text) {
    showToast('Please type a message first');
    return;
  }
  const content = area.innerHTML;

  // Append to conversation thread
  const thread = document.getElementById('conversation-thread');
  if (thread) {
    const now     = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg     = document.createElement('div');
    msg.className = 'thread-msg sent';
    msg.innerHTML =
      '<div class="thread-av sent-av">ST</div>' +
      '<div class="thread-bubble">' + content +
      '<div class="thread-ts">' + timeStr + '</div></div>';
    thread.appendChild(msg);
    thread.scrollTop = thread.scrollHeight;
  }

  // Register in Sent list so the Sent filter picks it up
  const selectedRow  = document.querySelector('.email-row.selected');
  const replySubject = 'RE: ' + (selectedRow?.querySelector('.email-subject')?.textContent || 'Email');
  const list     = document.querySelector('.email-list-panel');
  const firstRow = list?.querySelector('.email-row');
  if (list && firstRow) {
    const sentRow = document.createElement('div');
    sentRow.className    = 'email-row';
    sentRow.dataset.sent = 'true';
    sentRow.setAttribute('onclick', 'selectEmail(this)');
    sentRow.innerHTML =
      '<div class="status-dot"></div>' +
      '<div class="email-avatar" style="background:#253471;">ST</div>' +
      '<div class="email-meta">' +
        '<div class="email-sender">You (reply)</div>' +
        '<div class="email-subject">' + replySubject + '</div>' +
      '</div>';
    list.insertBefore(sentRow, firstRow);
  }

  area.innerHTML = '';
  showToast('Message sent');
  simulateReply();
}

/* ─── EMAIL: COMPOSE NEW EMAIL ───────────────────────── */
function composeNewEmail() {
  const to      = document.getElementById('comp-to')?.value.trim()      || '';
  const subject = document.getElementById('comp-subject')?.value.trim() || '(No subject)';
  const body    = document.getElementById('comp-body')?.value.trim()    || '';

  if (!to)   { showToast('Please enter a recipient'); return; }
  if (!body) { showToast('Please type a message'); return; }

  closeModal('compose-modal');

  const list     = document.querySelector('.email-list-panel');
  const firstRow = list?.querySelector('.email-row');
  if (list && firstRow) {
    const initials = to.split(/[\s@]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'XX';
    const newRow   = document.createElement('div');
    newRow.className      = 'email-row';
    newRow.dataset.sent   = 'true';
    newRow.setAttribute('onclick', 'selectEmail(this)');
    newRow.innerHTML =
      '<div class="status-dot"></div>' +
      '<div class="email-avatar" style="background:#253471;">' + initials + '</div>' +
      '<div class="email-meta">' +
        '<div class="email-sender">You → ' + to + '</div>' +
        '<div class="email-subject">' + subject + '</div>' +
      '</div>';
    list.insertBefore(newRow, firstRow);
  }

  ['comp-to', 'comp-subject', 'comp-body'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.value = '';
  });
  showToast('Email sent to ' + to);
}

/* ─── EMAIL: ACTION DROPDOWN (button) ────────────────── */
let _menuOpen    = false;
let _forwardMode = false;
let _forwardSubject = '';

function toggleActionMenu(event, btn) {
  event.stopPropagation();
  const menu = document.getElementById('action-menu');
  if (!menu) return;
  if (_menuOpen) {
    menu.classList.remove('open');
    _menuOpen = false;
    return;
  }
  menu.style.visibility = 'hidden';
  menu.classList.add('open');
  const rect  = btn.getBoundingClientRect();
  const menuW = menu.offsetWidth;
  menu.style.top  = (rect.bottom + 4) + 'px';
  menu.style.left = Math.max(8, rect.right - menuW) + 'px';
  menu.style.visibility = '';
  _menuOpen = true;
}

function emailAction(type) {
  const menu = document.getElementById('action-menu');
  if (menu) menu.classList.remove('open');
  _menuOpen = false;

  const selectedRow = document.querySelector('.email-row.selected');
  const subject = selectedRow?.querySelector('.email-subject')?.textContent || 'this email';

  if (type === 'markread' && selectedRow) {
    const dot = selectedRow.querySelector('.status-dot');
    if (dot) dot.classList.remove('unread');
    syncUnreadCount();
    showToast('Marked as read');
    return;
  }

  if (type === 'markunread' && selectedRow) {
    const dot = selectedRow.querySelector('.status-dot');
    if (dot) dot.classList.add('unread');
    syncUnreadCount();
    showToast('Marked as unread');
    return;
  }

  if (type === 'flag' && selectedRow) {
    if (selectedRow.classList.contains('flagged')) {
      selectedRow.classList.remove('flagged');
      selectedRow.dataset.flagged = 'false';
      selectedRow.querySelector('.flag-mark')?.remove();
      showToast('Flag removed');
    } else {
      selectedRow.classList.add('flagged');
      selectedRow.dataset.flagged = 'true';
      const flag = document.createElement('span');
      flag.className = 'flag-mark';
      flag.textContent = '🚩';
      flag.style.cssText = 'font-size:11px;flex-shrink:0;';
      selectedRow.appendChild(flag);
      showToast('Flagged');
    }
    return;
  }

  if (type === 'delete' && selectedRow) {
    selectedRow.style.display = 'none';
    showToast('"' + subject + '" deleted');
    return;
  }

  if (type === 'archive' && selectedRow) {
    selectedRow.dataset.archived = 'true';
    const activeTab = document.querySelector('.ftab.active');
    if (!activeTab || activeTab.textContent.trim() === 'Archive') {
      // Already in archive view, show it normally
    } else {
      selectedRow.style.display = 'none';
    }
    showToast('"' + subject + '" archived');
    return;
  }

  if (type === 'reply' || type === 'replyall') {
    exitForwardMode();
    document.getElementById('compose-area')?.focus();
    showToast(type === 'reply' ? 'Replying to "' + subject + '"…' : 'Replying all to "' + subject + '"…');
    return;
  }

  if (type === 'forward' && selectedRow) {
    const originalSubject = selectedRow.querySelector('.email-subject')?.textContent || 'Email';
    const originalSender  = selectedRow.querySelector('.email-sender')?.textContent  || 'Unknown';
    const fwdSubject      = 'Fwd: ' + originalSubject;

    // Capture original body text from the detail panel
    const bodyEl = document.querySelector('.email-body-text');
    const bodyLines = bodyEl ? bodyEl.innerText.trim().split('\n') : [];
    const quotedBody = bodyLines
      .map(l => '<div style="margin:0;">' + (l.trim() ? l : '&nbsp;') + '</div>')
      .join('');

    // Enter forward mode
    _forwardMode    = true;
    _forwardSubject = fwdSubject;

    const fwdHeader = document.getElementById('forward-header');
    if (fwdHeader) fwdHeader.classList.add('visible');

    const fwdSubjectDisplay = document.getElementById('fwd-subject-display');
    if (fwdSubjectDisplay) fwdSubjectDisplay.textContent = originalSubject;

    // Prefill compose area with blank top line + quoted original
    const area = document.getElementById('compose-area');
    if (area) {
      area.innerHTML =
        '<div><br></div>' +
        '<div style="border-left:3px solid #d1d5db;padding-left:12px;margin-top:8px;' +
             'color:#6b7280;font-size:13px;line-height:1.6;">' +
          '<div style="font-weight:600;margin-bottom:2px;">From: ' + originalSender + '</div>' +
          '<div style="font-weight:600;margin-bottom:8px;">Subject: ' + originalSubject + '</div>' +
          quotedBody +
        '</div>';
      // Place cursor at the very start (before the quote)
      const range = document.createRange();
      const sel   = window.getSelection();
      const firstChild = area.firstChild;
      if (firstChild) {
        range.setStart(firstChild, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    // Focus To field so user can type recipient immediately
    document.getElementById('fwd-to')?.focus();
    showToast('Forward: enter a recipient and send');
    return;
  }

  showToast('Done');
}

/* ─── EMAIL: EXIT FORWARD MODE ───────────────────────── */
function exitForwardMode() {
  _forwardMode    = false;
  _forwardSubject = '';
  const fwdHeader = document.getElementById('forward-header');
  if (fwdHeader) fwdHeader.classList.remove('visible');
  const fwdTo = document.getElementById('fwd-to');
  if (fwdTo) fwdTo.value = '';
  const area = document.getElementById('compose-area');
  if (area) area.innerHTML = '';
}

/* ─── CALENDAR: CREATE MEETING → grid ────────────────── */
function createMeeting() {
  const title    = document.getElementById('meet-title')?.value.trim()  || 'New Meeting';
  const dateVal  = document.getElementById('meet-date')?.value          || '';
  const timeVal  = document.getElementById('meet-time')?.value          || '';
  const platform = document.getElementById('meet-platform')?.value      || '';

  closeModal('meeting-modal');

  const dayCols = document.querySelectorAll('#cal-body .day-col');
  let targetCol = null;
  let topPx = 122; // default 9AM

  if (dateVal && timeVal) {
    const origin    = new Date('2026-03-09T00:00:00');
    const chosen    = new Date(dateVal + 'T00:00:00');
    const dayOffset = Math.round((chosen - origin) / 86400000);
    if (dayOffset >= 0 && dayOffset < dayCols.length) {
      targetCol = dayCols[dayOffset];
    }
    const [h, m] = timeVal.split(':').map(Number);
    topPx = ((h - 8) * 60 + m) / 60 * 122;
  }

  // Fallback to first column if date out of range
  if (!targetCol) targetCol = dayCols[0];

  if (targetCol) {
    const [h2, m2] = timeVal ? timeVal.split(':').map(Number) : [9, 0];
    const endMin   = (h2 * 60 + m2) + 30;
    const endH     = Math.floor(endMin / 60);
    const endM     = endMin % 60;
    const fmt = (hr, mn) => {
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const h12  = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
      return h12 + ':' + String(mn).padStart(2, '0') + ' ' + ampm;
    };

    const evt = document.createElement('div');
    evt.className = 'evt';
    evt.style.top    = Math.max(0, topPx) + 'px';
    evt.style.height = '42px';
    evt.style.background = '#dbeafe';
    const evtTitle = title;
    const evtTime  = timeVal ? fmt(h2, m2) + ' – ' + fmt(endH, endM) : 'All day';
    evt.innerHTML  =
      '<div class="evt-name">' + evtTitle + '</div>' +
      '<div class="evt-time">' + evtTime + '</div>';
    evt.onclick = () => {
      _currentEvtEl = evt;
      showEventDetailData(evtTitle, evtTime, platform, 'You', 'New meeting', platform, ['ST']);
    };
    targetCol.appendChild(evt);
  }

  showToast('"' + title + '" added to calendar' + (platform ? ' via ' + platform : ''));
  ['meet-title', 'meet-date', 'meet-time', 'meet-attendees', 'meet-platform'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.value = '';
  });
}

/* ─── CALENDAR: CANCEL EVENT ─────────────────────────── */
let _currentEvtEl = null;

function cancelEvent() {
  if (_currentEvtEl) {
    _currentEvtEl.classList.add('cancelled');
    _currentEvtEl.onclick = () => showToast('This event has been cancelled');
  }
  closeModal('event-detail-modal');
  showToast('Event cancelled');
}

/* ─── CALENDAR: JOIN MEETING POPUP ───────────────────── */
const PLATFORM_ICONS = {
  'Zoom':         '🎥',
  'Google Teams': '💬',
  'Google Meet':  '📹',
  'In Person':    '📍'
};

function joinMeeting(platform) {
  const iconEl = document.getElementById('join-platform-icon');
  const nameEl = document.getElementById('join-platform-name');
  if (iconEl) iconEl.textContent = PLATFORM_ICONS[platform] || '🔗';
  if (nameEl) nameEl.textContent = platform;
  openModal('join-modal');
}

function confirmJoin() {
  const platform = document.getElementById('join-platform-name')?.textContent || 'Platform';
  closeModal('join-modal');
  showToast('Connecting to ' + platform + '…');
}

/* ─── CALENDAR: CUSTOM DATE RANGE ────────────────────── */
function applyCustomRange() {
  const from = document.getElementById('range-from')?.value;
  const to   = document.getElementById('range-to')?.value;
  if (!from || !to) { showToast('Please select both dates'); return; }

  const startDate  = new Date(from + 'T00:00:00');
  const endDate    = new Date(to   + 'T00:00:00');
  if (endDate < startDate) { showToast('End date must be after start date'); return; }

  const dayNames   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  document.querySelectorAll('.cal-day-header').forEach((h, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    h.textContent = monthNames[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0') + ', ' + dayNames[d.getDay()];
  });

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn[data-filter="custom"]')?.classList.add('active');
  closeModal('custom-range-modal');
  showToast('Showing custom range');
}

/* ─── CALENDAR: EVENT DETAIL DATA ────────────────────── */
const EVENT_DATA = {
  e1: { title: 'Product Sync',              time: '09:30 – 10:00 AM', platform: 'Google Teams', host: 'Isabelle S.',   location: 'Google Teams',  attendees: ['IS','MD','AA'],         notes: 'Weekly product sync to align on roadmap items.' },
  e2: { title: 'StartUp',                   time: '10:30 – 11:30 AM', platform: 'Zoom',         host: 'Lena Park',     location: 'Zoom',          attendees: ['LP','ST','JM'],         notes: 'Startup investor pitch review session.' },
  e3: { title: '1:1 Manager',               time: '12:00 – 01:00 PM', platform: 'In Person',    host: 'Alex Chen',     location: 'Room 268',      attendees: ['AC','ST'],              notes: 'Monthly 1:1 check-in with your manager.' },
  e4: { title: 'Weekly Team Meeting',        time: '09:00 – 09:30 AM', platform: 'Google Meet',  host: 'Daisy Adams',   location: 'Google Meet',   attendees: ['DA','IS','LP','ST'],    notes: 'Weekly all-hands for the design team.' },
  e5: { title: 'Brainstorming Session',      time: '09:30 – 10:00 AM', platform: 'Google Teams', host: 'Marcus Weiss',  location: 'Google Teams',  attendees: ['MW','ST','JM'],         notes: 'Q2 campaign brainstorming.' },
  e6: { title: 'Workshop',                   time: '12:00 – 01:00 PM', platform: 'Zoom',         host: 'Sarah Johnson', location: 'Zoom',          attendees: ['SJ','IS','MD','AA'],    notes: 'UX research workshop.' },
  e7: { title: 'Quarterly Financial Review', time: '01:00 – 01:30 PM', platform: 'Google Meet',  host: 'Finance Team',  location: 'Google Meet',   attendees: ['FT','ST'],              notes: 'Q1 financial results presentation.' },
  e8: { title: 'Customer Feedback Analysis', time: '11:00 AM – 12:00 PM', platform: 'Zoom',      host: 'Lena Park',     location: 'Zoom',          attendees: ['LP','ST','MW'],         notes: 'Review of Q1 customer NPS data.' },
  e9: { title: 'Sony (Sarah & Shelley)',     time: '12:00 – 01:00 PM', platform: 'Google Teams', host: 'Sarah Johnson', location: 'Google Teams',  attendees: ['SJ','SH','ST'],         notes: 'Sony partnership contract discussion.' }
};

function showEventDetail(id) {
  _currentEvtEl = document.getElementById(id);
  const data = EVENT_DATA[id];
  if (!data) return;
  showEventDetailData(data.title, data.time, data.platform, data.host, data.notes, data.location, data.attendees);
}

function showEventDetailData(title, time, platform, host, notes, location, attendees) {
  document.getElementById('ed-title').textContent    = title    || '—';
  document.getElementById('ed-time').textContent     = time     || '—';
  document.getElementById('ed-platform').textContent = platform || '—';
  document.getElementById('ed-host').textContent     = host     || '—';
  document.getElementById('ed-location').textContent = location || platform || '—';
  document.getElementById('ed-notes').textContent    = notes    || '—';

  const avRow = document.getElementById('ed-attendees');
  if (avRow) {
    const list   = attendees || [];
    const colors = ['#2e8cff','#d03438','#4a3ac8','#f97316','#06b6d4','#8b5cf6'];
    avRow.innerHTML = list.map((a, i) =>
      '<div class="ed-av" style="background:' + colors[i % colors.length] + '">' + a + '</div>'
    ).join('');
  }

  document.getElementById('rsvp-status').textContent = '';
  openModal('event-detail-modal');
}

function rsvpEvent(response) {
  const statusEl = document.getElementById('rsvp-status');
  if (statusEl) {
    statusEl.textContent = response === 'accept' ? '✓ You accepted this meeting' : '✗ You declined this meeting';
    statusEl.style.color = response === 'accept' ? '#253471' : '#9da4b1';
  }
  showToast(response === 'accept' ? 'RSVP: Accepted' : 'RSVP: Declined');
}

/* ─── CONNECT TOOL (+1 badge) ────────────────────────── */
let _emailToolCount = 0;
let _calToolCount   = 0;

function connectTool() {
  const name = document.getElementById('tool-name')?.value.trim() || 'Tool';
  const type = document.getElementById('tool-type')?.value        || '';
  closeModal('tool-modal');

  const isCalType   = type === 'Calendar';
  const isEmailType = type === 'Email' || type === 'Communication';

  if (isCalType) {
    _calToolCount++;
    const badge = document.getElementById('cal-tool-badge');
    if (badge) { badge.textContent = '+' + _calToolCount; badge.classList.add('visible'); }
  } else {
    // Email, Communication, and everything else → email badge
    _emailToolCount++;
    const badge = document.getElementById('email-tool-badge');
    if (badge) { badge.textContent = '+' + _emailToolCount; badge.classList.add('visible'); }
  }

  ['tool-name', 'tool-type'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.value = '';
  });
  showToast('"' + name + '" connected successfully');
}

/* ─── TOAST ──────────────────────────────────────────── */
let _toastTimer = null;

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ─── SEARCH: LIVE FILTER ────────────────────────────── */
function initSearch() {
  const ovSearch = document.getElementById('ov-search');
  if (ovSearch) {
    ovSearch.addEventListener('input', () => {
      const q = ovSearch.value.toLowerCase();
      document.querySelectorAll('#overview-view .item-row').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  const emSearch = document.getElementById('em-search');
  if (emSearch) {
    emSearch.addEventListener('input', () => {
      const q = emSearch.value.toLowerCase();
      document.querySelectorAll('.email-row').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  const calSearch = document.getElementById('cal-search');
  if (calSearch) {
    calSearch.addEventListener('input', () => {
      const q = calSearch.value.toLowerCase();
      document.querySelectorAll('.evt').forEach(evt => {
        evt.style.display = evt.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
}

/* ─── EMAIL: FLAG BUTTON IN DETAIL PANEL ────────────── */
function toggleFlag(btn) {
  const selectedRow = document.querySelector('.email-row.selected');
  if (btn.classList.contains('flagged')) {
    btn.classList.remove('flagged');
    // update SVG stroke back to muted
    btn.querySelectorAll('path').forEach(p => p.setAttribute('stroke', '#9da4b1'));
    if (selectedRow) {
      selectedRow.classList.remove('flagged');
      selectedRow.dataset.flagged = 'false';
      selectedRow.querySelector('.flag-mark')?.remove();
    }
    showToast('Flag removed');
  } else {
    btn.classList.add('flagged');
    // update SVG stroke to red
    btn.querySelectorAll('path').forEach(p => p.setAttribute('stroke', '#ef4444'));
    if (selectedRow) {
      selectedRow.classList.add('flagged');
      selectedRow.dataset.flagged = 'true';
      if (!selectedRow.querySelector('.flag-mark')) {
        const flag = document.createElement('span');
        flag.className = 'flag-mark';
        flag.textContent = '🚩';
        flag.style.cssText = 'font-size:11px;flex-shrink:0;';
        selectedRow.appendChild(flag);
      }
    }
    showToast('Flagged');
  }
}

/* ─── FILE ATTACHMENT: FAKE DOWNLOAD ─────────────────── */
function fakeDownload(filename) {
  showToast('Downloading ' + filename + '…');
  setTimeout(() => {
    const blob = new Blob(
      ['[Prototype] This is a placeholder for: ' + filename + '\n\nContract content would appear here in production.'],
      { type: 'application/octet-stream' }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(filename + ' downloaded');
  }, 600);
}

/* ─── OVERVIEW: NAVIGATE TO CALENDAR EVENT ───────────── */
function openCalendarItem(eventId) {
  showView('calendar');
  // Small delay so the calendar view renders before opening modal
  setTimeout(() => showEventDetail(eventId), 80);
}

/* ─── OVERVIEW: NAVIGATE TO EMAIL ───────────────────── */
function openEmailItem(subject) {
  showView('email');
  setTimeout(() => {
    const rows = document.querySelectorAll('.email-row');
    for (const row of rows) {
      const subjectEl = row.querySelector('.email-subject');
      if (subjectEl && subjectEl.textContent.trim() === subject) {
        selectEmail(row);
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        break;
      }
    }
  }, 80);
}

/* ─── LOGOUT FLOW ────────────────────────────────────── */
function confirmLogout() {
  closeModal('logout-modal');
  // Brief pause then show login screen
  setTimeout(() => {
    document.getElementById('login-screen').classList.remove('hidden');
    // clear fields
    ['login-email', 'login-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('login-error').textContent = '';
  }, 200);
}

function doLogin() {
  const email = document.getElementById('login-email')?.value.trim() || '';
  const pass  = document.getElementById('login-password')?.value     || '';
  const errEl = document.getElementById('login-error');
  if (!email || !pass) {
    if (errEl) errEl.textContent = 'Please enter your email and password.';
    return;
  }
  if (errEl) errEl.textContent = '';
  document.getElementById('login-screen').classList.add('hidden');
  showToast('Welcome back, Shalimar!');
  showView('overview');
}

/* ─── SETTINGS PANEL ─────────────────────────────────── */
function openSettings() {
  document.getElementById('settings-panel')?.classList.add('open');
  document.getElementById('settings-backdrop')?.classList.add('open');
}

function closeSettings() {
  document.getElementById('settings-panel')?.classList.remove('open');
  document.getElementById('settings-backdrop')?.classList.remove('open');
}

/* ─── CLOSE ACTION MENU ON OUTSIDE CLICK ────────────── */
document.addEventListener('click', () => {
  const menu = document.getElementById('action-menu');
  if (menu && _menuOpen) {
    menu.classList.remove('open');
    _menuOpen = false;
  }
});

/* ─── INIT ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  initCalendarArrows();
  initCalendarFilters();
  initEmailFilters();
  initEmailContextMenu();
  initSearch();
  initOverviewFilters();
  initComposeKeydown();

  // Forward To field: Enter moves focus to compose area
  document.getElementById('fwd-to')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('compose-area')?.focus();
    }
  });

  // Close toolbar dropdowns on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.toolbar-dropdown').forEach(d => d.classList.remove('open'));
  });

  // Set unread count to reflect actual state on load
  syncUnreadCount();

  showView('overview');
});
