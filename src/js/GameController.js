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

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.movement = new GameMovement(gamePlay, this);
    this.playerCharacterTypes = [Swordman, Magician, Bowman];
    this.currentLevel = 0;
    this.currentTurn = 'player';
    this.selectedChar = null;
    this.enemyLogic = new EnemyLogic(this);
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
    // TODO: load saved stated from stateService
    this.startNewGame();
  }

  startNewGame() {
    this.points = 0;
    this.playerTeam = new Team(this.playerOptions);
    this.enemyTeam = this.generateEnemyTeam();
    this.positions = [];
    this.positionChars(this.playerTeam, this.enemyTeam);
    this.currentLevel = 0;
    this.startNextLevel();
    this.gamePlay.addSong();
    this.redrawPositions();
  }
  startNextLevel() {
    this.currentLevel += 1;
    if (this.currentLevel > 4) {
      this.gamePlay.showMessage('You win,let`s go it again!');
      this.startNewGame();
    }

    this.isLevelStart = true;
    this.currentTurn = 'player';
    this.selectedChar = null;
    this.gamePlay.drawUi(themes[this.currentLevel]);

    if (this.currentLevel > 1) {
      this.calculatePoints();
      this.positions = [];
      this.playerTeam.charactersLevelUp();

      const maxLvl = this.currentLevel - 1;
      this.playerTeam.addNewCharacter(this.playerCharacterTypes, maxLvl, maxLvl);
      this.enemyTeam = this.generateEnemyTeam();
      this.positionChars(this.playerTeam, this.enemyTeam);
      this.redrawPositions();
    }
  }

  generateEnemyTeam() {
    const options = {
      side: 'enemy',
      allowedTypes: [Daemon, Undead, Vampire],
      maxLevel: this.currentLevel,
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
    this.points += sum;
    const [pointsDiv] = document.getElementsByClassName('user-points');
    pointsDiv.textContent = `Your points: ${this.points}`;
  }

  getTeamPositions(side) {
    const positions = this.positions.filter((char) => char.character.side === side);
    return positions;
  }

  getCharByPosition(index) {
    const positionedChar = this.positions.find((char) => char.position === index);
    return positionedChar || null;
  }

  removePosChar(posChar) {
    const index = this.positions.findIndex((element) => element === posChar);
    if (index !== -1) {
      this.positions.splice(index, 1);
    } else {
      throw new Error('You can`t just delete non-existent character');
    }
    if (this.selectedChar === posChar) {
      this.selectedChar = null;
    }
  }

  redrawPositions() {
    this.gamePlay.redrawPositions(this.positions);
    if (this.selectedChar) {
      const index = this.selectedChar.position;
      this.gamePlay.selectCell(index, 'yellow');
    }
  }

  selectEnemyCharacter(index) {
    this.gamePlay.selectCell(index, 'red');
  }

  deselectEnemyCharacter(index) {
    if (index) {
      this.gamePlay.deselectCell(index);
    } else {
      const selected = document.querySelectorAll('selected-red');

      selected.forEach((elem) => elem.classList.remove('selected-red'));
    }
  }

  switchTurn(delay = 0) {
    return new Promise((resolve) => {
      if (this.isLevelStart) {
        this.gamePlay.isPlayerFrozen = false;
        this.currentTurn = 'player';
        return;
      }
      this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
      setTimeout(() => {
        if (this.currentTurn === 'enemy') {
          this.enemyTurn();
        } else {
          this.playerTurn();
        }
        resolve();
      }, delay);
    });
  }

  async enemyTurn() {
    this.gamePlay.isPlayerFrozen = true;
    this.gamePlay.setCursor(cursors.notallowed);

    await this.enemyLogic.doAction();
    await this.switchTurn(100);
  }

  playerTurn() {
    this.gamePlay.isPlayerFrozen = false;
    this.onCellEnter(this.gamePlay.lastEnteredCellIndex);
  }

  commitTeamDefeat(side) {
    if (side === 'player') {
      this.gamePlay.showMessage('You lose. Try again?');
      this.startNewGame();
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

  performPlayerAction(actionType, index) {
    this.isLevelStart = false;
    if (actionType === 'attack') {
      const enemy = this.getCharByPosition(index);
      this.performAttack(this.selectedChar, enemy);
    } else {
      this.movement.moveCharacter(this.selectedChar, index);
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
    if (targetChar.side === 'player') {
      this.gamePlay.deselectCell(target.position);
    }

    this.redrawPositions();
  }

  async onCellClick(index) {
    // react to click
    const selectedCell = document.getElementsByClassName('selected')[0];
    if (selectedCell) {
      selectedCell.classList.remove('selected', 'selected-yellow');
    }

    if (
      this.selectedChar &&
      this.movement.availableForMoveCell(this.selectedChar, index)
    ) {
      this.performPlayerAction('move', index);
      await this.switchTurn();
      return;
    }

    if (this.playerCell(index)) {
      this.gamePlay.selectCell(index);
      this.selectedChar = this.getCharByPosition(index);
    }

    if (this.enemyCell(index)) {
      if (this.selectedChar && this.availableForAttackCell(this.selectedChar, index)) {
        this.performPlayerAction('attack', index);
        await this.switchTurn();
      }
    }
  }

  onCellEnter(index) {
    // react to mouse enter
    if (!this.emptyCell(index)) {
      const positionedChar = this.positions.find((element) => element.position === index);
      const { character } = positionedChar;
      const message = createCharacterInfo(character);
      this.gamePlay.showCellTooltip(message, index);
    } else if (this.selectedChar) {
      //console.log('Under construction');
      this.cursorAtEmptyCell(this.selectedChar, index);
    }

    if (this.playerCell(index)) {
      this.gamePlay.setCursor(cursors.pointer);
    }

    if (this.selectedChar && this.enemyCell(index)) {
      this.cursorAtEnemyCell(this.selectedChar, index);
    }
  }

  onCellLeave(index) {
    if (this.selectedChar?.position !== index) {
      this.gamePlay.deselectCell(index);
    }

    this.gamePlay.setCursor(cursors.auto);
    const cell = this.gamePlay.cells[index];
    if (cell.classList.contains('character')) {
      this.gamePlay.hideCellTooltip(index);
    }
  }

  getCellChildIndex(index) {
    const cell = this.gamePlay.cells[index];
    //console.log(cell.firstChild);
    return cell.firstChild;
  }

  playerCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return cellChild?.classList.contains('player');
  }

  enemyCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return cellChild?.classList.contains('enemy');
  }

  emptyCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return !cellChild;
  }

  cursorAtEnemyCell(playerChar, index) {
    if (this.availableForAttackCell(playerChar, index)) {
      this.gamePlay.setCursor(cursors.crosshair);
      this.gamePlay.selectCell(index, 'red-dashed');
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
    }
  }

  cursorAtEmptyCell(playerChar, index) {
    if (this.movement.availableForMoveCell(playerChar, index)) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
    }
  }
}
