import { ScriptBehavior, Param } from '@oo/scripting'

import {

    Vector3
} from 'three'

export default class ParticleScaleEditor extends ScriptBehavior<any> {


    @Param({ name:"Animate In",  skipLabel: true })
    animateIn = true;

    @Param({ name:"Animate Out", skipLabel: true })
    animateOut = true;

    @Param({ name:"Use scale range", skipLabel: true })
    useScaleRange = false;

    @Param({ visible:(it)=>{return it.useScaleRange}, name:"scale min", step: 0.001, max: 10, min : 0.001 })
    scaleMin = new Vector3(0.5, 0.5, 0.5)

    @Param({ visible:(it)=>{return it.useScaleRange}, name:"scale max", step: 0.001, max: 10, min : 0.001 })
    scaleMax = new Vector3(0.5, 0.5, 0.5)

    @Param({ visible:(it)=>{return !it.useScaleRange}, name:"scale", step: 0.001, max: 10, min : 0.001 })
    _scale = new Vector3(1, 1, 1)

     @Param({ visible:(it)=>{return !it.useScaleRange}, type: "number", name:"scale variance", step: 0.001, max: 10, min : 0.0 })
    _scaleVariance = 1.0;
 
    async onRenderUpdate( data ){

        if( this.animateIn != data.prev.animateIn || this.animateOut != data.prev.animateOut || this.useScaleRange != data.prev.useScaleRange ) {

            this.plugin = null

            await this.host.create()
        }

    }

    pluginUpdateData =( data )=>{

        if( data.scale ) {

            if( this.useScaleRange ) {

                let rdmX = Math.random() * (this.scaleMax.x - this.scaleMin.x) + this.scaleMin.x
                let rdmY = Math.random() * (this.scaleMax.y - this.scaleMin.y) + this.scaleMin.y
                let rdmZ = Math.random() * (this.scaleMax.z - this.scaleMin.z) + this.scaleMin.z
 
                data.scale.x = rdmX 
                data.scale.y = rdmY 
                data.scale.z = rdmZ 
            }

            else {

                let rdm = Math.random() * this._scaleVariance

                data.scale.x = this._scale.x + rdm 
                data.scale.y = this._scale.y + rdm
                data.scale.z = this._scale.z + rdm
            }

            
        }
    }

    plugin = null

    getPlugin(){ 
 
        var plugin = {

            name: "ParticleScalePlugin",

            uniforms : {

            },
          
            vertexShaderHooks: {

                main: `

                    float tempScale = 1.0;
    
                    #ifdef ANIMATE_IN
                        float animateInFactor = smoothstep(0.0, 0.2, life);
                        tempScale *= animateInFactor;
                    #endif
                    
                    #ifndef PERPETUAL_LIFE

                        #ifdef ANIMATE_OUT
                            float animateOutFactor = smoothstep(0.8, 1.0, life);
                            tempScale *= 1.0 - animateOutFactor;
                        #endif
                    #endif

                    particleScale *= tempScale;
    
                `
            },
          
            defines : []
            
        }

        if( this.animateIn ){

            plugin.defines['ANIMATE_IN'] = ''
        }

        if( this.animateOut ){

            plugin.defines['ANIMATE_OUT'] = ''
        }

        this.plugin = plugin

        return plugin
    }
}

