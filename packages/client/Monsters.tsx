
import { Components, Emitter, Player, Controls, Device, World, ScriptComponent } from '@oo/scripting'

import { getComponentValue, Component, ComponentValue, defineQuery, Entity, Has, isComponentUpdate, Schema, QueryFragment, getComponentValueStrict, runQuery, HasValue, overridableComponent } from "@latticexyz/recs";

import { Component3D } from '@oo/scripting'

import { Events } from "@oo/scripting"

import { Euler, Mesh, BoxGeometry, MeshBasicMaterial, CircleGeometry, DoubleSide } from 'three'

import { Vector3, Object3D, Quaternion, ArrowHelper } from "three";

import { monsterTypes, MonsterType, Encounter } from "./Encounter";

import MUD from './mud'

import PlayersSync from "./PlayersSync"

import Map from "./Map";

export enum MonsterCatchResult {
  Missed,
  Caught,
  Fled,
}

export default class Monsters extends ScriptComponent {

    map: any = null;

    mud: any = null;

    encounter: any = null;

    players: any = null;

    encounters = {};

    avatars = {};

    steering = [];

    onReady = async () => {

        this.avatars = Components.byTag("monster");

        this.avatars.forEach(avatar => {
            
          avatar.visible = false;

          avatar.rigidBody.enabled = false
        
        });

        // @ts-ignore
        this.mud = MUD.getMain();
        
        // @ts-ignore
        this.map = Map.getMain();

        // @ts-ignore
        this.players = PlayersSync.getMain();

    }

    onStart = async () => {

      this.mud.useEntityQuery([HasValue(this.mud.components.Encounter, {
      
        player: this.mud.mud.network.playerEntity
      
      })], async (encounterIds) => {

        const encounters = await Promise.all(encounterIds.map(async (encounterId) => {

          const encounter = getComponentValueStrict(this.mud.components.Encounter, encounterId);
          
          const monsterType = getComponentValueStrict(this.mud.components.Monster, encounter.monster as Entity)?.value;
          
          const monster = monsterTypes[monsterType];

          if (!this.encounters[encounterId]) {

            this.encounters[encounterId] = {};

            const originalAvatar = Components.byId(monster.name)

            const avatar = await originalAvatar.duplicate();
            
            avatar.visible = true;

            this.encounters[encounterId] = { avatar, name: monster.name };

            const zone = this.map.getZoneByBlockId(encounter.x, encounter.y);

            avatar.position.set(
              zone.position.x,
              0,
              zone.position.z
            );

            avatar.userData.wander = new Wander(avatar);

            avatar.userData.encounterManager = new EncounterManager({
              encounter: this.encounters[encounterId],
              encounterId,
              mud: this.mud,
              encounters: this.encounters
            })
          }

          return {
            id: encounterId,
            ...encounter,
            monster
          };
        }));

        Emitter.emit("MONSTERS_UPDATED", encounters.map((encounter) => {
          return {
            id: encounter.id,
            monster: encounter.monster,
            x: encounter.x,
            y: encounter.y
          }
        }));

        // remove players that are not in the entity list
        // encounters.forEach((entityId: string) => {
        //     if (!this.encounters[entityId] && this.encounters[entityId]?.avatar) {
        //       this.encounters[entityId].avatar.destroy();
        //       delete this.encounters[entityId];
        //     }
        // });
      });
  }

  _fleeForce = new Vector3()

  onUpdate = (delta) => {
    // let dFlee = this._fleeForce.multiplyScalar(0)        


    // this.steering.forEach((steering) => {
    //   const result = steering.seek(
    //     steering.runawayV3,
    //     1,
    //     dFlee
    //   );

    //   steering.runawayV3.add(1).setY(0).normalize()

    //   steering.self.position.add(result.multiplyScalar(delta))

    // });

  }
}

class EncounterManager {

  postprocessing: any;

  avatars: any;

