
import { ScriptBehavior, Component3D } from '@oo/scripting'

import { World, Emitter, Events } from "@oo/scripting"

import { Vector3, Quaternion, Euler, Mesh, BoxGeometry, MeshBasicMaterial, CircleGeometry, DoubleSide } from 'three'


export const MIN_FLOAT: number = 0.00001;

function Truncate(vec3: Vector3, max: number): Vector3 {
    if (vec3.length() > MIN_FLOAT) {
        var factor = max / vec3.length();
        factor = factor < 1.0 ? factor : 1.0;
        vec3 = vec3.multiplyScalar(factor);
    }
    else {
        vec3.set(0, 0, 0);
    }
    return vec3;
}

function GetDistance(orgPos: Vector3, targetPos: Vector3): Vector3 {
    var distance = new Vector3();

    distance.subVectors(targetPos, orgPos);

    if (Math.abs(distance.x) < MIN_FLOAT)
        distance.setX(0);

    if (Math.abs(distance.y) < MIN_FLOAT)
        distance.setY(0);

    if (Math.abs(distance.z) < MIN_FLOAT)
        distance.setZ(0);

    return distance;
}

function RotateY(vec3: Vector3, angle: number): void {
    var len = vec3.length();
    vec3.setX(Math.cos(angle) * len);
    vec3.setZ(Math.sin(angle) * len);
}

export interface IWanderParam {
    /**
     * center of wander range
     * @abstract
     * @member {Vector3} IWanderParam#orbitCenter
     */
    orbitCenter: Vector3;

    /**
     * radius of wander range
     * @abstract
     * @member {number} IWanderParam#orbitRadius
     */
    orbitRadius: number;

    /**
     * Distance between center of wander force circle and position of ISteerObj
     * @abstract
     * @member {number} IWanderParam#circleDistance
     */
    circleDistance: number;

    /**
     * Radius of wander force circle
     * @abstract
     * @member {number} IWanderParam#circleRadius
     */
    circleRadius: number;

    /**
     * Current wander force direction, accumulated by angleChange
     * @abstract
     * @member {number} IWanderParam#angle
     */
    angle: number;

    /**
     * Amount of random angle change per tick for wander force.
     * @abstract
     * @member {number} IWanderParam#angleChange
     */
    angleChange: number;
}


export default class Wander extends ScriptBehavior<Component3D> {

    mesh = null;

    wanderParam: IWanderParam = {
        orbitCenter: new Vector3(),
        orbitRadius: 1,
        circleDistance: 0.5,
        circleRadius: 2,
        angle: 0,
        angleChange: 0.5
    }

    velocity: Vector3 = new Vector3(0, 0, 0);
    movement: Vector3 = new Vector3(0, 0, 0);
    mass: number = 6;
    maxVelocity: number = 3; // Meter / second
    maxForce: number = 0.2;
    maxSpeed: number = 6;

    kinematicController = null
    
    steering = new Vector3();

    enableYCtrl = false;

    _active = false;

    static config = {
        title: "Wander",
    }

    set active(val) {
        this._active = val;
    }

    get active() {

        return this._active;
    }

    onReady = () => {
        // invoked each time user starts or replays the game (everytime World.start() is called, we call it by default in Display script)
         // invoked once when the game has finished loading


        this.wanderParam.orbitCenter.copy(this.host.position);

        this.kinematicController = new KinematicController(this.host);

        this.mesh = new Mesh(
            new CircleGeometry(this.wanderParam.orbitRadius * 5),
            new MeshBasicMaterial({ color: "red", side: DoubleSide })
        )

        this.mesh.rotation.x = -Math.PI / 2;

        World.add(this.mesh);

        this.mesh.position.copy(this.host.position)

        this.active = true;
    }

    onStart = () => {
        

    }

