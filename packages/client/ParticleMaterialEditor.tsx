import { ScriptBehavior,$Param, Param, OOOBjects, Components,Env, Player, SHARED, ResourceParam, ResourceLoader } from '@oo/scripting'
 
import {

    TextureLoader,

    Texture,

    Vector2,

    SRGBColorSpace,

    MeshStandardMaterial,

    MeshBasicMaterial,

    Color,

    LinearFilter,

    LinearMipmapLinearFilter

} from 'three'


export default class ParticleMaterialEditor extends ScriptBehavior<any> {
    
 
    @Param({ type: "color", name:"color"})
    color = 0xffffff;
    
    @Param({ name:"use bloom emissive", skipLabel: true})
    useEmissiveColor = false;

    @Param({ visible:(it)=>{ return it.useEmissiveColor }, type: "color", name:"bloom emissive color", skipLabel: true})
    emissiveColor = 0xffffff;

    @Param({ visible:(it)=>{ return it.useEmissiveColor }, step: 0.01, max: 10, min : 0, skipLabel: true})
    emissiveForce = 1;


    @Param({ type: "select", mode: "buttons", skipLabel: true, options: [ "Unlit", "Standard"]})
    mode = "Standard"

    @Param({ visible: (current) => current.mode === "Standard", type: "number", name:"roughness", step: 0.01, max: 1, min : 0 })
    roughness = 0.9; 

    @Param({ visible: (current) => current.mode === "Standard", type: "number", name:"metalness", step: 0.01, max: 1, min : 0 })
    metalness = 0.1;
    

    @Param({ visible: (current) => current.mode === "Standard", type: "number", name:"envMapIntensity", step: 0.01, max: 1, min : 0 })
    envMapIntensity = 0.5;
    
    @Param({type: 'select', options: [
            {id:1, name:'normal'},
            {id: 2, name: 'additive'},
            {id: 3, name: 'substractive'},
            {id: 4, name: 'multiply'}
 
        ]
    } ) blending = 1
   
    @Param({ name:"depthTest"})
    depthtest = true;

    @Param({ name:"depthWrite"})
    depthWrite = true;

    @Param({ name:"transparent"})
    transparent = false;

    @Param({ type: "number", name:"opacity", step: 0.01, max: 1, min : 0 })
    opacity = 1;

    @Param({ type: "number", name:"alphaTest", step: 0.01, max: 1, min : 0 })
    alphaTest = 0.5;

    @Param({ type: "number", name:"shadowAlphaTest", step: 0.01, max: 1, min : 0 })
    shadowAlphaTest = 0.5;

    @Param({ type: "number", name:"side", step: 1, max: 2, min : 0 })
    side = 2;

    @Param({skipLabel: true})
    forceSinglePass = true;


    @Param() image = $Param.Resource("image") 

    @Param({type: 'select', options: [
            {id: LinearMipmapLinearFilter, name: 'LinearMipmapLinearFilter'},
            {id: LinearFilter,name:'LinearFilter'},
        ]
    } ) textureFilter = LinearMipmapLinearFilter
   

    @Param({ name:"Image use atlas"})
    imageUseAtlas = false;

    @Param({  visible: (current) => current.imageUseAtlas === true, name:"image atlas size", step: 1, max: 32, min : 1 })
    imageAtlasSize = new Vector2(1,1)


    @Param({visible: (current) => current.mode === "Standard"}) imageNormal = $Param.Resource("image") 

    @Param({visible: (current) => current.mode === "Standard"}) imageRoughness = $Param.Resource("image") 

    @Param({ visible: (current) => current.mode === "Standard", step: 0.01}) normalScale = new Vector2(0.3, 0.3)

    constructor(args){

        super(args)

        window['yala'] = this
    }
    async onReady(){

        await this.setupMaterial() 
    }

    update(){

        this.setupMaterial() 
    }
 
    onRenderInit(){

        if( Env.editMode ){

            this.setupMaterial() 
        }
    }

    texture = null 

    normalTexture    = null

    roughnessTexture = null

    lastImageUrl     = null 

    lastNormalUrl    = null

    lastRoughnessUrl = null

    // used to get the material constructor for lighting and non lighting materials 
 
    getMaterialConstructor(){

        let res = {

            diffuseMaterial: OOOBjects.InstancedBasicMaterial,

            occlusionMaterial :  OOOBjects.InstancedBasicMaterial,
            
            lightingMaterial : this.mode == 'Standard' ? OOOBjects.InstancedStandardMaterial: OOOBjects.InstancedBasicMaterial,

            lightingOcclusionMaterial : this.mode == 'Standard' ? OOOBjects.InstancedStandardMaterial: OOOBjects.InstancedBasicMaterial
        }
        return res
    }

