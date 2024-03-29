
import { CanvaManager } from "../../Engine/CanvaManager.js";
import { Shader } from "../../Engine/Shader/Shader.js";
import { Texture } from "../../Engine/Texture.js";
import { Matrix3 } from "../../Engine/Utils/Matrix3.js";
import { Sprite } from "../../Engine/Utils/Sprite.js";
import { GuiComponent } from "./GuiComponent.js";
export class DarkScreen extends GuiComponent
{
    constructor(id:string)
    {
        super(id);
        this.visible =false;
        this.renderMe = true;
        this.transformation = Matrix3.identity();
        this.sprite = new Sprite(-1,-1,1,1);
        this.tcoords = Texture.GUI.coords[12];
    }
    renderItself(shader: Shader, mat: Matrix3): void {
        shader.loadFloat("prop",1);
        super.renderItself(shader,mat);
        shader.loadFloat("prop",CanvaManager.getProportion);
    }
}