import Bowman from './characters/Bowman';
import Daemon from './characters/Daemon';
import Magician from './characters/Magician';
import Swordman from './characters/Swordman';
import Undead from './characters/Undead';
import Vampire from './characters/Vampire';
import PositionedCharacter from './PositionedCharacter';

export default class GameState {
  static characterClasses = {
    daemon: Daemon,
    swordman: Swordman,
    magician: Magician,
    bowman: Bowman,
    undead: Undead,
    vampire: Vampire,
  };

  static from({ positions, currentTurn, currentLevel, points, gameMode, highScore, p1Wins, p2Wins }) {
    const savedPositions = [];
    for (const positionedChar of positions) {
      const { character, position } = positionedChar;
      const properties = { ...character };
      const formatPositionedChar = {
        position,
        properties,
        constructorName: character.type,
      };
      savedPositions.push(formatPositionedChar);
    }
    return {
      currentTurn,
      currentLevel,
      points,
      savedPositions,
      gameMode: gameMode || 'pve',
      highScore: highScore || 0,
      p1Wins: p1Wins || 0,
      p2Wins: p2Wins || 0,
    };
  }

  static getSavedData({
    currentTurn,
    currentLevel,
    points,
    savedPositions,
    gameMode = 'pve',
    highScore = 0,
    p1Wins = 0,
    p2Wins = 0,
  }) {
    const playerChar = [];
    const enemyChar = [];
    const positions = [];

    for (const savedCharacter of savedPositions) {
      const { position, properties, constructorName } = savedCharacter;
      const constructor = this.characterClasses[constructorName];
      const newCharacter = new constructor(1);

      for (const prop in properties) {
        newCharacter[prop] = properties[prop];
      }
      const positionedChar = new PositionedCharacter(newCharacter, position);
      positions.push(positionedChar);
      if (newCharacter.side === 'player') {
        playerChar.push(newCharacter);
      } else {
        enemyChar.push(newCharacter);
      }
    }
    return {
      playerChar,
      enemyChar,
      gameControllerProperties: {
        currentTurn,
        currentLevel,
        points,
        positions,
        gameMode,
        highScore,
        p1Wins,
        p2Wins,
      },
    };
  }
}
