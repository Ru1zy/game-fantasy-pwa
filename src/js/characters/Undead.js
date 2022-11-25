import Character from '../Character';

export default class Undead extends Character {
  constructor(level, type = 'undead') {
    super(level, type);
    this.attack = 40;
    this.defence = 10;
    this.attackRange = 1;
    this.moveRange = 4;
    this.side = 'enemy';
  }
}
