import { calcHealthLevel, calcTileType } from './utils';
import soundfile from '../audio/classic.mp3';
import themes from './themes';

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
    this.playerFrozen = false;
    this.audio = new Audio(soundfile);
    this.hasClicked = false;
    this.isMuted = false;
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
          <div class="game-brand">
            <span class="game-title">⚔️ FANTASY TACTICS 2D</span>
            <span class="game-badge">PWA</span>
          </div>

          <div class="controls">
            <button data-id="action-restart" class="btn btn-primary" title="Начать игру заново">Новая игра</button>
            <button data-id="action-mode" class="btn btn-mode" title="Сменить режим">🤖 1P vs AI</button>
            <button data-id="action-save" class="btn btn-secondary" title="Сохранить прогресс">💾 Сохранить</button>
            <button data-id="action-load" class="btn btn-secondary" title="Загрузить сохранение">📂 Загрузить</button>
            <button data-id="action-audio" class="btn btn-icon" title="Звук Вкл/Выкл">🔊</button>
          </div>
        </header>

        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">УРОВЕНЬ</span>
            <span class="hud-value stat-level">1</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">ОЧКИ</span>
            <span class="hud-value stat-points">0</span>
          </div>
          <div class="hud-item highlight">
            <span class="hud-label">РЕКОРД</span>
            <span class="hud-value stat-highscore">0</span>
          </div>
          <div class="hud-turn-pill turn-player">
            <span class="turn-dot"></span>
            <span class="turn-text">Ход: Игрок (Свет)</span>
          </div>
        </div>

        <div class="board-container">
          <div data-id="board" class="board"></div>
        </div>

        <div class="game-legend">
          <span class="legend-item"><span class="legend-dot green"></span> Доступный ход</span>
          <span class="legend-item"><span class="legend-dot red"></span> Зона атаки</span>
          <span class="legend-item"><span class="legend-dot yellow"></span> Выбранный боец</span>
        </div>

        <!-- End of Match / Level Modal -->
        <div class="game-modal-overlay" id="gameModal" style="display: none;">
          <div class="game-modal">
            <h3 class="game-modal-title" id="gameModalTitle">Победа!</h3>
            <p class="game-modal-text" id="gameModalText">Раунд пройден</p>
            <button class="btn btn-primary game-modal-btn" id="gameModalBtn">Продолжить</button>
          </div>
        </div>

        <!-- Online Multiplayer Lobby Modal -->
        <div class="game-modal-overlay" id="onlineLobbyModal" style="display: none;">
          <div class="game-modal lobby-modal">
            <h3 class="game-modal-title">🌐 Онлайн-дуэль по ссылке</h3>
            <p class="game-modal-text" id="lobbyInstructions">Отправьте эту ссылку другу, чтобы сыграть вместе:</p>
            
            <div class="lobby-link-box" id="lobbyLinkContainer">
              <input type="text" readonly id="lobbyUrlInput" class="lobby-url-input" />
              <button class="btn btn-secondary" id="lobbyCopyBtn">📋 Копировать</button>
            </div>

            <div class="lobby-status-panel">
              <div class="lobby-status-text" id="lobbyStatusText">Ожидание подключения второго игрока...</div>
              <div class="lobby-players-indicator">
                <span class="player-badge" id="lobbyP1">Игрок 1 (Свет): ⏳ Ждем</span>
                <span class="player-badge" id="lobbyP2">Игрок 2 (Тьма): ⏳ Ждем</span>
              </div>
            </div>

            <div class="lobby-actions">
              <button class="btn btn-primary" id="lobbyReadyBtn" disabled>⚔️ Я готов к бою!</button>
              <button class="btn btn-secondary" id="lobbyCancelBtn">Отмена</button>
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

    this.boardEl = this.container.querySelector('[data-id=board]');
    this.boardEl.classList.add(theme);

    for (let i = 0; i < this.boardSize ** 2; i += 1) {
      const cellEl = document.createElement('div');
      cellEl.classList.add(
        'cell',
        'map-tile',
        `map-tile-${calcTileType(i, this.boardSize)}`,
      );
      cellEl.addEventListener('mouseenter', (event) => this.onCellEnter(event));
      cellEl.addEventListener('mouseleave', (event) => this.onCellLeave(event));
      cellEl.addEventListener('click', (event) => this.onCellClick(event));
      this.boardEl.appendChild(cellEl);
    }

    this.cells = Array.from(this.boardEl.querySelectorAll('.cell'));
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

  updateHud({ level = 1, points = 0, highScore = 0, currentTurn = 'player', gameMode = 'pve' } = {}) {
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
      if (gameMode === 'pve') {
        modeBtn.textContent = '🤖 1P vs AI';
      } else if (gameMode === 'pvp') {
        modeBtn.textContent = '👥 2P Hotseat';
      } else if (gameMode === 'online') {
        modeBtn.textContent = '🌐 2P Онлайн';
      }
    }

    if (turnPill && turnText) {
      turnPill.classList.remove('turn-player', 'turn-enemy');
      if (currentTurn === 'player') {
        turnPill.classList.add('turn-player');
        turnText.textContent = gameMode !== 'pve' ? 'Ход: Игрок 1 (Свет)' : 'Ход: Игрок';
      } else {
        turnPill.classList.add('turn-enemy');
        turnText.textContent = gameMode !== 'pve' ? 'Ход: Игрок 2 (Тьма)' : 'Ход: Компьютер';
      }
    }
  }

  showLobbyModal({ roomUrl, isHost, onReady, onCancel }) {
    const modal = this.container.querySelector('#onlineLobbyModal');
    const urlInput = this.container.querySelector('#lobbyUrlInput');
    const copyBtn = this.container.querySelector('#lobbyCopyBtn');
    const readyBtn = this.container.querySelector('#lobbyReadyBtn');
    const cancelBtn = this.container.querySelector('#lobbyCancelBtn');
    const statusText = this.container.querySelector('#lobbyStatusText');
    const p1Badge = this.container.querySelector('#lobbyP1');
    const p2Badge = this.container.querySelector('#lobbyP2');

    if (!modal) return;
    modal.style.display = 'flex';

    if (urlInput) urlInput.value = roomUrl || window.location.href;

    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(urlInput.value).then(() => {
          copyBtn.textContent = '✓ Скопировано!';
          setTimeout(() => { copyBtn.textContent = '📋 Копировать'; }, 2500);
        });
      };
    }

    if (readyBtn) {
      readyBtn.disabled = true;
      readyBtn.textContent = '⚔️ Я готов к бою!';
      readyBtn.onclick = () => {
        readyBtn.disabled = true;
        readyBtn.textContent = '✓ Вы готовы (Ожидание соперника)';
        if (onReady) onReady();
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal.style.display = 'none';
        if (onCancel) onCancel();
      };
    }

    if (statusText) {
      statusText.textContent = isHost
        ? 'Отправьте ссылку сопернику и дождитесь подключения...'
        : 'Подключение к хосту...';
    }

    if (p1Badge) p1Badge.textContent = 'Игрок 1 (Свет): ⏳ Ждем';
    if (p2Badge) p2Badge.textContent = 'Игрок 2 (Тьма): ⏳ Ждем';
  }

  updateLobbyStatus({ status, p1Ready, p2Ready, canReady }) {
    const statusText = this.container.querySelector('#lobbyStatusText');
    const readyBtn = this.container.querySelector('#lobbyReadyBtn');
    const p1Badge = this.container.querySelector('#lobbyP1');
    const p2Badge = this.container.querySelector('#lobbyP2');

    if (statusText && status) statusText.textContent = status;
    if (readyBtn && canReady !== undefined) readyBtn.disabled = !canReady;

    if (p1Badge) {
      p1Badge.textContent = p1Ready ? 'Игрок 1 (Свет): ✓ ГОТОВ' : 'Игрок 1 (Свет): ⏳ Готовится';
      p1Badge.classList.toggle('ready', p1Ready);
    }
    if (p2Badge) {
      p2Badge.textContent = p2Ready ? 'Игрок 2 (Тьма): ✓ ГОТОВ' : 'Игрок 2 (Тьма): ⏳ Готовится';
      p2Badge.classList.toggle('ready', p2Ready);
    }
  }

  closeLobbyModal() {
    const modal = this.container.querySelector('#onlineLobbyModal');
    if (modal) modal.style.display = 'none';
  }

  showEndGameModal(title, text, btnText = 'Играть снова', onConfirm = null) {
    const modal = this.container.querySelector('#gameModal');
    const modalTitle = this.container.querySelector('#gameModalTitle');
    const modalText = this.container.querySelector('#gameModalText');
    const modalBtn = this.container.querySelector('#gameModalBtn');

    if (!modal) return;
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalBtn.textContent = btnText;
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
    event.preventDefault();
    const index = this.cells.indexOf(event.currentTarget);
    this.lastEnteredCellIndex = index;
    if (this.playerFrozen) return;
    this.cellEnterListeners.forEach((o) => o.call(null, index));
  }

  onCellLeave(event) {
    event.preventDefault();
    const index = this.cells.indexOf(event.currentTarget);
    if (this.playerFrozen) return;
    this.cellLeaveListeners.forEach((o) => o.call(null, index));
  }

  onCellClick(event) {
    const index = this.cells.indexOf(event.currentTarget);
    if (this.playerFrozen) return;
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
