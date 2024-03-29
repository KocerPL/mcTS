import { CanvaManager } from "../Engine/CanvaManager.js";
import { EBO } from "../Engine/EBO.js";
import { Vector4 } from "../Engine/Utils/Vector4.js";
import { VAO } from "../Engine/VAO.js";
import { VBO } from "../Engine/VBO.js";
import {  Main } from "../Main.js";
import { Block} from "./Block.js";
import { SubChunk} from "./SubChunk.js";
import { Matrix4 } from "../Engine/Utils/Matrix4.js";
import { Mesh } from "./Mesh.js";
import { LightNode, Lighter } from "../Lighter.js";
import { SkyLighter } from "../SkyLighter.js";
import { GameScene } from "./scenes/GameScene.js";
import { Vector3 } from "../Engine/Utils/Vector3.js";
const gl = CanvaManager.gl;
export type DIR = "POS_X" | "POS_Z" | "NEG_X"  | "NEG_Z";
export function flipDir(dir:DIR)
{
    switch(dir)
    {
    case "POS_X": return "NEG_X";
    case "NEG_X": return "POS_X";
    case "POS_Z": return "NEG_Z";
    case "NEG_Z": return "POS_Z";  
    }
}
export class Chunk {
    subchunks: Array<SubChunk> = new Array(16);
    heightmap: Array<Array<number>> = new Array(16);
    neighbours:{POS_X?:Chunk,POS_Z?:Chunk,NEG_X?:Chunk,NEG_Z?:Chunk}={};
    allNeighbours=false;
    generated = true;
    generatingIndex =0;
    allWasUpdated = false;
    pos:Vector4;
    mesh:Mesh;
    vao:VAO;
    vbo:VBO;
    vtc:VBO;
    vlo:VBO;
    vfb:VBO;
    ebo:EBO;
    lastUsed=0;
    lightQueue:Array<Array<number>>=[];
    transformation = Matrix4.identity();
    constructor(x:number, z:number) {
        this.transformation= this.transformation.translate(x*16,0,z*16);
        this.mesh = new Mesh();
        this.vao = new VAO();
        this.vbo = new VBO();
        this.vao.addPtr(0,3,0,0);
        this.vtc = new VBO();
        this.vao.addPtr(1,2,0,0);
        this.vlo = new VBO();
        this.vao.addPtr(2,1,0,0);
        this.vfb = new VBO();
        this.vao.addPtr(3,1,0,0);
        this.ebo = new EBO();
        VAO.unbind();
        VBO.unbind();
        EBO.unbind();
        
        for(let i=0;i<this.heightmap.length;i++)
        {
            this.heightmap[i]=[];
            for(let j=0;j<this.heightmap.length;j++)
            {
                this.heightmap[i][j]=255;
            }
        }
        this.pos = new Vector4(x,0,z);
    }
    updateNeighbour(neigbDir:DIR,chunk:Chunk,gs:GameScene)
    {
    //console.log("what")
    //console.log(this.pos,neigbDir);
        if(chunk==undefined || this.allNeighbours) return;
        this.neighbours[neigbDir] =chunk;
        if(this.neighbours["NEG_X"]!=undefined && this.neighbours["POS_X"]!=undefined && this.neighbours["POS_Z"]!=undefined && this.neighbours["NEG_Z"]!=undefined)
        {
            //  console.log("gathered all neighbours :)");
            this.allNeighbours = true;
            this.updateAllSubchunks(gs);
          
        }
    }
    deleteNeighbour(dir:DIR)
    {
        this.allNeighbours = false;
        this.neighbours[dir] = undefined;
    }
    deleteSubchunksFromQueue(gs:GameScene)
    {
        for(const subchunk of this.subchunks)
            gs.toUpdate.delete(subchunk);
    }
    deleteNeighbours(gs:GameScene)
    {
        this.deleteSubchunksFromQueue(gs);
        let neighbour:Chunk = gs.getChunkAt(this.pos.x-1,this.pos.z);
        neighbour && neighbour.deleteNeighbour("POS_X");
        neighbour = gs.getChunkAt(this.pos.x+1,this.pos.z);
        neighbour && neighbour.deleteNeighbour("NEG_X");
        neighbour = gs.getChunkAt(this.pos.x,this.pos.z-1);
        neighbour && neighbour.deleteNeighbour("POS_Z");
        neighbour = gs.getChunkAt(this.pos.x,this.pos.z+1);
        neighbour && neighbour.deleteNeighbour("NEG_Z");
    }
    sdNeighbour(neighbour:Chunk,dir,gs:GameScene)
    { try
    {
        neighbour.updateNeighbour(dir,this,gs);
        if(neighbour.isSubArrayReady())
            this.updateNeighbour(flipDir(dir),neighbour,gs);
    }
    catch(error)
    { /* empty */ }
    }
    sendNeighbours( gs:GameScene)
    {
 
        if(this.allNeighbours || !this.generated) return;
        let neighbour = gs.getChunkAt(this.pos.x-1,this.pos.z);
        this.sdNeighbour(neighbour,"POS_X",gs);
        neighbour = gs.getChunkAt(this.pos.x+1,this.pos.z);
        this.sdNeighbour(neighbour,"NEG_X",gs);
        neighbour = gs.getChunkAt(this.pos.x,this.pos.z-1);
        this.sdNeighbour(neighbour,"POS_Z",gs);
        neighbour = gs.getChunkAt(this.pos.x,this.pos.z+1);
        this.sdNeighbour(neighbour,"NEG_Z",gs);
    }
    async preUpdate(yPos,gs:GameScene)
    {
        const lastHeightMap = this.heightmap;
        this.heightmap =new Array(16);
        for(let i=0;i<this.heightmap.length;i++)
        {
            this.heightmap[i]=[];
            for(let j=0;j<this.heightmap.length;j++)
            {
                this.heightmap[i][j]=255;
            }
        }
        for(let x=0;x<=15;x++)
            for(let z=0;z<=15;z++)
                for(let y=255;y>0;y--) 
                {
                    const block =this.getBlock(new Vector4(x,y,z));
                    if(block.id>0)
                    {
                        this.heightmap[x][z] = y;
                        break;
                    }
                }
        const queue = [];
        for(let x=0;x<16;x++)
            for(let z=0;z<16;z++)
            {
                if( this.heightmap[x][z]>lastHeightMap[x][z])
                {
                    for(let i=lastHeightMap[x][z]+1 ;i<=this.heightmap[x][z];i++)
                    {
                        SkyLighter.rmNodes.push(new LightNode((this.pos.x*16)+x , i ,(this.pos.z*16)+z ,15));
                        //  await occasionalSleeper();
                   
                    }
                }
                else if(this.heightmap[x][z]<lastHeightMap[x][z])
                {
                    for(let i=this.heightmap[x][z]+1 ;i<=lastHeightMap[x][z];i++)
                    {
                        this.getBlock(new Vector4(x,i,z)).skyLight=15;
                        queue.push([(this.pos.x*16)+x , i ,(this.pos.z*16)+z ]);
                    }
                }
            }
        for(const k of this.lightQueue)
        {
            SkyLighter.nodes.push(new LightNode(k[0],k[1],k[2],15));
            //     await occasionalSleeper();
        }
        this.lightQueue.length =0;
        for(const k of queue)
        {
            SkyLighter.nodes.push(new LightNode(k[0],k[1],k[2],15));
            // await   gs.occasionalSleeper();
        }
        for(const ls of this.subchunks[yPos].lightList)
        {
            Lighter.nodes.push(new LightNode(ls.x+(this.pos.x*16),ls.y+(yPos*16),ls.z+(this.pos.z*16),15));
        // await occasionalSleeper();
        }
        this.subchunks[yPos].fPass=false;
    }
    updateMesh() {
        this.mesh.reset();
        for (let i = 0; i < this.subchunks.length; i++) {
            this.mesh.add(this.subchunks[i].mesh);
        }
        this.vao.bind();  
        this.vbo.bufferData(this.mesh.vertices);
        this.vlo.bufferData(this.mesh.lightLevels);
        this.vfb.bufferData(this.mesh.fb);
        this.vtc.bufferData(this.mesh.tCoords);
        this.ebo.bufferData(this.mesh.indices);
    }
    render() {
        if(this.allNeighbours)
        {
            this.vao.bind();
            Main.shader.loadTransformation(this.transformation);
            gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_INT, 0);
        }

    }
    renderWater() {
        //TODO: Water rendering
    }
    getBlock(pos:Vector3):Block {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 15 || pos.y > 256 || pos.z > 15) {
            throw new Error("Incorrect cordinates: x:"+pos.x+" y:"+pos.y+" z:"+pos.z );
        }
        const y = pos.y%16;
        const yPos = Math.floor(pos.y/16);
        if(this.subchunks[yPos]!=undefined)
        {
            if(! (this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] =new Block(0);
            //  console.log(this.subchunks[yPos].blocks[pos.x][y][pos.z]);
            return this.subchunks[yPos].blocks[pos.x][y][pos.z];
        }
        throw new Error("Undefined subchunk! ");
    }
    getBlockSub(pos:Vector3):{block:Block,sub:SubChunk} {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 15 || pos.y > 256 || pos.z > 15) {
            throw new Error("Incorrect cordinates: x:"+pos.x+" y:"+pos.y+" z:"+pos.z );
        }
        const y = pos.y%16;
        const yPos = Math.floor(pos.y/16);
        if(this.subchunks[yPos]!=undefined)
        {
            if(! (this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] =new Block(0);
            //  console.log(this.subchunks[yPos].blocks[pos.x][y][pos.z]);
            return  {block:this.subchunks[yPos].blocks[pos.x][y][pos.z],sub:this.subchunks[yPos]};
        }
        throw new Error("Undefined subchunk! ");
    }
    setLight(pos:Vector4,lightLevel:number)
    {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
            throw new Error("Incorrect cordinates");
        }
        const y = pos.y%16;
  
        const yPos = Math.floor(Math.round(pos.y)/16);
        if(this.subchunks[yPos]!=undefined)
        {
            if(! (this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] =new Block(0);
            this.subchunks[yPos].blocks[pos.x][y][pos.z].skyLight=lightLevel;
        }
        else
        {
            //   console.log("Subchunk is undefined");
        }
   
    }
    updateAllSubchunks(gs:GameScene)
    {
        // console.log("UPDATING SUBSS");
        //console.log(gs);
        this.allWasUpdated = true;
        for(let i=15;i>=0;i--)
        {
            //  console.log(i);
            //console.log(this.subchunks[i]);
            this.subchunks[i].lightUpdate =true;
            gs.toUpdate.add(this.subchunks[i]);
        }
        //console.log("now not lazy hehehehe")
    }
    getSubchunk(y)
    {
        const yPos = Math.floor(Math.round(y)/16);
        if(this.subchunks[yPos]!= undefined)
            return this.subchunks[yPos];
    }
    updateSubchunkAt(y,gs:GameScene)
    {
        if(!this.allNeighbours) return;
        const yPos = Math.floor(Math.round(y)/16);

        gs.toUpdate.add(this.subchunks[yPos]);
  
    }
    prepareLight()
    {
        const queue = [];
        const lastHeightMap = this.heightmap;
        this.heightmap =new Array(16);
        for(let i=0;i<this.heightmap.length;i++)
        {
            this.heightmap[i]=[];
            for(let j=0;j<this.heightmap.length;j++)
            {
                this.heightmap[i][j]=255;
            }
        }
        for(let x=0;x<=15;x++)
            for(let z=0;z<=15;z++)
                for(let y=255;y>0;y--) 
                {
                    const block =this.getBlock(new Vector4(x,y,z));
                    if(block.id>0)
                    {
                        this.heightmap[x][z] = y;
                        break;
                    }
                }
        for(let x=0;x<16;x++)
            for(let z=0;z<16;z++)
            {
                if(this.heightmap[x][z]<lastHeightMap[x][z])
                {
                    for(let i=this.heightmap[x][z]+1;i<=lastHeightMap[x][z];i++)
                    {
                        this.getBlock(new Vector4(x,i,z)).skyLight=15;
                        queue.push([(this.pos.x*16)+x , i ,(this.pos.z*16)+z ]);
                    }
                }
            }
        this.lightQueue.push(...queue);
        
    }
    isSubArrayReady()
    {
        for(let i=0;i<16;i++)
            if(this.subchunks[i]==undefined)
                return false;
        return true;
    }
    setBlock(pos:Vector4,blockID:number,gs:GameScene)
    {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
            throw new Error("Incorrect cordinates");
        }
        const y = pos.y%16;
        const yPos = Math.floor(Math.round(pos.y)/16);
        if(this.subchunks[yPos]!=undefined )//&& this.subchunks[yPos].generated==true)
        {
            if(! (this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] =new Block(0);
            this.subchunks[yPos].blocks[pos.x][y][pos.z].id=blockID;
            this.subchunks[yPos].lightUpdate =true;
            gs.toUpdate.add(this.subchunks[yPos]);
            try
            {
                // console.log("executing block update part")
                if(pos.x ==0)
                {
                    gs.toUpdate.add(this.neighbours["NEG_X"].subchunks[yPos]);
                }
                else if(pos.x ==15)
                {
                    gs.toUpdate.add( this.neighbours["POS_X"].subchunks[yPos]);
                }
                if(y ==0)
                {
                    gs.toUpdate.add(this.subchunks[yPos-1]);
                }
                else if(y ==15)
                {
                    gs.toUpdate.add(this.subchunks[yPos+1]);
                  
                }
                if(pos.z ==0)
                {
                    gs.toUpdate.add(this.neighbours["NEG_Z"].subchunks[yPos]);
                  
                }
                else if(pos.z ==15)
                {
                    gs.toUpdate.add(this.neighbours["POS_Z"].subchunks[yPos]);
                    
                }
      
            }
            catch(error)
            {
                console.log(error);
            }
        }
        
    }
  

}