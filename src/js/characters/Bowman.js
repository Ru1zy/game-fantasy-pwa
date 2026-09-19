import Character from '../Character';

export default class Bowman extends Character {
  constructor(level, type = 'bowman') {
    super(level, type);
    this.attack = 26;
    this.defence = 20;
    this.attackRange = 2;
    this.moveRange = 2;
    this.side = 'player';
    this.levelUpNewCharacter();
  }
}
