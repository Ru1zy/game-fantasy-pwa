import Character from '../js/Character.js';
import Bowman from '../js/characters/Bowman';
import Swordman from '../js/characters/Swordman';
import Magician from '../js/characters/Magician';
import Daemon from '../js/characters/Daemon';
import Vampire from '../js/characters/Vampire';
import Undead from '../js/characters/Undead';

test('New Character should throw exception', () => {
  expect(() => new Character()).toThrowError();
});

describe.each([
  [Bowman, 2, 32, 32, 50, 'bowman'],
  [Swordman, 2, 52, 13, 50, 'swordman'],
  [Magician, 2, 13, 52, 50, 'magician'],
  [Vampire, 2, 32, 32, 50, 'vampire'],
  [Undead, 2, 52, 13, 50, 'undead'],
  [Daemon, 2, 13, 13, 50, 'daemon'],
])('description', (characterClass, level, attack, defence, health, type) => {
  test(`testing ${characterClass.name}`, () => {
    const character = new characterClass(level);

    expect(character).toHaveProperty('level', 2);
    expect(character).toHaveProperty('attack', attack);
    expect(character).toHaveProperty('defence', defence);
    expect(character).toHaveProperty('health', health);
    expect(character).toHaveProperty('type', type);
  });
});
