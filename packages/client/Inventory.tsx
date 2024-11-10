import { ScriptComponent, UI, Components, Player } from '@oo/scripting'

import MUD from "./mud";

import { getComponentValueStrict, HasValue } from '@latticexyz/recs';

import { monsterTypes } from './Encounter';

import Follow from "@oncyber/Follow"; 

// TODO: fix rand

const root = UI.createRenderer()

class Store<Data extends Object> {
    listeners: Record<string, ()=>void> = {};
    data: Data;
    id = 0;

    constructor(data: Data){
        this.data = data;
    }

    subscribe(f: any){
        this.id++;
        this.listeners[this.id] = f;
        return () => delete this.listeners[this.id];
    };

    getSnapshot(): Data{
        return this.data;
    };

    setState(newState: Partial<Data>){
        this.data = {
            ...this.data,
            ...newState
        };
        Object.values(this.listeners).forEach(x=>x())
    }
}

export const inventoryStore =  new Store({
    inventory: {
        monsters: [],
    },
    monsterProfile: {
        monster: null,
    },
    modal: "",
    invoke: (m, ms) => {},
    close: () => {},
    mud: null
});

inventoryStore.subscribe(() => {
    root.render(<div>
        <Buttons />
        <InventoryModal />
        <MonsterModal />
    </div>)
})

function getMonsterEmoji(monster) {
    if (!monster) {
        return "";
    }

    const monsterEmoji = monster.name === "unicorn" ?
        "🦄" : monster.name === "slug" ? "🐌" : monster.name === "frog" ? "🐸" : "💱";

    return monsterEmoji;
}

const Buttons = () => {

    const { monster } = inventoryStore.data.monsterProfile;

    const monsterEmoji = getMonsterEmoji(monster);

    return <div style={{
        position: "fixed",
        left: 13,
        bottom: 13,
        userSelect: "none",
        color: "#ffffff",
        opacity: 0.93,
        width: "max-content",
        display: "flex",
        gap: "12px",
    }}>
        <div onClick={() => {
            inventoryStore.setState({
                modal: inventoryStore.data.modal === "inventory" ? "" : "inventory",
            })
        }} style={{
            padding: 7.5,
            backgroundColor: "white",
            // borderRadius: 13,
            border: "3px solid #ffffff",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            background: "rgb(113 180 123)",
            cursor: "pointer",
        }}>{ inventoryStore.data.modal === "inventory" ? "❌" : "🎒"}</div>

        { !monster ? null : <div onClick={() => {
            inventoryStore.setState({
                modal: inventoryStore.data.modal === "monster" ? "" : "monster",
            })
        }} style={{
            padding: 7.5,
            backgroundColor: "white",
            // borderRadius: 13,
            border: "3px solid #ffffff",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            background: "rgb(113 180 123)",
            cursor: "pointer",
        }}>{ inventoryStore.data.modal === "monster" ? "❌" : monsterEmoji}</div>}
    </div> 
}

function InventoryModal() {
    const {  monsters } = inventoryStore.data.inventory;

    const { monster } = inventoryStore.data.monsterProfile;

    const { invoke, close } = inventoryStore.data;

    if (inventoryStore.data.modal !== "inventory") {
        return null;
    }

    return <div style={{
        position: "fixed",
        bottom: "54px",
        left: "13px",
        background: "rgb(113 180 123)",
        padding: "7.5px",
        marginBottom: "7.5px",
        border: "3px solid #ffffff",
        display: "grid",
        gap: "12px",
        gridTemplateColumns: "repeat(6, 1fr)",
    }}>
        {monsters?.map((_monster: any) => {
            const isInvoked = monster === _monster.entity;

            return <MonsterBox 
                monster={_monster}
                isInvoked={isInvoked}
                onClick={() => {
                    if (isInvoked) {
                        close();
                    } else {
                        invoke(_monster, monsters);
                        inventoryStore.setState({
                            monsterProfile: {
                                ...inventoryStore.data.monsterProfile,
                                monster: _monster,
                            },
                            modal: "monster"
                        })
                    }
                }} />
        })}
    </div>
}

function MonsterModal() {

    const { monster } = inventoryStore.data.monsterProfile;

    const { monsters } = inventoryStore.data.inventory;

    if (!monster) {
        return null;
    }

    if (inventoryStore.data.modal !== "monster") {
        return null;
    }

    const monsterEmoji = getMonsterEmoji(monster);

    return <div style={{
        position: "fixed",
        bottom: "54px",
        left: "13px",
        userSelect: "none",
        color: "#ffffff",
        opacity: 0.93,
        width: "max-content",
        background: "rgb(113 180 123)",
        // borderRadius: "13px",
        padding: "7.5px",
        marginBottom: "7.5px",
        border: "3px solid #ffffff",
    }}> 
        <div style={{
            display: "flex",
            gap: "12px",
            marginBottom: "12px"
        }}>
            <p style={{
                fontSize: 58,
                textTransform: "capitalize",
            }}> { monsterEmoji }</p>
            <div>
                <p style={{
                    marginBottom: "4px",
                    textWrap: "nowrap",
                }}>
                    <span>Level </span> 
                    <span>{ monster.level || 0}</span>
                </p>
                <p style={{
                    textTransform: "capitalize",
                    fontSize: "24px",
                    fontWeight: "bold",
                    marginBottom: "4px",
                }}>{ monster.name }</p>
            </div>
        </div>

        { monster.level >=5 ? <div>
            <h4 style={{
                marginBottom: "8px",
                textWrap: "nowrap",
            }}>Max level reached!</h4>
        </div> : <div>
            <h4 style={{
                marginBottom: "8px",
            }}>Evolve</h4>
            <div style={{
                gridTemplateColumns: "repeat(6, 1fr)",
                display: "grid",
                gap: "12px",
            }}>
                {
                    monsters.filter(m => m.monster == monster.monster && m.entity !== monster.entity).map((m) => {
                        return <MonsterBox
                            monster={m}
                            isInvoked={monster.level !== m.level}
                            onClick={() => {
                                if (monster.level !== m.level) {
                                    return;
                                }

                                inventoryStore.data.mud.systemCalls.fuseMonsters({
                                    self: monster.entity,
                                    target: m.entity
                                })
                            }} />
                    })
                }
            </div>
        </div>}
    </div> 
}