  monster: {
    name: string;
    avatar: any;
  };

  encounterId: string;

  mud: any;

  _loading = false;

  tvTimeout = null;

  interactions = [];

  encounters = null;
  
  set loading(value) {
    if (value) {
      this.interactions.forEach((interaction) => {
        interaction.hide();
      });  
    } else {
      this.interactions.forEach((interaction) => {
        interaction.show();
      });
    }
    this._loading = value;
  }

  get loading() {
    return this._loading;
  }

  constructor({ encounter, encounterId, mud, encounters }) {

    this.monster = encounter;

    this.mud = mud;

    this.encounterId = encounterId;

    this.postprocessing = Components.byId("postprocessing");

    this.avatars = Components.byTag("monster");

    this.encounters = encounters;

    this.createInteraction({
      type: 'interaction',
      keyLetter: "e",
      key: "KeyE",
      position: {
        x: 0,
        y: this.monster.avatar.getDimensions().y + 0.3,
        z: 0
      },
      onInteraction: this.onInteract,
    });
  }

  onInteract = async ({ interaction }) => {

    if (this.tvTimeout) return;

    interaction.active = false;

    interaction.visible = false;

    console.log("interacting with monster", this.monster);

    this.monster.avatar.useMixer = true;

    this.monster.avatar.userData.wander.active = false;

    this.monster.avatar.play("praying", {
      reset: true,
      stopAll: true
    });

    this.createInteraction({
      type: "interaction",
      key: "KeyX",
      keyLetter: "x",
      position: {
        x: -1,
        y: interaction.position.y,
        z: 0
      },
      scale: 0.1,
      textContent: "to leave",
      textIndent: 0.5,
      textScale: 0.3,
      onInteraction: ({ dispose }) => {

        const controls = Controls.getControllerFor(Player.avatar);

        controls.controller.active = true;

        controls.active = true;

        controls.autoAnimate = true;

        controls.autoRotate = true;

        this.monster.avatar.useMixer = false;

        dispose();

        interaction.active = true;

        interaction.visible = true;

        this.postprocessing._dataWrapper.setMerged(['tvOpts', 'amount'], 0);

        this.monster.avatar.rotation.y -= Math.PI;

        this.monster.avatar.play("goofy-running", {
          reset: true,
          stopAll: true,
        });

        this.interactions.forEach((interaction) => {
          interaction.dispose();
        });

        if (this.tvTimeout) {
          clearTimeout(this.tvTimeout);
          this.tvTimeout = null;
        }

        this.monster.avatar.userData.wander.active = true;

      }
    }).then((interaction) => {
      this.interactions.push(interaction)
    });
    
    const controls = Controls.getControllerFor(Player.avatar);

    controls.controller.active = false;

    controls.active = false;

    controls.autoAnimate = false;

    controls.autoRotate = false;

    Player.avatar.play("bouncing-idle", {
      reset: true,
      stopAll: true
    });

    const angle = Math.atan2(
      Player.avatar.position.x - this.monster.avatar.position.x, 
      
      Player.avatar.position.z - this.monster.avatar.position.z
    );

    this.monster.avatar.rotation.y = angle + Math.PI;

    const angle2 = Math.atan2(
        this.monster.avatar.position.x - Player.avatar.position.x, 
        
        this.monster.avatar.position.z - Player.avatar.position.z
    );

    Player.avatar.rotation.y = angle2 + Math.PI;

    Player.avatar.rigidBody.teleport(
      Player.avatar.position,
      Player.avatar.quaternion
    )

    this.postprocessing._dataWrapper.setMerged(['tvOpts', 'amount'], 1);
    
    this.createInteraction({
      type: 'interaction',
      key: "KeyO",
      keyLetter: "o",
      distance: 10,
      position: {
        x: 1,
        y: interaction.position.y,
        z: 0
      },
      textContent: "attack",
      onInteraction: async () => {
        try {

          this.loading = true;
  
          const result = await this.mud.systemCalls.throwBall(this.encounterId);
  
          if (result === MonsterCatchResult.Caught) {
            await this.handleEncounterState("captured");
  
            this.monster.avatar.destroy();
  
            this.destroy();
          } else if (result === MonsterCatchResult.Fled) {
            await this.handleEncounterState("flee");
            this.destroy()
          } else if (result === MonsterCatchResult.Missed) {
            await this.handleEncounterState("miss");
            this.loading = false;
          } else {
          }
        } catch(err) {

          this.loading = false;
        }
      }
    }).then((interaction) => {
      this.interactions.push(interaction)
    });


    this.createInteraction({
      type: 'interaction',
      key: "KeyP",
      keyLetter: "p",
      distance: 10,
      position: {
        x: 1,
        y: interaction.position.y - 0.6,
        z: 0
      },
      textContent: "spare",
      onInteraction: async () => {
        try {
          this.loading = true;
  
          const result = await this.mud.systemCalls.fleeEncounter(this.encounterId);
  
          await this.handleEncounterState("spare");
  
          this.destroy();
        } catch (e) {

          this.loading = false;
        }

      }
    }).then((interaction) => {
      this.interactions.push(interaction)
    });

    await new Promise((resolve) => {
      
      this.tvTimeout = setTimeout(() => {
        this.postprocessing._dataWrapper.setMerged(['tvOpts', 'amount'], 0);
        resolve(null);
      }, 2000);
    })

  }

