import { ScriptBehavior, Param, Folder} from '@oo/scripting'

import { curl_noise } from "@oncyber/ShaderLib"
 
export default class ParticleNoiseEditor extends ScriptBehavior<any> {


    @Folder("Curl", {})

    @Param({ name:"curl enabled", step: 0.01, min: -10, max: 10 })
    curlEnabled = true

    @Param({ visible: (current) => current.curlEnabled, name:"curl power", step: 0.01, min: 0, max: 1 })
    curlPower = 1.0;

    @Param({visible: (current) => current.curlEnabled,name:"curl domain", step: 0.01, min: 0, max: 1 })
    curlDomain = 0.1;

    @Param({visible: (current) => current.curlEnabled,name:"curl speed", step: 0.01, min: 0, max: 5 })
    curlSpeed = 0.1;

    @Param({visible: (current) => current.curlEnabled,name:"curl speed variation", step: 0.01, min: 0, max: 5 })
    curlSpeedVariation = 0.1;

    plugin = null

    async onRenderUpdate( data ){

        if( this.curlEnabled != data.prev.curlEnabled  ) {

            this.plugin = null

            await this.host.create()
        }
    }

    onFrame(delta){

        if( this.plugin?.uniforms.curlPower != null && this.curlEnabled == true ){

            this.plugin.uniforms.curlPower.value = this.curlPower
            this.plugin.uniforms.curlDomain.value = this.curlDomain
            this.plugin.uniforms.curlSpeed.value = this.curlSpeed
            this.plugin.uniforms.curlSpeedVariation.value = this.curlSpeedVariation
        }
    }

    getPlugin(){ 

        var plugin = {

            name: "ParticleNoisePlugin",

            uniforms : {

            },
          
            vertexShaderHooks: {

                prefix: '',
                
                main:'',

                suffix: '',
            },
          
            defines : []
            
        }

      
        if(this.curlEnabled == true){

            plugin.uniforms.curlPower = {

                value: this.curlPower
            }

             plugin.uniforms.curlDomain = {

                value: this.curlDomain
            }

            plugin.uniforms.curlSpeed = {

                value: this.curlDomain
            }

            plugin.uniforms.curlSpeedVariation = {

                value: this.curlSpeedVariation
            }

            plugin.vertexShaderHooks.prefix += curl_noise +
            
            `
                uniform float curlPower;               
                uniform float curlDomain;               
                uniform float curlSpeed;               
                uniform float curlSpeedVariation;  
            `

            plugin.vertexShaderHooks.main +=  `

                float noiseScale = curlDomain;

                float curlTimer = (pluginTimer * (curlSpeed + curlSpeedVariation * nrand( vec2(randomID) * 40.0 ) ) ) ;
                vec3 posX = (offset + vec3(curlTimer) * noiseScale );
                vec3 posY = posX + vec3(31.341, -43.23, 12.34f); //random offset
                vec3 posZ = posX + vec3(-231.341, 124.23, -54.34); //random offset
                vec3 derivX = SimplexPerlin3D_Deriv(posX);
                vec3 derivY = SimplexPerlin3D_Deriv(posY);
                vec3 derivZ = SimplexPerlin3D_Deriv(posZ);
                vec3 curlDir = vec3(derivZ.y - derivY.z, derivX.z - derivZ.x, derivY.x - derivX.y);


                particlePosition += curlDir * curlPower;
                    
            `

            this.plugin = plugin
 
            return plugin
        }

        else {

            this.plugin = null
            
            return null
        }


       
    }
}


