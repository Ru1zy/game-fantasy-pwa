import Character from '../Character';

export default class Magician extends Character {
  constructor(level, type = 'magician') {
    super(level, type);
    this.attack = 10;
    this.defence = 40;
    this.attackRange = 4;
    this.moveRange = 1;
    this.side = 'player';
    this.levelUpNewCharacter();
  }
}
