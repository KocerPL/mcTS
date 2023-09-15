import { GuiComponent } from "./GuiComponent.js";
import { Texture } from "../../Engine/Texture.js";
import { BoundingBox } from "../../Engine/Utils/BoundingBox.js";
import { Matrix3 } from "../../Engine/Utils/Matrix3.js";
export class ItemSlot extends GuiComponent {
    constructor(x, y, id) {
        super(id);
        this.visible = true;
        this.boundingBox = new BoundingBox(-0.05, -0.05, 0.05, 0.05);
        this.transformation = Matrix3.identity().translate(x, y);
        this.tcoords = Texture.GUI.coords[1];
    }
    update() {
        // const set = this.boundingBox.getRenderStuff(Texture.GUI.coords[1]);
        //this.rArrays.vertices = [];
        //this.rArrays.indices = set.indices;
        //this.rArrays.textureCoords = set.textureCoords;
        //for(let i =0;i<set.vertices.length;i+=2)
        //{
        //  const result:Vector3 = this.transformation.multiplyVec(new Vector3(set.vertices[i],set.vertices[i+1],1)); 
        //this.rArrays.vertices.push(result.x,result.y);
        //}
        //this.changed =true;
    }
}
