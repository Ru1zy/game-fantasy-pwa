/* some functions relocated from generators.js */
export default class Team {
  constructor({ side, allowedTypes, maxLevel, characterCount }) {
    this.side = side;
    this.characters = [];
    this.addNewCharacter(allowedTypes, maxLevel, characterCount);
  }

  *[Symbol.iterator]() {
    const { characters } = this;
    const { length } = characters;
    for (let i = 0; i < length; i++) {
      yield [...characters][i];
    }
  }

  get length() {
    return this.characters.length;
  }

  characterGenerator(allowedTypes, maxLevel) {
    const index = Math.floor(Math.random() * allowedTypes.length);
    const characterConstructor = allowedTypes[index];
    const level = Math.floor(Math.random() * maxLevel + 1);
    return new characterConstructor(level);
  }

  addNewCharacter(allowedTypes, maxLevel, characterCount) {
    for (let i = 1; i <= characterCount; i++) {
      const newCharacter = this.characterGenerator(allowedTypes, maxLevel, this);
      this.characters.push(newCharacter);
    }
  }

  removeCharacter(character) {
    const index = this.characters.findIndex((char) => char === character);
    if (index !== -1) {
      this.characters.splice(index, 1);
    }
  }
}
