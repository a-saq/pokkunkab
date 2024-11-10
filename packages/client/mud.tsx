import { ScriptComponent, Components, UI } from '@oo/scripting'

import { abi } from "./abi";

import { getComponentValue, defineQuery, Has, isComponentUpdate, QueryFragment, runQuery, HasValue, overridableComponent } from "@latticexyz/recs";

import { singletonEntity } from "@latticexyz/store-sync/recs";

import{ mount as mountDevTools } from "@latticexyz/dev-tools";

import { encodeFunctionData } from "viem";

import { resourceToHex } from '@latticexyz/common';

const renderer = UI.createRenderer();


// particle on victory 
// redirect to battle
// fix wander 
// fix batch calls not called
// map debug
// gang up 
// make spare faster

enum Direction {
  North = 0,
  East,
  South,
  West,
}

function isEqual(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!isEqual(a[i], b[i])) return false;
      return true;
    }

    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!isEqual(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};


export default class MUD extends ScriptComponent {

    static config = {
      singleton: true,
    }

    components = null;

    systemCalls = null;

    mud = null;

    map = null;

    players = null;

    avatars = [];

    encounter = null;

    onPreload = async () => {

      this.mud = await Components.create({
        type: "mud",

        mudConfig: {
          enums: {
            Direction: ["North", "East", "South", "West"],
            MonsterCatchResult: ["Missed", "Caught", "Fled"],
            MonsterType: ["None", "Eagle", "Rat", "Caterpillar"],
            TerrainType: ["None", "TallGrass", "Boulder"],
          },
          tables: {
            Counter: {
              schema: {
                value: "uint32",
              },
              key: [],
            },
            Encounter: {
              schema: {
                encounter: "bytes32",
                player: "bytes32",
                exists: "bool",
                monster: "bytes32",
                catchAttempts: "uint256",
                x: "int32",
                y: "int32"
              },
              key: ["encounter"],
            },
            EncounterTrigger: "bool",
            Encounterable: "bool",
            MapConfig: {
              schema: {
                width: "uint32",
                height: "uint32",
                terrain: "bytes",
              },
              key: [],
              codegen: {
                dataStruct: false,
              },
            },
            MonsterCatchAttempt: {
              type: "offchainTable",
              schema: {
                encounter: "bytes32",
                result: "MonsterCatchResult",
              },
              key: ["encounter"],
              codegen: {
                dataStruct: false,
              },
            },
            Monster: "MonsterType",
            Movable: "bool",
            Obstruction: "bool",
            OwnedBy: {
              schema: {
                id: "uint256",
                monster: "MonsterType",
                owner: "bytes32",
                level: "uint32",
                health: "uint256",
                strength: "uint256", // how hard he hits
                dexterity: "uint256", // how hard he is to hit
                intelligence: "uint256" // how hard he is to catch
              },
              key: ["id"],
            },
            Player: "bool",
            Position: {
              schema: {
                id: "bytes32",
                x: "int32",
                y: "int32",
              },
              key: ["id"],
              codegen: {
                dataStruct: false,
              },
            },
          },
        },

        WorldAbi: abi,

        worlds: {
            "31337": {
                "address": "0x4f4ddafbc93cf8d11a253f21ddbcf836139efdec"
            }
        }
    
      });

      this.components = this.createClientComponents(this.mud.network);

      this.systemCalls = this.createSystemCalls(this.mud.network);

      await new Promise((resolve) => {

        this.subscribeToComponentUpdate(this.components.SyncProgress, singletonEntity, (val) => {

          if (val.percentage === 100 && val.step === "live") {
            resolve(null);
          }
        });
      });

      // mountDevTools
      await mountDevTools({
          config: this.mud.mudConfig,
          publicClient: this.mud.network.publicClient,
          walletClient: this.mud.network.walletClient,
          latestBlock$: this.mud.network.latestBlock$,
          storedBlockLogs$: this.mud.network.storedBlockLogs$,
          worldAddress: this.mud.network.worldContract.address,
          worldAbi: this.mud.network.worldContract.abi,
          write$: this.mud.network.write$,
          recsWorld: this.mud.network.world,
      });

      const interval = setInterval(() => {

          const mudToggler = document.querySelector("#mud-dev-tools > div > div > div");
        
          if (!mudToggler) return;
        
          clearInterval(interval);
        
          //@ts-ignore
          mudToggler.style.bottom = "auto";
        
          //@ts-ignore
          mudToggler.style.color = "white";
        
          //@ts-ignore
          mudToggler.style.textShadow = "0 0 21px black";
          
      }, 1000);

    }

