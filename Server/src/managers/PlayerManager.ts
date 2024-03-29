import { Socket } from "socket.io";
import { UUID, paths, Main, defaultSpawnPoint, getUUID } from "../Main";
import { randRange } from "../Utils";
import { Vector3 } from "../Utils/Vector3";
import * as fs from "fs";
import { Item } from "../Entities/Item";
import { World } from "../World/World";
import { Vector } from "../Utils/Vector";
import e = require("express");
export class PlayerInfo
{
    inventory:Array<{id:number,count:number}>=new Array(27);
    itemsBar:Array<{id:number,count:number}>=new Array(9);
    pos:Vector3 =  defaultSpawnPoint.copy();
   
   
    constructor(data?:{pos:{x:number,y:number,z:number},inventory:Array<{id:number,count:number}>,itemsBar:Array<{id:number,count:number}>})
    {
        if(data)
        {
            this.pos=new Vector3(data.pos);
            this.inventory = data.inventory;
            this.itemsBar = data.itemsBar;
            return;
        }
        for(let i=0;i<this.inventory.length;i++)
        this.inventory[i] ={ id:Math.floor(randRange(0,11)),count:64};
        for(let i=0;i<this.itemsBar.length;i++)
        this.itemsBar[i] ={ id:0,count:0};
    }
    
}
export class PlayerRotations
{
    body:Vector3=new Vector3(0,0,0);
    leftHand:Vector3 = new Vector3(0,0,0);
    rightHand:Vector3= new Vector3(0,0,0);
    leftLeg:Vector3 = new Vector3(0,0,0);
    rightLeg:Vector3 = new Vector3(0,0,0);
    head:Vector3 = new Vector3(0,0,0);   
}
export class Player
{
    name:string;
    uuid:UUID;
    socket:Socket;
    pos:Vector3 = new Vector3(0,0,0);
    rots=new PlayerRotations();
    inventory:Array<{id:number,count:number}> = new Array();
    itemsBar:Array<{id:number,count:number}> = new Array();
    constructor(name:string,socket:Socket,uuid:UUID)
    {
        this.name = name;
        this.socket = socket;
        this.uuid= uuid;
        let plInfo = Main.playerManager.getPlayerInfo(this);
        this.inventory = plInfo.inventory;
        this.itemsBar = plInfo.itemsBar;
        this.pos = new Vector3(plInfo.pos);
        this.rots = new PlayerRotations();
        socket.on('moveItem',(data:{slot1:number,isInv1:boolean, slot2:number,isInv2:boolean})=>{
            this.moveItem(data);
          });
          socket.on('getSubchunk',(x:number,y:number,z:number)=>{
            this.getSubchunk(x,y,z); 
        });
              socket.on("playerMove",(pos,rots)=>{
                 this.playerMove(pos,rots);
              });
          socket.on("placeBlock",(data)=>{
              this.placeBlock(data);
          });
          socket.on("disconnect", (reason) => {
              this.disconnect();
            });
            socket.on("dropItem",(slot:number,isInv:boolean)=>{
                this.dropItem(slot,isInv);
            })
            socket.on("message",(text:string)=>{
               
                this.message(text);
            })
    }
    dropItem(slot:number,isInv:boolean)
    {
        let it:Item;
        if(isInv)
        {
            if(this.inventory[slot].count<=0) return;
            this.inventory[slot].count--;
            it = new Item(this.pos,this.inventory[slot].id);
            Main.entityManager.add(it);
            if(this.inventory[slot].count<=0)
            this.inventory[slot].id =0;
            this.socket.emit("updateItem",{id: this.inventory[slot].id,count: this.inventory[slot].count,slot:slot,inventory:true});
        }
        else
        {
            if(this.itemsBar[slot].count<=0) return;
            this.itemsBar[slot].count--;
            it = new Item(this.pos,this.itemsBar[slot].id);
            Main.entityManager.add(it);
            if(this.itemsBar[slot].count<=0)
            this.itemsBar[slot].id =0;
            this.socket.emit("updateItem",{id: this.itemsBar[slot].id,count: this.itemsBar[slot].count,slot:slot,inventory:false});
        }
        let yRot = -this.rots.body.y;
        it.acc.x=Math.sin(yRot*Math.PI/180)*0.7;
        it.acc.z=Math.cos(yRot*Math.PI/180)*0.7;
    }
    mvItemsSSlot(slot1: {
        id: number;
        count: number;
    },slot2: {
        id: number;
        count: number;
    })
    {
        
        if(slot1.id!=slot2.id || (slot1.count +slot2.count)>64)
        {
        let item = slot1;
        slot1 = slot2;
        slot2 = item;
        }
        else
        {
           slot1.count = slot1.count +slot2.count;
           slot2.count =0;
            slot2.id=0;
          
        }
        return {slot1,slot2};
    }
    moveItem(data:{slot1:number,isInv1:boolean, slot2:number,isInv2:boolean})
    {

            //  console.log("Moving....");
            console.log(data);
              
              
            if(data.isInv1 && data.isInv2)
            {
                let ret =  this.mvItemsSSlot(this.inventory[data.slot1],this.inventory[data.slot2]);
            //    console.log("Moved item!!");
            this.inventory[data.slot1] = ret.slot1;
            this.inventory[data.slot2] = ret.slot2;
            this.socket.emit("updateItem",{id: this.inventory[data.slot2].id,count: this.inventory[data.slot2].count,slot:data.slot2,inventory:true});
            this.socket.emit("updateItem",{id: this.inventory[data.slot1].id,count: this.inventory[data.slot1].count,slot:data.slot1,inventory:true});   
            } 
            else if(data.isInv1 && !data.isInv2)
            {
              let ret =  this.mvItemsSSlot(this.inventory[data.slot1],this.itemsBar[data.slot2]);
              this.inventory[data.slot1] = ret.slot1;
              this.itemsBar[data.slot2] = ret.slot2;  
              this.socket.emit("updateItem",{id: this.itemsBar[data.slot2].id,count: this.itemsBar[data.slot2].count,slot:data.slot2,inventory:false});
                this.socket.emit("updateItem",{id: this.inventory[data.slot1].id,count: this.inventory[data.slot1].count,slot:data.slot1,inventory:true});
            }
            else if(!data.isInv1 && data.isInv2)
            {
                let ret =this.mvItemsSSlot(this.itemsBar[data.slot1],this.inventory[data.slot2]);
                this.itemsBar[data.slot1] = ret.slot1;
                this.inventory[data.slot2] = ret.slot2;  
                this.socket.emit("updateItem",{id: this.itemsBar[data.slot1].id,count: this.itemsBar[data.slot1].count,slot:data.slot1,inventory:false});
                this.socket.emit("updateItem",{id: this.inventory[data.slot2].id,count: this.inventory[data.slot2].count,slot:data.slot2,inventory:true});
            }
            else if(!data.isInv1 && !data.isInv2)
            {
               let ret= this.mvItemsSSlot(this.itemsBar[data.slot1],this.itemsBar[data.slot2]);
                this.itemsBar[data.slot1] = ret.slot1;
                this.itemsBar[data.slot2] = ret.slot2;
                this.socket.emit("updateItem",{id: this.itemsBar[data.slot1].id,count: this.itemsBar[data.slot1].count,slot:data.slot1,inventory:false});
                this.socket.emit("updateItem",{id: this.itemsBar[data.slot2].id,count: this.itemsBar[data.slot2].count,slot:data.slot2,inventory:false});
            }
            Main.playerManager.savePlayerInfo();
    }
    playerMove(pos,rots)
    {
        this.pos =new Vector3(pos);
        this.rots= rots;
        this.socket.broadcast.emit("moveEntity",this.uuid,pos,rots);
    }
    message(text)
    {
        Main.networkManager.io.emit("message","<"+this.name+"> "+ text);

    }
    getSubchunk(x,y,z)
    {
        
        const chunk = Main.world.getChunk(x,z);
        let entities = Main.entityManager.getByAABB(x*16,y*16,z*16,(x+1)*16,(y+1)*16,(z+1)*16)
        for( const ent of entities)
        {
        this.socket.emit("spawnEntity",{type:ent.type,id:ent instanceof Item?ent.id:2 ,pos:ent.pos,uuid:ent.uuid});
        Main.entityManager.add(ent);
        }
         let data =chunk.subchunks[y];
         this.socket.emit('subchunk', {data:{subX:x,subY:y,subZ:z,blocks:data}})  
    }
    placeBlock(data)
    {
        if(data.id!=0 &&this.itemsBar[data.slot].id != data.id) return;
        if(data.id!=0)
        {
        if(--this.itemsBar[data.slot].count<=0)
        {
        this.itemsBar[data.slot].id=0;
        this.itemsBar[data.slot].count=0;
        }
        this.socket.emit("updateItem",{id:this.itemsBar[data.slot].id,count: this.itemsBar[data.slot].count,slot:data.slot,inventory:false});
        Main.playerManager.savePlayerInfo();
        }
       
       Main.networkManager.io.emit("placeBlock",data);
       let inPos ={x:Math.round(Math.round(data.pos.x)%16),y:Math.round(Math.round(data.pos.y)%16),z:Math.round(Math.round(data.pos.z)%16)};
       if(inPos.x<0)
       inPos.x = 16-Math.abs(inPos.x);
   if(inPos.z<0)
       inPos.z = 16-Math.abs(inPos.z);
       if(inPos.y<0)
       inPos.y = 16-Math.abs(inPos.y);
       const subchunkPos = {x:Math.floor(Math.round(data.pos.x)/16),y:Math.floor(Math.round(data.pos.y)/16),z:Math.floor(Math.round(data.pos.z)/16)};
       let chunk = Main.world.getChunk(subchunkPos.x,subchunkPos.z);
       if(data.id==0)
       {
        let uuid = getUUID()
      // this.socket.emit("spawnEntity",{type:"item",id: chunk.subchunks[subchunkPos.y][World.toSubIndex(inPos.x,inPos.y,inPos.z)],pos:data.pos,uuid:uuid});
       Main.entityManager.add(new Item(new Vector3(data.pos), chunk.subchunks[subchunkPos.y][World.toSubIndex(inPos.x,inPos.y,inPos.z)],uuid));
    }
     //  let fdata = JSON.parse(fs.readFileSync(__dirname+"/world/"+subchunkPos.x+"."+subchunkPos.y+"."+subchunkPos.z+".sub").toString());
       chunk.subchunks[subchunkPos.y][World.toSubIndex(inPos.x,inPos.y,inPos.z)] = data.id;
        Main.world.saveChunk(chunk);
    }
    disconnect()
    {
        console.log(this.name +"  DISCONNECTED");
        Main.networkManager.io.emit("message",this.name+" left the game");
        this.socket.broadcast.emit("killEntity",this.uuid);
        Main.playerManager.remove(this.socket);
    }
}
export class PlayerManager
{
    players:Map<Socket,Player> = new Map();
    constructor()
    {
      
    }
    add(player:Player)
    {
        this.players.set(player.socket,player);
    }
    remove(socket:Socket)
    {
        this.savePlayerInfo();
        this.players.delete(socket);

    }
    update()
    {
        for(let p of this.players)
        {
            let player = p[1];
           let p1 =  player.pos.add(new Vector3(-2,-2,-2))
           let p2 =  player.pos.add(new Vector3(2,2,2))
          let entities = Main.entityManager.getByAABB(p1.x,p1.y,p1.z,p2.x,p2.y,p2.z);
            for(let ent of entities)
            {
                if(ent instanceof Item && ent.invurnerableEnd<= Date.now())
                {
                    let dist = Vector3.distance(player.pos,ent.pos);
                    if(dist<0.5)
                    {
                    for(let i=0;i<player.itemsBar.length;i++)
                    {
                       const slot = player.itemsBar[i];
                       if((slot.id== ent.id && slot.count<64))
                        {
                        slot.id = ent.id;
                        Main.entityManager.remove(ent);
                           player.socket.emit("updateItem",{id: slot.id,count: ++slot.count,slot:i,inventory:false});
                           this.savePlayerInfo();
                           return;
                        }
                    }
                    for(let i=0;i<player.itemsBar.length;i++)
                    {
                        const slot = player.itemsBar[i];
                        if( slot.id ==0)
                        {
                            slot.id = ent.id;
                            slot.count=0;
                            Main.entityManager.remove(ent);
                           player.socket.emit("updateItem",{id: slot.id,count: ++slot.count,slot:i,inventory:false});
                           this.savePlayerInfo();
                           return;
                        }
                    }
                    for(let i=0;i<player.inventory.length;i++)
                    {
                       const slot = player.inventory[i];
                       if((slot.id== ent.id && slot.count<64))
                        {
                        slot.id = ent.id;
                        Main.entityManager.remove(ent);
                           player.socket.emit("updateItem",{id: slot.id,count: ++slot.count,slot:i,inventory:true});
                           this.savePlayerInfo();
                           return;
                        }
                    }
                    for(let i=0;i<player.inventory.length;i++)
                    {
                        const slot = player.inventory[i];
                        if(!slot.id  || slot.id ==0)
                        {
                            slot.id = ent.id;
                        Main.entityManager.remove(ent);
                           player.socket.emit("updateItem",{id: slot.id,count: ++slot.count,slot:i,inventory:true});
                           this.savePlayerInfo();
                           return;
                        }
                    }
                    }
                    else
                    {
                       let k =  player.pos.add(ent.pos.multiply(-1));
                        ent .pos = ent.pos.add(k.multiply(1/dist));
                       Main.networkManager.io.volatile.emit("updateEntity", ent);
                    }
                    

                }
            }
        }
    }
    existName(name:string)
    {
        for(let pl of this.players)
        {
            if(pl[1].name == name)
            return true;
        }
        return false;
    }
    getBySocket(socket:Socket)
    {
        return this.players.get(socket);
    }
    getPlayerInfo(player):PlayerInfo
    {
        let playersInfo = this.loadPlayersInfo();
        if(!(player.name in playersInfo))
                {
                    playersInfo[player.name] = new PlayerInfo();
                    this.savePlayerInfo();
                }
                return  new PlayerInfo(playersInfo[player.name]);
    }
    loadPlayersInfo():{}
    {
        if(fs.existsSync(paths.save+"/players.json"))
      return JSON.parse(fs.readFileSync(paths.save+"/players.json").toString());
    else
    return {};
    }
    savePlayerInfo()
{ 
    let playersInfo = this.loadPlayersInfo();
    for(let player of this.players)
    {
        playersInfo[player[1].name ] =  new PlayerInfo(player[1]);
    }
    console.log("saved player info");
    fs.writeFileSync(paths.save+"/players.json",JSON.stringify(playersInfo));

}
}