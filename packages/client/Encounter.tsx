import { Camera, Components, Controls, Player } from "@oo/scripting";
import { clamp } from "gsap";

import { Vector3 } from "three";

export enum MonsterCatchResult {
    Missed,
    Caught,
    Fled,
}
  
export enum MonsterType {
    Unicorn = 1,
    Slug,
    Frog,
}
  
type MonsterConfig = {
    name: string;
};

const DISTANCE_TO_CENTER = 1;

const ENCOUNTER_CAMERA_ZOOM = 3;
  
export const monsterTypes: Record<MonsterType, MonsterConfig> = {
    [MonsterType.Unicorn]: {
      name: "unicorn",
    },
    [MonsterType.Slug]: {
      name: "slug",
    },
    [MonsterType.Frog]: {
      name: "frog",
    },
};

const CAMERA_STATE = {
    "spherical": {
        "radius": 5,
        "phi": 0.9007963267948995,
        "theta": 0.7875000000000008
    },
    "targetSpherical": {
        "radius": 5,
        "phi": 0.9007963267948995,
        "theta": 0.7875000000000006
    },
    "idealCameraPosition": {
        "x": -74.04120594448334,
        "y": 5.805018537487246,
        "z": -114.05975987516487
    },
    "idealCameraTarget": {
        "x": -76.81825256347656,
        "y": 2.700088602304459,
        "z": -116.82515716552734
    },
    "cameraPosition": {
        "x": 0,
        "y": 0,
        "z": 0
    },
    "cameraTarget": {
        "x": -76.81825256347656,
        "y": 2.700088602304459,
        "z": -116.82515716552734
    },
    "cameraHeight": 2.7,
    "currentZoom": ENCOUNTER_CAMERA_ZOOM
}

  
export class Encounter {
    postprocessing;
    
    avatars = [];

    zone = null;

    name = "";

    systemCalls = null;

    interactions = [];

    result = null;

    monster = null;

    timeout = null;

    constructor({
        zone, 

        name,

        systemCalls

    }) {

        this.postprocessing = Components.byId("postprocessing");

        this.avatars = Components.byTag("monster");

        this.zone = zone;

        this.name = name;

        this.systemCalls = systemCalls;

        this.init();
    }

    _loading = false;


    set loading(value) {
        this._loading = value;

        if (value) {
            this.interactions.forEach((interaction, index) => {
                interaction.hide()
                // if (index === 0) {
                //     interaction.showLoading()
                // }
            });
        } else {
            this.interactions.forEach(interaction => {
                interaction.show()
            });
        }
    }

    get loading() {
        return this._loading;
    }