  async handleEncounterState(state: "captured" | "miss" | "flee" | "spare") {

    const idle = () => {
      if (!Player.avatar.activeAnimations["bouncing-idle"]) {
        Player.avatar.play("bouncing-idle", {
            loop: "loop",
            stopAll: true,
            fadeIn: 0.1
        });
      }
          
      if (!this.monster.avatar.activeAnimations["praying"]) {
        this.monster.avatar.play("praying", {
          loop: "loop",
          stopAll: true,
          fadeIn: 0.1
        });
      }
    } 

    const fight = async () => {
      const promise1 = new Promise((resolve) => {
          Player.avatar.play("punch-combo", {
              loop: "loop",
              stopAll: true,
              fadeIn: 0.1,
              reset: true,
              callback: () => {
                resolve(null);
              }
          });
      });

      const promise2 = new Promise((resolve) => {
        this.monster.avatar.play("dodging", {
          loop: "loop",
          stopAll: true,
          fadeIn: 0.1,
          reset: true,
          callback: () => {
              resolve(null);
          }
        })
      });

      return Promise.all([promise1, promise2]);
    }

    return await new Promise(async (resolve) => {
      switch (state) {
  
        case "captured": 

          await fight();

          this.monster.avatar.play("hit-fall", {
            clampWhenFinished: true,
            loop: "once",
            reset: true,
            stopAll: true,
            callback: () => {
              resolve(null);
            }
          });

          Player.avatar.play("victory", {
            clampWhenFinished: true,
            loop: "once",
            reset: true,
            stopAll: true,
            callback: () => {
            }
          })
  
          break;
        case "miss":
          await fight();
          idle();
          resolve(null);
          break;
        case "flee":
          await fight();
          Player.avatar.play("bouncing-idle", {
              loop: "loop",
              stopAll: true,
              fadeIn: 0.1
          });

          this.monster.avatar.rotation.y -= Math.PI;

          this.monster.avatar.play("goofy-running", {
              clampWhenFinished: true,
              loop: "once",
              reset: true,
              stopAll: true,
              callback: () => {
                resolve(null);
              }
          });
          break;
        case "spare":
            Player.avatar.play("spare", {
              clampWhenFinished: true,
              loop: "once",
              callback: () => {
                  this.monster.avatar.play("bow", {
                      clampWhenFinished: true,
                      loop: "once",
                      callback: () => {
                          this.monster.avatar.rotation.y -= Math.PI;
                          this.monster.avatar.play("goofy-running", {
                            callback: () => {
                              resolve(null);
                            }
                          });
                      }
                  })
              }
          })
          break;
        default:
          break;
      }
    })
  }

