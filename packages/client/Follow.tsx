import { Vector3 } from 'three'
import { Param, ScriptBehavior, BasicCharacterController, AvatarComponent, Player } from '@oo/scripting'

export default class Follow extends ScriptBehavior<AvatarComponent> {

    @Param() speed = 10;
    @Param() minDistance = 4;
    @Param() targetDistance = 6;
    @Param() maxDistance = 30;
    @Param() gravity = 10;

    private controller = new BasicCharacterController();
    private movement = new Vector3();
    private velocity = new Vector3();
    private target: AvatarComponent;
    private onFloor = false;

    onReady = () => {
        this.target = Player.avatar;
    }

    onFixedUpdate(dt: number) {
        this.movement.set(0,0,0);
        this.applyGravity(dt);
        this.moveToTarget(dt);
        this.applyMovement(dt);
        this.animate(dt);
    }

    tmpV = new Vector3()
    tmpV2 = new Vector3()
    moveToTarget(dt: number) {
        const delta = this.tmpV.copy(this.target.position).sub(this.host.position);
        const distance = delta.lengthSq();
        const distance2D = (delta.x**2 + delta.z**2);
        if(distance > this.maxDistance**2) this.host.rigidBody.raw.setTranslation(this.host.position.copy(this.target.position).sub(this.tmpV2.copy(delta).normalize().multiplyScalar(this.targetDistance)).setY(this.target.position.y), true);
        if(distance2D < this.minDistance**2) return;
        this.movement.add(delta.normalize().multiplyScalar(this.speed * dt));
        this.host.lookAt(this.tmpV.copy(this.host.position).multiplyScalar(2).sub(this.target.position).setY(this.host.position.y));
    }

    applyMovement(dt: number) {
        const { onFloor } = this.controller.update(this.host, this.movement, dt);
        this.onFloor = onFloor;
    }

    applyGravity(dt: number) {
        if(!this.onFloor) this.velocity.y -= this.gravity * dt;
        this.movement.add(this.velocity)
    }

    animate(dt: number) {
        this.host.animation = (this.movement.x**2 + this.movement.z**2) < 0.001 ? "idle" : "run"
    }

    onAttached() {
        this.host?.updateData?.({
            collider: {
                enabled: true,
                rigidbodyType: "PLAYER",
            }
        });
    }
}