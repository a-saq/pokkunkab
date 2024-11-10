
import { Vector2 } from 'three'
import { ScriptBehavior, Param } from '@oo/scripting'


export default class ParticleUVEffectPlugin extends ScriptBehavior<any> {
 

    @Param({ name:"uv Scroll", step: 0.001, max: 20, min : -20 })

    uvScroll = new Vector2(0, 0);

    @Param({ name:"uv repeat", step: 0.001, max: 20, min : -20 })

    uvReapeat = new Vector2(1, 1);

    @Param({ name:"uv fade" })
    uvFade = false

    @Param({name:"Reverse BackFace UV"})
    reverseBackFaceUV = false


    @Param({ visible:(it)=>{  return it.uvFade == true }, name:"uv fadeY", skipLabel: true })
    uvFadeY = true

    @Param({ visible:(it)=>{ return it.uvFade == true }, name:"uv fadeX", skipLabel: true })
    uvFadeX = true
  
    plugin = null

    onRenderUpdate( opts ){

        if  ( 
                    this.uvFade != opts.prev.uvFade
                ||  this.uvFadeX != opts.prev.uvFadeX
                ||  this.uvFadeY != opts.prev.uvFadeY
                ||  this.reverseBackFaceUV != opts.prev.reverseBackFaceUV
            ){

            this.host.create()
        }
    }

    getPlugin(){ 
 
        var plugin = {

            name: "ParticleUVPlugin",

            uniforms : {

                particleUVScroll : {

                    value: this.uvScroll
                },

                particleUVRepeat : {

                    value: this.uvReapeat
                }
            },

            vertexShaderHooks: {

                prefix: `

                    #ifdef REVERSE_BACK_FACE_UV

                        #if defined(ATLAS) && defined(USE_MAP)
                            varying vec2 backFacevMapUv;
                        #endif

                    #endif
                `,

                main: ``,

                suffix: `

                    #ifdef REVERSE_BACK_FACE_UV

                        #if defined(ATLAS) && defined(USE_MAP)
                            backFacevMapUv =  atlas.xy + atlas.zw * vec2( 1.0 - uv.x, uv.y);
                        #else

                            backFacevMapUv = vec2( 1.0 - vMapUv.x, vMapUv.y );

                        #endif

                    #endif

                `
            },
          
            fragmentShaderHooks:{


                prefix: `


                    #if defined(REVERSE_BACK_FACE_UV) && defined(USE_MAP)
                        
                        varying vec2 backFacevMapUv;
                    #endif


                    uniform vec2 particleUVScroll;
                    uniform vec2 particleUVRepeat;
                `,
                main: `

                    #ifdef UV_FADE

                        #ifndef OPAQUE
                            
                            #ifdef UV_FADE_X

                                opacity = opacity * sin(3.1416 * particleUV.x );

                            #endif

                            #ifdef UV_FADE_Y

                                opacity = opacity * sin(3.1416 * particleUV.y );

                            #endif

                        #endif

                    #endif

                    #ifdef USE_MAP

                        vec2 vMapUv = mod( vMapUv * particleUVRepeat  + vTimerDiff * particleUVScroll, vec2(1.0));

                        #ifdef REVERSE_BACK_FACE_UV

                            vMapUv.x = gl_FrontFacing ? vMapUv.x : backFacevMapUv.x;

                        #endif

                    #endif

                  
                   
                `
            },
          
            defines : []
        }

        if( this.uvFade && ( this.uvFadeX || this.uvFadeY )){

            plugin.defines['UV_FADE'] = ''

            if( this.uvFadeX ){

                plugin.defines['UV_FADE_X'] = ''
            }
            
            if( this.uvFadeY ){

                plugin.defines['UV_FADE_Y'] = ''
            }
        }

        if( this.reverseBackFaceUV ){

            plugin.defines['REVERSE_BACK_FACE_UV'] = ''
        }

        this.plugin = plugin

        return plugin
    }
}


