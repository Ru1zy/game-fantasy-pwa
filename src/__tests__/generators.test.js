//import { characterGenerator, addNewCharacter } from '../js/Team';
import Team from '../js/Team';
import Bowman from '../js/characters/Bowman';
import Swordman from '../js/characters/Swordman';
import Magician from '../js/characters/Magician';
import Daemon from '../js/characters/Daemon';
import Vampire from '../js/characters/Vampire';
import Undead from '../js/characters/Undead';
const numberOfCharacters = 500;
const characterPlayerTypes = [Bowman, Swordman, Magician];
const characterEnemyTypes = [Daemon, Vampire, Undead];
const teamPlayer = new Team({
  side: 'player',
  allowedTypes: characterPlayerTypes,
  maxLevel: 4,
  characterCount: numberOfCharacters,
});
const teamEnemy = new Team({
  side: 'enemy',
  allowedTypes: characterEnemyTypes,
  maxLevel: 4,
  characterCount: numberOfCharacters,
});
test('Test number of new characters created (player)', () => {
  const characters = [];
  for (let i = 0; i < numberOfCharacters; i++)
    characters.push(teamPlayer.characterGenerator(characterPlayerTypes, 2));
  expect(characters.length).toBe(numberOfCharacters);
});
test('Test number of new characters created (enemy)', () => {
  const characters = [];
  for (let i = 0; i < numberOfCharacters; i++)
    characters.push(teamEnemy.characterGenerator(characterPlayerTypes, 2));
  expect(characters.length).toBe(numberOfCharacters);
});
test('Test team size (player)', () => {
  expect(teamPlayer.characters.length).toBe(numberOfCharacters);
});
test('Test team size (enemy)', () => {
  expect(teamEnemy.characters.length).toBe(numberOfCharacters);
});
describe('Test team level (player)', () => {
  test.each(teamPlayer.characters)('Test %o level', (character) => {
    expect(character.level).toBeLessThanOrEqual(4);
    expect(character.level).toBeGreaterThanOrEqual(1);
  });
});
describe('Test team level (enemy)', () => {
  test.each(teamEnemy.characters)('Test %o level', (character) => {
    expect(character.level).toBeLessThanOrEqual(4);
    expect(character.level).toBeGreaterThanOrEqual(1);
  });
});