    async setupMaterial(){

        const mesh = this.host?.getMesh() 

        if( mesh == null ){
            
            console.log(' no mesh ')
 
            return
        }


        if(this.image?.url != null ){

            if( this.lastImageUrl != this.image.url ){

                this.texture = new Texture()

                ResourceLoader.rawImage(this.image.url).then(( rawImage )=>{

                    this.texture.image = rawImage
                    this.texture.needsUpdate = true
                })

                this.texture.colorSpace = SRGBColorSpace
            }

            this.lastImageUrl = this.image.url
        }
        else {

            this.texture = null
        }

        if( this.texture ) {

            this.texture.minFilter = this.textureFilter

            this.texture.needsUpdate = true
        }

        this.lastImageUrl = this.image?.url

         if(this.imageNormal?.url != null ){

            if( this.lastNormalUrl != this.imageNormal.url ){

                this.normalTexture = new Texture()

                ResourceLoader.rawImage(this.imageNormal.url).then(( rawImage )=>{

                    this.normalTexture.image = rawImage
                    this.normalTexture.needsUpdate = true
                })
            } 
 
            this.lastNormalUrl = this.imageNormal.url
        }
        else {

            this.normalTexture = null
        }

        this.lastNormalUrl = this.imageNormal?.url



        if(this.imageRoughness?.url != null ){
        

            if( this.lastRoughnessUrl != this.imageRoughness.url ){

                this.roughnessTexture = new Texture()

                ResourceLoader.rawImage(this.imageRoughness.url).then(( rawImage )=>{

                    this.roughnessTexture.image = rawImage
                    this.roughnessTexture.needsUpdate = true
                })

            }

            this.lastRoughnessUrl = this.imageRoughness.url
        }
        else {

            this.roughnessTexture = null
        } 

        this.lastRoughnessUrl = this.imageRoughness?.url


        this.updateMaterialSettings(mesh.lightingMaterials.material) 
        this.updateMaterialSettings(mesh.lightingMaterials.occlusionMaterial, true) 
        this.updateMaterialSettings(mesh.diffuseMaterials.material) 
        this.updateMaterialSettings(mesh.diffuseMaterials.occlusionMaterial, true) 
 

    }

    updateMaterialSettings( material, occlusion = false ){

        const isBasic = material.type == "MeshBasicMaterial" 

        if( isBasic == false ){

           material.metalness          = this.metalness
           material.roughness          = this.roughness
           material.envMapIntensity    = this.envMapIntensity
           material.normalScale.copy(this.normalScale)
        }

       material.alphaTest       = this.alphaTest
       material.side            = this.side
       material.forceSinglePass = this.forceSinglePass

       if( occlusion == false){

            material.color.setHex(this.color)
       }
       else{

            if( this.useEmissiveColor ){

                material.color.setHex(this.emissiveColor)

                material.color.r *= this.emissiveForce
                material.color.g *= this.emissiveForce
                material.color.b *= this.emissiveForce
            }
            else {

                material.color.setHex(0x000000)
            }
       }

       material.blending       = +this.blending
       material.depthTest      = this.depthtest
       material.depthWrite     = this.depthWrite
       material.transparent    = this.transparent
       material.opacity        = this.opacity


        if(  material.map != this.texture ){

            material.map         = this.texture
            material.needsUpdate = true
        }

        if( isBasic == false && material.normalMap != this.normalTexture ){

            material.normalMap                = this.normalTexture
            material.needsUpdate = true
        }

        if( isBasic == false && material.roughnessMap != this.roughnessTexture ){

            material.roughnessMap                = this.roughnessTexture
            material.needsUpdate = true
        }
    }

    getGeometryOptions(){

        let opts = {}

        if( this.imageUseAtlas ){

            opts.atlas = true 
        }

        return opts
    }

    onRenderUpdate( data ){

        if( 
            data.prev.imageUseAtlas != this.imageUseAtlas && this.host != null || (this.mode != data.prev.mode ) || this.forceSinglePass != data.prev.forceSinglePass 
            || this.imageAtlasSize.x !=  data.prev.imageAtlasSize.x || this.imageAtlasSize.y != data.prev.imageAtlasSize.y   
        ){

            this.host.create()
            return;
        }

        this.setupMaterial()

        this.plugin.uniforms.alphaTestShadow.value = this.shadowAlphaTest
        
    }

    pluginUpdateData(data){

        if( this.imageUseAtlas ){

            let rdmX = Math.ceil( Math.random() * this.imageAtlasSize.x ) - 1
            let rdmY = Math.ceil( Math.random() * this.imageAtlasSize.y ) - 1

            data.atlas = this.getAtlasData( rdmX, rdmY, this.imageAtlasSize.x, this.imageAtlasSize.y )
        }
    } 

    plugin = null

    getPlugin(){

        // plugin that deal with :
        // atlas 
        // custom shadow depth test
        // emissive on bloom 

        var plugin = {

            name: "ParticleMaterialPlugin",

            uniforms : {

                alphaTestShadow: {

                    value: 0.5
                },
            },

            vertexShaderHooks: {

                prefix: 
                 
                `      
                    #if defined(ATLAS) && defined(USE_MAP)
                        attribute vec4 atlas;
                    #endif
                `,

                main: `
                   
                `,

                suffix: `

                    #if defined(ATLAS) && defined(USE_MAP)
                        vMapUv =  atlas.xy + atlas.zw * vMapUv;
                    #endif
                `,
            },

            fragmentShaderHooks : {

                prefix: 
                ` 

                    #ifdef SHADOW
                        uniform float alphaTestShadow;
                    #endif
                `,
                suffix: `

                `
            },
          
            defines : []
            
        }

        if( this.imageUseAtlas) {

            plugin.defines['ATLAS'] = ''
        }

        this.plugin = plugin

 
        return plugin

    }

    getAtlasData(x, y, sizeX, sizeY) {

        const cellWidth = 1 / sizeX;
        const cellHeight = 1 / sizeY;
        
        return {
            x: x * cellWidth,
            y: y * cellHeight,
            z: cellWidth,
            w: cellHeight
        }
    }
   
}