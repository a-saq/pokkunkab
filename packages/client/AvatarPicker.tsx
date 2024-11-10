import { OOUI, Controls, Player, Camera, ScriptComponent, Param } from '@oo/scripting'
import anime from "animejs";

export default class AvatarPicker extends ScriptComponent {

    static config = {
        title: "Avatar Picker",
        description: "Enables visitors to choose custom avatars in your experience",
        image: "https://res.cloudinary.com/oncyber-io/image/upload/v1722280280/picker_eikwoy.png",
        singleton: true,
    }
    
    @Param({})
    show = true;
    
    private _active = false;
    private rotTween = null;

    set active(val) {
        if (this._active === val) return;
        this._active = val;
        OOUI.showAvatarPickerBtn = this._active;
        if (this._active) {
            this.addEvents()
        } else {
            this.removeEvents()
        }
    }

    get active() {
        return this._active;
    }
    
    onStart() {
        this.active = this.show; 
    }

    onPause() {
        this.active = false;
    }

    onResume() {
        this.active = this.show; 
    }

    addEvents() {
        window.addEventListener("message", this.handler)
    }

    removeEvents() {
        window.removeEventListener("message", this.handler)
    }

    handleOpen = () => {
        const controller = Controls.getControllerFor(Player.avatar);
        controller.active = false;
    }

    handleClose = () => {
        const controller = Controls.getControllerFor(Player.avatar);
        controller.active = true;
    }

    handleChanged = async (opts) => {

        const currentRot = getAngleFromVectors(
            Player.avatar.position,
            Camera.position
        );
        Player.avatar.rotation.y = currentRot;

        if (opts.username) {
            Player.avatar.text = opts.username;
        }

        if (opts.vrm) {
            await Player.avatar.updateVRM(opts.vrm.url, opts.vrm.data);

            if (this.rotTween) {
                this.rotTween.restart();
            }  else {
                this.rotTween = anime({
                    targets: Player.avatar.rotation,
                    y: getNextMultiple(currentRot, Math.PI * 2 + currentRot),
                    duration: 2000,
                    complete: () => {
                        this.rotTween = null;
                    }
                });
            }
        }
    }

    
    handler = (event) => {
        switch(event.data.type) {
            case "AVATAR-PICKER_opened":
                this.handleOpen();
                break;
            case "AVATAR-PICKER_closed":
                this.handleClose();
                break;
            case "AVATAR-PICKER_avatarChanged":
                this.handleChanged(event.data.payload);
                break;
            default:
        }
    }

    onDispose() {
        this.active = false;
        this.removeEvents();
    }
}

function getAngleFromVectors(a, b) {
    const deltaX = a.x - b.x;
    const deltaZ = a.z - b.z;
    return Math.atan2(deltaX, deltaZ);
}

function getNextMultiple(number, multipleOf) {
    if (multipleOf === 0) return 0;
    const remainder = number % multipleOf;
    if (remainder === 0) return number;
    return number + multipleOf - remainder;
}