    async init() {

        const monster: any = Components.byId(this.name);

        this.monster = monster;

        if (!monster || !this.zone) return;

        const controls = Controls.getControllerFor(Player.avatar);

        controls.controller.active = false;

        controls.active = false;

        controls.autoAnimate = false;

        controls.autoRotate = false;

        this.postprocessing._dataWrapper.setMerged(['tvOpts', 'amount'], 1);

        Player.avatar.play("looking");

        await new Promise((resolve) => {
            setTimeout(() => {

                this.postprocessing._dataWrapper.setMerged(['tvOpts', 'amount'], 0);
                
                resolve(null);

            }, 2000);
        })  

        monster.visible = true;

        monster.position.x = this.zone.position.x - DISTANCE_TO_CENTER;

        monster.position.z = this.zone.position.z - DISTANCE_TO_CENTER;

        Player.avatar.position.x = this.zone.position.x + DISTANCE_TO_CENTER;

        Player.avatar.position.z = this.zone.position.z + DISTANCE_TO_CENTER;

        Player.avatar.position.y = 0;

        monster.animation = "praying";

        Player.avatar.animation = "bouncing-idle";

        Camera.controls.active = false;

        const angle = Math.atan2(
            Player.avatar.position.x - monster.position.x, 
            
            Player.avatar.position.z - monster.position.z
        );

        monster.rotation.y = angle + Math.PI;

        const angle2 = Math.atan2(
            monster.position.x - Player.avatar.position.x, 
            
            monster.position.z - Player.avatar.position.z
        );

        Player.avatar.rotation.y = angle2 + Math.PI;

        Player.avatar.rigidBody.teleport(
            Player.avatar.position,
            Player.avatar.quaternion
        )

        const idle = () => {

            if (!Player.avatar.activeAnimations["bouncing-idle"]) {

                Player.avatar.play("bouncing-idle", {
                    loop: "loop",
                    stopAll: true,
                    fadeIn: 0.1
                });
            }
                
            if (!monster.activeAnimations["praying"]) {

                monster.play("praying", {
                    loop: "loop",
                    stopAll: true,
                    fadeIn: 0.1
                });
            }
        }

        idle();

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
                monster.play("dodging", {

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

        Camera.controls.loadState(CAMERA_STATE);

        const interaction1 = await this.createInteraction({
            key: "KeyE",
            monster,
            position: {
                x: -1,
                y: 2,
                z: 0
            },
            textContent: "Swing",
            onInteraction: async ({
                interaction,
                text
            }) => {

                if (this.loading) return;

                this.loading = true;

                const promise = fight();

                console.log("ENCOUNTER INITIATED")

                let shouldDestroy = false;
                
                try {

                    const result = await this.systemCalls.throwBall();
                    
                    this.result = result;

                    await new Promise((resolve) => {

                        if (result === MonsterCatchResult.Caught) {
                            promise.then(() => {

                                // Player.avatar.play("bouncing-idle", {
                                //     loop: "loop",
                                //     stopAll: true,
                                //     fadeIn: 0.1
                                // });

                                Player.avatar.play("victory", {
                                    clampWhenFinished: true,
                                    loop: "once",
                                    reset: true,
                                    stopAll: true,
                                    callback: () => {
                                    }
                                })

                                this.monster.play("hit-fall", {
                                    clampWhenFinished: true,
                                    loop: "once",
                                    reset: true,
                                    stopAll: true,
                                    callback: () => {
                                        shouldDestroy = true;
                                        resolve(null);
                                    }
                                });

                            });

                            // play happy 
                        } else if (result === MonsterCatchResult.Fled) {
        
                            promise.then(() => {
                                Player.avatar.play("bouncing-idle", {
                                    loop: "loop",
                                    stopAll: true,
                                    fadeIn: 0.1
                                });

                                this.monster.rotation.y -= Math.PI;

                                this.monster.play("goofy-running", {
                                    clampWhenFinished: true,
                                    loop: "once",
                                    reset: true,
                                    stopAll: true,
                                    callback: () => {
                                        shouldDestroy = true;
                                        
                                        resolve(null);
                                    }
                                });
                            });

                            // play sad 
                        } else if (result === MonsterCatchResult.Missed) {
                    
                            // shouldn't play automatically, wait until punch-combo / dodging is done

                            promise.then(() => {

                                resolve(null);
                            });
                    
                        } else {

                            promise.then(() => {

                                resolve(null);
                            });
                            
                        }
                    })
                } catch (e) {
                
                    console.warn(e);

                } finally {


                    if (shouldDestroy) {
                    
                        this.destroy();
                    
                        this.loading = false;

                    } else {
                    
                        promise.then(() => {

                            idle()
                
                            this.loading = false;

                        });
                    }

                }
            }
        })

        this.interactions.push(interaction1);

        const interaction2 = await this.createInteraction({
            key: "KeyF",
            monster,
            position: {
                x: -1,
                y: 1,
                z: 0
            },
            textContent: "Spare",
            onInteraction: async ({
                interaction, 
                text
            }) => {

                if (this.loading) return;

                this.loading = true;

                idle();

                try {

                    await this.systemCalls.fleeEncounter()
                
    
                    Player.avatar.play("spare", {
    
                        clampWhenFinished: true,
    
                        loop: "once",
    
                        callback: () => {
    
                            this.monster.play("bow", {
    
                                clampWhenFinished: true,
    
                                loop: "once",
                                
                                callback: () => {
    
                                    this.monster.rotation.y -= Math.PI;
    
                                    this.monster.play("goofy-running", {
    
                                        callback: () => {
                                            
                                            this.destroy();
                                        }
                                    });
                                }
                            })
                        }
                    })

                } catch (e) {

                    idle()

                }
            }
        })

        this.interactions.push(interaction2);
    }

    destroy() {

        this.avatars.forEach(avatar => {
            
          avatar.visible = false;
        
        });

        const controls = Controls.getControllerFor(Player.avatar);
        
        controls.active = true;

        controls.controller.active = true;

        controls.autoAnimate = true;

        controls.autoRotate = true;

        Camera.controls.active = true;

        this.interactions.forEach(interaction => {
            interaction.dispose()
        });

        Camera.controls.currentZoom = Camera.controls.maxZoomOut;

        this.monster = null;
    }

    async createInteraction({ key, monster, position, textContent, onInteraction }) {

        const interaction = await Components.create({
  
            type: 'interaction',
  
            distanceTarget:  Player.avatar.position,
            
            distance: 20,
            
            key,

            scale: {
                x: 0.2,
                y: 0.2,
                z: 0.2
            },

            position: {
                x: position.x,
                y: position.y,
                z: position.z
            }
   
        });
  
        interaction.onInteraction( () => {

            onInteraction({

                interaction,

                text 

            })
        
        })  
  
        const text = await Components.create({
  
          type: "text",
  
          text: textContent,

          position: {
            x: position.x - 0.6,
            y: position.y,
            z: position.z
          },

          scale: {
            x: 0.5,
            y: 0.5,
            z: 0.5
          },

          rotation: {
            x: 0,
            y: Math.PI,
            z: 0
          }
  
        });

        monster.add(text);
        monster.add(interaction);
  
        let prevText = "";

        const hide = () => {
                
            text.visible = false;
    
            interaction.active = false;
        }

        const show = () => {

            if (prevText) {
                text.text = prevText;
            }

            text.visible = true;

            interaction.active = true;
        }

        const showLoading = () => {
            
            prevText = text.text;

            text.visible = true;

            text.text = "Loading…";
        }

        const dispose = () => {
            monster.remove(interaction);
            monster.remove(text);
            interaction.destroy();
            text.destroy();
        };

        return {
            dispose,
            hide, 
            show,
            showLoading
        }
    }
  
}