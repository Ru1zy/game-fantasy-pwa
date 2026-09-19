/**
 * Базовый класс персонажей:
 * swordsman, bowman, magician
 * daemon, undead, vampire
 */
export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this._health = 50;
    this.type = type;

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
    const damage = Math.max(this.attack - target.defence, Math.ceil(this.attack * 0.15));
    return Math.ceil(damage);
  }

  increaseStats(stat) {
    // Сбалансированный прирост характеристик (+22% за уровень вместо прежнего сломанного умножения на 1.8x)
    const bonus = Math.max(3, Math.round(this[stat] * 0.22));
    this[stat] += bonus;
  }

  levelUp() {
    this.level += 1;
    this.health += 50; // Восстановление здоровья между раундами
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
