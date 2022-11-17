/*  Entry point of app  */
import GamePlay from "./GamePlay";
import GameController from "./GameController";
import GameStateService from "./GameStateService";

const gamePlay = new GamePlay();
gamePlay.bindToDOM(document.querySelector("#game-container"));

const stateService = new GameStateService(localStorage);

const gameCtrl = new GameController(gamePlay, stateService);
gameCtrl.init();
