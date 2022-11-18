import Character from "../Character";

export default class Swordman extends Character {
  constructor(level) {
    super(level);
    this.level = level;
    this.attack = 40;
    this.defence = 10;
    this.type = "swordman";
  }
}
