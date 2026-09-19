import themes from './themes';
import Team from './Team';
import Bowman from './characters/Bowman';
import Daemon from './characters/Daemon';
import Magician from './characters/Magician';
import Swordman from './characters/Swordman';
import Undead from './characters/Undead';
import Vampire from './characters/Vampire';
import PositionedCharacter from './PositionedCharacter';
import { createCharacterInfo } from './utils';
import GameMovement from './GameMovement';
import cursors from './cursors';
import EnemyLogic from './EnemyLogic';
import GameState from './GameState';
import NetworkManager from './NetworkManager';
import { t } from './i18n';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.movement = new GameMovement(gamePlay, this);
    this.network = new NetworkManager(this);
    this.playerCharacterTypes = [Swordman, Magician, Bowman];
    this.enemyCharacterTypes = [Daemon, Undead, Vampire];
    this.currentLevel = 0;
    this.currentTurn = 'player';
    this.selectedChar = null;
    this.enemyLogic = new EnemyLogic(this);
    this.gameMode = 'pve'; // 'pve' | 'pvp' | 'online'
    this.isOnlineHost = false;
    this.isLocalReady = false;
    this.isRemoteReady = false;
    this.highScore = Number(localStorage.getItem('fantasy_pwa_highscore')) || 0;
    this.points = 0;
    this.p1Wins = 0;
    this.p2Wins = 0;

    this.playerOptions = {
      side: 'player',
      allowedTypes: [Swordman, Magician, Bowman],
      maxLevel: 1,
      characterCount: 2,
    };
  }

  init() {
    this.gamePlay.addCellEnterListener((index) => this.onCellEnter(index));
    this.gamePlay.addCellClickListener((index) => this.onCellClick(index));
    this.gamePlay.addCellLeaveListener((index) => this.onCellLeave(index));
    this.gamePlay.addNewGameListener(() => this.startNewGame());
    this.gamePlay.addLoadGameListener(() => this.loadHandler());
    this.gamePlay.addSaveGameListener(() => this.saveHandler());
    this.gamePlay.addModeChangeListener(() => this.cycleGameMode());
    this.gamePlay.addLanguageChangeListener(() => {
      this.updateHud();
      if (this.gamePlay.lastEnteredCellIndex !== undefined) {
        this.onCellEnter(this.gamePlay.lastEnteredCellIndex);
      }
    });

    this.startNewGame();

    // Проверка ссылки на онлайн-комнату при открытии
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      this.cleanUrlParams();
      setTimeout(() => {
        this.joinOnlineRoom(roomFromUrl);
      }, 400);
    }
  }

  cleanUrlParams() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('room')) {
        url.searchParams.delete('room');
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch (e) {}
  }

  cycleGameMode() {
    if (this.gameMode === 'pve') {
      this.gameMode = 'pvp';
      this.startNewGame();
    } else if (this.gameMode === 'pvp') {
      this.startOnlineLobby();
    } else {
      this.cleanUrlParams();
      this.network.disconnect();
      this.gameMode = 'pve';
      this.startNewGame();
    }
    this.updateHud();
  }

  startOnlineLobby() {
    this.gameMode = 'online';
    this.isOnlineHost = true;
    this.isLocalReady = false;
    this.isRemoteReady = false;

    this.network.createRoom().then((roomUrl) => {
      this.gamePlay.showLobbyModal({
        isHost: true,
        roomUrl,
        onReady: () => this.handleLocalReady(),
        onCancel: () => {
          this.cleanUrlParams();
          this.network.disconnect();
          this.gameMode = 'pve';
          this.startNewGame();
        },
      });
    }).catch((err) => {
      this.gamePlay.showMessage(t('lobbyErrorConnect', { error: err.message }));
      this.cleanUrlParams();
      this.gameMode = 'pve';
      this.updateHud();
    });
  }

  joinOnlineRoom(roomId) {
    this.cleanUrlParams();
    this.gameMode = 'online';
    this.isOnlineHost = false;
    this.isLocalReady = false;
    this.isRemoteReady = false;

    this.gamePlay.showLobbyModal({
      isHost: false,
      roomUrl: window.location.href,
      onReady: () => this.handleLocalReady(),
      onCancel: () => {
        this.cleanUrlParams();
        this.network.disconnect();
        this.gameMode = 'pve';
        this.startNewGame();
      },
    });

    this.network.joinRoom(roomId, (attempt, max) => {
      this.gamePlay.updateLobbyStatus({
        status: t('lobbyStatusGuestConnecting', { attempt, max }),
        isHost: false,
      });
    }).catch((err) => {
      this.gamePlay.showMessage(t('lobbyErrorConnect', { error: err.message }));
      this.cleanUrlParams();
      this.gameMode = 'pve';
      this.updateHud();
    });
  }

  onNetworkConnected(isHost) {
    this.gamePlay.updateLobbyStatus({
      status: isHost
        ? (this.isLocalReady ? t('lobbyStatusWaitingOpponent') : t('lobbyStatusConnected'))
        : t('lobbyStatusConnected'),
      canReady: !this.isLocalReady,
      isHost,
    });
  }

  handleLocalReady() {
    this.isLocalReady = true;
    this.network.send({ type: 'ready' });

    this.gamePlay.updateLobbyStatus({
      status: this.isRemoteReady ? t('lobbyStatusBothReady') : t('lobbyStatusWaitingOpponent'),
      p1Ready: this.isOnlineHost ? this.isLocalReady : this.isRemoteReady,
      p2Ready: this.isOnlineHost ? this.isRemoteReady : this.isLocalReady,
      canReady: false,
      isHost: this.isOnlineHost,
    });

    if (this.isRemoteReady && this.isOnlineHost) {
      setTimeout(() => this.launchOnlineMatch(), 600);
    }
  }

  launchOnlineMatch() {
    this.startNewGame();
    const gameState = GameState.from(this);
    this.network.send({ type: 'start_game', state: gameState });
    this.gamePlay.closeLobbyModal();
    this.updateHud();
  }

  onNetworkMessage(data) {
    if (!data) return;

    if (data.type === 'ready') {
      this.isRemoteReady = true;
      this.gamePlay.updateLobbyStatus({
        status: this.isLocalReady ? t('lobbyStatusBothReady') : t('lobbyStatusOpponentReady'),
        p1Ready: this.isOnlineHost ? this.isLocalReady : this.isRemoteReady,
        p2Ready: this.isOnlineHost ? this.isRemoteReady : this.isLocalReady,
        canReady: !this.isLocalReady,
        isHost: this.isOnlineHost,
      });

      if (this.isLocalReady && this.isOnlineHost) {
        setTimeout(() => this.launchOnlineMatch(), 600);
      }
    } else if (data.type === 'start_game') {
      const savedData = GameState.getSavedData(data.state);
      const { gameControllerProperties: properties, playerChar, enemyChar } = savedData;

      for (const prop in properties) {
        this[prop] = properties[prop];
      }
      this.playerTeam.characters = playerChar;
      this.enemyTeam.characters = enemyChar;
      this.gameMode = 'online';
      this.isOnlineHost = false;
      this.gamePlay.changeTheme(this.currentLevel);
      this.gamePlay.clearRanges();
      this.redrawPositions();
      this.playerTurn();
      this.updateHud();
      this.gamePlay.closeLobbyModal();
    } else if (data.type === 'action') {
      const actor = this.getCharByPosition(data.from);
      if (data.actionType === 'move') {
        this.movement.moveCharacter(actor, data.to);
      } else if (data.actionType === 'attack') {
        const target = this.getCharByPosition(data.to);
        this.performAttack(actor, target);
      }
      this.switchTurnInternal();
    } else if (data.type === 'rematch') {
      if (this.isOnlineHost) {
        this.launchOnlineMatch();
      }
    }
  }

  onNetworkDisconnected() {
    this.cleanUrlParams();
    this.gamePlay.showMessage(t('lobbyDisconnected'));
    this.gameMode = 'pve';
    this.updateHud();
  }

  saveHandler() {
    const data = GameState.from(this);
    this.stateService.save(data);
    this.gamePlay.showMessage(t('saveSuccess'));
  }

  loadHandler() {
    let data;
    try {
      data = this.stateService.load();
    } catch (e) {
      this.gamePlay.showMessage(e.message);
      return;
    }

    const savedData = GameState.getSavedData(data);
    const { gameControllerProperties: properties, playerChar, enemyChar } = savedData;

    for (const prop in properties) {
      this[prop] = properties[prop];
    }
    this.playerTeam.characters = playerChar;
    this.enemyTeam.characters = enemyChar;
    this.gamePlay.changeTheme(this.currentLevel);
    this.gamePlay.clearRanges();
    this.redrawPositions();
    this.updateHud();

    if (this.currentTurn === 'enemy' && this.gameMode === 'pve') {
      this.enemyTurn();
    }
    this.gamePlay.showMessage(t('loadSuccess'));
  }

  startNewGame() {
    this.points = 0;
    this.playerTeam = new Team(this.playerOptions);
    this.enemyTeam = this.generateEnemyTeam();
    this.positions = [];
    this.positionChars(this.playerTeam, this.enemyTeam);
    this.currentLevel = 0;
    this.gamePlay.clearRanges();
    this.startNextLevel();
    this.redrawPositions();

    document.addEventListener(
      'click',
      () => {
        if (!this.gamePlay.hasClicked) {
          this.gamePlay.addSong();
          this.gamePlay.hasClicked = true;
        }
      },
      { once: true },
    );
  }

  startNextLevel() {
    this.currentLevel += 1;
    this.isLevelStart = true;
    this.currentTurn = 'player';
    this.selectedChar = null;
    this.gamePlay.clearRanges();

    if (this.currentLevel === 1) {
      this.gamePlay.drawUi(themes[this.currentLevel]);
    } else {
      this.gamePlay.changeTheme(this.currentLevel);
      this.calculatePoints();
      this.positions = [];

      this.playerTeam.charactersLevelUp();

      const maxLvl = Math.max(1, Math.min(this.currentLevel - 1, 4));
      const charsToAdd = Math.min(2, Math.max(1, Math.floor(this.currentLevel / 2)));
      this.playerTeam.addNewCharacter(this.playerCharacterTypes, maxLvl, charsToAdd);

      this.enemyTeam = this.generateEnemyTeam();
      this.positionChars(this.playerTeam, this.enemyTeam);
      this.redrawPositions();
    }

    this.updateHud();
  }

  generateEnemyTeam() {
    let enemyMaxLevel = 1;
    if (this.currentLevel > 1) {
      enemyMaxLevel = Math.max(1, Math.min(Math.floor(this.currentLevel * 0.8) + 1, 4));
    }

    const options = {
      side: 'enemy',
      allowedTypes: this.enemyCharacterTypes,
      maxLevel: enemyMaxLevel,
      characterCount: this.playerTeam.length,
    };
    return new Team(options, this);
  }

  generatePosition(side) {
    const { boardSize } = this.gamePlay;
    const rowStart = Math.floor(Math.random() * boardSize) * boardSize;
    const randomOffset = Math.floor(Math.random() * 2);
    const teamOffset = side === 'enemy' ? boardSize - 2 : 0;
    return rowStart + randomOffset + teamOffset;
  }

  positionChars(...teams) {
    for (const team of teams) {
      for (const char of team) {
        let position;
        do {
          position = this.generatePosition(team.side);
        } while (this.getCharByPosition(position));

        const positionedChar = new PositionedCharacter(char, position);
        this.positions.push(positionedChar);
      }
    }
  }

  availableForAttackCell(actor, targetPosition) {
    const { character, position } = actor;
    const target = this.getCharByPosition(targetPosition);
    const { distance } = this.movement.calcDistance(position, targetPosition);
    return target && character.attackRange >= distance;
  }

  calculatePoints() {
    let sum = 0;
    for (const char of this.playerTeam) {
      sum += char.health;
    }
    this.points += sum * this.currentLevel;

    if (this.points > this.highScore) {
      this.highScore = this.points;
      try {
        localStorage.setItem('fantasy_pwa_highscore', String(this.highScore));
      } catch (e) {}
    }
  }

  updateHud() {
    this.gamePlay.updateHud({
      level: this.currentLevel,
      points: this.points,
      highScore: this.highScore,
      currentTurn: this.currentTurn,
      gameMode: this.gameMode,
      isOnlineHost: this.isOnlineHost,
    });
  }

  getTeamPositions(side) {
    return this.positions.filter((char) => char.character.side === side);
  }

  getCharByPosition(index) {
    const positionedChar = this.positions.find((char) => char.position === index);
    return positionedChar || null;
  }

  removePosChar(posChar) {
    const index = this.positions.findIndex((element) => element === posChar);
    if (index !== -1) {
      this.positions.splice(index, 1);
    }
    if (this.selectedChar === posChar) {
      this.selectedChar = null;
      this.gamePlay.clearRanges();
    }
  }

  redrawPositions() {
    this.gamePlay.redrawPositions(this.positions);
    if (this.selectedChar) {
      const index = this.selectedChar.position;
      this.gamePlay.selectCell(index, 'yellow');
      this.showRangesForChar(this.selectedChar);
    }
  }

  showRangesForChar(posChar) {
    this.gamePlay.clearRanges();
    if (!posChar) return;

    const availableMoves = this.movement.getAvailableMoveCells(posChar);
    this.gamePlay.showMoveRange(availableMoves);

    const availableAttacks = this.movement.getAvailableAttackCells(posChar);
    this.gamePlay.showAttackRange(availableAttacks);
  }

  selectEnemyCharacter(index) {
    this.gamePlay.selectCell(index, 'red');
  }

  deselectEnemyCharacter(index) {
    if (index) {
      this.gamePlay.deselectCell(index);
    } else {
      const selected = document.querySelectorAll('.selected-red');
      selected.forEach((elem) => elem.classList.remove('selected-red'));
    }
  }

  switchTurnInternal() {
    this.selectedChar = null;
    this.gamePlay.clearRanges();

    if (this.isLevelStart) {
      this.gamePlay.playerFrozen = false;
      this.currentTurn = 'player';
      this.updateHud();
      return;
    }

    this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
    this.updateHud();
  }

  switchTurn(delay = 0) {
    return new Promise((resolve) => {
      this.switchTurnInternal();

      setTimeout(() => {
        if (this.currentTurn === 'enemy') {
          if (this.gameMode === 'pvp') {
            this.gamePlay.playerFrozen = false;
            this.redrawPositions();
          } else if (this.gameMode === 'online') {
            // В онлайн-режиме управление на стороне игрока 2 (Тьма)
            this.gamePlay.playerFrozen = this.isOnlineHost;
            this.redrawPositions();
          } else {
            this.enemyTurn();
          }
        } else {
          this.playerTurn();
        }
        resolve();
      }, delay);
    });
  }

  async enemyTurn() {
    this.gamePlay.playerFrozen = true;
    this.gamePlay.setCursor(cursors.notallowed);

    await this.enemyLogic.doAction();
    await this.switchTurn(100);
  }

  playerTurn() {
    if (this.gameMode === 'online') {
      this.gamePlay.playerFrozen = !this.isOnlineHost;
    } else {
      this.gamePlay.playerFrozen = false;
    }
    this.redrawPositions();
    if (this.gamePlay.lastEnteredCellIndex !== undefined) {
      this.onCellEnter(this.gamePlay.lastEnteredCellIndex);
    }
  }

  commitTeamDefeat(side) {
    if (this.gameMode !== 'pve') {
      let winnerText = '';
      if (this.gameMode === 'online') {
        const isPlayerDefeat = side === 'player';
        const won = (this.isOnlineHost && !isPlayerDefeat) || (!this.isOnlineHost && isPlayerDefeat);
        winnerText = won ? t('onlineWinYou') : t('onlineLoseYou');
      } else {
        winnerText = side === 'player' ? t('pvpWinP2') : t('pvpWinP1');
        if (side === 'player') this.p2Wins += 1;
        else this.p1Wins += 1;
      }

      this.gamePlay.showEndGameModal(
        t('victory'),
        winnerText,
        t('playAgain'),
        () => {
          if (this.gameMode === 'online') {
            this.network.send({ type: 'rematch' });
            if (this.isOnlineHost) this.launchOnlineMatch();
          } else {
            this.startNewGame();
          }
        },
      );
      return;
    }

    if (side === 'player') {
      this.calculatePoints();
      this.gamePlay.showEndGameModal(
        t('gameOver'),
        t('allFallen'),
        t('playAgain'),
        () => this.startNewGame(),
      );
    } else {
      this.startNextLevel();
    }
  }

  removeCharacter(posChar, side) {
    const team = side === 'player' ? this.playerTeam : this.enemyTeam;
    this.removePosChar(posChar);
    team.removeCharacter(posChar.character);
    if (!team.length) {
      this.commitTeamDefeat(side);
    }
  }

  performAction(actionType, index) {
    this.isLevelStart = false;
    const actorPos = this.selectedChar.position;

    if (actionType === 'attack') {
      const target = this.getCharByPosition(index);
      this.performAttack(this.selectedChar, target);
    } else {
      this.movement.moveCharacter(this.selectedChar, index);
    }

    if (this.gameMode === 'online') {
      this.network.send({
        type: 'action',
        actionType,
        from: actorPos,
        to: index,
      });
    }
  }

  performAttack(actor, target) {
    const anyChar = actor.character;
    const targetChar = target.character;
    const damage = anyChar.calculateDamage(targetChar);
    targetChar.health -= damage;
    this.gamePlay.showDamage(target.position, damage);

    if (targetChar.health <= 0) {
      this.removeCharacter(target, targetChar.side);
    }
    this.gamePlay.deselectCell(target.position);
    this.redrawPositions();
  }

  async onCellClick(index) {
    if (this.gameMode === 'online') {
      // Проверяем право хода онлайн-игрока
      const isMyTurn = (this.isOnlineHost && this.currentTurn === 'player') ||
                       (!this.isOnlineHost && this.currentTurn === 'enemy');
      if (!isMyTurn) return;
    }

    const activeSide = this.currentTurn;
    const opponentSide = activeSide === 'player' ? 'enemy' : 'player';

    // 1. Перемещение выбранного юнита в свободную клетку
    if (
      this.selectedChar &&
      this.movement.availableForMoveCell(this.selectedChar, index)
    ) {
      this.performAction('move', index);
      await this.switchTurn();
      return;
    }

    // 2. Атака вражеского юнита
    if (this.selectedChar && this.isCellSide(index, opponentSide)) {
      if (this.availableForAttackCell(this.selectedChar, index)) {
        this.performAction('attack', index);
        await this.switchTurn();
        return;
      }
    }

    // 3. Выбор своего бойца активным игроком
    if (this.isCellSide(index, activeSide)) {
      const posChar = this.getCharByPosition(index);
      if (this.selectedChar === posChar) {
        this.selectedChar = null;
        this.gamePlay.deselectCell(index);
        this.gamePlay.clearRanges();
      } else {
        this.selectedChar = posChar;
        this.redrawPositions();
      }
    }
  }

  onCellEnter(index) {
    const activeSide = this.currentTurn;
    const opponentSide = activeSide === 'player' ? 'enemy' : 'player';

    if (!this.emptyCell(index)) {
      const positionedChar = this.getCharByPosition(index);
      if (positionedChar) {
        let message = createCharacterInfo(positionedChar.character);

        if (
          this.selectedChar &&
          positionedChar.character.side === opponentSide &&
          this.availableForAttackCell(this.selectedChar, index)
        ) {
          const dmg = this.selectedChar.character.calculateDamage(positionedChar.character);
          message += ` | ${t('estDamage', { dmg })}`;
        }

        this.gamePlay.showCellTooltip(message, index);
      }
    } else if (this.selectedChar) {
      this.cursorAtEmptyCell(this.selectedChar, index);
    }

    if (this.isCellSide(index, activeSide)) {
      this.gamePlay.setCursor(cursors.pointer);
    }

    if (this.selectedChar && this.isCellSide(index, opponentSide)) {
      this.cursorAtEnemyCell(this.selectedChar, index);
    }
  }

  onCellLeave(index) {
    if (this.selectedChar?.position !== index) {
      this.gamePlay.deselectCell(index);
    }

    this.gamePlay.setCursor(cursors.auto);
    this.gamePlay.hideCellTooltip(index);
  }

  isCellSide(index, side) {
    const char = this.getCharByPosition(index);
    return char && char.character.side === side;
  }

  emptyCell(index) {
    return !this.getCharByPosition(index);
  }

  cursorAtEnemyCell(actor, index) {
    if (this.availableForAttackCell(actor, index)) {
      this.gamePlay.setCursor(cursors.crosshair);
      this.gamePlay.selectCell(index, 'red-dashed');
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
    }
  }

  cursorAtEmptyCell(actor, index) {
    if (this.movement.availableForMoveCell(actor, index)) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
    }
  }
}
