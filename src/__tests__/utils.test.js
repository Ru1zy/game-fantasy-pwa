import { calcTileType } from '../js/utils';

describe.each([
  [0, 8, 'top-left'],
  [3, 8, 'top'],
  [7, 8, 'top-right'],
  [16, 8, 'left'],
  [56, 8, 'bottom-left'],
  [60, 8, 'bottom'],
  [63, 8, 'bottom-right'],
  [15, 8, 'right'],
  [45, 8, 'center'],
])('check index %i', (index, boardSize, result) => {
  test(`match ${result}`, () => {
    expect(calcTileType(index, boardSize)).toBe(result);
  });
});
