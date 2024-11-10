import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  enums: {
    Direction: ["North", "East", "South", "West"],
    MonsterCatchResult: ["Missed", "Caught", "Fled"],
    MonsterType: ["None", "Eagle", "Rat", "Caterpillar"],
    TerrainType: ["None", "TallGrass", "Boulder"],
  },
  tables: {
    Counter: {
      schema: {
        value: "uint32",
      },
      key: [],
    },
    Encounter: {
      schema: {
        encounter: "bytes32",
        player: "bytes32",
        exists: "bool",
        monster: "bytes32",
        catchAttempts: "uint256",
        x: "int32",
        y: "int32"
      },
      key: ["encounter"],
    },
    EncounterTrigger: "bool",
    Encounterable: "bool",
    MapConfig: {
      schema: {
        width: "uint32",
        height: "uint32",
        terrain: "bytes",
      },
      key: [],
      codegen: {
        dataStruct: false,
      },
    },
    MonsterCatchAttempt: {
      type: "offchainTable",
      schema: {
        encounter: "bytes32",
        result: "MonsterCatchResult",
      },
      key: ["encounter"],
      codegen: {
        dataStruct: false,
      },
    },
    Monster: "MonsterType",
    Movable: "bool",
    Obstruction: "bool",
    OwnedBy: {
      schema: {
        id: "uint256",
        monster: "MonsterType",
        owner: "bytes32",
        rarity: "uint32",
        level: "uint32",
        health: "uint256",
        strength: "uint256", // how hard he hits
        dexterity: "uint256", // how hard he is to hit
        intelligence: "uint256" // how hard he is to catch
      },
      key: ["id"],
    },
    Player: "bool",
    Position: {
      schema: {
        id: "bytes32",
        x: "int32",
        y: "int32",
      },
      key: ["id"],
      codegen: {
        dataStruct: false,
      },
    },
  },
});
