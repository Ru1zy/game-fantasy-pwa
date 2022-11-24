/*
  index - индекс поля
  boardSize - размер квадратного поля (в длину или ширину)
  @returns строка - тип ячейки на поле:
  top-left
  top-right
  top
  bottom-left
  bottom-right
  bottom
  right
  left
  center
 */
export function calcTileType(index, boardSize) {
  if (index === 0) return 'top-left';
  if (index > 0 && index < boardSize - 1) return 'top';
  if (index === boardSize - 1) return 'top-right';
  if (index === boardSize * (boardSize - 1)) return 'bottom-left';
  if (index > boardSize * (boardSize - 1) && index < boardSize * boardSize - 1)
    return 'bottom';
  if (index === boardSize * boardSize - 1) return 'bottom-right';
  if (index % boardSize === 0 && index !== 0 && index !== boardSize * (boardSize - 1))
    return 'left';
  if (
    index % boardSize === 7 &&
    index !== boardSize - 1 &&
    index !== boardSize * boardSize - 1
  )
    return 'right';
  return 'center';
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}

export function createCharacterInfo(char) {
  return `🎖${char.level} | ⚔${char.attack} | 🛡${char.defence} | ❤${char.health}`;
}
