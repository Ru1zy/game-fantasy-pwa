import Character from '../Character';

export default class Daemon extends Character {
  constructor(level, type = 'daemon') {
    super(level, type);
    this.attack = 10;
    this.defence = 10;
    this.attackRange = 4;
    this.moveRange = 1;
    this.side = 'enemy';
    this.levelUpNewCharacter();
  }
}
