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
    this._health = 50;
    this.type = type;
    // выбросить исключение, если кто-то использует "new Character()"
    if (new.target.name === 'Character') {
      throw new Error('Dude, stop call dat. Call already created characters.');
    }
  }
  get health() {
    return this._health;
  }

  set health(points) {
    this._health = points;
    if (this._health > 100) {
      this._health = 100;
    }
    if (this._health <= 0) {
      this._health = 0;
    }
  }

  calculateDamage(target) {
    const damage = Math.max(this.attack - target.defence, this.attack * 0.1);
    return Math.ceil(damage);
  }

  increaseStats(stat) {
    const newValue = Math.max(this[stat], (this[stat] * (80 + this.health)) / 100);
    this[stat] = Math.floor(newValue);
  }

  levelUp() {
    this.level += 1;
    this.health += 80;
    this.increaseStats('attack');
    this.increaseStats('defence');
  }

  levelUpNewCharacter() {
    for (let i = 1; i < this.level; i++) {
      this.increaseStats('attack');
      this.increaseStats('defence');
    }
  }
}
