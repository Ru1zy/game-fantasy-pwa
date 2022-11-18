/**
 * Формирует экземпляр персонажа из массива allowedTypes со
 * случайным уровнем от 1 до maxLevel
 *
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @returns генератор, который при каждом вызове
 * возвращает новый экземпляр класса персонажа
 *
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  // TODO: write logic here
  while (true) {
    const length = Math.floor(Math.random() * allowedTypes.length);
    const level = Math.ceil(Math.random() * maxLevel);
    yield { character: new allowedTypes[length](level), level };
  }
}

/**
 * Формирует массив персонажей на основе characterGenerator
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @param characterCount количество персонажей, которое нужно сформировать
 * @returns экземпляр Team, хранящий экземпляры персонажей. Количество персонажей в команде - characterCount
 * */
export function generateTeam(
  allowedTypes,
  maxLevel,
  characterCount,
  fury = false
) {
  const newCharacter = characterGenerator(allowedTypes, maxLevel);
  const team = [];
  for (let i = 0; i < characterCount; i++) {
    const newest = newCharacter.next().value;
    if (fury && newest.level !== 1) {
      newest.character.attack += 5 * (newest.level - 1);
      newest.character.defence += 5 * (newest.level - 1);
    }
    team.push(newest.character);
  }
  return team;
}
