import { ScriptBehavior, Component3D, Components, Param, Player, $Param } from '@oo/scripting'

import {

    Vector3,
    Euler
} from 'three'

const mixamoVRMRigMap = {
    mixamorigHips: 'hips',
    mixamorigSpine: 'spine',
    mixamorigSpine1: 'chest',
    mixamorigSpine2: 'upperChest',
    mixamorigNeck: 'neck',
    mixamorigHead: 'head',
    mixamorigLeftShoulder: 'leftShoulder',
    mixamorigLeftArm: 'leftUpperArm',
    mixamorigLeftForeArm: 'leftLowerArm',
    mixamorigLeftHand: 'leftHand',
    mixamorigLeftHandThumb1: 'leftThumbMetacarpal',
    mixamorigLeftHandThumb2: 'leftThumbProximal',
    mixamorigLeftHandThumb3: 'leftThumbDistal',
    mixamorigLeftHandIndex1: 'leftIndexProximal',
    mixamorigLeftHandIndex2: 'leftIndexIntermediate',
    mixamorigLeftHandIndex3: 'leftIndexDistal',
    mixamorigLeftHandMiddle1: 'leftMiddleProximal',
    mixamorigLeftHandMiddle2: 'leftMiddleIntermediate',
    mixamorigLeftHandMiddle3: 'leftMiddleDistal',
    mixamorigLeftHandRing1: 'leftRingProximal',
    mixamorigLeftHandRing2: 'leftRingIntermediate',
    mixamorigLeftHandRing3: 'leftRingDistal',
    mixamorigLeftHandPinky1: 'leftLittleProximal',
    mixamorigLeftHandPinky2: 'leftLittleIntermediate',
    mixamorigLeftHandPinky3: 'leftLittleDistal',
    mixamorigRightShoulder: 'rightShoulder',
    mixamorigRightArm: 'rightUpperArm',
    mixamorigRightForeArm: 'rightLowerArm',
    mixamorigRightHand: 'rightHand',
    mixamorigRightHandPinky1: 'rightLittleProximal',
    mixamorigRightHandPinky2: 'rightLittleIntermediate',
    mixamorigRightHandPinky3: 'rightLittleDistal',
    mixamorigRightHandRing1: 'rightRingProximal',
    mixamorigRightHandRing2: 'rightRingIntermediate',
    mixamorigRightHandRing3: 'rightRingDistal',
    mixamorigRightHandMiddle1: 'rightMiddleProximal',
    mixamorigRightHandMiddle2: 'rightMiddleIntermediate',
    mixamorigRightHandMiddle3: 'rightMiddleDistal',
    mixamorigRightHandIndex1: 'rightIndexProximal',
    mixamorigRightHandIndex2: 'rightIndexIntermediate',
    mixamorigRightHandIndex3: 'rightIndexDistal',
    mixamorigRightHandThumb1: 'rightThumbMetacarpal',
    mixamorigRightHandThumb2: 'rightThumbProximal',
    mixamorigRightHandThumb3: 'rightThumbDistal',
    mixamorigLeftUpLeg: 'leftUpperLeg',
    mixamorigLeftLeg: 'leftLowerLeg',
    mixamorigLeftFoot: 'leftFoot',
    mixamorigLeftToeBase: 'leftToes',
    mixamorigRightUpLeg: 'rightUpperLeg',
    mixamorigRightLeg: 'rightLowerLeg',
    mixamorigRightFoot: 'rightFoot',
    mixamorigRightToeBase: 'rightToes',
}; 

const boneOptions = Object.keys(mixamoVRMRigMap).map((key)=>{

    return {id: key, name: mixamoVRMRigMap[key] }
})

export default class ItemEquipement extends ScriptBehavior<Component3D> {
    
    
    @Param model = $Param.Component('model')

    currentList = null
 
