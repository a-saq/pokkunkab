import { Components, Emitter, Player, ScriptComponent, UI } from "@oo/scripting";

import { Vector3, Euler } from "three"; 

import { getComponentValue } from "@latticexyz/recs";

import { singletonEntity } from "@latticexyz/store-sync/recs";

import { hexToArray } from "@latticexyz/utils";

import MUD from "./mud"

import PlayersSync from "./PlayersSync"

export const BLOCK_SIZE = 40;

export enum TerrainType {
    TallGrass = 1,
    Boulder,
}
  
const rotations = [
    Math.PI,
    Math.PI / 2,
    Math.PI * 1.5,
    Math.PI * 2,
]
  
const terrainTypes: Record<TerrainType, string> = {
    [TerrainType.TallGrass]: "grass",
    [TerrainType.Boulder]: "boulder"
};


function hide(entity) {
    if (entity) {
        if (entity.rigidBody) {
            entity.rigidBody.enabled = false;
        }
        entity.visible = false;
    }
}

const renderer = UI.createRenderer();

export default class Map extends ScriptComponent {

    boulderZone: any = null;

    noneZones: any = null;

    grassZone: any = null;

    mud: any = null;

    zones = {};

    map: any = {};

    terrainData: any = [];

    monsters: any = null;

    width: number = 0;

    height: number = 0;

    players: any = null;

    batch: any = null;

    terrain: any = [];

    async onReady() {

      this.boulderZone = Components.byId("boulder-zone");

      this.batch = Components.byId("batch");

      this.boulderZone.children.forEach(hide);

      this.grassZone = Components.byId("grass-zone");

      this.grassZone.children.forEach(hide);

      const noneZone0 = Components.byId("none-block-0");
      const noneZone1 = Components.byId("none-block-1");
      const noneZone2 = Components.byId("none-block-2");
      const noneZone3 = Components.byId("none-block-3");

      this.noneZones = [
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone0,
        noneZone1,
        noneZone2,
        noneZone3
      ];

      this.noneZones.forEach(noneZone => noneZone.children.forEach(hide));
      
      this.mud = MUD.getMain();

      this.players = PlayersSync.getMain();

      this.monsters = Components.byId("monsters");

      this.map = getComponentValue(this.mud.components.MapConfig, singletonEntity);
    
      const { width, height, terrain: terrainData } = this.map;

      this.width = width;

      this.height = height;

      this.terrain = terrainData;

      this.terrainData = Array.from(hexToArray(this.terrain)).map((value, index) => {
        return {
          x: index % width,
          y: Math.floor(index / width),
          type: terrainTypes[value] || "None",
        };
      });

      const edges = [
        { x: -height, y: 0 },
        { x: height, y: 0 },
        { x: 0, y: -width },
        { x: 0, y: width }
      ]

      edges.forEach(async edge => {
          
        await this.createEdge(edge.x, edge.y , width, height);

      });

      for (let i = 0; i < this.terrainData.length; i++) {

        const block = this.terrainData[i];

        let zone: any = null;

        if ( block.type === "grass" ) {

          zone = await this.grassZone.duplicate()

        } else if ( block.type === "boulder" ) {

          zone = await this.boulderZone.duplicate()
          
        } else {

          zone = await this.noneZones[
            Math.floor(Math.random() * this.noneZones.length)
          ].duplicate()
        }

        if (zone) {

          zone.position.x = block.x * BLOCK_SIZE - (this.width * BLOCK_SIZE) / 2;
          
          zone.position.z = block.y * BLOCK_SIZE - (this.height * BLOCK_SIZE) / 2;
          
          zone.rotation.y = rotations[Math.floor(Math.random() * rotations.length)];

          if (block.type === "grass") {

            this.addGrassToZone(zone);

          }

          zone.userData.blockId = `${ block.x }-${ block.y }`;
  
          zone.userData.type = block.type;

          this.zones[zone.userData.blockId] = zone;
        }
      }

      let state = {
        player: {
          x: 0,
          y: 0
        },
        monsters: []
      }

      this.showMiniMap(state);

      Emitter.on("PLAYER_MOVED", async (data) => {
        state.player.x = data.x;
        state.player.y = data.y;
        this.showMiniMap(state);
      });

      Emitter.on("MONSTERS_UPDATED", async (data) => {
        console.log("MONSTERS_UPDATED", data);
        state.monsters = data;
        this.showMiniMap(state);
      });

      Emitter.emit("MAP_LOADED");
    }

