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
}
