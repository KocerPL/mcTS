import { Model } from "../Game/Models.js";
import { Player } from "../Game/Player.js";
import { CanvaManager } from "./CanvaManager.js";
import { Loader } from "./Loader.js";
let gl = CanvaManager.gl;
export class Texture
{
    static SIZE=64;
    static imageSize = 1024;
    static rowSize = 16;
    static blocksGridTest = Loader.imageArray("/res/textures/Blocks.png",20,16);
   // static GUI = Loader.image("/JS/Engine/Textures/GUI.png");
   static blockOverlay = Loader.imageArray("/res/textures/blockOverlay.png",6,8)
   static skin = Loader.imageArrayByJSON("/res/textures/skinMC.png",Model.player);
    static GUItest = Loader.imageArray("/res/textures/GUI.png",3,9);
    static crossHair = Loader.image("/res/textures/crosshair.png");
  
    static skinAtlas =  Loader.imageAtlasByJSON("/res/textures/skinMC.png",Model.player,64,64);

  
    
}