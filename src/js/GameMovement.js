export default class GameMovement {
  constructor(gamePlay, gameController) {
    this.gamePlay = gamePlay;
    this.gameController = gameController;
  }

  calcPosByDifference(index, { verticalDifference, horizontalDifference }) {
    return index + horizontalDifference + verticalDifference * this.gamePlay.boardSize;
  }

  calcDistance(characterPosition, cellIndex) {
    const { boardSize } = this.gamePlay;
    const verticalDifference =
      Math.floor(cellIndex / boardSize) - Math.floor(characterPosition / boardSize);
    const horizontalDifference =
      (cellIndex % boardSize) - (characterPosition % boardSize);
    const distance = Math.max(
      Math.abs(verticalDifference),
      Math.abs(horizontalDifference),
    );
    return { distance, verticalDifference, horizontalDifference };
  }

  moveCharacter(character, index) {
    this.gamePlay.deselectCell(character.position);
    character.position = index;
    this.gameController.redrawPositions();
  }

  availableForMoveCell({ character, position }, targetIndex) {
    const { distance } = this.calcDistance(position, targetIndex);
    const isEmpty = this.gameController.emptyCell(targetIndex);
    return isEmpty && character.moveRange >= distance;
  }

  getAvailableMoveCells(positionedChar) {
    const cells = [];
    const totalCells = this.gamePlay.boardSize ** 2;
    for (let i = 0; i < totalCells; i += 1) {
      if (this.availableForMoveCell(positionedChar, i)) {
        cells.push(i);
      }
    }
    return cells;
  }

  getAvailableAttackCells(positionedChar) {
    const cells = [];
    const totalCells = this.gamePlay.boardSize ** 2;
    for (let i = 0; i < totalCells; i += 1) {
      const { distance } = this.calcDistance(positionedChar.position, i);
      if (distance > 0 && distance <= positionedChar.character.attackRange) {
        cells.push(i);
      }
    }
    return cells;
  }
}
