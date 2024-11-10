// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Encounter, EncounterData, Encounterable, EncounterTrigger, MapConfig, Monster, Movable, Obstruction, Player, Position } from "../codegen/index.sol";
import { Direction, MonsterType } from "../codegen/common.sol";
import { addressToEntityKey } from "../addressToEntityKey.sol";
import { positionToEntityKey } from "../positionToEntityKey.sol";
import { console } from "forge-std/console.sol";

contract MapSystem is System {
  function spawn(int32 x, int32 y) public {
    bytes32 player = addressToEntityKey(address(_msgSender()));
    require(!Player.get(player), "already spawned");

    // Constrain position to map size, wrapping around if necessary
    (uint32 width, uint32 height, ) = MapConfig.get();
    x = (x + int32(width)) % int32(width);
    y = (y + int32(height)) % int32(height);

    bytes32 position = positionToEntityKey(x, y);
    require(!Obstruction.get(position), "this space is obstructed");

    Player.set(player, true);
    Position.set(player, x, y);
    Movable.set(player, true);
    Encounterable.set(player, true);
  }

  function move(Direction direction) public {
    bytes32 player = addressToEntityKey(_msgSender());
    require(Movable.get(player), "cannot move");
    // require(!Encounter.getExists(player), "cannot move during an encounter");
    (int32 x, int32 y) = Position.get(player);
    if (direction == Direction.North) {
      y -= 1;
    } else if (direction == Direction.East) {
      x += 1;
    } else if (direction == Direction.South) {
      y += 1;
    } else if (direction == Direction.West) {
      x -= 1;
    }

    // Constrain position to map size, wrapping around if necessary
    (uint32 width, uint32 height, ) = MapConfig.get();
    x = (x + int32(width)) % int32(width);
    y = (y + int32(height)) % int32(height);

    bytes32 position = positionToEntityKey(x, y);
    require(!Obstruction.get(position), "this space is obstructed");

    Position.set(player, x, y);
    
    bytes32 id = getEncounterId(player, x, y);

    if (Encounterable.get(player) && EncounterTrigger.get(position) && !Encounter.getExists(id)) {

      uint256 rand = 10;

      if (rand % 2 == 0) {
        startEncounter(player, x, y);
      }
    }
  }

  function startEncounter(bytes32 player, int32 x, int32 y) internal {
    
    bytes32 monster = keccak256(abi.encode(player, block.timestamp, block.prevrandao));
    
    MonsterType monsterType = MonsterType((uint256(monster) % uint256(type(MonsterType).max)) + 1);

    bytes32 id = getEncounterId(player, x, y);

    Monster.set(id, monsterType);
    
    Encounter.set(id, EncounterData({
      player: player,
      exists: true, 
      monster: id,
      catchAttempts: 0,
      x: x, 
      y: y
    }));
  }

  function getEncounterId(bytes32 player, int32 x, int32 y) internal pure returns (bytes32) {
    string memory concatenated = string(abi.encodePacked(player, x, y));

    bytes32 encounterId = keccak256(abi.encode(concatenated));
    
    return encounterId;
  }
}
