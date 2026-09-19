import Character from '../Character';

export default class Vampire extends Character {
  constructor(level, type = 'vampire') {
    super(level, type);
    this.attack = 26;
    this.defence = 20;
    this.attackRange = 2;
    this.moveRange = 2;
    this.side = 'enemy';
    this.levelUpNewCharacter();
  }
}
