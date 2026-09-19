import Character from '../Character';

export default class Swordman extends Character {
  constructor(level, type = 'swordman') {
    super(level, type);
    this.attack = 30;
    this.defence = 25;
    this.attackRange = 1;
    this.moveRange = 3;
    this.side = 'player';
    this.levelUpNewCharacter();
  }
}
