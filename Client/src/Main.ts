import { CanvaManager } from "./Engine/CanvaManager.js";
import { AtlasShader } from "./Engine/Shader/AtlasShader.js";
import { DefaultShader } from "./Engine/Shader/DefaultShader.js";
import { Shader2d } from "./Engine/Shader/Shader2d.js";
import { Task } from "./Engine/Task.js";
import { Texture } from "./Engine/Texture.js";
import { Array3D } from "./Engine/Utils/Array3D.js";
import { Matrix4 } from "./Engine/Utils/Matrix4.js";
import { Vector } from "./Engine/Utils/Vector.js";
import { Block, blocks } from "./Game/Block.js";
import { Chunk } from "./Game/Chunk.js";
import { Entity } from "./Game/Entity.js";
import { GUI } from "./Game/gui/GUI.js";
import { Player } from "./Game/Player.js";
import { SubChunk } from "./Game/SubChunk.js";
import { World } from "./Game/World.js";
import { PlayerEntity } from "./Game/entities/PlayerEntity.js";
import { Inventory } from "./Game/gui/Inventory.js";
import { ItemBar } from "./Game/gui/ItemBar.js";
import { Scene } from "./Engine/Scene.js";
import { GameScene } from "./Game/scenes/GameScene.js";
const gl = CanvaManager.gl;
declare const io;
export class Main
{
    public static scene:Scene;
    //public static maxChunks =128;
    //public static maxSubUpdates = 5;
    //public static okok = false;
    //public static dispLl = false;
    //public static fly =false;
   // public static fastBreaking=false;
    public static FPS=61;
    public static fastTPS=60;
    //public static minimalStorage = [];
   // public static TPS=20;
   // public static sunLight=14;
    //public static entities:Array<Entity> = [];
    //public static gui:GUI;
    public static Measure = {
        tps:0,
        fps:0,
        lastTime:0,
        ticks:0,
        frames:0,
        lastLimit:0
    };
  //  private static unloadedChunks:Array<Chunk> = [];
    public static shader2d:Shader2d;
    //public static tasks:Array<Array<Task>> = new Array(11);
    private static lastTick = 0;
    private static lastFrame=0;
    //public static socket = io();
    public static shader:DefaultShader;
    public static atlasShader:AtlasShader;
    private static delta = 0;
    private static fastDelta=0;
    private static lastFastTick=0;
   // public static inv:Inventory;
   // public static player:Player ;
    //public static range = {start:0, end:1};
    //public static chunks:Array<Array<Chunk>>=new Array(8);
    //public static chunkQueue:Array<Chunk> = []; 
    //public static loadedChunks:Map<string,Chunk> = new Map();
    //public static toUpdate:Set<SubChunk> = new Set();
    //public static integratedServer:Worker;
    public static heh():void
    {
        console.log("heh");
    }
    public static run():void
    {
        this.shader = new DefaultShader();
        this.atlasShader = new AtlasShader();
        console.log(this.atlasShader);
        //shader for GUI(2d)
        this.shader2d = new Shader2d();
        this.scene = new GameScene();
        this.scene.start();
        CanvaManager.setupCanva(document.body);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        //Transparency requires blending 
        gl.enable (gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //init world
        //loading chunks
        requestAnimationFrame(this.loop.bind(this));
    
    }

    ////MAIN LOOP\\\\
    public static loop(time:number):void
    {
        //if(this.chunkQueue.length>0)
          //  this.processChunk(this.chunkQueue.shift());
   
        if(this.Measure.lastTime <= time-1000)
            this.resetMeasure(time);
        const delta = time-this.lastTick;
        this.delta += delta/(2000/this.scene.TPS);
        // console.log(this.delta);
        if(this.delta>=1) this.lastTick=time;
     
        while(this.delta>=1)
        {
            if(this.delta>100) {
                console.log("Is game overloaded? Skipping "+delta+"ms");
                this.delta = 0;
          
            }
            this.delta--;
            this.update();
        }
        //60 updates
   /*     const fastDelta = time-this.lastFastTick;
        this.fastDelta += fastDelta/(2000/this.fastTPS);
        // console.log(this.fastDelta);
        if(this.fastDelta>=1) this.lastFastTick=time;
     
        while(this.fastDelta>=1)
        {
            if(this.fastDelta>100) {
                console.log("Is game overloaded? Skipping "+fastDelta+"ms");
                this.fastDelta = 0;
          
            }
            this.fastDelta--;
            this.fastUpdate();
        }*/
      //  this.updateSubchunks();
        this.render();
        this.lastFrame= time;
        requestAnimationFrame(this.loop.bind(this));
    }
    private static resetMeasure(time:number)
    {
        this.Measure.lastTime = time;
        this.Measure.tps = this.Measure.ticks;
        this.Measure.ticks=0;
        this.Measure.fps = this.Measure.frames;
        this.Measure.frames = 0;
    }


    public static update()
    {
        this.scene.update();
      /*  if(CanvaManager.getKeyOnce(86)) {this.inv.setVisible =!this.inv.getVisible; console.log("VVVVV");}
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
      
        if(CanvaManager.getKeyOnce(54))
            this.maxChunks--;
        if(CanvaManager.getKeyOnce(55))
            this.maxChunks++;
        if(CanvaManager.getKeyOnce(56))
            this.fastBreaking=!this.fastBreaking;
        if(CanvaManager.getKeyOnce(57))
            this.fly=!this.fly;*/
    }
   
    public static renderDebug()
    {
      //  CanvaManager.debug.innerText = "Fps: "+this.Measure.fps+" Selected block: "+ blocks[this.player.itemsBar[this.player.selectedItem].id].name +" Count:"+this.player.itemsBar[this.player.selectedItem].count+
      //"\n XYZ:  X:"+(Math.floor(this.player.pos.x*100)/100)+"  Y:"+(Math.floor(this.player.pos.y*100)/100)+"  Z:"+(Math.floor(this.player.pos.z*100)/100)+"\nFast break [8]: "+this.fastBreaking+" Fly[9]: "+this.fly+"\n Sky light [4][5]:"+this.sunLight
     //+"\n Visible chunks[6][7]: "+this.maxChunks+"\n    Heightmap:"+World.getHeightMap(this.player.pos);
    }
    public static render()
    {
        this.Measure.frames++;
  
        this.renderDebug();
       
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.scene.render();
        /*
        this.shader.use();
        this.player.camera.preRender();
        this.shader.setFog(this.player.camera.getPosition(),Math.sqrt(this.maxChunks)*8);
        CanvaManager.preRender();
        gl.clearColor(0.43*(this.sunLight/15) ,0.69 *(this.sunLight/15),(this.sunLight/15),1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
        Texture.testAtkas.bind();
    
        Main.shader.loadUniforms(Main.player.camera.getProjection(), Matrix4.identity(), Main.player.camera.getView(),Main.sunLight);
        for(const val of this.loadedChunks)
        {
        
            val[1].render();   
        
        } 
        for(let i=0;i<this.entities.length;i++)
        {
            this.entities[i].render();
        }
        this.player.render();
        this.gui.render();*/
    }
}
Main.run();