    onReady = async () => {
   
      // @ts-ignore
      this.players = Components.byId("players");

      this.avatars = Components.byTag("monster");

      this.avatars.forEach(avatar => {

        avatar.visible = false;

      });      

    }

    onStart = async () => {

      // this.components.Counter.update$.subscribe((update) => {

      //   const [nextValue, prevValue] = update.value;

      //   this.counterUi(nextValue.value);

      // });

      // const val = getComponentValue(this.components.Counter, singletonEntity)
      
      // this.counterUi(val?.value || 0)
     
    }

    subscribeToComponentUpdate = (component, entity, callback = (val: any) => {}) => {

      if (entity == null) return;

      const queryResult = defineQuery([Has(component)], { runOnInit: true });

      const subscription = queryResult.update$.subscribe((update) => {
      
        if (isComponentUpdate(update, component) && update.entity === entity) {
      
          const [nextValue] = update.value;
      
          callback(nextValue);
        }
      });

      return () => subscription.unsubscribe();

    }

    useEntityQuery = (fragments: QueryFragment[], callback, options?: { updateOnValueChange?: boolean }) => {
      const updateOnValueChange = options?.updateOnValueChange ?? true;

      const query = defineQuery(fragments, { runOnInit: true });

      const { map, distinctUntilChanged } = this.mud.rxjs;

      let observable = query.update$.pipe(map(() => [...query.matching]));

      if (!updateOnValueChange) {
        // re-render only on entity array changes
        observable = observable.pipe(distinctUntilChanged((a, b) => isEqual(a, b)));
      }

      const subscription = observable.subscribe((entities) => callback(entities));

      return () => subscription.unsubscribe();
    }

    counterUi(value) {
        renderer.render(<div style={{
            bottom: 15,
            left: 15,
            position: "fixed",
            color: "white", 
            fontSize: 32
        }}>
            <p>Counter: {value}</p>
            <button style={{
                color: "white",
                border: "2px solid",
                borderRadius: "5px",
                padding: "8px",
            }} onClick={this.systemCalls.increment}>
                Increment
            </button>
        </div>)
    }

    createClientComponents({ components }) {
        return {
            ...components,
        };
    }

    isObstructed = (x: number, y: number) => {
      return runQuery([Has(this.components.Obstruction), HasValue(this.components.Position, { x, y })]).size > 0;
    };

