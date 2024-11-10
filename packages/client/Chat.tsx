import { Components, Player, OOUI, ScriptComponent, Emitter, Events } from '@oo/scripting'
import Multiplayer from "./Multiplayer"

export default class Chat extends ScriptComponent {

    static config = {
        singleton: true,
    }
    
    dialog = null;

    dialogs = {}

    _active = false;

    multiplayer = null;

    set active(value) {

        if (value === this._active) return;

        this._active = value;
    }

    get active() {

        return this._active;
    }

    onReady = () => {

        this.multiplayer = Multiplayer.getMain();

        if(!this.multiplayer) return this.destroy();

        if (!this.multiplayer.hasConnected) return;

        window.addEventListener("message", this.handler);

        const instance = this.multiplayer.instance;

        OOUI.showChat = true;

        Emitter.on(Events.KEY_DOWN, (e) => {

            if (e.code === "Enter") {

                window.parent.postMessage({
                    type: "chat-focus",
                }, {
                    targetOrigin: "*"
                });

            }

        });

        instance.room.onMessage((message) => {

            const { payload } = message;

            if (payload.type === "message") {

                const sessionId = message.payload.from.sessionId 

                if (sessionId === Player.sessionId) return;
                
                this._sendReceiveMessageEvent(payload.message)

                if (this.multiplayer.instance.room.players[sessionId]) {

                    this.createDialog(

                        sessionId,

                        this.multiplayer.instance.room.players[sessionId].avatar,

                        message.payload.message.text

                    )

                }

            }

        })

        instance.room.onPlayerLeft((player) => {

            const dialog = this.dialogs[player.sessionId];

            if (dialog) {
                
                dialog.destroy();

                delete this.dialogs[player.sessionId]

            }
        })


        this.active = true;

    }

    handleSendMessage = async (data) => {

        this.multiplayer.instance.broadcast({

            type: "message",
            
            message: data,
        
        });

        this.createDialog(Player.sessionId, Player.avatar, data.text);
    }

   async createDialog( userId, target, text ) {

        if (this.dialogs?.[userId]) {

            this.dialogs[userId].destroy();

            this.dialogs[userId] = null;

        }

        if (!target) return;

        this.dialogs[userId] = await Components.create({

            type: 'dialog',

            backgroundColor: 0x000000,
            
            width: 1200,
            
            align:'left',
            
            billboard: true,

            backgroundOpacity: 0.75

        })

        this.dialogs[userId].userData.target = target

        this.dialogs[userId].position.copy(target.position)

        this.dialogs[userId].scale.set(0.5, 0.5, 0.5)

        const prevText = target.text;

        target.text = ""

        this.dialogs[userId].showScript({

            texts: [
                
                text,
            
            ],

            speed: 0.02,
            
            delay: 8
        
        }).then(() => {
            
            target.text = prevText
        
        });

        const targetHeight = (target.getBBox().max.y - target.getBBox().min.y) * target.scale.x

        const dialogHeight = this.dialogs[userId].getDimensions().y

        this.dialogs[userId].position.y = target.position.y + targetHeight + (dialogHeight / 2)
    }

    onUpdate = () => {

        Object.values(this.dialogs).forEach((dialog: any) => {

            if (!dialog) return;

            const target = dialog.userData.target;

            if (!target) return;

            dialog.position.copy(target.position);

            const targetHeight = (target.getBBox().max.y - target.getBBox().min.y) * target.scale.x
        
            const dialogHeight = dialog.getDimensions().y

            dialog.position.y = target.position.y + targetHeight + (dialogHeight / 2)

        })
        
    }

    onDispose() {

        window.removeEventListener("message", this.handler)

        OOUI.showChat = false;
    }


    handleActiveChatChanged = (data) => {
        this.active = data === "global";
    }

    _sendReceiveMessageEvent(newMessage) {
                
        window.parent.postMessage({

            type: "receive-message",
            
            payload: newMessage
        
        }, {
        
            targetOrigin: "*"
        
        });
    }

    handler = (event) => {

        switch(event.data.type) {
            
            case "change-active-chat":
                this.handleActiveChatChanged(event.data.payload);
                break;
        
            case "send-message":
                if (!this.active) return;
                this.handleSendMessage(event.data.payload)
                break;

            default: 
                // do nothing...
        }
    }
}