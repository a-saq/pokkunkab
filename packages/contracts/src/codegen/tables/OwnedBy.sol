// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

/* Autogenerated file. Do not edit manually. */

// Import store internals
import { IStore } from "@latticexyz/store/src/IStore.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";
import { Bytes } from "@latticexyz/store/src/Bytes.sol";
import { Memory } from "@latticexyz/store/src/Memory.sol";
import { SliceLib } from "@latticexyz/store/src/Slice.sol";
import { EncodeArray } from "@latticexyz/store/src/tightcoder/EncodeArray.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { EncodedLengths, EncodedLengthsLib } from "@latticexyz/store/src/EncodedLengths.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

// Import user types
import { MonsterType } from "./../common.sol";

struct OwnedByData {
  MonsterType monster;
  bytes32 owner;
  uint32 rarity;
  uint32 level;
  uint256 health;
  uint256 strength;
  uint256 dexterity;
  uint256 intelligence;
}

library OwnedBy {
  // Hex below is the result of `WorldResourceIdLib.encode({ namespace: "", name: "OwnedBy", typeId: RESOURCE_TABLE });`
  ResourceId constant _tableId = ResourceId.wrap(0x746200000000000000000000000000004f776e65644279000000000000000000);

  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x00a9080001200404202020200000000000000000000000000000000000000000);

  // Hex-encoded key schema of (uint256)
  Schema constant _keySchema = Schema.wrap(0x002001001f000000000000000000000000000000000000000000000000000000);
  // Hex-encoded value schema of (uint8, bytes32, uint32, uint32, uint256, uint256, uint256, uint256)
  Schema constant _valueSchema = Schema.wrap(0x00a90800005f03031f1f1f1f0000000000000000000000000000000000000000);

  /**
   * @notice Get the table's key field names.
   * @return keyNames An array of strings with the names of key fields.
   */
  function getKeyNames() internal pure returns (string[] memory keyNames) {
    keyNames = new string[](1);
    keyNames[0] = "id";
  }

  /**
   * @notice Get the table's value field names.
   * @return fieldNames An array of strings with the names of value fields.
   */
  function getFieldNames() internal pure returns (string[] memory fieldNames) {
    fieldNames = new string[](8);
    fieldNames[0] = "monster";
    fieldNames[1] = "owner";
    fieldNames[2] = "rarity";
    fieldNames[3] = "level";
    fieldNames[4] = "health";
    fieldNames[5] = "strength";
    fieldNames[6] = "dexterity";
    fieldNames[7] = "intelligence";
  }

  /**
   * @notice Register the table with its config.
   */
  function register() internal {
    StoreSwitch.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  /**
   * @notice Register the table with its config.
   */
  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  /**
   * @notice Get monster.
   */
  function getMonster(uint256 id) internal view returns (MonsterType monster) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 0, _fieldLayout);
    return MonsterType(uint8(bytes1(_blob)));
  }

  /**
   * @notice Get monster.
   */
  function _getMonster(uint256 id) internal view returns (MonsterType monster) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 0, _fieldLayout);
    return MonsterType(uint8(bytes1(_blob)));
  }

  /**
   * @notice Set monster.
   */
  function setMonster(uint256 id, MonsterType monster) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setStaticField(_tableId, _keyTuple, 0, abi.encodePacked(uint8(monster)), _fieldLayout);
  }

  /**
   * @notice Set monster.
   */
  function _setMonster(uint256 id, MonsterType monster) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setStaticField(_tableId, _keyTuple, 0, abi.encodePacked(uint8(monster)), _fieldLayout);
  }

  /**
   * @notice Get owner.
   */
  function getOwner(uint256 id) internal view returns (bytes32 owner) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 1, _fieldLayout);
    return (bytes32(_blob));
  }

  /**
   * @notice Get owner.
   */
  function _getOwner(uint256 id) internal view returns (bytes32 owner) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 1, _fieldLayout);
    return (bytes32(_blob));
  }

  /**
   * @notice Set owner.
   */
  function setOwner(uint256 id, bytes32 owner) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setStaticField(_tableId, _keyTuple, 1, abi.encodePacked((owner)), _fieldLayout);
  }

  /**
   * @notice Set owner.
   */
  function _setOwner(uint256 id, bytes32 owner) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setStaticField(_tableId, _keyTuple, 1, abi.encodePacked((owner)), _fieldLayout);
  }

  /**
   * @notice Get rarity.
   */
  function getRarity(uint256 id) internal view returns (uint32 rarity) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 2, _fieldLayout);
    return (uint32(bytes4(_blob)));
  }

  /**
   * @notice Get rarity.
   */
  function _getRarity(uint256 id) internal view returns (uint32 rarity) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 2, _fieldLayout);
    return (uint32(bytes4(_blob)));
  }

  /**
   * @notice Set rarity.
   */
  function setRarity(uint256 id, uint32 rarity) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setStaticField(_tableId, _keyTuple, 2, abi.encodePacked((rarity)), _fieldLayout);
  }

  /**
   * @notice Set rarity.
   */
  function _setRarity(uint256 id, uint32 rarity) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setStaticField(_tableId, _keyTuple, 2, abi.encodePacked((rarity)), _fieldLayout);
  }

  /**
   * @notice Get level.
   */
  function getLevel(uint256 id) internal view returns (uint32 level) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 3, _fieldLayout);
    return (uint32(bytes4(_blob)));
  }

  /**
   * @notice Get level.
   */
  function _getLevel(uint256 id) internal view returns (uint32 level) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 3, _fieldLayout);
    return (uint32(bytes4(_blob)));
  }

  /**
   * @notice Set level.
   */
  function setLevel(uint256 id, uint32 level) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setStaticField(_tableId, _keyTuple, 3, abi.encodePacked((level)), _fieldLayout);
  }

  /**
   * @notice Set level.
   */
  function _setLevel(uint256 id, uint32 level) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setStaticField(_tableId, _keyTuple, 3, abi.encodePacked((level)), _fieldLayout);
  }

  /**
   * @notice Get health.
   */
  function getHealth(uint256 id) internal view returns (uint256 health) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 4, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Get health.
   */
  function _getHealth(uint256 id) internal view returns (uint256 health) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 4, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Set health.
   */
  function setHealth(uint256 id, uint256 health) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setStaticField(_tableId, _keyTuple, 4, abi.encodePacked((health)), _fieldLayout);
  }

  /**
   * @notice Set health.
   */
  function _setHealth(uint256 id, uint256 health) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setStaticField(_tableId, _keyTuple, 4, abi.encodePacked((health)), _fieldLayout);
  }

  /**
   * @notice Get strength.
   */
  function getStrength(uint256 id) internal view returns (uint256 strength) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 5, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Get strength.
   */
  function _getStrength(uint256 id) internal view returns (uint256 strength) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 5, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Set strength.
   */
  function setStrength(uint256 id, uint256 strength) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setStaticField(_tableId, _keyTuple, 5, abi.encodePacked((strength)), _fieldLayout);
  }

  /**
   * @notice Set strength.
   */
  function _setStrength(uint256 id, uint256 strength) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setStaticField(_tableId, _keyTuple, 5, abi.encodePacked((strength)), _fieldLayout);
  }

  /**
   * @notice Get dexterity.
   */
  function getDexterity(uint256 id) internal view returns (uint256 dexterity) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 6, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Get dexterity.
   */
  function _getDexterity(uint256 id) internal view returns (uint256 dexterity) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 6, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Set dexterity.
   */
  function setDexterity(uint256 id, uint256 dexterity) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setStaticField(_tableId, _keyTuple, 6, abi.encodePacked((dexterity)), _fieldLayout);
  }

  /**
   * @notice Set dexterity.
   */
  function _setDexterity(uint256 id, uint256 dexterity) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setStaticField(_tableId, _keyTuple, 6, abi.encodePacked((dexterity)), _fieldLayout);
  }

  /**
   * @notice Get intelligence.
   */
  function getIntelligence(uint256 id) internal view returns (uint256 intelligence) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 7, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Get intelligence.
   */
  function _getIntelligence(uint256 id) internal view returns (uint256 intelligence) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 7, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Set intelligence.
   */
  function setIntelligence(uint256 id, uint256 intelligence) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setStaticField(_tableId, _keyTuple, 7, abi.encodePacked((intelligence)), _fieldLayout);
  }

  /**
   * @notice Set intelligence.
   */
  function _setIntelligence(uint256 id, uint256 intelligence) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setStaticField(_tableId, _keyTuple, 7, abi.encodePacked((intelligence)), _fieldLayout);
  }

  /**
   * @notice Get the full data.
   */
  function get(uint256 id) internal view returns (OwnedByData memory _table) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    (bytes memory _staticData, EncodedLengths _encodedLengths, bytes memory _dynamicData) = StoreSwitch.getRecord(
      _tableId,
      _keyTuple,
      _fieldLayout
    );
    return decode(_staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Get the full data.
   */
  function _get(uint256 id) internal view returns (OwnedByData memory _table) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    (bytes memory _staticData, EncodedLengths _encodedLengths, bytes memory _dynamicData) = StoreCore.getRecord(
      _tableId,
      _keyTuple,
      _fieldLayout
    );
    return decode(_staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Set the full data using individual values.
   */
  function set(
    uint256 id,
    MonsterType monster,
    bytes32 owner,
    uint32 rarity,
    uint32 level,
    uint256 health,
    uint256 strength,
    uint256 dexterity,
    uint256 intelligence
  ) internal {
    bytes memory _staticData = encodeStatic(monster, owner, rarity, level, health, strength, dexterity, intelligence);

    EncodedLengths _encodedLengths;
    bytes memory _dynamicData;

    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setRecord(_tableId, _keyTuple, _staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Set the full data using individual values.
   */
  function _set(
    uint256 id,
    MonsterType monster,
    bytes32 owner,
    uint32 rarity,
    uint32 level,
    uint256 health,
    uint256 strength,
    uint256 dexterity,
    uint256 intelligence
  ) internal {
    bytes memory _staticData = encodeStatic(monster, owner, rarity, level, health, strength, dexterity, intelligence);

    EncodedLengths _encodedLengths;
    bytes memory _dynamicData;

    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setRecord(_tableId, _keyTuple, _staticData, _encodedLengths, _dynamicData, _fieldLayout);
  }

  /**
   * @notice Set the full data using the data struct.
   */
  function set(uint256 id, OwnedByData memory _table) internal {
    bytes memory _staticData = encodeStatic(
      _table.monster,
      _table.owner,
      _table.rarity,
      _table.level,
      _table.health,
      _table.strength,
      _table.dexterity,
      _table.intelligence
    );

    EncodedLengths _encodedLengths;
    bytes memory _dynamicData;

    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.setRecord(_tableId, _keyTuple, _staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Set the full data using the data struct.
   */
  function _set(uint256 id, OwnedByData memory _table) internal {
    bytes memory _staticData = encodeStatic(
      _table.monster,
      _table.owner,
      _table.rarity,
      _table.level,
      _table.health,
      _table.strength,
      _table.dexterity,
      _table.intelligence
    );

    EncodedLengths _encodedLengths;
    bytes memory _dynamicData;

    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.setRecord(_tableId, _keyTuple, _staticData, _encodedLengths, _dynamicData, _fieldLayout);
  }

  /**
   * @notice Decode the tightly packed blob of static data using this table's field layout.
   */
  function decodeStatic(
    bytes memory _blob
  )
    internal
    pure
    returns (
      MonsterType monster,
      bytes32 owner,
      uint32 rarity,
      uint32 level,
      uint256 health,
      uint256 strength,
      uint256 dexterity,
      uint256 intelligence
    )
  {
    monster = MonsterType(uint8(Bytes.getBytes1(_blob, 0)));

    owner = (Bytes.getBytes32(_blob, 1));

    rarity = (uint32(Bytes.getBytes4(_blob, 33)));

    level = (uint32(Bytes.getBytes4(_blob, 37)));

    health = (uint256(Bytes.getBytes32(_blob, 41)));

    strength = (uint256(Bytes.getBytes32(_blob, 73)));

    dexterity = (uint256(Bytes.getBytes32(_blob, 105)));

    intelligence = (uint256(Bytes.getBytes32(_blob, 137)));
  }

  /**
   * @notice Decode the tightly packed blobs using this table's field layout.
   * @param _staticData Tightly packed static fields.
   *
   *
   */
  function decode(
    bytes memory _staticData,
    EncodedLengths,
    bytes memory
  ) internal pure returns (OwnedByData memory _table) {
    (
      _table.monster,
      _table.owner,
      _table.rarity,
      _table.level,
      _table.health,
      _table.strength,
      _table.dexterity,
      _table.intelligence
    ) = decodeStatic(_staticData);
  }

  /**
   * @notice Delete all data for given keys.
   */
  function deleteRecord(uint256 id) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreSwitch.deleteRecord(_tableId, _keyTuple);
  }

  /**
   * @notice Delete all data for given keys.
   */
  function _deleteRecord(uint256 id) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    StoreCore.deleteRecord(_tableId, _keyTuple, _fieldLayout);
  }

  /**
   * @notice Tightly pack static (fixed length) data using this table's schema.
   * @return The static data, encoded into a sequence of bytes.
   */
  function encodeStatic(
    MonsterType monster,
    bytes32 owner,
    uint32 rarity,
    uint32 level,
    uint256 health,
    uint256 strength,
    uint256 dexterity,
    uint256 intelligence
  ) internal pure returns (bytes memory) {
    return abi.encodePacked(monster, owner, rarity, level, health, strength, dexterity, intelligence);
  }

  /**
   * @notice Encode all of a record's fields.
   * @return The static (fixed length) data, encoded into a sequence of bytes.
   * @return The lengths of the dynamic fields (packed into a single bytes32 value).
   * @return The dynamic (variable length) data, encoded into a sequence of bytes.
   */
  function encode(
    MonsterType monster,
    bytes32 owner,
    uint32 rarity,
    uint32 level,
    uint256 health,
    uint256 strength,
    uint256 dexterity,
    uint256 intelligence
  ) internal pure returns (bytes memory, EncodedLengths, bytes memory) {
    bytes memory _staticData = encodeStatic(monster, owner, rarity, level, health, strength, dexterity, intelligence);

    EncodedLengths _encodedLengths;
    bytes memory _dynamicData;

    return (_staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Encode keys as a bytes32 array using this table's field layout.
   */
  function encodeKeyTuple(uint256 id) internal pure returns (bytes32[] memory) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = bytes32(uint256(id));

    return _keyTuple;
  }
}