function MonsterBox({
    isInvoked, 
    onClick,
    monster
}) {
    if (!monster) return null;

    const monsterEmoji = getMonsterEmoji(monster);

    return <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "4px",
        flexDirection: "column",
        opacity: isInvoked ? 0.7 : 1,
        cursor: "pointer",
        width: "max-content"
    }} onClick={onClick} >
        <p style={{
            fontSize: "34px"
        }}>{monsterEmoji}</p>
        <p style={{
            textTransform: "capitalize",
            fontSize: 12,
            textWrap: "nowrap"
        }}>{ monster.name }</p>
        <p style={{
            textTransform: "capitalize",
            fontSize: "11px",
            fontWeight: "bold",
            textWrap: "nowrap"
        }}>Level { monster.level || 0 }</p>
    </div>
}

export default class Inventory extends ScriptComponent {

    mud: any = null;

    invokedMonsterId: string = "";

    invokedMonster = null;

    static config = {
        title: "Inventory",
    }

    onReady = () => {
        // @ts-ignore
        this.mud = MUD.getMain();

        const aura = Components.byId("aura");

        aura.autoSpawn = false;
    }

    onStart = () => {
        inventoryStore.setState({
            invoke: this.handleInvokeMonster,
            close: this.handleInvokeClose,
            inventory: {
                monsters: [],
            },
            mud: this.mud,
            modal: "",
        })

        this.mud.useEntityQuery(
            [HasValue(this.mud.components.OwnedBy, { owner: this.mud.mud.network.playerEntity }) ],
            (data) => {

                let currentMonster = null;

                const ownedMonsters = data?.map?.(entity => {
                    const ownedMonster = getComponentValueStrict(this.mud.components.OwnedBy, entity);
                    
                    const monsterType = ownedMonster.monster;

                    const monster = monsterTypes[monsterType];

                    if ( this.invokedMonster && this.invokedMonsterId === entity) {
                        
                        currentMonster = {
                            ...ownedMonster,
                            ...monster,
                            entity: entity,
                        }

                    }

                    return {
                        ...ownedMonster,
                        ...monster,
                        entity: entity,
                    };
                });

               
                if (this.invokedMonster && currentMonster && inventoryStore.data.modal === "monster") {

                    const scale = 1 + (currentMonster.level * 0.1); 

                    this.invokedMonster.scale.set(
                        scale, 
                        scale,
                        scale 
                    );

                    if (currentMonster.level >= 5) {
                        const aura = Components.byId("aura");
    
                        const auraColor = Components.byId("aura-color");
    
                        if (aura) {
                            aura.source = this.invokedMonster;
                        }
    
                        if (auraColor) {
                            auraColor.emissiveColor = 
                                currentMonster.name === "unicorn" ? 0xff99cf :
                                currentMonster.name === "slug" ? 0xe2ff94 
                                : 0xb8ff99
                        } 
                    }

                    inventoryStore.setState({
                        inventory: {
                            monsters: ownedMonsters,
                        },
                        monsterProfile: {
                            monster: currentMonster,
                        },
                        modal: "monster",
                    })

                    return;
                }

                inventoryStore.setState({
                    inventory: {
                        ...inventoryStore.data.inventory,
                        monsters: ownedMonsters,
                    }
                })
            }
        )

    }

    onUpdate = (dt: number) => {
        // this will be invoked on each frame (assuming the game is not paused)
    }

    handleInvokeMonster = async (monster) => {

        const original = Components.byId(monster.name);

        if (original) {

            if (this.invokedMonster) {
                this.invokedMonster.destroy();
                this.invokedMonster = null;
            }

            this.invokedMonsterId = monster.entity;
            this.invokedMonster = await original.duplicate()


            if (this.invokedMonster) {
                
                await Follow.create({
                    parentId: this.invokedMonster.componentId,
                    parent: this.invokedMonster,
                    host: this.invokedMonster
                })

                const scale = 1 + (monster.level * 0.1); 

                this.invokedMonster.scale.set(
                    scale, 
                    scale,
                    scale 
                );


                if (monster.level >= 5) {
                    const aura = Components.byId("aura");

                    const auraColor = Components.byId("aura-color");


                    if (aura) {
                        aura.autoSpawn = true;
                        aura.source = this.invokedMonster;
                    }

                    if (auraColor) {
                        auraColor.emissiveColor = 
                            monster.name === "unicorn" ? 0xff99cf :
                            monster.name === "slug" ? 0xe2ff94 
                            : 0xb8ff99
                    } 
                }
            }
        }
    }

    handleInvokeClose = () => {
        if (this.invokedMonster) {

            inventoryStore.setState({
                monsterProfile: {
                    monster: null,
                },
                modal: ""
            });

            this.invokedMonster.destroy();
            this.invokedMonster = null;
            this.invokedMonsterId = "";
        }
    }
}