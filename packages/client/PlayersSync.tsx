import { Components, ScriptComponent, Player,  Emitter, Events, Camera } from "@oo/scripting";

import MUD from "./mud"

import { getComponentValue, getComponentValueStrict, Has } from "@latticexyz/recs";

import { singletonEntity } from "@latticexyz/store-sync/recs";

import Map, { BLOCK_SIZE, generateRandomPositionInComponent } from "./Map";

import { Vector3 } from "three";

enum Direction {
    North = 0,
    East,
    South,
    West,
}

export default class PlayersSync extends ScriptComponent {

    mud: any = null;

    currentZone = "";

    map: any = null;

    players = {};

    async onReady() {

        // @ts-ignore
        this.mud = MUD.getMain();

        // @ts-ignore
        this.map = Map.getMain();

        new Promise((resolve) => {
            Emitter.on("MAP_LOADED", () => {
                this.handleInit();
                resolve(null);
            });
        });
    }

    handleInit = async () => {

        const canSpawn = getComponentValue(this.mud.components.Player, this.mud.mud.network.playerEntity)?.value !== true;

        if (canSpawn) {

          this.mud.systemCalls.spawn(7, 11);
        
        } 

        const position = getComponentValueStrict(this.mud.components.Position, this.mud.mud.network.playerEntity);

        this.currentZone = `${typeof position.x === "number" ? position.x : 7 }-${ typeof position.y === "number" ? position.y : 11}`;


        const zone = this.map.zones[this.currentZone];

        Emitter.emit("PLAYER_MOVED", {
            x: position.x,
            y: position.y
        })

        if (zone.userData.blockId === this.currentZone) {
            
            const newPosition = generateRandomPositionInComponent(
                {x: 5, y: 0, z: 5},
                new Vector3(zone.position.x, 0, zone.position.z),
                {
                    useHeight: false,
                    marginPercent: 0
                }
            );

            Player.avatar.rigidBody.teleport(

                // new Vector3(zone.position.x, 0, zone.position.z),
                newPosition,

                Player.avatar.quaternion

            );

            const controls = Components.byId("controls");

            controls.active = true;
        }
    }

    async onStart() {

        this.mud.useEntityQuery(
          [
            Has(this.mud.components.Player), 
            Has(this.mud.components.Position)
          ], 
          async entity => {

            const players = await Promise.all(entity.map(async entity => {

                const position = getComponentValueStrict(this.mud.components.Position, entity);

                if (entity === this.mud.mud.network.playerEntity

                  && this.currentZone !== `${position.x}-${position.y}`) {

                    // rollback...

                }

                if (entity === this.mud.mud.network.playerEntity) {

                    Emitter.emit("PLAYER_MOVED", {
                        x: position.x,
                        y: position.y
                    })

                }
            
                if (entity !== this.mud.mud.network.playerEntity) {

                    if (!this.players[entity]) {

                        this.players[entity] = {};

                        const avatar = await Player.avatar.duplicate();
                        
                        this.players[entity] = {
                            avatar
                        }
                    }

                    if (this.players[entity].avatar) {

                        const newPosition = generateRandomPositionInComponent(
                            {x: 5, y: 0, z: 5},
          
                            new Vector3(
                                position.x * BLOCK_SIZE - (this.map.width * BLOCK_SIZE) / 2, 
                                0, 
                                position.y * BLOCK_SIZE - (this.map.height * BLOCK_SIZE) / 2
                            ),
                            {
                                useHeight: false,
                                marginPercent: 0
                            }
                        )

                        newPosition.y = 0.55;

                        this.players[entity].avatar.rigidBody.teleport(
                            newPosition,
                            this.players[entity].avatar.quaternion
                        );

                        this.players[entity].avatar.animation = "looking";
                    }
                }

                return {
                  entity,
                  x: position.x,
                  y: position.y,
                  emoji: entity === this.mud.mud.network.playerEntity ? "🤠" : "🥸",
                }
            }));

            // remove players that are not in the entity list
            players.forEach(({ entity: entityId }) => {
                if (entityId !== this.mud.mud.network.playerEntity && !this.players[entityId]) {
                    this.players[entityId].avatar.destroy();
                    delete this.players[entityId];
                }
            });
          }
        );

        Player.avatar.onSensorEnter((collision) => {

            // check if at the distance of 10 from the center

            const blockId = collision?.other?.parent?.userData?.blockId;

            const type = collision?.other?.parent?.userData?.type;

            if (type === "boulder") return;

            const [ x, y ] = blockId?.split("-")?.map(s => Number(s)) || [0, 0];

            let [ currentX, currentY ] = this.currentZone?.split?.("-")?.map(s => Number(s)) || [0, 0];

            this.currentZone = blockId;

            let direction = "";

            if (currentX === x && currentY === y) return;

            while (currentX !== x || currentY !== y) {
                    
                if ( y < currentY ) {

                    this.mud.systemCalls.move([Direction.North]);

                    currentY--;

                    direction = "north";

                } else if ( y > currentY ) {

                    this.mud.systemCalls.move([Direction.South]);

                    currentY++;

                    direction = "south";

                } else if ( x > currentX ) {

                    this.mud.systemCalls.move([Direction.East]);

                    currentX++;

                    direction = "east";

                } else if ( x < currentX ) {

                    this.mud.systemCalls.move([Direction.West]);
                
                    currentX--;

                    direction = "west";
                } else {
                    console.log("Error: Could not move to block");
                }

                console.log(`Moving ${direction === "north" ? "Up" 
                    : direction === "south" ? "Down" 
                    : direction === "east" ? "Right"
                    : "Left"
                } to ${blockId}`);
            }
        })
    }
} 