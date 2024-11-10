// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Position, Player, Encounter, EncounterData, MonsterCatchAttempt, OwnedBy, Monster, OwnedByData } from "../codegen/index.sol";
import { MonsterCatchResult, MonsterType } from "../codegen/common.sol";
import { addressToEntityKey } from "../addressToEntityKey.sol";

contract EncounterSystem is System {
  uint256 counter = 0;
  uint256 counter2 = 0;

  function throwBall(bytes32 id) public {
    bytes32 player = addressToEntityKey(_msgSender());

    EncounterData memory encounter = Encounter.get(id);
    require(encounter.exists, "not in encounter");
    require(encounter.player == player, "not your encounter");
    require(encounter.x == Position.getX(player) && encounter.y == Position.getY(player), "not in same position");

    uint256 rand = 10;
    if (rand % 2 == 0) {
      counter++;
      // 50% chance to catch monster
      MonsterCatchAttempt.set(player, MonsterCatchResult.Caught);
      // OwnedBy.set(counter, OwnedByData);
      MonsterType monsterType = Monster.getValue(id);

      uint256 health = 20 + random() % 10;
      uint256 strength = 10 + random() % 15;
      uint256 dexterity = 10 + random() % 15;
      uint256 intelligence = 10 + random() % 10;

      uint256 total = health + strength + dexterity + intelligence;

      uint32 monsterRarity = 0; // weak
      
      if (total <= 60) {
        monsterRarity = 1; // average
      } else if (total <= 70) {
        monsterRarity = 2; // strong
      } else if (total <= 90) {
        monsterRarity = 3; // epic 
      } else {
        monsterRarity = 4; // herculian 
      }

      OwnedBy.set(counter, OwnedByData({
        owner: player,
        monster: monsterType,
        level: 1,
        health: health,
        strength: strength,
        dexterity: dexterity,
        intelligence: intelligence,
        rarity: monsterRarity
      }));
      Monster.deleteRecord(encounter.monster);
      Encounter.deleteRecord(id);
    } else if (encounter.catchAttempts >= 2) {
      // Missed 2 times, monster escapes
      MonsterCatchAttempt.set(player, MonsterCatchResult.Fled);
      Monster.deleteRecord(encounter.monster);
      Encounter.deleteRecord(id);
    } else {
      // Throw missed!
      MonsterCatchAttempt.set(player, MonsterCatchResult.Missed);
      Encounter.setCatchAttempts(id, encounter.catchAttempts + 1);
    }
  }

  function random() internal returns (uint256) {
    counter2++;
    return uint256(keccak256(abi.encodePacked(
      tx.origin,
      blockhash(block.number - 1),
      block.timestamp,
      counter2
    )));
  }

  function flee(bytes32 id) public {
    bytes32 player = addressToEntityKey(_msgSender());

    EncounterData memory encounter = Encounter.get(id);

    require(encounter.exists, "not in encounter");
    require(encounter.player == player, "not your encounter");
    require(encounter.x == Position.getX(player) && encounter.y == Position.getY(player), "not in same position");

    Monster.deleteRecord(id);
    Encounter.deleteRecord(id);
  }

  function fuse(uint256 self, uint256 target) public {
    bytes32 player = addressToEntityKey(_msgSender());

    OwnedByData memory selfData = OwnedBy.get(self);
    OwnedByData memory targetData = OwnedBy.get(target);

    require(selfData.owner == player, "not your monster");
    require(targetData.owner == player, "not your monster");
    require(selfData.monster == targetData.monster, "not same monster");
    require(selfData.level == targetData.level, "not same level");
    require(selfData.level < 5, "max level reached");


    OwnedBy.set(self, OwnedByData({
      owner: player,
      monster: selfData.monster,
      level: selfData.level + 1,
      health: selfData.health + 5,
      strength: selfData.strength + 2,
      dexterity: selfData.dexterity + 2,
      intelligence: selfData.intelligence + 2,
      rarity: selfData.rarity
    }));
    
    OwnedBy.deleteRecord(target);
  }
}
