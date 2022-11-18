import themes from "./themes";
import Bowman from "./characters/Bowman";
import Daemon from "./characters/Daemon";
import Magician from "./characters/Magician";
import Swordman from "./characters/Swordman";
import Undead from "./characters/Undead";
import Vampire from "./characters/Vampire";
import PositionedCharacter from "./PositionedCharacter";
import { generateTeam } from "./generators";

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.teamSides = {
      light: {
        name: "light",
        first: 0,
        second: 1,
        characters: [Bowman, Swordman, Magician],
      },
      dark: {
        name: "dark",
        first: 6,
        second: 7,
        characters: [Daemon, Undead, Vampire],
      },
    };
  }

  init() {
    this.theme = themes.prairie;
    this.gamePlay.drawUi(this.theme);
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
  }

  onCellClick(index) {
    // TODO: react to click
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
  }
}
