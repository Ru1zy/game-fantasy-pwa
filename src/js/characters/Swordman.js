import Character from '../Character';

export default class Swordman extends Character {
  constructor(level, type = 'swordman') {
    super(level, type);
    this.attack = 40;
    this.defence = 10;
    this.side = 'player';
  }
}
