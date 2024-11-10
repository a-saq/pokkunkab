import { ScriptBehavior, Component3D, Param} from '@oo/scripting'

export default class Spinning extends ScriptBehavior<Component3D> {

    static config = {
        title: "Spinning",
    }
    
    @Param({ name:"enabled" })
    enabled = true;

    @Param({ type: "number", name:"speed", step: 0.01, max: 5 })
    speed = 1;


    onReady = () => {
        // invoked once when the game has finished loading
        console.log("Behavior attached to", this.host);
    }

    onStart = () => {
        // invoked each time user starts or replays the game (everytime World.start() is called, we call it by default in Display script)
    }

    onUpdate = (dt: number) => {
        // this will be invoked on each frame (assuming the game is not paused)
    }

    accDelta = 0

    onFrame(dt: number){

        if( this.enabled ){

            this.accDelta += dt * this.speed

            this.host.rotation.y =  this.host.data.rotation.y + this.accDelta
        }

    }
}