  async createInteraction({ 
    key, 
    position, 
    textContent, 
    onInteraction, 
    keyLetter, 
    distance, 
    scale,
    textIndent,
    textScale 
  }) {

    const interaction = await Components.create({

        type: 'interaction',

        distanceTarget:  Player.avatar.position,
        
        distance: distance || 5,
        
        atlas: Device.isMobile ? "tap-outline" : `keyboard_${keyLetter}`,

        key,

        scale: {
            x: scale || 0.2,
            y: scale || 0.2,
            z: scale || 0.2
        },

        position: {
            x: position.x,
            y: position.y,
            z: position.z
        }

    });

    let text = null;

    if (textContent) {
      text = await Components.create({
  
        type: "text",
  
        text: textContent,
  
        position: {
          x: position.x - (textIndent || 0.8),
          y: position.y,
          z: position.z
        },
  
        scale: {
          x: textScale || 0.5,
          y: textScale || 0.5,
          z: textScale || 0.5
        },
  
        rotation: {
          x: 0,
          y: Math.PI,
          z: 0
        },

        // instanced: true,

        instancedBillboard: true
  
      });
  
      this.monster.avatar.add(text);
    }

    this.monster.avatar.add(interaction);

    let prevText = "";

    const hide = () => {
      if (text) text.visible = false;

      interaction.active = false;
    }

    const show = () => {
      if (text && prevText) { text.text = prevText; }

      if (text) text.visible = true;

      interaction.active = true;
    }

    const dispose = () => {
      this.monster.avatar.remove(interaction);
      this.monster.avatar.remove(text);
      interaction.destroy();
      if (text) text.destroy();
    };

    interaction.onInteraction(() => onInteraction({ 
      interaction, 
      dispose,
      hide, 
      show,
    }))  

    return {
        dispose,
        hide, 
        show,
    }
  }
  
  destroy() {
    this.interactions.forEach((interaction) => {
      interaction.dispose();
    });

    delete this.encounters[this.encounterId];

    this.monster.avatar.destroy();

    const controls = Controls.getControllerFor(Player.avatar);

    controls.controller.active = true;

    controls.active = true;

    controls.autoAnimate = true;

    controls.autoRotate = true;

    this.postprocessing._dataWrapper.setMerged(['tvOpts', 'amount'], 0);

    if (this.tvTimeout) {
      clearTimeout(this.tvTimeout);
      this.tvTimeout = null;
    }
  }
}

export const MIN_FLOAT: number = 0.00001;

function Truncate(vec3: Vector3, max: number): Vector3 {
    if (vec3.length() > MIN_FLOAT) {
        var factor = max / vec3.length();
        factor = factor < 1.0 ? factor : 1.0;
        vec3 = vec3.multiplyScalar(factor);
    }
    else {
        vec3.set(0, 0, 0);
    }
    return vec3;
}

function GetDistance(orgPos: Vector3, targetPos: Vector3): Vector3 {
    var distance = new Vector3();

    distance.subVectors(targetPos, orgPos);

    if (Math.abs(distance.x) < MIN_FLOAT)
        distance.setX(0);

    if (Math.abs(distance.y) < MIN_FLOAT)
        distance.setY(0);

    if (Math.abs(distance.z) < MIN_FLOAT)
        distance.setZ(0);

    return distance;
}

function RotateY(vec3: Vector3, angle: number): void {
    var len = vec3.length();
    vec3.setX(Math.cos(angle) * len);
    vec3.setZ(Math.sin(angle) * len);
}

export interface IWanderParam {
    /**
     * center of wander range
     * @abstract
     * @member {Vector3} IWanderParam#orbitCenter
     */
    orbitCenter: Vector3;