    onUpdate = (deltaTime: number) => {

        if (!this.active) return;

        if (deltaTime > 0.16) deltaTime = 0.16;

        this.steering.set(0, 0, 0);

        // Calculate the circle center
        var circleCenter = new Vector3(0, 0, -1);
        circleCenter.copy(this.velocity);

        circleCenter.normalize().multiplyScalar(this.wanderParam.circleDistance);

        // Calculate the displacement force
        var displacement = new Vector3(0, 0, -1);
        displacement.multiplyScalar(this.wanderParam.circleRadius);
        // 
        // Randomly change the vector direction 
        // by making it change its current angle
        RotateY(displacement, this.wanderParam.angle);

        // Change wanderAngle just a bit, so it 
        // won't have the same value in the 
        // next game frame.
        this.wanderParam.angle += Math.random() * this.wanderParam.angleChange - this.wanderParam.angleChange * 0.5;
        this.wanderParam.angle = this.wanderParam.angle % 2 * Math.PI;

        var force = circleCenter.clone().add(displacement);

        var orbitVec = GetDistance(this.host.position, this.wanderParam.orbitCenter);

        if (orbitVec.length() > this.wanderParam.orbitRadius) {
            force.add(orbitVec);
        }

        this.steering.add(force);
 
        // 
        Truncate(this.steering, this.maxForce);

        var steerFactor = 1;

        if (this.mass > 0) {
            steerFactor = steerFactor / this.mass;
        }
        
        this.steering.multiplyScalar(steerFactor);

        this.velocity.add(this.steering);

        Truncate(this.velocity, this.maxSpeed);

        this.movement.copy(this.velocity).multiplyScalar(deltaTime);
        // 

        if (!this.enableYCtrl) {
            this.movement.setY(0);
        }

        this.kinematicController.movement.copy(this.movement);
    }
}


const Mix = function mix(min, max, value) {
    return min * (1 - value) + max * value;
};

const Smoothstep = function smoothstep(min, max, value) {
    if (min === max) {
        // If min and max are the same, return 0 if value is less than or equal to min,
        // and return 1 if value is greater than min.
        return value <= min ? 0 : 1;
    }

    return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

export const DIRECTION = {
    UP: new Vector3(0, 1, 0).normalize(),
};

export class KinematicController {

    characterController;

    movement = new Vector3();

    private quaternion = new Quaternion();

    private rotation = new Euler();

    private rotateQuarternion = new Quaternion();

    private targetRot: number = 0;

    gravity = { x: 0, y: -9.81, z: 0 }

    isMoving = false;

    isOnFloor = false;


    constructor(public component) {

        this.characterController = World.physics.world.createCharacterController(0.1);

        this.characterController.enableAutostep(5, 5, true);

        this.characterController.setApplyImpulsesToDynamicBodies(true);

        this.addEvents();

    }

    addEvents() {

        Emitter.on(Events.GAME_PRE_UPDATE, this.update);
    }

    removeEvents() {

        Emitter.off(Events.GAME_PRE_UPDATE, this.update);
    }

    
    update = (deltaTime) => {

        this.isMoving = new Vector3(this.movement.x, 0, this.movement.z).length() > 0;

        this.movement.setY(this.movement.y + this.gravity.y * deltaTime)

        this.characterController.computeColliderMovement(
            this.component.rigidBody.colliders[0].raw,         
            this.movement, 
            null,
            null,
            ( collider )=>{

                // this is filter from the collision solver : 
                // if the colliding object is a sensor => no collision

                const isSensor = collider.isSensor();

                const c =  (collider.parent().userData).mesh.componentType;

                const t = isSensor == false && c != 'avatar';

                return t;
            }
        )

        this.isOnFloor = this.characterController.computedGrounded();

        let correctedMovement = this.characterController.computedMovement();

        const rpos = this.component.collider.rigidBody.translation();

        const newPosition = new Vector3(

            rpos.x + correctedMovement.x,

            rpos.y + correctedMovement.y,
            
            rpos.z + correctedMovement.z
        
        );

        this.component.position.copy(newPosition);

        this.component.collider.rigidBody.setNextKinematicTranslation(newPosition);

        this._rotation(deltaTime);

        this._animation();
    }

     _rotation(deltaTime) {
        //
        this.targetRot = !this.isMoving
            ? this.targetRot
            : Math.atan2(this.movement.x, this.movement.z) + Math.PI;

        this.rotateQuarternion.setFromAxisAngle(DIRECTION.UP, this.targetRot);

        const angleDifference = this.quaternion.angleTo(this.rotateQuarternion);

        if (angleDifference != 0) {
            const multiplayer = 1;

            const force = Mix(10, 20, Smoothstep(0, Math.PI, angleDifference));

            this.quaternion.rotateTowards(
                this.rotateQuarternion,
                Math.min(deltaTime * force, 1.0),
            );
        }

        this.rotation.setFromQuaternion(this.quaternion, "YXZ");

        this.component.rotation.set(0, this.rotation.y, 0);
    }

    _animation() {

        if (!this.isOnFloor) {

            this.component.animation = "jump"

        }
        if (this.isMoving) {

            this.component.animation = "sneak-walk";

        } else {

            this.component.animation = "idle";

        }
    }
}
