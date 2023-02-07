import { CanvaManager } from "../Engine/CanvaManager.js";
import { EBO } from "../Engine/EBO.js";
import { Vector } from "../Engine/Utils/Vector.js";
import { VAO } from "../Engine/VAO.js";
import { VBO } from "../Engine/VBO.js";
import { LightNode, Main } from "../Main.js";
import { Block, directions } from "./Block.js";
import { SubChunk } from "./SubChunk.js"
import { Matrix } from "../Engine/Utils/Matrix.js";
import { Mesh } from "./Mesh.js";
import { World } from "./World.js";
import { randRange } from "../Engine/Utils/Math.js";
let gl = CanvaManager.gl;
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
  allNeighbours:boolean=false;
  generated:boolean = false;
  generatingIndex:number =0;
  sended:boolean =false;
  lazy:boolean =false;
  pos:Vector;
  mesh:Mesh;
  vao:VAO;
  vbo:VBO;
  vtc:VBO;
  vlo:VBO;
  vfb:VBO;
  ebo:EBO;
  transformation = Matrix.identity();
constructor(x:number, z:number) {
    // console.log("Constructing chunk");
    this.transformation= this.transformation.translate(x*16,0,z*16)
      this.mesh = new Mesh();
      this.vao = new VAO();
      this.vbo = new VBO();
      this.vao.addPtr(0,3,0,0);
      this.vtc = new VBO();
      this.vao.addPtr(1,3,0,0);
    this.vlo = new VBO();
      this.vao.addPtr(2,1,0,0);
      this.vfb = new VBO();
      this.vao.addPtr(3,1,0,0);
      this.ebo = new EBO();
      VAO.unbind();
      VBO.unbind();
      EBO.unbind();
    
    this.pos = new Vector(x,0,z);
    for(let i =0; i<16;i++)
    {
      this.heightmap[i] = new Array(16);
    }
  // this.preGenSubchunks();
    // console.log("done constructing");
  }
   preGenOne()
  {
    if(this.generatingIndex>=16) return;
    this.subchunks[this.generatingIndex] = new SubChunk(new Vector(this.pos.x, this.generatingIndex, this.pos.z),this);
    this.subchunks[this.generatingIndex].preGenerate(this.heightmap);
    this.generatingIndex++;
    if(this.generatingIndex>=16){ 
      this.generated =true;}
  }
  preGenSubchunks()
  {
    for (let i = 0; i < 16; i++) {
      this.subchunks[i] = new SubChunk(new Vector(this.pos.x, i, this.pos.z),this);
      this.subchunks[i].preGenerate(this.heightmap);
     }
     this.generated=true;
    
  }
  postGenerate()
  {

    let x = randRange(0,15)+(this.pos.x*16);
    let z= randRange(0,15)+(this.pos.z*16);
    World.generateTree(new Vector(x,World.getHeight(x,z),z));
  }
  updateNeighbour(neigbDir:DIR,chunk:Chunk)
  {
    //console.log("what")
    //console.log(this.pos,neigbDir);
    if(chunk==undefined|| this.allNeighbours) return;
    this.neighbours[neigbDir] =chunk;
    if(this.neighbours["NEG_X"]!=undefined && this.neighbours["POS_X"]!=undefined && this.neighbours["POS_Z"]!=undefined && this.neighbours["NEG_Z"]!=undefined)
    {
      //console.log("gathered all neighbours :)")
      this.allNeighbours = true;
      this.postGenerate();
    this.updateAllSubchunks();
    }
  }
  sdNeighbour(neighbour,dir)
  { try
    {
    neighbour.updateNeighbour(dir,this);
    this.updateNeighbour(flipDir(dir),neighbour)
    }
    catch(error)
    {

    }
  }
  sendNeighbours()
  {
    if(this.allNeighbours || !this.generated) return;
    let neighbour = Main.getChunkAt(this.pos.x-1,this.pos.z);
     this.sdNeighbour(neighbour,"POS_X");
   neighbour = Main.getChunkAt(this.pos.x+1,this.pos.z);
 this.sdNeighbour(neighbour,"NEG_X");
  neighbour = Main.getChunkAt(this.pos.x,this.pos.z-1);
   this.sdNeighbour(neighbour,"POS_Z");
  neighbour = Main.getChunkAt(this.pos.x,this.pos.z+1);
  this.sdNeighbour(neighbour,"NEG_Z");
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
    if(!this.lazy)
    {
    this.vao.bind();
    Main.shader.loadTransformation(this.transformation);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_INT, 0);
    }

  }
  renderWater() {
   //TODO: Water rendering
  }
  getBlock(pos:Vector):Block {
    if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 15 || pos.y > 256 || pos.z > 15) {
      throw new Error("Incorrect cordinates: x:"+pos.x+" y:"+pos.y+" z:"+pos.z );
    }
    let y = pos.y%16;
    let yPos = Math.floor(pos.y/16);
    if(this.subchunks[yPos]!=undefined)
    {
      if(! (this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
      this.subchunks[yPos].blocks[pos.x][y][pos.z] =new Block(0);
  //  console.log(this.subchunks[yPos].blocks[pos.x][y][pos.z]);
    return this.subchunks[yPos].blocks[pos.x][y][pos.z];
    }
    throw new Error("Undefined subchunk! ");
  }
  setLight(pos:Vector,lightLevel:number)
  {
    if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
      throw new Error("Incorrect cordinates");
    }
    let y = pos.y%16;
  
    let yPos = Math.floor(Math.round(pos.y)/16);
    if(this.subchunks[yPos]!=undefined)
    {
      if(! (this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
      this.subchunks[yPos].blocks[pos.x][y][pos.z] =new Block(0);
      this.subchunks[yPos].blocks[pos.x][y][pos.z].lightLevel=lightLevel;
    }
    else
    {
   //   console.log("Subchunk is undefined");
    }
   
  }
   updateAllSubchunks()
  {
    if(!this.allNeighbours) return;
    for (let i = 0; i < this.subchunks.length; i++) {
    
     this.subchunks[i].update();
    }
    this.updateMesh();
   // console.log("now not lazy hehehehe")
  }
  getSubchunk(y)
  {
    let yPos = Math.floor(Math.round(y)/16);
    if(this.subchunks[yPos]!= undefined)
   return this.subchunks[yPos];
  }
  updateSubchunkAt(y)
  {
    if(!this.allNeighbours) return;
    let yPos = Math.floor(Math.round(y)/16);

    Main.toUpdate.add(this.subchunks[yPos]);
  
  }
  setBlock(pos:Vector,blockID:number)
  {
    if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
      throw new Error("Incorrect cordinates");
    }
    let y = pos.y%16;
    let yPos = Math.floor(Math.round(pos.y)/16);
    if(this.subchunks[yPos]!=undefined )//&& this.subchunks[yPos].generated==true)
    {
      if(! (this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
      this.subchunks[yPos].blocks[pos.x][y][pos.z] =new Block(0);
      let  lights:Array<LightNode> = this.subchunks[yPos-1].getLights();
      lights = lights.concat(this.subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["POS_X"].subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["POS_X"].subchunks[yPos].getLights());
    lights = lights.concat(this.neighbours["POS_X"].subchunks[yPos-1].getLights());

    lights = lights.concat(this.neighbours["POS_X"].neighbours["NEG_Z"].subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["POS_X"].neighbours["NEG_Z"].subchunks[yPos].getLights());
    lights = lights.concat(this.neighbours["POS_X"].neighbours["NEG_Z"].subchunks[yPos-1].getLights());

    lights = lights.concat(this.neighbours["POS_X"].neighbours["POS_Z"].subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["POS_X"].neighbours["POS_Z"].subchunks[yPos].getLights());
    lights = lights.concat(this.neighbours["POS_X"].neighbours["POS_Z"].subchunks[yPos-1].getLights());

    lights = lights.concat(this.neighbours["NEG_X"].neighbours["NEG_Z"].subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["NEG_X"].neighbours["NEG_Z"].subchunks[yPos].getLights());
    lights = lights.concat(this.neighbours["NEG_X"].neighbours["NEG_Z"].subchunks[yPos-1].getLights());

    lights = lights.concat(this.neighbours["NEG_X"].neighbours["POS_Z"].subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["NEG_X"].neighbours["POS_Z"].subchunks[yPos].getLights());
    lights = lights.concat(this.neighbours["NEG_X"].neighbours["POS_Z"].subchunks[yPos-1].getLights());

    lights = lights.concat(this.neighbours["NEG_X"].subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["NEG_X"].subchunks[yPos].getLights());
    lights = lights.concat(this.neighbours["NEG_X"].subchunks[yPos-1].getLights());

    lights = lights.concat(this.neighbours["POS_Z"].subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["POS_Z"].subchunks[yPos].getLights());
    lights = lights.concat(this.neighbours["POS_Z"].subchunks[yPos-1].getLights());

    lights = lights.concat(this.neighbours["NEG_Z"].subchunks[yPos+1].getLights());
    lights = lights.concat(this.neighbours["NEG_Z"].subchunks[yPos].getLights());
    lights = lights.concat(this.neighbours["NEG_Z"].subchunks[yPos-1].getLights());
      let remlights = this.subchunks[yPos].getLights().concat(lights);
      for(let light of remlights)
    {
    //  console.log("Found light, refreshing...");
      Main.lightRemQueue.push(light);
    }
    this.subchunks[yPos].blocks[pos.x][y][pos.z].id=blockID;
    this.subchunks[yPos].refreshLights();
     lights = lights.concat(this.subchunks[yPos].getLights());
    for(let light of lights)
    {
      if(Vector.distance(light.pos,new Vector(pos.x,y,pos.z))<16)
    Main.lightQueue.push(light);
    }
    if(blockID!=0 )
    {
      this.subchunks[yPos].blocks[pos.x][y][pos.z].lightFBlock=0;
      this.subchunks[yPos].blocks[pos.x][y][pos.z].lightLevel=0;
    if(pos.y>this.heightmap[pos.x][pos.z])
    this.heightmap[pos.x][pos.z] = pos.y;
    }
    else{
      
      if (pos.y==this.heightmap[pos.x][pos.z])
    {
      while(this.getBlock(new Vector(pos.x,this.heightmap[pos.x][pos.z],pos.z)).id==0)
    this.heightmap[pos.x][pos.z]--;
    this.heightmap[pos.x][pos.z]--;
    }
  }
    this.updateSubchunkAt(pos.y);
    try
    {
    if(pos.x ==0)
    {
      Main.toUpdate.add(Main.getChunkAt(this.pos.x-1, this.pos.z).subchunks[yPos]);
    }
   else if(pos.x ==15)
    {
      Main.toUpdate.add( Main.getChunkAt(this.pos.x+1, this.pos.z).subchunks[yPos]);
    }
    if(y ==0)
    {
      Main.toUpdate.add(this.subchunks[yPos-1]);
    }
   else if(y ==15)
    {
      Main.toUpdate.add(this.subchunks[yPos+1]);
    }
    if(pos.z ==0)
    {
      Main.toUpdate.add(Main.getChunkAt(this.pos.x, this.pos.z-1).subchunks[yPos]);
    }
   else if(pos.z ==15)
    {
      Main.toUpdate.add(Main.getChunkAt(this.pos.x, this.pos.z+1).subchunks[yPos]);
      
    }
 
  }
  catch(error)
  {
   // console.log(error);
  }
    }
    else
    {
      console.log("Subchunk is undefined");
    }
   
  }
  setBlock2(pos:Vector, blockID) {
    if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
      throw new Error("Incorrect cordinates");
    }
    let y = pos.y%16;
  
    let yPos = Math.floor(Math.round(pos.y)/16);
    console.log(yPos);
    if(this.subchunks[yPos]!=undefined)
    {
    this.subchunks[yPos].blocks[pos.x][y][pos.z].id=blockID;
    try
    {
      if(yPos+y>=this.heightmap[pos.x][pos.z] )
      {
        this.heightmap[pos.x][pos.z]=(yPos+y)-1;
        let blockId =  this.subchunks[yPos].blocks[pos.x][y-1][pos.z].id;
        this.subchunks[yPos].blocks[pos.x][y-1][pos.z].lightLevel=15; 
        this.subchunks[yPos].blocks[pos.x-1][y-1][pos.z].lightLevel=13; 
          this.subchunks[yPos].blocks[pos.x+1][y-1][pos.z].lightLevel=13;
          this.subchunks[yPos].blocks[pos.x][y-1][pos.z+1].lightLevel=13;
          this.subchunks[yPos].blocks[pos.x][y-1][pos.z-1].lightLevel=13;   
        let tempPos = 0;
        while(blockId<1)
        {
          tempPos+=1;
          this.heightmap[pos.x][pos.z]=(yPos+y)-tempPos;
          blockID =    this.subchunks[yPos].blocks[pos.x][y-tempPos][pos.z].id;
          this.subchunks[yPos].blocks[pos.x][y-tempPos][pos.z].lightLevel=15; 
          this.subchunks[yPos].blocks[pos.x-1][y-tempPos][pos.z].lightLevel=13-tempPos; 
          this.subchunks[yPos].blocks[pos.x+1][y-tempPos][pos.z].lightLevel=13-tempPos;
          this.subchunks[yPos].blocks[pos.x][y-tempPos][pos.z+1].lightLevel=13-tempPos;
          this.subchunks[yPos].blocks[pos.x][y-tempPos][pos.z-1].lightLevel=13-tempPos;   
        }
      }
      else
      {
        let light =   this.subchunks[yPos].blocks[pos.x][y][pos.z].lightLevel;
        if( this.subchunks[yPos].blocks[pos.x+1][y][pos.z].lightLevel < light-1)
        this.subchunks[yPos].blocks[pos.x+1][y][pos.z].lightLevel=light-1; 
        if( this.subchunks[yPos].blocks[pos.x-1][y][pos.z].lightLevel < light-1)
        this.subchunks[yPos].blocks[pos.x-1][y][pos.z].lightLevel=light-1; 
        if( this.subchunks[yPos].blocks[pos.x][y][pos.z-1].lightLevel < light-1)
          this.subchunks[yPos].blocks[pos.x][y][pos.z-1].lightLevel=light-1;
          if( this.subchunks[yPos].blocks[pos.x][y][pos.z+1].lightLevel < light-1)
          this.subchunks[yPos].blocks[pos.x][y][pos.z+1].lightLevel=light-1;
          if( this.subchunks[yPos].blocks[pos.x][y-1][pos.z].lightLevel < light-1)
          this.subchunks[yPos].blocks[pos.x][y-1][pos.z].lightLevel=light-1;   
          if( this.subchunks[yPos].blocks[pos.x][y+1][pos.z].lightLevel < light-1)
          this.subchunks[yPos].blocks[pos.x][y+1][pos.z].lightLevel=light-1; 
      }
    }
    catch(error)
    {
      
    }
    this.subchunks[yPos].update();
    }
    else console.log("undefined Chunk!");
  }

}