    /**
     * radius of wander range
     * @abstract
     * @member {number} IWanderParam#orbitRadius
     */
    orbitRadius: number;

    /**
     * Distance between center of wander force circle and position of ISteerObj
     * @abstract
     * @member {number} IWanderParam#circleDistance
     */
    circleDistance: number;

    /**
     * Radius of wander force circle
     * @abstract
     * @member {number} IWanderParam#circleRadius
     */
    circleRadius: number;

    /**
     * Current wander force direction, accumulated by angleChange
     * @abstract
     * @member {number} IWanderParam#angle
     */
    angle: number;

    /**
     * Amount of random angle change per tick for wander force.
     * @abstract
     * @member {number} IWanderParam#angleChange
     */
    angleChange: number;
}


class Wander {

  mesh = null;

  wanderParam: IWanderParam = {
    orbitCenter: new Vector3(),
    orbitRadius: 1,
    circleDistance: 0.5,
    circleRadius: 2,
    angle: 0,
    angleChange: 0.5
  }

  velocity: Vector3 = new Vector3(0, 0, 0);
  movement: Vector3 = new Vector3(0, 0, 0);
  mass: number = 6;
  maxVelocity: number = 3; // Meter / second
  maxForce: number = 0.2;
  maxSpeed: number = 6;

  kinematicController: KinematicController = null
  
  steering = new Vector3();

  enableYCtrl = false;

  _active = false;

  host: any;

  set active(val) {

    this._active = val;
    
    if ( val ) {

      Emitter.on(Events.GAME_UPDATE, this.onUpdate);

    } else {
        
      Emitter.off(Events.GAME_UPDATE, this.onUpdate);
    }

    this.kinematicController.active = val;
  }

  get active() {
    return this._active;
  }

  constructor(host: Component3D) {
    this.host = host;

    this.wanderParam.orbitCenter.copy(this.host.position);

    this.kinematicController = new KinematicController(this.host);

    this.mesh = new Mesh(
        new CircleGeometry(this.wanderParam.orbitRadius * 5),
        new MeshBasicMaterial({ color: "red", side: DoubleSide })
    )

    this.mesh.rotation.x = -Math.PI / 2;

    // World.add(this.mesh);

    this.mesh.position.copy(this.host.position)

    this.active = true;

  }

  onUpdate = (deltaTime: number) => {

    if (!this.active) return;

    if (deltaTime > 0.16) deltaTime = 0.16;

    this.steering.set(0, 0, 0);

    // Calculate the circle center
    var circleCenter = new Vector3(0, 0, -1);
    circleCenter.copy(this.velocity);

    circleCenter.normalize().multiplyScalar(this.wanderParam.circleDistance);

    // Calculate the displacement force
    var displacement = new Vector3(0, 0, -1);
    displacement.multiplyScalar(this.wanderParam.circleRadius);
    // 
    // Randomly change the vector direction 
    // by making it change its current angle
    RotateY(displacement, this.wanderParam.angle);

    // Change wanderAngle just a bit, so it 
    // won't have the same value in the 
    // next game frame.
    this.wanderParam.angle += Math.random() * this.wanderParam.angleChange - this.wanderParam.angleChange * 0.5;
    this.wanderParam.angle = this.wanderParam.angle % 2 * Math.PI;

    var force = circleCenter.clone().add(displacement);

    var orbitVec = GetDistance(this.host.position, this.wanderParam.orbitCenter);

    if (orbitVec.length() > this.wanderParam.orbitRadius) {
        force.add(orbitVec);
    }

    this.steering.add(force);

    // 
    Truncate(this.steering, this.maxForce);

    var steerFactor = 1;

    if (this.mass > 0) {
        steerFactor = steerFactor / this.mass;
    }
    
    this.steering.multiplyScalar(steerFactor);

    this.velocity.add(this.steering);

    Truncate(this.velocity, this.maxSpeed);

    this.movement.copy(this.velocity).multiplyScalar(deltaTime);
    // 

    if (!this.enableYCtrl) {
        this.movement.setY(0);
    }

    this.kinematicController.movement.copy(this.movement);
  }
}