    createEdge = async (x, y, width, height) => {

        const edge = await Components.create({
  
          type: "mesh",
  
          geometryData: {
  
            type: "box",
  
            boxParams: {
  
              width: 1,
  
              height: 1,
  
              depth: 1
            }
          },
  
          collider: {
  
            enabled:       true,
  
            rigidbodyType: "FIXED",
            
            type:          "CUBE",
          },
  
          position: {
  
            x: x ? (x * BLOCK_SIZE) - (x * BLOCK_SIZE / 2) - 20: 0,
  
            y: 0,
  
            z: y ? (y * BLOCK_SIZE) - (y * BLOCK_SIZE / 2) - 20: 0
          },
  
          scale: {
  
            x: y ? height * BLOCK_SIZE + 20 * 2: 1,
  
            y: 200,
  
            z: x ? width * BLOCK_SIZE + 20 * 2: 1
          }
        });
  
        edge.visible = false;
    }

    addGrassToZone = async (zone) => {

      for (let i = 0; i < 300; i++) {
        
        const position = generateRandomPositionInComponent(

            {x: 40, y: 40, z: 40},
          
            zone.position,
          
            {
              useHeight: true,
              marginPercent: 0
          
            }
        );

        this.batch._addItem({

            position: new Vector3(
                position.x,
                0,
                position.z
            ),
          
            rotation: new Euler(0, 0, 0),
          
            scale: new Vector3(15, 15, 15),
          
            debug: false
        })
      }
    }

    getZoneByBlockId = (x, y) => {
      return this.zones[`${x}-${y}`];
    }

    showMiniMap = ({ player, monsters }) => {
      const rows = new Array(this.width).fill(0).map((_, i) => i);
      const columns = new Array(this.height).fill(0).map((_, i) => i);

      renderer.render(<div style={{
        position: "fixed",
        zIndex: 100,
        left: 13,
        top: 13,
        display: "inline-grid",
        border: "4px solid white",
        opacity: 0.73,
        fontSize: "8px",
        userSelect: "none",
        pointerEvents: "none"
      }}>
          {rows.map((y) =>
            columns.map((x) => {
              const terrainEmoji = this.terrainData?.find(
                (t) => t.x === x && t.y === y
              );

              const emoji = terrainEmoji?.type === "grass" ? "🌾" : terrainEmoji?.type === "boulder" ? "🪨" : "";

              const monster = monsters.find((m) => {
                return m.x === x && m.y === y;
              });

              const monsterEmoji = monster?.monster?.name === "unicorn" 
                ? "🦄" : monster?.monster?.name === "slug" 
                ? "🐌" : monster?.monster?.name === "frog" 
                  ? "🐸" : "";

              return (
                <div
                  key={`${x},${y}`}
                  style={{
                    gridColumn: x + 1,
                    gridRow: y + 1,
                    width: 10.4,
                    height: 10.4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#6bc877",
                  }}
                >
                  <div className="flex flex-wrap gap-1 items-center justify-center relative">
                    { player.x === x && player.y === y  
                      ? <span >{"😈"}</span> 
                        : monsterEmoji ? <span>{monsterEmoji}</span> : emoji 
                        ? <div>
                        {emoji}
                      </div> : null}
                  </div>
                </div>
              );
            })
          )}
      </div>)
    }
} 

export function generateRandomPositionInComponent(
  dimensions,
  centerPosition,
  options: {
      useHeight?: boolean;  // Whether to randomize Y position
      marginPercent?: number;  // Margin from edges (0-1)
  } = {}
) {

  const {
      useHeight = false,
      marginPercent = 0
  } = options;

  // Calculate margins
  const marginX = (dimensions.x * marginPercent) / 2;
  const marginY = (dimensions.y * marginPercent) / 2;
  const marginZ = (dimensions.z * marginPercent) / 2;

  // Calculate min and max bounds with margins
  const minX = centerPosition.x - (dimensions.x / 2) + marginX;
  const maxX = centerPosition.x + (dimensions.x / 2) - marginX;
  
  const minY = 0;
  const maxY = 0;
  
  const minZ = centerPosition.z - (dimensions.z / 2) + marginZ;
  const maxZ = centerPosition.z + (dimensions.z / 2) - marginZ;

  // Generate random position
  const randomPosition = {
    x: minX + Math.random() * (maxX - minX),
    y: 0,
    z: minZ + Math.random() * (maxZ - minZ)
  };

  return randomPosition;
}