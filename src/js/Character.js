/**
 * Базовый класс, от которого    наследуются классы персонажей:
 * swordsman
 * bowman
 * magician
 * daemon
 * undead
 * vampire
 */
export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 50;
    this.type = type;
    // выбросить исключение, если кто-то использует "new Character()"
    if (new.target.name === 'Character') {
      throw new Error('Dude, stop call dat. Call already created characters.');
    }
  }
}