    @Param({type: 'select', options: ( it )=>{

        const skeleton = (it.getSkinnedModel())?.skeleton

        if( skeleton != null ){

            const bones = skeleton.bones 
            
            const res = []
            let i = 0

            while( i < bones.length ){

                res.push( { id: bones[i].name, name: bones[i].name } ) 
                i++
            }

            it.currentList = res

            return res
        }

        it.currentList = boneOptions
        
        return boneOptions

    } } ) bone = null

    @Param({step: 0.01}) modelPosition = new Vector3(0,0,0)

    @Param({step: 0.1}) modelRotation = new Euler()

    @Param({step: 0.1}) modelScale = new Vector3(1,1,1)

    
    static config = {
        title: "Item Equipement",
    }

    _host = null 

    avatar = null

    previousPosition = null 

    previousRotation = null 

    previousScale    = null 

    previousParent   = null

    onReady = async () => {   

        this._host =  this.host
         
    }

    sourceModel = null

    attachedModel = null

    async onRenderUpdate(){

        this.clean()

        this.onRenderInit()
    }

    skinnedModel = null

    async getSourceModel(){

        this._host =  this.host 

        this.avatar = this._host._avatar
        
        this.sourceModel = this.avatar?.vrm?.highQualityMeshes

        if( this.sourceModel == null ){

            this.host.data.useMixer = true

            await this.host.updateAnimationMode( this.host.data.useMixer )
        }

        this._host =  this.host 

        this.avatar = this._host._avatar
        
        this.sourceModel = this.avatar?.vrm?.highQualityMeshes
    }

    getSkinnedModel(){

        if( this.sourceModel == null ){

            this.getSourceModel()
        }

        if( this.sourceModel ){

            this.sourceModel.traverse((child)=>{

                if( child.skeleton){

                    this.skinnedModel = child
                }
            })
        }

        return this.skinnedModel
    }
 
    async onRenderInit() {

        if( this.model == null ){

            return
        }

        if( this.bone == null ) {

            this.bone = this.currentList[0].name
        }
 
        this._host =  this.host 

        this.avatar = this._host._avatar

        this.sourceModel = this.avatar?.vrm?.highQualityMeshes

        if( this.sourceModel == null ){

            this.host.data.useMixer = true

            await this.host.updateAnimationMode( this.host.data.useMixer )

            this.sourceModel = this.avatar?.vrm?.highQualityMeshes

            if( this.sourceModel == null ){

                console.log('no high quality meshes model, make sure the avatar is using CPU animation')
                return
            }
        }

        if( this.attachedModel  != this.model ){

            this.attachedModel = this.model

            this.previousPosition = this.model.position.clone() 

            this.previousRotation = this.model.rotation.clone() 

            this.previousScale    = this.model.scale.clone() 

            this.previousParent   = this.model.parent

        } 

        this.attachedModel.position.copy( this.modelPosition)

        this.attachedModel.rotation.set( this.modelRotation.x,this.modelRotation.y,this.modelRotation.z )

        this.attachedModel.scale.copy( this.modelScale )
 
        this.sourceModel.traverse((child)=>{

            if(child.skeleton){
 
                let i = 0

                while(i < child.skeleton.bones.length ){

                    if( child.skeleton.bones[i].name?.endsWith(this.bone) ){

                        child.skeleton.bones[i].add( this.attachedModel )
                    }

                    i++
                }
            }
        }) 
    } 

    clean( force = false ){

        if( this.attachedModel ){

            this.attachedModel.position.copy( this.previousPosition )  
            this.attachedModel.rotation.copy( this.previousRotation )  
            this.attachedModel.scale.copy( this.previousScale )  

            if(this.previousParent ){

                this.previousParent.add( this.attachedModel )
            }

            this.attachedModel = null

        }
    }

    onRenderDispose(){

        this.clean( true )
    }

    onStart = () => {
        // invoked each time user starts or replays the game (everytime World.start() is called, we call it by default in Display script)
    }

    onUpdate = (dt: number) => {
      
    }
}