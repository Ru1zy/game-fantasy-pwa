import Character from '../Character';

export default class Undead extends Character {
  constructor(level, type = 'undead') {
    super(level, type);
    this.attack = 30;
    this.defence = 25;
    this.attackRange = 1;
    this.moveRange = 3;
    this.side = 'enemy';
    this.levelUpNewCharacter();
  }
}
