import Character from '../Character';

export default class Magician extends Character {
  constructor(level, type = 'magician') {
    super(level, type);
    this.attack = 36;
    this.defence = 15;
    this.attackRange = 3;
    this.moveRange = 2;
    this.side = 'player';
    this.levelUpNewCharacter();
  }
}
