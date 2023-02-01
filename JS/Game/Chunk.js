import { CanvaManager } from "../Engine/CanvaManager.js";
import { EBO } from "../Engine/EBO.js";
import { Vector } from "../Engine/Utils/Vector.js";
import { VAO } from "../Engine/VAO.js";
import { VBO } from "../Engine/VBO.js";
import { Main } from "../Main.js";
import { Block } from "./Block.js";
import { SubChunk } from "./SubChunk.js";
import { Matrix } from "../Engine/Utils/Matrix.js";
import { Mesh } from "./Mesh.js";
let gl = CanvaManager.gl;
export class Chunk {
    subchunks = new Array(16);
    todo = new Array();
    heightmap = new Array(16);
    neighbours = {};
    allNeighbours = false;
    sended = false;
    lazy = false;
    pos;
    mesh;
    vao;
    vbo;
    vtc;
    vlo;
    vfb;
    ebo;
    transformation = Matrix.identity();
    constructor(x, z) {
        // console.log("Constructing chunk");
        this.transformation = this.transformation.translate(x * 16, 0, z * 16);
        this.mesh = new Mesh();
        this.vao = new VAO();
        this.vbo = new VBO();
        this.vao.addPtr(0, 3, 0, 0);
        this.vtc = new VBO();
        this.vao.addPtr(1, 3, 0, 0);
        this.vlo = new VBO();
        this.vao.addPtr(2, 1, 0, 0);
        this.vfb = new VBO();
        this.vao.addPtr(3, 1, 0, 0);
        this.ebo = new EBO();
        VAO.unbind();
        VBO.unbind();
        EBO.unbind();
        this.pos = new Vector(x, 0, z);
        for (let i = 0; i < 16; i++) {
            this.heightmap[i] = new Array(16);
        }
        for (let i = 0; i < this.subchunks.length; i++) {
            this.subchunks[i] = new SubChunk(new Vector(x, i, z), this.heightmap, this);
            //console.log("Completed generating subchunk: "+i);
        }
        this.sendNeighbours();
        // console.log("done constructing");
    }
    updateNeighbour(neigbDir, chunk) {
        console.log("what");
        console.log(this.pos, neigbDir);
        if (chunk == undefined)
            return;
        this.neighbours[neigbDir] = chunk;
        if (this.neighbours["NEG_X"] != undefined && this.neighbours["POS_X"] != undefined && this.neighbours["POS_Z"] != undefined && this.neighbours["NEG_Z"] != undefined) {
            console.log("gathered all neighbours :)");
            this.allNeighbours = true;
            this.updateAllSubchunks();
        }
    }
    gatherNeighbours() {
        if (this.allNeighbours)
            return;
        try {
            let neighbour = Main.getChunkAt(this.pos.x - 1, this.pos.z);
            this.updateNeighbour("NEG_X", neighbour);
        }
        catch (error) {
        }
        try {
            let neighbour = Main.getChunkAt(this.pos.x + 1, this.pos.z);
            this.updateNeighbour("POS_X", neighbour);
        }
        catch (error) {
        }
        try {
            let neighbour = Main.getChunkAt(this.pos.x, this.pos.z - 1);
            this.updateNeighbour("NEG_Z", neighbour);
        }
        catch (error) {
        }
        try {
            let neighbour = Main.getChunkAt(this.pos.x, this.pos.z + 1);
            this.updateNeighbour("POS_Z", neighbour);
        }
        catch (error) {
        }
    }
    sendNeighbours() {
        if (this.allNeighbours)
            return;
        try {
            let neighbour = Main.getChunkAt(this.pos.x - 1, this.pos.z);
            console.log(neighbour.pos);
            neighbour.updateNeighbour("POS_X", this);
        }
        catch (error) {
            console.log("hehe");
        }
        try {
            let neighbour = Main.getChunkAt(this.pos.x + 1, this.pos.z);
            neighbour.updateNeighbour("NEG_X", this);
        }
        catch (error) {
        }
        try {
            let neighbour = Main.getChunkAt(this.pos.x, this.pos.z - 1);
            neighbour.updateNeighbour("POS_Z", this);
        }
        catch (error) {
        }
        try {
            let neighbour = Main.getChunkAt(this.pos.x, this.pos.z + 1);
            neighbour.updateNeighbour("NEG_Z", this);
        }
        catch (error) {
        }
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
        if (!this.lazy) {
            this.vao.bind();
            Main.shader.loadTransformation(this.transformation);
            gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_INT, 0);
        }
    }
    renderWater() {
        //TODO: Water rendering
    }
    getBlock(pos) {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 15 || pos.y > 256 || pos.z > 15) {
            throw new Error("Incorrect cordinates: x:" + pos.x + " y:" + pos.y + " z:" + pos.z);
        }
        let y = pos.y % 16;
        let yPos = Math.floor(pos.y / 16);
        if (this.subchunks[yPos] != undefined) {
            if (!(this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] = new Block(0);
            //  console.log(this.subchunks[yPos].blocks[pos.x][y][pos.z]);
            return this.subchunks[yPos].blocks[pos.x][y][pos.z];
        }
        throw new Error("Undefined subchunk! ");
    }
    setLight(pos, lightLevel) {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
            throw new Error("Incorrect cordinates");
        }
        let y = pos.y % 16;
        let yPos = Math.floor(Math.round(pos.y) / 16);
        if (this.subchunks[yPos] != undefined) {
            if (!(this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] = new Block(0);
            this.subchunks[yPos].blocks[pos.x][y][pos.z].lightLevel = lightLevel;
        }
        else {
            console.log("Subchunk is undefined");
        }
    }
    generate() {
        for (let i = 0; i < this.subchunks.length; i++) {
            this.subchunks[i].preGenerate(this.heightmap);
        }
        // this.lazy=false;
    }
    updateAllSubchunks() {
        for (let i = 0; i < this.subchunks.length; i++) {
            this.subchunks[i].update();
        }
        this.lazy = false;
        this.updateMesh();
        console.log("now not lazy hehehehe");
    }
    getSubchunk(y) {
        let yPos = Math.floor(Math.round(y) / 16);
        if (this.subchunks[yPos] != undefined)
            return this.subchunks[yPos];
    }
    updateSubchunkAt(y) {
        let yPos = Math.floor(Math.round(y) / 16);
        if (this.subchunks[yPos].generated)
            this.subchunks[yPos].update();
        this.updateMesh();
    }
    setBlock(pos, blockID, update) {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
            throw new Error("Incorrect cordinates");
        }
        let y = pos.y % 16;
        let yPos = Math.floor(Math.round(pos.y) / 16);
        if (this.subchunks[yPos] != undefined) //&& this.subchunks[yPos].generated==true)
         {
            if (!(this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] = new Block(0);
            this.subchunks[yPos].blocks[pos.x][y][pos.z].id = blockID;
            this.updateSubchunkAt(pos.y);
            try {
                if (pos.x == 0) {
                    Main.getChunkAt(this.pos.x - 1, this.pos.z).subchunks[yPos].update();
                }
                else if (pos.x == 15) {
                    Main.getChunkAt(this.pos.x + 1, this.pos.z).subchunks[yPos].update();
                }
                if (y == 0) {
                    Main.getChunkAt(this.pos.x, this.pos.z).subchunks[yPos - 1].update();
                }
                else if (y == 15) {
                    Main.getChunkAt(this.pos.x, this.pos.z).subchunks[yPos + 1].update();
                }
                if (pos.z == 0) {
                    Main.getChunkAt(this.pos.x, this.pos.z - 1).subchunks[yPos].update();
                }
                else if (pos.z == 15) {
                    Main.getChunkAt(this.pos.x, this.pos.z + 1).subchunks[yPos].update();
                }
            }
            catch (error) {
                // console.log(error);
            }
        }
        else {
            console.log("Subchunk is undefined");
        }
    }
    setBlock2(pos, blockID) {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
            throw new Error("Incorrect cordinates");
        }
        let y = pos.y % 16;
        let yPos = Math.floor(Math.round(pos.y) / 16);
        console.log(yPos);
        if (this.subchunks[yPos] != undefined) {
            this.subchunks[yPos].blocks[pos.x][y][pos.z].id = blockID;
            try {
                if (yPos + y >= this.heightmap[pos.x][pos.z]) {
                    this.heightmap[pos.x][pos.z] = (yPos + y) - 1;
                    let blockId = this.subchunks[yPos].blocks[pos.x][y - 1][pos.z].id;
                    this.subchunks[yPos].blocks[pos.x][y - 1][pos.z].lightLevel = 15;
                    this.subchunks[yPos].blocks[pos.x - 1][y - 1][pos.z].lightLevel = 13;
                    this.subchunks[yPos].blocks[pos.x + 1][y - 1][pos.z].lightLevel = 13;
                    this.subchunks[yPos].blocks[pos.x][y - 1][pos.z + 1].lightLevel = 13;
                    this.subchunks[yPos].blocks[pos.x][y - 1][pos.z - 1].lightLevel = 13;
                    let tempPos = 0;
                    while (blockId < 1) {
                        tempPos += 1;
                        this.heightmap[pos.x][pos.z] = (yPos + y) - tempPos;
                        blockID = this.subchunks[yPos].blocks[pos.x][y - tempPos][pos.z].id;
                        this.subchunks[yPos].blocks[pos.x][y - tempPos][pos.z].lightLevel = 15;
                        this.subchunks[yPos].blocks[pos.x - 1][y - tempPos][pos.z].lightLevel = 13 - tempPos;
                        this.subchunks[yPos].blocks[pos.x + 1][y - tempPos][pos.z].lightLevel = 13 - tempPos;
                        this.subchunks[yPos].blocks[pos.x][y - tempPos][pos.z + 1].lightLevel = 13 - tempPos;
                        this.subchunks[yPos].blocks[pos.x][y - tempPos][pos.z - 1].lightLevel = 13 - tempPos;
                    }
                }
                else {
                    let light = this.subchunks[yPos].blocks[pos.x][y][pos.z].lightLevel;
                    if (this.subchunks[yPos].blocks[pos.x + 1][y][pos.z].lightLevel < light - 1)
                        this.subchunks[yPos].blocks[pos.x + 1][y][pos.z].lightLevel = light - 1;
                    if (this.subchunks[yPos].blocks[pos.x - 1][y][pos.z].lightLevel < light - 1)
                        this.subchunks[yPos].blocks[pos.x - 1][y][pos.z].lightLevel = light - 1;
                    if (this.subchunks[yPos].blocks[pos.x][y][pos.z - 1].lightLevel < light - 1)
                        this.subchunks[yPos].blocks[pos.x][y][pos.z - 1].lightLevel = light - 1;
                    if (this.subchunks[yPos].blocks[pos.x][y][pos.z + 1].lightLevel < light - 1)
                        this.subchunks[yPos].blocks[pos.x][y][pos.z + 1].lightLevel = light - 1;
                    if (this.subchunks[yPos].blocks[pos.x][y - 1][pos.z].lightLevel < light - 1)
                        this.subchunks[yPos].blocks[pos.x][y - 1][pos.z].lightLevel = light - 1;
                    if (this.subchunks[yPos].blocks[pos.x][y + 1][pos.z].lightLevel < light - 1)
                        this.subchunks[yPos].blocks[pos.x][y + 1][pos.z].lightLevel = light - 1;
                }
            }
            catch (error) {
            }
            this.subchunks[yPos].update();
        }
        else
            console.log("undefined Chunk!");
    }
}
