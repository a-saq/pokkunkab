import { ScriptBehavior, Param } from '@oo/scripting'


import {

    Vector3,

    Vector2

} from 'three'

export default class ParticleSpawnPositionEditor extends ScriptBehavior<any> {


    @Param({ name:"spawn random displacement range", step: 0.01 })
    displacement = new Vector3(5, 5, 5);

    @Param({ name:"spawn offset", step: 0.01 })
    offset = new Vector3(0, 0, 0);

    @Param({ name:"Spawn around source" })
    aroundSource = false

    @Param({ visible: (current) => current.aroundSource == true, name:"Spawn around source radius", step: 0.01 })
    aroundSourceMinMax = new Vector2(2, 4)


    pluginUpdateData =( data )=>{

        if( data.position ) {
 
            data.position.x +=  (Math.random() - Math.random()) * this.displacement.x 
            data.position.y +=  (Math.random() - Math.random()) * this.displacement.y 
            data.position.z +=  (Math.random() - Math.random()) * this.displacement.z

            data.position.x += this.offset.x
            data.position.y += this.offset.y
            data.position.z += this.offset.z


            if( this.aroundSource ){

                let angle = Math.random() * Math.PI * 2


                let rdmX = this.aroundSourceMinMax.x  + Math.random() * (this.aroundSourceMinMax.y - this.aroundSourceMinMax.x)
                let rdmZ = this.aroundSourceMinMax.x  + Math.random() * (this.aroundSourceMinMax.y - this.aroundSourceMinMax.x)


                data.position.x +=   rdmX * Math.cos( angle )  
                data.position.z +=   rdmZ * Math.sin( angle ) 

            }
        }
    }
   
}

