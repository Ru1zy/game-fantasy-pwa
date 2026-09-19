export default class EnemyLogic {
  constructor(gameController) {
    this.gameController = gameController;
    this.movement = gameController.movement;
    this.potentialActions = [];
    this.delay = 220;
  }

  async doAction() {
    return new Promise((resolve) => {
      this.potentialActions = [];
      const enemyCharacters = this.gameController.getTeamPositions('enemy');
      this.playerCharacters = this.gameController.getTeamPositions('player');

      if (!enemyCharacters.length || !this.playerCharacters.length) {
        resolve();
        return;
      }

      for (const char of enemyCharacters) {
        this.pushCharActions(char);
      }

      const action = this.findBestAction(this.potentialActions);
      if (!action) {
        resolve();
        return;
      }

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
            // Удаление неудачного действия и выбор альтернативного
            const actionIndex = this.potentialActions.findIndex(
              (elem) => elem === action,
            );
            if (actionIndex !== -1) {
              this.potentialActions.splice(actionIndex, 1);
            }
            const nextAction = this.findBestAction(this.potentialActions);

            if (nextAction) {
              await this.performBestAction(nextAction);
              resolve();
            } else {
              // Если нет прямого пути к цели, сделать любой безопасный ход
              this.makeFallbackMove(actor);
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

    const potentialDamage = character.calculateDamage(player.character);
    const canAttackImmediately = distance <= attackRange;
    const canKillNow = canAttackImmediately && player.character.health <= potentialDamage;

    // 1. Высший приоритет - добивание цели за один удар
    if (canKillNow) {
      return 1000 + potentialDamage;
    }

    // 2. Возможность атаковать прямо сейчас
    if (canAttackImmediately) {
      let score = 500 + potentialDamage;
      // Бонус за атаку уязвимых целей с высоким уроном (Маги и Лучники)
      if (player.character.type === 'magician') score += 120;
      if (player.character.type === 'bowman') score += 80;
      // Бонус за цель с меньшим здоровьем
      score += (100 - player.character.health) * 2;
      return score;
    }

    // 3. Если атаковать нельзя, оцениваем сближение
    const turnsNumber = Math.max(1, Math.ceil((distance - attackRange) / Math.max(1, moveRange)));
    let movePriority = 100 / (turnsNumber + 1);

    // Приоритет целей с малым здоровьем и опасных классов
    if (player.character.type === 'magician') movePriority += 25;
    if (player.character.type === 'bowman') movePriority += 15;
    movePriority += (100 - player.character.health) * 0.3;

    return movePriority;
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
    let mostEffectiveAction = null;
    let highestPriority = -Infinity;
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
      const {
        character: { moveRange, attackRange },
        position: index,
      } = actor;

      const availableMoves = this.movement.getAvailableMoveCells(actor);
      if (!availableMoves.length) {
        reject(new Error('No available moves'));
        return;
      }

      // Выбираем клетку, которая максимально приближает к цели (или ставит в идеальный радиус атаки)
      let bestCell = null;
      let minEvalScore = Infinity;

      for (const cellIndex of availableMoves) {
        const { distance } = this.movement.calcDistance(cellIndex, target.position);
        
        // Для стрелков идеальная дистанция - это attackRange (кайтинг, чтобы не подходить в упор к мечникам)
        let evalScore = distance;
        if (attackRange > 1) {
          if (distance <= attackRange && distance >= 2) {
            evalScore = 0; // Идеальная стрелковая позиция
          } else if (distance < 2) {
            evalScore = 3; // Слишком близко в упор
          }
        }

        if (evalScore < minEvalScore) {
          minEvalScore = evalScore;
          bestCell = cellIndex;
        }
      }

      if (bestCell !== null && bestCell !== index) {
        setTimeout(() => {
          this.movement.moveCharacter(actor, bestCell);
          resolve();
        }, this.delay);
      } else {
        reject(new Error('No optimal cell found'));
      }
    });
  }

  makeFallbackMove(actor) {
    const availableMoves = this.movement.getAvailableMoveCells(actor);
    if (availableMoves.length) {
      const randomCell = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      this.movement.moveCharacter(actor, randomCell);
    }
  }
}
