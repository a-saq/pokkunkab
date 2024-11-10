import { Mesh, BoxGeometry, MeshBasicMaterial, SphereGeometry, Sphere, Vector3 } from 'three'
import { ScriptBehavior, Component3D, Env, Param } from '@oo/scripting'

const tempVec = new Vector3()

export default class ParticleFrustumTestEditor extends ScriptBehavior<Component3D> {
    static config = {
        transform: true
    }
    
    @Param() display = true;
    private mesh: Mesh

    private sphere = new Sphere()

    _currentFrame = -1

    _testedFrame = -1

    _setup = false

    _baseRadiusParam = 12 

    source = null;
     
    onRenderInit() {

        if( this.mesh == null ){

            this.mesh = new Mesh(
                new SphereGeometry(this._baseRadiusParam, 16, 16),
                new MeshBasicMaterial({ color: "green", transparent: true, opacity: 0.5,depthWrite: false })
            )
        }   
       
        this.mesh.visible = false;

        this.add(this.mesh)

        this.updateFrustrum()
    }


    onFrame(){

        if( this._setup == false ){

            this.setup()
        }

        this._currentFrame ++

        if (this.source !== this.host.source) {
            this.source = this.host.source
            this.setup()
        }
    }

    onRenderUpdate(opts) {

        this.mesh.visible = Env.editMode && this.display;
        
        this.updateFrustrum()
    }  

    updateFrustrum() {  

        this.mesh.geometry.computeBoundingSphere()
    }

    setup(){    

        if( this.host && this.host?.getMesh ){

            const mesh = this.host?.getMesh() 

            if( mesh != null ){

                mesh.geometry.setUniqueFrustumTest( this.customFrustumTest.bind(this) )

                this._setup = true;

                if( this.host.source ){

                    this.host.source.add( this )
                }
            }
        }
    }

    _lastFrustumResult = false

    customFrustumTest( frustum ){

        if( this._testedFrame != this._currentFrame ){

            this.sphere.radius =( Math.max(this.scale.x, this.scale.y, this.scale.z) ) * this._baseRadiusParam

            this.sphere.center.set( this.mesh.matrixWorld.elements[12], this.mesh.matrixWorld.elements[13], this.mesh.matrixWorld.elements[14 ] )

            this._lastFrustumResult = frustum.intersectsSphere( this.sphere )

            this._testedFrame = this._currentFrame 
        }
            
       
        return this._lastFrustumResult
    }

    onRenderDispose() {

        this._setup = false

        this.remove(this.mesh)
    } 

    onGetCollisionMesh(){
        return this.mesh.visible ? this.mesh : null;
    }
}