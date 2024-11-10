import { ScriptBehavior, Param,Folder } from '@oo/scripting'

import {

    Vector3,

    Color

} from 'three'


const tempColor = new Color()

export default class ParticleColorEditor extends ScriptBehavior<any> {

    _count = 3

    @Param({ type: "color", name:"color"})
    color0 = 0xffffff;

    @Param({ type: "color", name:"color"})
    color1 = 0xffffff;

     @Param({ type: "color", name:"color"})
    color2 = 0xffffff;

     @Param({ type: "color", name:"color"})
    color3 = 0xffffff;


    pluginUpdateData =( data )=>{

        let random = Math.round( Math.random() * this._count )

        tempColor.setHex( this['color' + random] ) 
        
        data.instanceColor = [tempColor.r, tempColor.g, tempColor.b] 
    }
    
    onRenderUpdate(){

    }

    plugin = null 

    getPlugin(){

        var plugin = {

            name: "ParticleColorEditor",

            attributes:{
            
                instanceColor: {

                    name: "instanceColor",
                    array: [],
                    length: 3,
                    defaultValue: [1,1,1]
                },
                
            }, 
          
            defines : { 

                USE_INSTANCING_COLOR: '',
                USE_COLOR : ''
            },

            chunks : {

                fragment: {},

                vertex: {

                    color_vertex: `

                        #if defined( USE_COLOR_ALPHA )
                            vColor = vec4( 1.0 );
                        #elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
                            vColor = vec3( 1.0 );
                        #endif
                        #ifdef USE_INSTANCING_COLOR
                            vColor.xyz *= instanceColor.xyz;
                        #endif
                    `
                }
            }
        }

        this.plugin = plugin
 
        return plugin

    }
   
}

