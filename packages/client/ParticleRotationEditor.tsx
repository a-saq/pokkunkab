import { ScriptBehavior, Param,Folder } from '@oo/scripting'

import {

    Vector3

} from 'three'

export default class ParticleRotationEditor extends ScriptBehavior<any> {

    billboard = false


    @Folder("Self Rotation", {})

    @Param({ visible: (current) => current.billboard === false,  name:"starting rotation", step: 0.01 })
    startingRotation = new Vector3(0,0,0)

    @Param({  visible: (current) => current.billboard === false, name:"random range starting rotation", step: 0.01, min: 0, max: 3.1416 })
    randomRangeRotation = new Vector3(0,0,0)

    @Param({ visible: (current) => current.billboard === false, name:"rotation axis over time", step: 0.01, min: 0, max: 3.1416 })
    rotationAxis = new Vector3(0,1,0)


    @Param({ visible: (current) => current.billboard === true, name:"billboard starting rotation", step: 0.01, min: -3.1416, max: 3.1416, type: 'number' })
    billboardStartingRotation = 0

    @Param({ visible: (current) => current.billboard === true, name:"billboard random range rotation", step: 0.01, min: -3.1416, max: 3.1416, type: 'number' })
    billboardRandomRangeRotation = 0

    @Param({ name:"rotation speedOverTime", step: 0.01, min: -10, max: 10 })
    rotationSpeed = 1

    @Folder("Rotation around axis", {})


    

    pluginUpdateData =( data )=>{


        this.billboard = data.billboard

        if( this.billboard ){

            data.rotationY = this.billboardStartingRotation + Math.random() * this.billboardRandomRangeRotation

        } 
        else{

            data.rotation.x = this.startingRotation.x  + ( Math.random() - Math.random()) * (this.randomRangeRotation.x )
            data.rotation.y = this.startingRotation.y  + ( Math.random() - Math.random()) * (this.randomRangeRotation.y )
            data.rotation.z = this.startingRotation.z  + ( Math.random() - Math.random()) * (this.randomRangeRotation.z )

        }
       
    }
    
    onRenderUpdate(){

        this.plugin.uniforms.urotationSpeed.value = this.rotationSpeed
    }

    plugin = null 

    getPlugin(){

        var plugin = {

            name: "ParticleRotationPlugin",

            uniforms : {

                urotationAxis: {

                    value: this.rotationAxis
                },
                urotationSpeed: {

                    value: this.rotationSpeed
                }

            },
          
            vertexShaderHooks: {

                prefix: 
                
                `
                    uniform vec3 urotationAxis;                
                    uniform float urotationSpeed;                
                `,

                main: `

                    rotationAxis += urotationAxis;
                    rotationSpeed += urotationSpeed;

                `,

                suffix: `
                
                `,
            },
          
            defines : []
            
        }

        this.plugin = plugin
 
        return plugin

    }
   
}

