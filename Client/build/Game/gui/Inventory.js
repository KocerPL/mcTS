import { Texture } from "../../Engine/Texture.js";
import { BoundingBox } from "../../Engine/Utils/BoundingBox.js";
import { Matrix3 } from "../../Engine/Utils/Matrix3.js";
import { Vector3 } from "../../Engine/Utils/Vector3.js";
import { GuiComponent } from "./GuiComponent.js";
export class Inventory extends GuiComponent {
    constructor() {
        super();
        this.boundingBox = new BoundingBox(-0.02, -0.02, 0.02, 0.02);
        this.visible = true;
        this.transformation = Matrix3.identity();
        let coords = Texture.GUI.coords;
        this.rArrays.textureCoords = [
            coords[0].dx, coords[0].y,
            coords[0].x, coords[0].dy,
            coords[0].dx, coords[0].dy,
            coords[0].x, coords[0].y
        ];
        this.rArrays.indices = [0, 1, 2, 1, 0, 3];
        this.update();
    }
    update() {
        let set = this.boundingBox.getRenderStuff(Texture.GUI.coords[0]);
        this.rArrays.vertices = [];
        this.rArrays.indices = set.indices;
        this.rArrays.textureCoords = set.textureCoords;
        for (let i = 0; i < set.vertices.length; i += 2) {
            let result = this.transformation.multiplyVec(new Vector3(set.vertices[i], set.vertices[i + 1], 1));
            this.rArrays.vertices.push(result.x, result.y);
        }
        this.changed = true;
    }
}
