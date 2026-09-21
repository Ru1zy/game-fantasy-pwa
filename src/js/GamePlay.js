import { calcHealthLevel, calcTileType } from './utils';
import soundfile from '../audio/classic.mp3';
import themes from './themes';
import { t, getLang, setLang } from './i18n';

export default class GamePlay {
  constructor() {
    this.boardSize = 8;
    this.container = null;
    this.boardEl = null;
    this.cells = [];
    this.cellClickListeners = [];
    this.cellEnterListeners = [];
    this.cellLeaveListeners = [];
    this.newGameListeners = [];
    this.saveGameListeners = [];
    this.loadGameListeners = [];
    this.modeChangeListeners = [];
    this.langChangeListeners = [];
    this.playerFrozen = false;
    this.audio = new Audio(soundfile);
    this.hasClicked = false;
    this.isMuted = false;
    this.lastHudState = null;
    this.currentLobbyParams = null;
    this.toastTimeout = null;
  }

  bindToDOM(container) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('container is not HTMLElement');
    }
    this.container = container;
  }

  /**
   * Draws boardEl with HUD and specific theme
   *
   * @param theme
   */
  drawUi(theme) {
    this.checkBinding();

    this.container.innerHTML = `
      <div class="game-wrapper">
        <header class="game-header">
          <div class="header-main">
            <div class="game-brand">
              <span class="game-title">⚔️ FANTASY TACTICS 2D</span>
              <span class="game-badge">PWA</span>
            </div>

            <div class="header-tools">
              <div class="lang-switcher" id="langSwitcher" title="Сменить язык / Switch Language">
                <button class="lang-btn ${getLang() === 'ru' ? 'active' : ''}" data-lang="ru">RU</button>
                <button class="lang-btn ${getLang() === 'en' ? 'active' : ''}" data-lang="en">EN</button>
              </div>
              <button data-id="action-audio" class="btn btn-icon" title="${t('audioTitle')}">🔊</button>
            </div>
          </div>

          <div class="controls">
            <button data-id="action-restart" class="btn btn-primary" title="${t('newGameTitle')}">
              <span class="btn-text full">${t('newGame')}</span>
              <span class="btn-text short">${t('newGameShort')}</span>
            </button>
            <button data-id="action-mode" class="btn btn-mode" title="${t('modeTitle')}">
              <span class="btn-text full">${t('modePve')}</span>
              <span class="btn-text short">${t('modePveShort')}</span>
            </button>
            <button data-id="action-save" class="btn btn-secondary" title="${t('saveTitle')}">
              <span class="btn-text full">${t('save')}</span>
              <span class="btn-text short">${t('saveShort')}</span>
            </button>
            <button data-id="action-load" class="btn btn-secondary" title="${t('loadTitle')}">
              <span class="btn-text full">${t('load')}</span>
              <span class="btn-text short">${t('loadShort')}</span>
            </button>
          </div>
        </header>

        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label label-level">${t('level')}</span>
            <span class="hud-value stat-level">1</span>
          </div>
          <div class="hud-item">
            <span class="hud-label label-points">${t('points')}</span>
            <span class="hud-value stat-points">0</span>
          </div>
          <div class="hud-item highlight">
            <span class="hud-label label-record">${t('record')}</span>
            <span class="hud-value stat-highscore">0</span>
          </div>
          <div class="hud-turn-pill turn-player">
            <span class="turn-dot"></span>
            <span class="turn-text">${t('turnPlayer')}</span>
          </div>
        </div>

        <div class="board-container">
          <div data-id="board" class="board"></div>
        </div>

        <div class="game-legend">
          <span class="legend-item"><span class="legend-dot green"></span> <span class="legend-move-text">${t('legendMove')}</span></span>
          <span class="legend-item"><span class="legend-dot red"></span> <span class="legend-attack-text">${t('legendAttack')}</span></span>
          <span class="legend-item"><span class="legend-dot yellow"></span> <span class="legend-select-text">${t('legendSelect')}</span></span>
        </div>

        <!-- End of Match / Level Modal -->
        <div class="game-modal-overlay" id="gameModal" style="display: none;">
          <div class="game-modal">
            <h3 class="game-modal-title" id="gameModalTitle">${t('victory')}</h3>
            <p class="game-modal-text" id="gameModalText">${t('roundCleared')}</p>
            <button class="btn btn-primary game-modal-btn" id="gameModalBtn">${t('continue')}</button>
          </div>
        </div>

        <!-- Online Multiplayer Lobby Modal -->
        <div class="game-modal-overlay" id="onlineLobbyModal" style="display: none;">
          <div class="game-modal lobby-modal">
            <h3 class="game-modal-title" id="lobbyTitle">${t('lobbyTitle')}</h3>
            <p class="game-modal-text" id="lobbyInstructions">${t('lobbyInstructions')}</p>
            
            <div class="lobby-link-box" id="lobbyLinkContainer">
              <input type="text" readonly id="lobbyUrlInput" class="lobby-url-input" />
              <button class="btn btn-secondary" id="lobbyCopyBtn">${t('lobbyCopy')}</button>
            </div>

            <div class="lobby-status-panel">
              <div class="lobby-status-text" id="lobbyStatusText">${t('lobbyStatusHostWait')}</div>
              <div class="lobby-players-indicator">
                <span class="player-badge" id="lobbyP1">${t('p1Waiting')}</span>
                <span class="player-badge" id="lobbyP2">${t('p2Waiting')}</span>
              </div>
            </div>

            <div class="lobby-actions">
              <button class="btn btn-primary" id="lobbyReadyBtn" disabled>${t('lobbyReady')}</button>
              <button class="btn btn-secondary" id="lobbyCancelBtn">${t('lobbyCancel')}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.newGameEl = this.container.querySelector('[data-id=action-restart]');
    this.saveGameEl = this.container.querySelector('[data-id=action-save]');
    this.loadGameEl = this.container.querySelector('[data-id=action-load]');
    this.modeEl = this.container.querySelector('[data-id=action-mode]');
    this.audioEl = this.container.querySelector('[data-id=action-audio]');

    this.newGameEl.addEventListener('click', (event) => this.onNewGameClick(event));
    this.saveGameEl.addEventListener('click', (event) => this.onSaveGameClick(event));
    this.loadGameEl.addEventListener('click', (event) => this.onLoadGameClick(event));
    this.modeEl.addEventListener('click', (event) => this.onModeClick(event));
    this.audioEl.addEventListener('click', () => this.toggleAudio());

    this.container.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.getAttribute('data-lang');
        if (lang && lang !== getLang()) {
          setLang(lang);
          this.applyLanguage();
          this.langChangeListeners.forEach((cb) => cb(lang));
        }
      });
    });

    this.boardEl = this.container.querySelector('[data-id=board]');
    this.boardEl.classList.add(theme);

    for (let i = 0; i < this.boardSize ** 2; i += 1) {
      const cellEl = document.createElement('div');
      cellEl.classList.add(
        'cell',
        'map-tile',
        `map-tile-${calcTileType(i, this.boardSize)}`,
      );
      cellEl.setAttribute('role', 'button');
      cellEl.setAttribute('tabindex', '0');

      let lastTouchTime = 0;
      let touchStartX = 0;
      let touchStartY = 0;

      cellEl.addEventListener('mouseenter', (event) => this.onCellEnter(event));
      cellEl.addEventListener('mouseleave', (event) => this.onCellLeave(event));

      cellEl.addEventListener(
        'touchstart',
        (e) => {
          if (e.touches && e.touches[0]) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }
        },
        { passive: true },
      );

      cellEl.addEventListener(
        'touchend',
        (e) => {
          if (e.changedTouches && e.changedTouches[0]) {
            const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
            const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
            if (dx < 12 && dy < 12) {
              lastTouchTime = Date.now();
              this.onCellEnter(e);
              this.onCellClick(e);
            }
          }
        },
        { passive: true },
      );

      cellEl.addEventListener('click', (event) => {
        if (Date.now() - lastTouchTime < 400) return;
        this.onCellClick(event);
      });

      this.boardEl.appendChild(cellEl);
    }

    this.cells = Array.from(this.boardEl.querySelectorAll('.cell'));
    this.applyLanguage();
  }

  showToast(message, type = 'warning') {
    let toast = this.container.querySelector('.game-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'game-toast';
      this.container.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `game-toast show toast-${type}`;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  applyLanguage() {
    const lang = getLang();
    document.documentElement.lang = lang;

    this.container.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    if (this.newGameEl) {
      const full = this.newGameEl.querySelector('.btn-text.full');
      const short = this.newGameEl.querySelector('.btn-text.short');
      if (full) full.textContent = t('newGame');
      if (short) short.textContent = t('newGameShort');
      this.newGameEl.title = t('newGameTitle');
    }
    if (this.saveGameEl) {
      const full = this.saveGameEl.querySelector('.btn-text.full');
      const short = this.saveGameEl.querySelector('.btn-text.short');
      if (full) full.textContent = t('save');
      if (short) short.textContent = t('saveShort');
      this.saveGameEl.title = t('saveTitle');
    }
    if (this.loadGameEl) {
      const full = this.loadGameEl.querySelector('.btn-text.full');
      const short = this.loadGameEl.querySelector('.btn-text.short');
      if (full) full.textContent = t('load');
      if (short) short.textContent = t('loadShort');
      this.loadGameEl.title = t('loadTitle');
    }
    if (this.audioEl) {
      this.audioEl.title = t('audioTitle');
    }

    const labelLevel = this.container.querySelector('.label-level');
    const labelPoints = this.container.querySelector('.label-points');
    const labelRecord = this.container.querySelector('.label-record');
    if (labelLevel) labelLevel.textContent = t('level');
    if (labelPoints) labelPoints.textContent = t('points');
    if (labelRecord) labelRecord.textContent = t('record');

    const legendMove = this.container.querySelector('.legend-move-text');
    const legendAttack = this.container.querySelector('.legend-attack-text');
    const legendSelect = this.container.querySelector('.legend-select-text');
    if (legendMove) legendMove.textContent = t('legendMove');
    if (legendAttack) legendAttack.textContent = t('legendAttack');
    if (legendSelect) legendSelect.textContent = t('legendSelect');

    const lobbyTitle = this.container.querySelector('#lobbyTitle');
    const lobbyCancel = this.container.querySelector('#lobbyCancelBtn');
    const lobbyCopy = this.container.querySelector('#lobbyCopyBtn');
    if (lobbyTitle) lobbyTitle.textContent = t('lobbyTitle');
    if (lobbyCancel) lobbyCancel.textContent = t('lobbyCancel');
    if (lobbyCopy) lobbyCopy.textContent = t('lobbyCopy');

    if (this.lastHudState) {
      this.updateHud(this.lastHudState);
    }
  }

  addLanguageChangeListener(callback) {
    this.langChangeListeners.push(callback);
  }

  changeTheme(levelNumber) {
    for (const theme in themes) {
      this.boardEl.classList.remove(themes[theme]);
    }
    const themeName = themes[levelNumber] || 'prairie';
    this.boardEl.classList.add(themeName);
  }

  showMoveRange(cellIndices) {
    cellIndices.forEach((index) => {
      if (this.cells[index]) {
        this.cells[index].classList.add('range-move');
      }
    });
  }

  showAttackRange(cellIndices) {
    cellIndices.forEach((index) => {
      if (this.cells[index]) {
        this.cells[index].classList.add('range-attack');
      }
    });
  }

  clearRanges() {
    for (const cell of this.cells) {
      cell.classList.remove('range-move', 'range-attack', 'range-target');
    }
  }

  updateHud({ level = 1, points = 0, highScore = 0, currentTurn = 'player', gameMode = 'pve', isOnlineHost = true } = {}) {
    this.lastHudState = { level, points, highScore, currentTurn, gameMode, isOnlineHost };

    const levelEl = this.container.querySelector('.stat-level');
    const pointsEl = this.container.querySelector('.stat-points');
    const highScoreEl = this.container.querySelector('.stat-highscore');
    const turnPill = this.container.querySelector('.hud-turn-pill');
    const turnText = this.container.querySelector('.turn-text');
    const modeBtn = this.container.querySelector('[data-id=action-mode]');

    if (levelEl) levelEl.textContent = level;
    if (pointsEl) pointsEl.textContent = points;
    if (highScoreEl) highScoreEl.textContent = highScore;

    if (modeBtn) {
      modeBtn.title = t('modeTitle');
      const full = modeBtn.querySelector('.btn-text.full');
      const short = modeBtn.querySelector('.btn-text.short');
      let fullText = '';
      let shortText = '';

      if (gameMode === 'pve') {
        fullText = t('modePve');
        shortText = t('modePveShort');
      } else if (gameMode === 'pvp') {
        fullText = t('modePvp');
        shortText = t('modePvpShort');
      } else if (gameMode === 'online') {
        fullText = t('modeOnline');
        shortText = t('modeOnlineShort');
      }

      if (full && short) {
        full.textContent = fullText;
        short.textContent = shortText;
      } else {
        modeBtn.textContent = fullText;
      }
    }

    if (turnPill && turnText) {
      turnPill.classList.remove('turn-player', 'turn-enemy');
      if (currentTurn === 'player') {
        turnPill.classList.add('turn-player');
        if (gameMode === 'pve') {
          turnText.textContent = t('turnPlayer');
        } else if (gameMode === 'pvp') {
          turnText.textContent = t('turnPlayer1');
        } else {
          turnText.textContent = isOnlineHost ? t('turnOnlineYouLight') : t('turnOnlineOpponentLight');
        }
      } else {
        turnPill.classList.add('turn-enemy');
        if (gameMode === 'pve') {
          turnText.textContent = t('turnAi');
        } else if (gameMode === 'pvp') {
          turnText.textContent = t('turnPlayer2');
        } else {
          turnText.textContent = isOnlineHost ? t('turnOnlineOpponentDark') : t('turnOnlineYouDark');
        }
      }
    }
  }

  showLobbyModal({ roomUrl, isHost, onReady, onCancel }) {
    this.currentLobbyParams = { roomUrl, isHost, onReady, onCancel };
    const modal = this.container.querySelector('#onlineLobbyModal');
    const urlInput = this.container.querySelector('#lobbyUrlInput');
    const copyBtn = this.container.querySelector('#lobbyCopyBtn');
    const readyBtn = this.container.querySelector('#lobbyReadyBtn');
    const cancelBtn = this.container.querySelector('#lobbyCancelBtn');
    const statusText = this.container.querySelector('#lobbyStatusText');
    const p1Badge = this.container.querySelector('#lobbyP1');
    const p2Badge = this.container.querySelector('#lobbyP2');
    const instructions = this.container.querySelector('#lobbyInstructions');
    const linkBox = this.container.querySelector('#lobbyLinkContainer');

    if (!modal) return;
    modal.style.display = 'flex';

    if (urlInput) urlInput.value = roomUrl || window.location.href;

    if (instructions) {
      instructions.textContent = isHost ? t('lobbyInstructions') : t('lobbyStatusGuestConnecting', { attempt: 1, max: 6 });
    }

    if (linkBox) {
      linkBox.style.display = isHost ? 'flex' : 'none';
    }

    if (copyBtn) {
      copyBtn.textContent = t('lobbyCopy');
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(urlInput.value).then(() => {
          copyBtn.textContent = t('lobbyCopied');
          setTimeout(() => { copyBtn.textContent = t('lobbyCopy'); }, 2500);
        });
      };
    }

    if (readyBtn) {
      readyBtn.disabled = !isHost;
      readyBtn.textContent = t('lobbyReady');
      readyBtn.onclick = () => {
        readyBtn.disabled = true;
        readyBtn.textContent = t('lobbyYouReady');
        if (onReady) onReady();
      };
    }

    if (cancelBtn) {
      cancelBtn.textContent = t('lobbyCancel');
      cancelBtn.onclick = () => {
        modal.style.display = 'none';
        if (onCancel) onCancel();
      };
    }

    if (statusText) {
      statusText.textContent = isHost ? t('lobbyStatusHostWait') : t('lobbyStatusGuestConnecting', { attempt: 1, max: 6 });
    }

    // Explicitly show who YOU are in the room!
    if (p1Badge) {
      p1Badge.classList.remove('ready');
      if (isHost) {
        p1Badge.textContent = t('p1HostYou');
        p1Badge.classList.add('ready');
      } else {
        p1Badge.textContent = t('p1Waiting');
      }
    }

    if (p2Badge) {
      p2Badge.classList.remove('ready');
      if (isHost) {
        p2Badge.textContent = t('p2Waiting');
      } else {
        p2Badge.textContent = t('p2GuestYou');
        p2Badge.classList.add('ready');
      }
    }
  }

  updateLobbyStatus({ status, p1Ready, p2Ready, canReady, isHost }) {
    const statusText = this.container.querySelector('#lobbyStatusText');
    const readyBtn = this.container.querySelector('#lobbyReadyBtn');
    const p1Badge = this.container.querySelector('#lobbyP1');
    const p2Badge = this.container.querySelector('#lobbyP2');

    if (statusText && status) statusText.textContent = status;
    if (readyBtn && canReady !== undefined) readyBtn.disabled = !canReady;

    if (p1Badge) {
      if (p1Ready) {
        p1Badge.textContent = t('p1Ready');
        p1Badge.classList.add('ready');
      } else if (isHost) {
        p1Badge.textContent = t('p1HostYou');
        p1Badge.classList.add('ready');
      } else {
        p1Badge.textContent = t('p1HostOther');
        p1Badge.classList.add('ready');
      }
    }

    if (p2Badge) {
      if (p2Ready) {
        p2Badge.textContent = t('p2Ready');
        p2Badge.classList.add('ready');
      } else if (isHost) {
        p2Badge.textContent = p2Ready ? t('p2Ready') : t('p2GuestOther');
        p2Badge.classList.toggle('ready', Boolean(p2Ready));
      } else {
        p2Badge.textContent = t('p2GuestYou');
        p2Badge.classList.add('ready');
      }
    }
  }

  closeLobbyModal() {
    const modal = this.container.querySelector('#onlineLobbyModal');
    if (modal) modal.style.display = 'none';
  }

  showEndGameModal(title, text, btnText = null, onConfirm = null) {
    const modal = this.container.querySelector('#gameModal');
    const modalTitle = this.container.querySelector('#gameModalTitle');
    const modalText = this.container.querySelector('#gameModalText');
    const modalBtn = this.container.querySelector('#gameModalBtn');

    if (!modal) return;
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalBtn.textContent = btnText || t('playAgain');
    modal.style.display = 'flex';

    modalBtn.onclick = () => {
      modal.style.display = 'none';
      if (onConfirm) onConfirm();
    };
  }

  redrawPositions(positions) {
    for (const cell of this.cells) {
      cell.innerHTML = '';
    }

    for (const positionOfCharacter of positions) {
      const { position, character } = positionOfCharacter;
      const cellEl = this.cells[position];
      if (!cellEl) continue;

      const charEl = document.createElement('div');
      charEl.classList.add('character', character.type, character.side);

      const healthEl = document.createElement('div');
      healthEl.classList.add('health-level');

      const healthIndicatorEl = document.createElement('div');
      healthIndicatorEl.classList.add(
        'health-level-indicator',
        `health-level-indicator-${calcHealthLevel(character.health)}`,
      );
      healthIndicatorEl.style.width = `${character.health}%`;
      healthEl.appendChild(healthIndicatorEl);

      charEl.appendChild(healthEl);
      cellEl.appendChild(charEl);
    }
  }

  addCellEnterListener(callback) {
    this.cellEnterListeners.push(callback);
  }

  addCellLeaveListener(callback) {
    this.cellLeaveListeners.push(callback);
  }

  addCellClickListener(callback) {
    this.cellClickListeners.push(callback);
  }

  addNewGameListener(callback) {
    this.newGameListeners.push(callback);
  }

  addSaveGameListener(callback) {
    this.saveGameListeners.push(callback);
  }

  addLoadGameListener(callback) {
    this.loadGameListeners.push(callback);
  }

  addModeChangeListener(callback) {
    this.modeChangeListeners.push(callback);
  }

  onModeClick(event) {
    event.preventDefault();
    this.modeChangeListeners.forEach((o) => o.call(null));
  }

  onCellEnter(event) {
    if (event.preventDefault && event.cancelable) event.preventDefault();
    const raw = event.currentTarget || event.target;
    const cell = raw && raw.closest ? raw.closest('.cell') : raw;
    const index = this.cells.indexOf(cell);
    if (index === -1) return;
    this.lastEnteredCellIndex = index;
    if (this.playerFrozen) return;
    this.cellEnterListeners.forEach((o) => o.call(null, index));
  }

  onCellLeave(event) {
    if (event.preventDefault && event.cancelable) event.preventDefault();
    const raw = event.currentTarget || event.target;
    const cell = raw && raw.closest ? raw.closest('.cell') : raw;
    const index = this.cells.indexOf(cell);
    if (index === -1) return;
    if (this.playerFrozen) return;
    this.cellLeaveListeners.forEach((o) => o.call(null, index));
  }

  onCellClick(event) {
    const raw = event.currentTarget || event.target;
    const cell = raw && raw.closest ? raw.closest('.cell') : raw;
    const index = this.cells.indexOf(cell);
    if (index === -1) return;
    this.cellClickListeners.forEach((o) => o.call(null, index));
  }

  onNewGameClick(event) {
    event.preventDefault();
    this.newGameListeners.forEach((o) => o.call(null));
  }

  onSaveGameClick(event) {
    event.preventDefault();
    this.saveGameListeners.forEach((o) => o.call(null));
  }

  onLoadGameClick(event) {
    event.preventDefault();
    this.loadGameListeners.forEach((o) => o.call(null));
  }

  showError(message) {
    alert(message);
  }

  showMessage(message) {
    alert(message);
  }

  selectCell(index, color = 'yellow') {
    this.deselectCell(index);
    if (this.cells[index]) {
      this.cells[index].classList.add('selected', `selected-${color}`);
    }
  }

  deselectCell(index) {
    if (this.cells[index]) {
      const cell = this.cells[index];
      cell.classList.remove(
        ...Array.from(cell.classList).filter((o) => o.startsWith('selected')),
      );
    }
  }

  showCellTooltip(message, index) {
    if (this.cells[index]) {
      this.cells[index].title = message;
    }
  }

  hideCellTooltip(index) {
    if (this.cells[index]) {
      this.cells[index].title = '';
    }
  }

  showDamage(index, damage) {
    return new Promise((resolve) => {
      const cell = this.cells[index];
      if (!cell) {
        resolve();
        return;
      }
      const { offsetTop, offsetLeft } = cell;
      const damageEl = document.createElement('span');
      damageEl.textContent = damage;
      damageEl.classList.add('damage');
      damageEl.style.top = `${offsetTop}px`;
      damageEl.style.left = `${offsetLeft}px`;
      cell.insertAdjacentElement('afterend', damageEl);

      damageEl.addEventListener('animationend', () => {
        damageEl.remove();
        resolve();
      });
    });
  }

  setCursor(cursor) {
    if (this.boardEl) {
      this.boardEl.style.cursor = cursor;
    }
  }

  checkBinding() {
    if (this.container === null) {
      throw new Error('GamePlay not bind to DOM');
    }
  }

  toggleAudio() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.audio.pause();
      if (this.audioEl) this.audioEl.textContent = '🔇';
    } else {
      this.audio.play().catch(() => {});
      if (this.audioEl) this.audioEl.textContent = '🔊';
    }
  }

  addSong() {
    if (this.isMuted) return;
    this.audio.currentTime = 0;
    this.audio.preload = 'auto';
    this.audio.loop = true;
    this.audio.volume = 0.35;
    this.audio.play().catch(() => {});
  }
}