const Mix = function mix(min, max, value) {
    return min * (1 - value) + max * value;
};

const Smoothstep = function smoothstep(min, max, value) {
    if (min === max) {
        // If min and max are the same, return 0 if value is less than or equal to min,
        // and return 1 if value is greater than min.
        return value <= min ? 0 : 1;
    }

    return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

export const DIRECTION = {
    UP: new Vector3(0, 1, 0).normalize(),
};

export class KinematicController {

    characterController;

    movement = new Vector3();

    private quaternion = new Quaternion();

    private rotation = new Euler();

    private rotateQuarternion = new Quaternion();

    private targetRot: number = 0;

    gravity = { x: 0, y: -9.81, z: 0 }

    isMoving = false;

    isOnFloor = false;

    _active = false;

    set active(val) {
      this._active = val;

      if (val) {
  
        this.component.rigidBody.teleport(this.component.position, this.component.quaternion);

        Emitter.on(Events.GAME_UPDATE, this.update);
  
      } else {
  
        Emitter.off(Events.GAME_UPDATE, this.update);
  
      }
    }

    get active() {
      return this._active;
    }

    constructor(public component) {

      this.characterController = World.physics.world.createCharacterController(0.1);
      this.characterController.enableAutostep(5, 5, true);
      this.characterController.setApplyImpulsesToDynamicBodies(true);

      component.rigidBody.teleport(this.component.position, this.component.quaternion);
    }
    
    update = (deltaTime) => {
      this.isMoving = new Vector3(this.movement.x, 0, this.movement.z).length() > 0;

      this.movement.setY(this.movement.y + this.gravity.y * deltaTime)

      this.characterController.computeColliderMovement(
          this.component.rigidBody.colliders[0].raw,         
          this.movement, 
          null,
          null,
          ( collider )=>{
            // this is filter from the collision solver : 
            // if the colliding object is a sensor => no collision
            const isSensor = collider.isSensor();
            const c =  (collider.parent().userData).mesh.componentType;
            const t = isSensor == false && c != 'avatar';
            return t;
          }
      )

      this.isOnFloor = this.characterController.computedGrounded();

      let correctedMovement = this.characterController.computedMovement();

      const rpos = this.component.collider.rigidBody.translation();

      const newPosition = new Vector3(

          rpos.x + correctedMovement.x,

          rpos.y + correctedMovement.y,
          
          rpos.z + correctedMovement.z
      
      );

      this.component.position.copy(newPosition);

      this.component.collider.rigidBody.setNextKinematicTranslation(newPosition);

      this._rotation(deltaTime);

      this._animation();
    }

     _rotation(deltaTime) {
        //
        this.targetRot = !this.isMoving
            ? this.targetRot
            : Math.atan2(this.movement.x, this.movement.z) + Math.PI;

        this.rotateQuarternion.setFromAxisAngle(DIRECTION.UP, this.targetRot);

        const angleDifference = this.quaternion.angleTo(this.rotateQuarternion);

        if (angleDifference != 0) {
            const multiplayer = 1;

            const force = Mix(10, 20, Smoothstep(0, Math.PI, angleDifference));

            this.quaternion.rotateTowards(
                this.rotateQuarternion,
                Math.min(deltaTime * force, 1.0),
            );
        }

        this.rotation.setFromQuaternion(this.quaternion, "YXZ");

        this.component.rotation.set(0, this.rotation.y, 0);
    }

    _animation() {
      if (!this.isOnFloor) {
        this.component.animation = "jump"
      }
      if (this.isMoving) {
        this.component.animation = "sneak-walk";
      } else {
        this.component.animation = "idle";
      }
    }
}
