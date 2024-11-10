import { ScriptBehavior, Receiver } from '@oo/scripting'

export default class ParticleSignalEditor extends ScriptBehavior<any> {

    @Receiver()
    enabledAutoSpawn(){
        this.host.autoSpawn = true 
    }

    @Receiver()
    disableAutoSpawn(){
        this.host.autoSpawn = false
    }

    @Receiver()
    toggleAutoSpawn(){
        this.host.autoSpawn = !this.host.autoSpawn
    }

    @Receiver()
    reset(){
        this.host.reset()
    }
}

