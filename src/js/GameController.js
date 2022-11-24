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

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
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

  getCellChildIndex(index) {
    const cell = this.gamePlay.cells[index];
    return cell.firstChild;
  }

  playerCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return cellChild?.classlist.contains('player');
  }

  enemyCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return cellChild?.classlist.contains('enemy');
  }

  emptyCell(index) {
    const cellChild = this.getCellChildIndex(index);
    return !cellChild;
  }

  onCellClick(index) {
    // TODO: react to click
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    if (!this.emptyCell(index)) {
      const positionedChar = this.positions.find((element) => element.position === index);
      const { character } = positionedChar;
      const message = createCharacterInfo(character);
      this.gamePlay.showCellTooltip(message, index);
    } else {
      console.log('Under construction');
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
  }
}
/*cursorAtEmptyCell (playerChar, index) {
    if (this.movement)
  }*/
