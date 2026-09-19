import Character from '../Character';

export default class Daemon extends Character {
  constructor(level, type = 'daemon') {
    super(level, type);
    this.attack = 36;
    this.defence = 15;
    this.attackRange = 3;
    this.moveRange = 2;
    this.side = 'enemy';
    this.levelUpNewCharacter();
  }
}