    createSystemCalls({ worldContract, waitForTransaction }) {

        const Player = overridableComponent(this.components.Player);
        
        const Position = overridableComponent(this.components.Position);
        
        const increment = async () => {
            const tx = await worldContract.write.increment();
            await waitForTransaction(tx);
            return getComponentValue(this.components.Counter, singletonEntity);
        };

        const wrapPosition = (x: number, y: number) => {
          const mapConfig = getComponentValue(this.components.MapConfig, singletonEntity);
          if (!mapConfig) {
            throw new Error("mapConfig no yet loaded or initialized");
          }
          return [
            (x + mapConfig.width) % mapConfig.width,
            (y + mapConfig.height) % mapConfig.height,
          ];
        };

        const spawn = async (inputX: number, inputY: number) => {
          if (!this.mud.network.playerEntity) {
            throw new Error("no player");
          }
      
          const canSpawn = getComponentValue(this.components.Player, this.mud.network.playerEntity)?.value !== true;

          if (!canSpawn) {
            throw new Error("already spawned");
          }
      
          const [x, y] = wrapPosition(inputX, inputY);
          if (this.isObstructed(x, y)) {
            throw new Error("cannot spawn on obstructed space");
            return;
          }
      
          const positionId = this.mud.uuid();

          Position.addOverride(positionId, {
            entity: this.mud.network.playerEntity,
            value: { x, y },
          });

          const playerId = this.mud.uuid();
          
          Player.addOverride(playerId, {
            entity: this.mud.network.playerEntity,
            value: { value: true },
          });
      
          try {
            const tx = await worldContract.write.spawn([x, y]);
            await waitForTransaction(tx);
          } finally {
            Position.removeOverride(positionId);
            Player.removeOverride(playerId);
          }
        };

        const fuseMonsters = async ({
          self,
          target,
        }) => {

          const tx = await worldContract.write.fuse([self, target]);
          
          const res = await waitForTransaction(tx);

          if (res.status !== "success") {
            throw new Error("transaction failed");
          }

          return true;
        }

        const move = async (direction) => {
          if (!this.mud.network.playerEntity) {
            throw new Error("no player");
          }
      
          const position = getComponentValue(this.components.Position, this.mud.network.playerEntity);
          if (!position) {
            throw new Error("cannot move without a player position, not yet spawned?");
            return;
          }
      
          const inEncounter = !!getComponentValue(this.components.Encounter, this.mud.network.playerEntity);
          if (inEncounter) {
            throw new Error("cannot move while in encounter");
            return;
          }
      
          let { x: inputX, y: inputY } = position;
          if (direction === Direction.North) {
            inputY -= 1;
          } else if (direction === Direction.East) {
            inputX += 1;
          } else if (direction === Direction.South) {
            inputY += 1;
          } else if (direction === Direction.West) {
            inputX -= 1;
          }
      
          const [x, y] = wrapPosition(inputX, inputY);
          if (this.isObstructed(x, y)) {
            throw new Error("cannot move to obstructed space");
            return;
          }
      
          const positionId = this.mud.uuid();
          Position.addOverride(positionId, {
            entity: this.mud.network.playerEntity,
            value: { x, y },
          });
      
          try {
            const tx = await worldContract.write.move([direction]);
            await waitForTransaction(tx);
          } finally {
            Position.removeOverride(positionId);
          }
        };

        const throwBall = async (entityId) => {
          const player = this.mud.network.playerEntity;
          if (!player) {
            throw new Error("no player");
          }
      
          const encounter = getComponentValue(this.components.Encounter, entityId);
          if (!encounter) {
            throw new Error("no encounter");
          }
      
          const tx = await worldContract.write.throwBall([entityId]);
          const res = await waitForTransaction(tx);

          if (res.status !== "success") {
            throw new Error("transaction failed");
          }
          
          const catchAttempt = getComponentValue(this.components.MonsterCatchAttempt, player);
          if (!catchAttempt) {
            throw new Error("no catch attempt found");
          }
      
          return catchAttempt.result;
        };

        const fleeEncounter = async (entityId: string) => {

          const tx = await worldContract.write.flee([entityId]);

          const res = await waitForTransaction(tx);

          if (res.status !== "success") {

            throw new Error("transaction failed");

          }

          return true;
        };
      
        const batchMove = async (directions: Direction[]) => {
          const resourceId = resourceToHex({
            type: "system",
            namespace: "",
            name: "MapSystem",
          });
      
          const moveAbi = [{
            "type": "function",
            "name": "move",
            "inputs": [
              {
                "name": "direction",
                "type": "uint8",
                "internalType": "enum Direction"
              }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
          }]
      
          const getCalldata = (direction: number) =>
            encodeFunctionData({
              abi: moveAbi,
              args: [direction],
            });
      
          const tx = await worldContract.write.batchCall([
            directions.map((direction) => [resourceId, getCalldata(direction)])
          ]);
          
          const response = await waitForTransaction(tx);
      
          return tx;
        }
      
        const debouncedMove =  debounce(batchMove, 20, 1000); 

        return {
            increment,
            spawn,
            fleeEncounter,
            move: debouncedMove,
            throwBall,
            fuseMonsters
        };
    }
}

const debounce = (fn: (args: Array<Direction>) => void, flushAt: number, ms: number) => {
  let timeout: NodeJS.Timeout | null = null;
  let previousArgs: Array<Direction> = [];

  return (args: Array<Direction>) => {
    previousArgs.push(...args);

    if (previousArgs.length >= flushAt) {
      fn(previousArgs);
      previousArgs = [];
      return;
    }

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn(previousArgs);
      previousArgs = [];
      timeout = null;
    }, ms);
  };
};


