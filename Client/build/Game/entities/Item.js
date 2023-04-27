import { CanvaManager } from "../../Engine/CanvaManager.js";
import { Texture } from "../../Engine/Texture.js";
import { Matrix } from "../../Engine/Utils/Matrix.js";
import { Vector } from "../../Engine/Utils/Vector.js";
import { Main } from "../../Main.js";
import { Entity } from "../Entity.js";
import { SubChunk } from "../SubChunk.js";
import { World } from "../World.js";
const gl = CanvaManager.gl;
export class Item extends Entity {
    type;
    cooldown = 10;
    lifeTime = 60000;
    rotation = 0;
    count = 1;
    yAcc = 0;
    constructor(pos, type) {
        super(pos);
        this.type = type;
        this.prepareModel();
    }
    update(i) {
        if (this.cooldown > 0)
            this.cooldown--;
        this.lifeTime--;
        if (this.cooldown < 1) {
            if (Main.player.isTouching(this.pos, 0.5)) {
                Main.player.pickupItem(this);
                Main.entities.splice(i, 1);
                return;
            }
            for (const ent of Main.entities)
                if (ent instanceof Item && ent.type == this.type && ent != this && this.isTouching(ent.pos, 1)) {
                    ent.count += this.count;
                    Main.entities.splice(i, 1);
                }
        }
        if (this.lifeTime < 1)
            Main.entities.splice(i, 1);
        const block = World.getBlock(new Vector(this.pos.x, this.pos.y, this.pos.z));
        let ll = block.skyLight;
        this.rs.skyLight = [ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll];
        ll = block.lightFBlock;
        this.rs.blockLight = [ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll, ll];
        this.rs.bufferArrays();
    }
    prepareModel() {
        this.rs.vertices = [...SubChunk.defVertices];
        this.rs.textureCoords = [...SubChunk.getTextureCords2(this.type, "front"), ...SubChunk.getTextureCords2(this.type, "back"),
            ...SubChunk.getTextureCords2(this.type, "left"), ...SubChunk.getTextureCords2(this.type, "right"),
            ...SubChunk.getTextureCords2(this.type, "bottom"), ...SubChunk.getTextureCords2(this.type, "top")];
        //     console.log(this.rs.textureCoords);
        this.rs.indices = [2, 1, 0, 2, 0, 3,
            6, 5, 4, 6, 4, 7, 10, 9, 8, 10, 8, 11, 14, 13, 12, 14, 12, 15, 18, 17, 16, 18, 16, 19, 22, 21, 20, 22, 20, 23];
        this.rs.skyLight = [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14];
    }
    isTouching(vec, offset) {
        offset ??= 0;
        if (vec.x > this.pos.x - 0.3 - offset && vec.z > this.pos.z - 0.3 - offset && vec.y > this.pos.y - 1
            && vec.x < this.pos.x + 0.3 + offset && vec.z < this.pos.z + 0.3 + offset && vec.y < this.pos.y + 1)
            return true;
        return false;
    }
    render() {
        // console.log("rendered")
        try {
            if (World.getBlock(new Vector(this.pos.x, this.pos.y, this.pos.z)).id > 0)
                this.yAcc -= 0.01;
            else if (World.getBlock(new Vector(this.pos.x, this.pos.y - 0.5, this.pos.z)).id == 0)
                this.yAcc += 0.01;
            else
                this.yAcc = 0;
        }
        catch (erro) {
            this.lifeTime = 0;
        }
        this.pos.y -= this.yAcc;
        if (this.rotation < 360)
            this.rotation++;
        else {
            this.rotation = 0;
        }
        this.transformation = Matrix.identity();
        this.transformation = this.transformation.translate(this.pos.x, this.pos.y + (Math.abs(this.rotation - 180) / 360), this.pos.z);
        this.transformation = this.transformation.scale(0.3, 0.3, 0.3);
        this.transformation = this.transformation.rotateY(this.rotation);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, Texture.blocksGridTest);
        this.rs.vao.bind();
        // Main.shader.use();
        Main.shader.loadUniforms(Main.player.camera.getProjection(), this.transformation, Main.player.camera.getView(), Main.sunLight);
        //     Main.shader.use();
        gl.drawElements(gl.TRIANGLES, this.rs.count, gl.UNSIGNED_INT, 0);
        if (this.count > 1) {
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, Texture.blocksGridTest);
            this.rs.vao.bind();
            this.transformation = this.transformation.translate(0.3, -0.3, 0.3);
            Main.shader.loadUniforms(Main.player.camera.getProjection(), this.transformation, Main.player.camera.getView(), Main.sunLight);
            gl.drawElements(gl.TRIANGLES, this.rs.count, gl.UNSIGNED_INT, 0);
        }
    }
}