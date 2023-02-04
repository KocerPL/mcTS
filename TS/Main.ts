import { Camera } from "./Engine/Camera.js";
import { CanvaManager } from "./Engine/CanvaManager.js";
import { EBO } from "./Engine/EBO.js";
import { AtlasShader } from "./Engine/Shader/AtlasShader.js";
import { DefaultShader } from "./Engine/Shader/DefaultShader.js";
import { Shader2d } from "./Engine/Shader/Shader2d.js";
import { Task } from "./Engine/Task.js";
import { Texture } from "./Engine/Texture.js";
import { Array3D } from "./Engine/Utils/Array3D.js";
import { Matrix } from "./Engine/Utils/Matrix.js";
import { Vector } from "./Engine/Utils/Vector.js";
import { VAO } from "./Engine/VAO.js";
import { VBO } from "./Engine/VBO.js";
import { Block, blocks } from "./Game/Block.js";
import { Chunk } from "./Game/Chunk.js";
import { Entity } from "./Game/Entity.js";
import { GUI } from "./Game/GUI.js";
import { Player } from "./Game/Player.js";
import { World } from "./Game/World.js";
let gl = CanvaManager.gl;
export class Main
{
   public static maxChunks =121;
      public static okok = false;
   public static dispLl = false;
   public static fastBreaking=true;
   public static FPS:number=61;
   public static fastTPS=60;
   public static minimalStorage = new Array();
   public static TPS:number=20;
   public static sunLight=14;
   public static file = null;
   public static entities:Array<Entity> = new Array();
   public static Measure = {
      tps:0,
      fps:0,
      lastTime:0,
      ticks:0,
      frames:0,
      lastLimit:0
   }
   private static unloadedChunks:Array<Chunk> = new Array();
   private static shader2d:Shader2d;
   public static tasks:Array<Array<Task>> = new Array(11);
   private static lastTick = 0;
   private static lastFrame=0;
   public static shader:DefaultShader;
   public static atlasShader:AtlasShader;
   private static delta = 0;
   private static crossVAO:VAO;
   private static fastDelta=0;
   private static lastFastTick=0;
   public static player = new Player(new Vector(0,130,0));
   public static range = {start:0, end:1};
   //public static chunks:Array<Array<Chunk>>=new Array(8);
   public static loadedChunks:Array<Chunk> = new Array();
  private static tempChunkBuffer:Array<Chunk> = new Array();
   private static crosscords = [
      -0.02,-0.02,
      0.02,0.02,
      -0.02,0.02,
      0.02,-0.02
   ]
   private static crosstcords = [
      0,0,
      9,9,
      0,9,
      9,0
   ]
   private static crossindices =[
      0,1,2, 3,1,0
   ]
   public static heh():void
   {
      console.log("heh");
   }
   public static run():void
   {
      CanvaManager.setupCanva(document.body);
    // EBO.unbind();
    // VBO.unbind();
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
   // gl.enable(gl.CULL_FACE);
   // gl.cullFace(gl.BACK);
    //Transparency requires blending 
    gl.enable (gl.BLEND);
   gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
   //Shader for world
     this.shader = new DefaultShader();
     this.atlasShader = new AtlasShader();
     //shader for GUI(2d)
     this.shader2d = new Shader2d();
     //loading crosshair 
     GUI.init();
     this.crossVAO = new VAO();
     let vbo = new VBO();
     vbo.bufferData(this.crosscords);
     this.crossVAO.addPtr(0,2,0,0);
     let vtc = new VBO();
     vtc.bufferData(this.crosstcords);
     this.crossVAO.addPtr(1,2,0,0);
    let ebo = new EBO();
    ebo.bufferData(this.crossindices);
    VAO.unbind();
    VBO.unbind();
    EBO.unbind();
    //init world
    World.init();
    for(let i=0;i<this.tasks.length;i++)
    {
       this.tasks[i]=new Array();
    }
     //loading chunks
  //  console.log(this.chunks);
 //   this.TESTtransf = this.TESTtransf.scale(2,1,1);
     requestAnimationFrame(this.loop.bind(this));
    
   }
   public static addTask(task:Task,priority)
   {
      this.tasks[priority].push(task);
   }
   public static cancelTasks(caller,label:string|undefined)
   {
      for(let x=0;x<this.tasks.length;x++)
      for(let y= this.tasks[x].length-1;y>-1;y--)
      if(this.tasks[x][y].caller ==caller && this.tasks[x][y].label ==label)
      this.tasks[x].splice(y,1);
   }
   private static resetMeasure(time:number)
   {
      this.Measure.lastTime = time;
      this.Measure.tps = this.Measure.ticks;
      this.Measure.ticks=0;
      this.Measure.fps = this.Measure.frames;
      this.Measure.frames = 0;
   }
   public static loop(time:number):void
   {
      let test =this.lastFrame-time;
      if(test<1000/this.FPS)
      {
         this.Measure.lastLimit=time;
      this.limitChunks();
      }
      if(this.Measure.lastTime <= time-1000)
      this.resetMeasure(time);
      let delta = time-this.lastTick;
      this.delta += delta/(2000/this.TPS);
     // console.log(this.delta);
      if(this.delta>=1) this.lastTick=time;
     
      while(this.delta>=1)
      {
         if(this.delta>100) {
            console.log("Is game overloaded? Skipping "+delta+"ms")
            this.delta = 0;
          
         }
      this.delta--;
      this.update();
      };
    
      //60 updates
     let fastDelta = time-this.lastFastTick;
      this.fastDelta += fastDelta/(2000/this.fastTPS);
     // console.log(this.fastDelta);
      if(this.fastDelta>=1) this.lastFastTick=time;
     
      while(this.fastDelta>=1)
      {
         if(this.fastDelta>100) {
            console.log("Is game overloaded? Skipping "+fastDelta+"ms")
            this.fastDelta = 0;
          
         }
      this.fastDelta--;
      this.fastUpdate();
      };
      /* let testTime = Date.now();
      if(this.Measure.fps>20)
      while(Date.now()-testTime <20 )
      {
         this.executeTasks(testTime);
         this.minChunks();
        // this.chunksUpdate();
      }*/
   //  if(this.lastFrame < time-(1000/this.FPS))
     
      this.render();
      this.lastFrame= time;
      requestAnimationFrame(this.loop.bind(this));
   }
   private static fastUpdate()
   {
      this.player.update();
   }
   public static update()
   {
    if(CanvaManager.getKeyOnce(71)) 
    console.log(World.getSubchunk(this.player.pos));
      if(CanvaManager.getKey(52)&&this.sunLight<16)
      this.sunLight++;
      if(CanvaManager.getKey(53)&&this.sunLight>0)
      this.sunLight--;  
      this.Measure.ticks++;
     // this.count++;
     // if(this.count>this.test.indices.length)
      //this.count=3;
      for(let i=0;i<this.entities.length;i++)
      {
         this.entities[i].update(i);
      }
      GUI.update();
      if(CanvaManager.getKeyOnce(54))
      this.exportChunks();
      if(CanvaManager.getKeyOnce(55))
      this.upload();
   }
   private static async limitChunks()
   {
      let x =Math.floor(Math.round(this.player.pos.x)/16);
      let z =Math.floor(Math.round(this.player.pos.z)/16);
      
      let step=1;
      let iter =1;
      let howMuch=this.maxChunks;
      let loadBuffer = new Array();
      this.tempChunkBuffer = [...this.loadedChunks];
      let {chunk,isNew} =  this.getORnew(x,z);
      if(isNew) chunk.preGenSubchunks();
      loadBuffer.push(chunk);
      let nextCoords= new Vector(x,0,z);
      //Spiral chunk loading algorithm
   
      let stop = false;
     while(loadBuffer.length<howMuch)
      {
            //x
            for(let i=0;i<iter;i++)
            {
         nextCoords.x+=step;
         let {chunk,isNew} = this.getORnew(nextCoords.x,nextCoords.z)
         loadBuffer.push(chunk);
              
               if(!chunk.generated) {chunk.preGenOne();stop =true; break; }
               else if(!chunk.sended){
                  chunk.sendNeighbours();
                  //chunk.gatherNeighbours();
                     chunk.sended =true;
                     stop =true;
                     break;
               }
            }
         //z
         if(stop) break;
         for(let i=0;i<iter;i++)
            {
         nextCoords.z+=step;
         let {chunk,isNew} = this.getORnew(nextCoords.x,nextCoords.z)
        // stop = isNew;
         loadBuffer.push(chunk);
         if(!chunk.generated) {chunk.preGenOne();
            stop =true; break; }else if(!chunk.sended){
               chunk.sendNeighbours();
              // chunk.gatherNeighbours();
                  chunk.sended =true;
                  stop =true;
                  break;
            }
            }
         //increase and invert step
         if(stop) break;
        iter++;
        step= -step;
      }
      this.loadedChunks=loadBuffer;
    
      for(let chunk of this.tempChunkBuffer)
      {
         chunk.sended = false;
         for(let i=this.entities.length-1; i>=0;i--)
         {
            let entity = this.entities[i];
            if(chunk.pos.x*16 < entity.pos.x && chunk.pos.z*16 < entity.pos.z && chunk.pos.x*16 > entity.pos.x-16 && chunk.pos.z*16 < entity.pos.z-16)
            this.entities.splice(i,1);
         }
      }
      this.unloadedChunks = this.unloadedChunks.concat([...this.tempChunkBuffer]);
   }
   private static getORnew(x:number,z:number):{chunk:Chunk,isNew:boolean}
   {
      for(let l=0;l<this.tempChunkBuffer.length;l++)
      if(this.tempChunkBuffer[l].pos.x == x && this.tempChunkBuffer[l].pos.z == z)
      {
      return  {chunk:[...this.tempChunkBuffer.splice(l,1)][0],isNew:false};
        
      }

      for(let l=0;l<this.unloadedChunks.length;l++)
      if(this.unloadedChunks[l].pos.x == x && this.unloadedChunks[l].pos.z == z)
      {
      return  {chunk:[...this.unloadedChunks.splice(l,1)][0],isNew:false};
        
      }
  return {chunk: new Chunk(x,z),isNew:true}; 
   }
   public static exportChunks()
   {
      let k = new Array();
     for(let x=0;x<this.loadedChunks.length;x++)
      {
         let chunk  =this.loadedChunks[x];
       //  console.log(chunk);
         if(chunk==undefined) continue;
         let blocks = new Array(16);
         for(let a=0;a<16;a++)
         {
            if(chunk.subchunks[a]==undefined) continue;
            let c = new Array3D(16,16,16);
            for(let x1=0;x1<16;x1++)
            for(let y1=0;y1<16;y1++)
            for(let z1=0;z1<16;z1++)
            {
               if( chunk.subchunks[a].blocks[x1][y1][z1]==undefined || chunk.subchunks[a].blocks[x1][y1][z1]==null) 
                  c[x1][y1][z1]=0;
               else
                  c[x1][y1][z1]=chunk.subchunks[a].blocks[x1][y1][z1].id;
            }
            blocks[a] = c;
         }
            k.push(
               {
                  pos:[chunk.pos.x,chunk.pos.z],
                  blocks:blocks
               }
            )
      }
      k.push({pPos:[this.player.pos.x,this.player.pos.y,this.player.pos.z]});
      this.download(JSON.stringify(k),"world.json","text/plain");
   }
   public static minChunks()
   {
     
         let chunk  =this.unloadedChunks.splice(0,1)[0];
         if(chunk==undefined) return;
         console.log(this.unloadedChunks);
         let blocks = new Array(16);
         for(let a=0;a<16;a++)
         {
            if(chunk.subchunks[a]==undefined) continue;
            let c = new Array3D(16,16,16);
            for(let x1=0;x1<16;x1++)
            for(let y1=0;y1<16;y1++)
            for(let z1=0;z1<16;z1++)
            {
               if( chunk.subchunks[a].blocks[x1][y1][z1]==undefined || chunk.subchunks[a].blocks[x1][y1][z1]==null) 
                  c[x1][y1][z1]=0;
               else
                  c[x1][y1][z1]=chunk.subchunks[a].blocks[x1][y1][z1].id;
            }
            blocks[a] = c;
         }
            this.minimalStorage.push(
               {
                  pos:[chunk.pos.x,chunk.pos.z],
                  blocks:blocks
               }
            )
   }
   public static getChunkAt(x:number,z:number):Chunk | undefined
   {
      for(let i=0;i<this.loadedChunks.length;i++)
      if(this.loadedChunks[i].pos.x == x && this.loadedChunks[i].pos.z == z)
      return this.loadedChunks[i];
      return undefined;
   }
   public static download(content, fileName, contentType) {
      var a = document.createElement("a");
      var file = new Blob([content], {type: contentType});
      a.href = URL.createObjectURL(file);
      a.download = fileName;
      a.click();
  }
  public static upload() {
   var a = document.createElement("input");
   a.type="file";
   
   a.click();
   a.oninput = (ev)=>{
     let file =    a.files.item(0);
     //console.log(file);
     const reader = new FileReader();
     let ok;
     reader.onload =(okok)=>{
        ok = okok.target.result;
        this.file =JSON.parse(ok);
    console.log(this.file);
     }
      var text = reader.result;
   
   let k=  reader.readAsText(file);
    console.log(ok);
//JSON.parse(file);
    

   };

}
   public static render()
   {
      this.Measure.frames++;
      CanvaManager.debug.value = "Fps: "+this.Measure.fps+" Selected block: "+ blocks[this.player.itemsBar[this.player.selectedItem].id].name +" Count:"+this.player.itemsBar[this.player.selectedItem].count+"\n XYZ:  X:"+this.player.pos.x+"  Y:"+this.player.pos.y+"  Z:"+this.player.pos.z;
      
      this.shader.use();
      this.player.camera.preRender();
      this.shader.setFogCenter(this.player.camera.getPosition());
      CanvaManager.preRender();
      gl.clearColor(0.0,this.sunLight/15,this.sunLight/15,1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
   
      gl.bindTexture(gl.TEXTURE_2D_ARRAY,Texture.blocksGridTest);
    
      Main.shader.loadUniforms(Main.player.camera.getProjection(), Matrix.identity(), Main.player.camera.getView(),Main.sunLight);
      for(let chunk of this.loadedChunks)
      {
         if(!chunk.lazy)
         {
         chunk.render()   
     // toRender.push(()=>{chunk.renderWater()});
         }
   } 
       for(let i=0;i<this.entities.length;i++)
       {
          this.entities[i].render();
       }
      //render crosshair
      this.player.render();
      GUI.render(this.shader2d);
   }
}
Main.run();