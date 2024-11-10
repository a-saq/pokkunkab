import { ScriptBehavior, Param} from '@oo/scripting'

import {

    Vector3 

} from 'three'


export default class ParticleDirectionEditor extends ScriptBehavior<any> {


    @Param({name:"direction", step: 0.01 })
    direction = new Vector3(0, 1, 0)

    @Param({name:"directionRandomness", step: 0.01 })
    directionRange = new Vector3(0, 0, 0)

    @Param({visible: (current) => current.host.source != null }) 
    followSourceDirection = true

    @Param({ type:"number", visible: (current) => current.followSourceDirection == true && current.host.source != null, min: -50, max : 50 }) followSourceDirectionForce = 1

    _currentFrame = -1

    _tempVec = new Vector3()

    async pluginUpdateData( data ){
        

        if (this.host.source != null && this.followSourceDirection == true  ){

            // process source orientation only once per frame, no need for each time we spawn a particle
            if ( data.frame != this._currentFrame ) {

                const e = this.host.source.matrixWorld.elements;

		        this._tempVec.set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize();

                this._currentFrame = data.frame
            }

            data.sourceDirection = [ -this._tempVec.x * this.followSourceDirectionForce, -this._tempVec.y * this.followSourceDirectionForce, -this._tempVec.z * this.followSourceDirectionForce]
        }
    }

    async onRenderUpdate(data){

        if( data.prev.followSourceDirection != this.data.followSourceDirection ){

            await this.host.create()
        }
    }

    getPlugin(){

        var plugin = {}

        if( this.followSourceDirection ){

            plugin = {

                name: "ParticleDirectionPlugin",

                uniforms : {

                    particleDirection: {

                        value: this.direction
                    },

                    particleDirectionRange: {

                        value: this.directionRange
                    },

                },

                attributes:{
                
                    sourceDirection: {

                        name: "sourceDirection",
                        array: [],
                        length: 3,
                        defaultValue: [0,0,0]
                    },
                   
                }, 
            
                vertexShaderHooks: {

                    prefix: 
                    
                    `     
                        uniform vec3 particleDirection;                
                        uniform vec3 particleDirectionRange;  
                        attribute vec3 sourceDirection;         
                    `,

                    main: `

                        particlePosition += sourceDirection * vTimerDiff;

                        particlePosition += particleDirection * vTimerDiff;

                        particlePosition.x += nrand( vec2(randomID) * 10.0  + 43.2 ) * particleDirectionRange.x * vTimerDiff;
                        particlePosition.y += nrand( vec2(randomID) * 20.0 - 12.3  ) * particleDirectionRange.y * vTimerDiff;
                        particlePosition.z += nrand( vec2(randomID) * 1.0  + 57.3  ) * particleDirectionRange.z * vTimerDiff;

                      
                    `,

                    suffix: `
                    
                    `,
                },
            
                defines : []
                
            }
        }

        else {

            plugin = {

                name: "ParticleDirectionPlugin",

                uniforms : {

                    particleDirection: {

                        value: this.direction
                    },

                    particleDirectionRange: {

                        value: this.directionRange
                    },

                },
            
                vertexShaderHooks: {

                    prefix: 
                    
                    `
                        uniform vec3 particleDirection;                
                        uniform vec3 particleDirectionRange;                
                    `,

                    main: `

                        particlePosition += particleDirection * vTimerDiff;

                        particlePosition.x += nrand( vec2(randomID) * 10.0  + 43.2 ) * particleDirectionRange.x;
                        particlePosition.y += nrand( vec2(randomID) * 20.0 - 12.3  ) * particleDirectionRange.y;
                        particlePosition.z += nrand( vec2(randomID) * 1.0  + 57.3  ) * particleDirectionRange.z;

                    `,

                    suffix: `
                    
                    `,
                },
            
                defines : []
                
            }
        }

       
 
        return plugin

    }

   
}

