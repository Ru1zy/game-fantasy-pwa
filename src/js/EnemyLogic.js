export default class EnemyLogic {
  constructor(gameController) {
    this.gameController = gameController;
    this.movement = gameController.movement;
    this.potentialActions = [];
    this.delay = 100;
  }

  async doAction() {
    return new Promise((resolve) => {
      this.potentialActions = [];
      const enemyCharacters = this.gameController.getTeamPositions('enemy');
      this.playerCharacters = this.gameController.getTeamPositions('player');

      for (const char of enemyCharacters) {
        this.pushCharActions(char);
      }

      const action = this.findBestAction(this.potentialActions);

      const promise = this.performBestAction(action);
      promise.then(() => {
        setTimeout(() => {
          this.gameController.deselectEnemyCharacter();
        }, this.delay);
        resolve();
      });
    });
  }

  performBestAction(action) {
    return new Promise((resolve) => {
      const { actor, target } = action;
      this.gameController.selectEnemyCharacter(actor.position);

      if (this.gameController.availableForAttackCell(actor, target.position)) {
        setTimeout(async () => {
          this.gameController.performAttack(actor, target);
          resolve();
        }, this.delay);
      } else {
        const promise = this.moveToTarget(actor, target);
        promise
          .then(() => {
            resolve();
          })
          .catch(async () => {
            // удаление действия из списка и попытка выполнить другое действие
            const actionIndex = this.potentialActions.findIndex(
              (elem) => elem === action,
            );
            this.potentialActions.splice(actionIndex, 1);
            const nextAction = this.findBestAction(this.potentialActions);

            if (nextAction) {
              await this.performBestAction(nextAction);
              resolve();
            } else {
              console.log('Dead end, try smth else.');
              resolve();
            }
          });
      }
    });
  }

  calculatePriority(enemy, player) {
    const { character, position } = enemy;
    const { moveRange, attackRange } = character;
    const { distance } = this.movement.calcDistance(position, player.position);

    const turnsNumber = Math.ceil((distance - 1) / (moveRange + attackRange - 1));
    const potentialDamage = character.calculateDamage(player.character);
    const hitsToKill = Math.ceil(player.character.health / potentialDamage);

    return 1 / (hitsToKill + turnsNumber);
  }

  pushCharActions(enemyChar) {
    for (const playerChar of this.playerCharacters) {
      const priority = this.calculatePriority(enemyChar, playerChar);
      const target = playerChar;
      const action = { actor: enemyChar, target, priority };
      this.potentialActions.push(action);
    }
  }

  findBestAction(actionsArr) {
    let mostEffectiveAction;
    let highestPriority = 0;
    for (const action of actionsArr) {
      if (action.priority > highestPriority) {
        highestPriority = action.priority;
        mostEffectiveAction = action;
      }
    }
    return mostEffectiveAction;
  }

  moveToTarget(actor, target) {
    return new Promise((resolve, reject) => {
      if (this.actionIsDone) return;
      const {
        character: { moveRange },
        position: index,
      } = actor;

      let { verticalDifference, horizontalDifference } = this.movement.calcDistance(
        index,
        target.position,
      );

      const isverticalDifferenceNegative = verticalDifference < 0;
      const ishorizontalDifferenceNegative = horizontalDifference < 0;

      if (Math.abs(verticalDifference) > moveRange - 1) {
        verticalDifference = moveRange;
      } else if (verticalDifference !== 0) {
        verticalDifference = Math.abs(verticalDifference) - 1;
      }

      if (Math.abs(horizontalDifference) > moveRange - 1) {
        horizontalDifference = moveRange;
      } else if (horizontalDifference !== 0) {
        horizontalDifference = Math.abs(horizontalDifference) - 1;
      }

      if (isverticalDifferenceNegative) verticalDifference *= -1;
      if (ishorizontalDifferenceNegative) horizontalDifference *= -1;

      let indexToMove = this.movement.calcPosByDifference(index, {
        verticalDifference,
        horizontalDifference,
      });

      // перерасчёт indexToMove, если ячейка занята другим персонажем
      while (
        !this.gameController.emptyCell(indexToMove) &&
        (Math.abs(verticalDifference) > 0 || Math.abs(horizontalDifference) > 0)
      ) {
        if (Math.abs(verticalDifference) > Math.abs(horizontalDifference)) {
          verticalDifference += isverticalDifferenceNegative ? 1 : -1;
        } else {
          horizontalDifference += ishorizontalDifferenceNegative ? 1 : -1;
        }

        indexToMove = this.movement.calcPosByDifference(index, {
          verticalDifference,
          horizontalDifference,
        });
      }

      if (indexToMove !== index) {
        setTimeout(() => {
          this.movement.moveCharacter(actor, indexToMove);
          resolve();
        }, this.delay);
      } else {
        reject(new Error('Нет очевидного пути'));
      }
    });
  }
}
