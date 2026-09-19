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
      let pool = allowedTypes;
      // Предотвращение появления 2 магов в отряде (неиграбельный спавн на старте)
      if (
        this.characters.length === 1 &&
        (this.characters[0].type === 'magician' || this.characters[0].type === 'daemon')
      ) {
        const filtered = allowedTypes.filter(
          (t) => t.name !== 'Magician' && t.name !== 'Daemon',
        );
        if (filtered.length) {
          pool = filtered;
        }
      }
      const newCharacter = this.characterGenerator(pool, maxLevel);
      this.characters.push(newCharacter);
    }
  }

  removeCharacter(character) {
    const index = this.characters.findIndex((char) => char === character);
    if (index !== -1) {
      this.characters.splice(index, 1);
    }
  }

  charactersLevelUp() {
    for (const char of this.characters) {
      char.levelUp();
    }
  }
}
