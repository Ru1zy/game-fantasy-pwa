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

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.movement = new GameMovement(gamePlay, this);
    this.playerCharacterTypes = [Swordman, Magician, Bowman];
    this.currentLevel = 0;
    this.currentTurn = 'player';
    this.selectedChar = null;
    this.playerOptions = {
      side: 'player',
      allowedTypes: [Swordman, Magician, Bowman],
      maxLevel: 1,
      characterCount: 2,
    };
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

  init() {
    this.theme = themes.prairie;
    this.gamePlay.drawUi(this.theme);
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.addNewGameListener(() => this.startNewGame());
    this.gamePlay.addCellEnterListener((index) => this.onCellEnter(index));
    this.gamePlay.addCellClickListener((index) => this.onCellClick(index));
    this.gamePlay.addCellLeaveListener((index) => this.onCellLeave(index));
    this.startNewGame();
  }

  startNewGame() {
    this.playerTeam = new Team(this.playerOptions);
    this.enemyTeam = this.generateEnemyTeam();
    this.positions = [];
    this.positionChars(this.playerTeam, this.enemyTeam);
    this.currentLevel = 0;

    this.redrawPositions();
  }

  redrawPositions() {
    this.gamePlay.redrawPositions(this.positions);
    if (this.selectedChar) {
      const index = this.selectedChar.position;
      this.gamePlay.selectCell(index, 'yellow');
    }
  }

  getCharByPosition(index) {
    const positionedChar = this.positions.find((char) => char.position === index);
    return positionedChar || null;
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

  getTeamPositions(side) {
    const positions = this.positions.filter((char) => char.character.side === side);
    return positions;
  }

  getCellChildIndex(index) {
    const cell = this.gamePlay.cells[index];
    //console.log(cell.firstChild);
    return cell.firstChild;
  }

  enemyCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return cellChild?.classList.contains('enemy');
  }

  playerCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return cellChild?.classList.contains('player');
  }

  emptyCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return !cellChild;
  }

  selectEnemyCharacter(index) {
    this.gamePlay.selectCell(index, 'red');
  }

  deselectEnemyCharacter(index) {
    if (index) {
      this.gamePlay.deselectCell(index);
    } else {
      const selected = document.getElementsByClassName('selected-red');
      selected.forEach((element) => element.classList.remove('selected-red'));
    }
  }

  availableForAttackCell(player, targetPosition) {
    const { character, position } = player;
    const target = this.getCharByPosition(targetPosition);
    const { distance } = this.movement.calcDistance(position, targetPosition);
    return target && character.attackRange >= distance;
  }

  performPlayerAction(actionType, index) {
    this.isLevelStart = false;
    if (actionType === 'attack') {
      const enemy = this.getCharByPosition(index);
      this;
    }
    this.movement.moveCharacter(this.selectedChar, index);
  }

  performAttack(player, target) {
    const playerChar = player.character;
    const targetChar = target.character;
    const damage = playerChar; //...;
  }

  cursorAtEmptyCell(playerChar, index) {
    if (this.movement.availableForMoveCell(playerChar, index)) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
    }
  }

  cursorAtEnemyCell(playerChar, index) {
    if (this.movement.availableForMoveCell(playerChar, index)) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
    }
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
      return;
    }

    if (this.playerCell(index)) {
      this.gamePlay.selectCell(index);
      this.selectedChar = this.getCharByPosition(index);
    }

    if (this.enemyCell(index)) {
      this.gamePlay.selectCell(index);
      this.selectedChar = this.getCharByPosition(index);
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
}
