import { CanvaManager } from "../Engine/CanvaManager.js";
import { EBO } from "../Engine/EBO.js";
import { Vector } from "../Engine/Utils/Vector.js";
import { VAO } from "../Engine/VAO.js";
import { VBO } from "../Engine/VBO.js";
import { LightNode, Main } from "../Main.js";
import { Block, directions } from "./Block.js";
import { SubChunk } from "./SubChunk.js";
import { Matrix } from "../Engine/Utils/Matrix.js";
import { Mesh } from "./Mesh.js";
import { World } from "./World.js";
import { randRange } from "../Engine/Utils/Math.js";
const gl = CanvaManager.gl;
export function flipDir(dir) {
    switch (dir) {
        case "POS_X": return "NEG_X";
        case "NEG_X": return "POS_X";
        case "POS_Z": return "NEG_Z";
        case "NEG_Z": return "POS_Z";
    }
}
export class Chunk {
    subchunks = new Array(16);
    heightmap = new Array(16);
    neighbours = {};
    allNeighbours = false;
    generated = true;
    generatingIndex = 0;
    sended = true;
    lazy = true;
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
    }
    preGenOne() {
        if (this.generatingIndex >= 16)
            return;
        this.subchunks[this.generatingIndex] = new SubChunk(new Vector(this.pos.x, this.generatingIndex, this.pos.z), this);
        this.subchunks[this.generatingIndex].preGenerate();
        this.generatingIndex++;
        if (this.generatingIndex >= 16) {
            this.generated = true;
        }
    }
    preGenSubchunks() {
        for (let i = 0; i < 16; i++) {
            this.subchunks[i] = new SubChunk(new Vector(this.pos.x, i, this.pos.z), this);
            this.subchunks[i].preGenerate();
        }
        this.generated = true;
    }
    postGenerate() {
        const x = randRange(0, 15) + (this.pos.x * 16);
        const z = randRange(0, 15) + (this.pos.z * 16);
        if (World.getHeight(x, z) < 150)
            World.generateTree(new Vector(x, World.getHeight(x, z), z));
    }
    updateNeighbour(neigbDir, chunk) {
        //console.log("what")
        //console.log(this.pos,neigbDir);
        if (chunk == undefined || this.allNeighbours)
            return;
        this.neighbours[neigbDir] = chunk;
        if (this.neighbours["NEG_X"] != undefined && this.neighbours["POS_X"] != undefined && this.neighbours["POS_Z"] != undefined && this.neighbours["NEG_Z"] != undefined) {
            console.log("gathered all neighbours :)");
            this.allNeighbours = true;
            this.updateAllSubchunks();
        }
    }
    sdNeighbour(neighbour, dir) {
        try {
            neighbour.updateNeighbour(dir, this);
            this.updateNeighbour(flipDir(dir), neighbour);
        }
        catch (error) { /* empty */ }
    }
    sendNeighbours() {
        if (this.allNeighbours || !this.generated)
            return;
        let neighbour = Main.getChunkAt(this.pos.x - 1, this.pos.z);
        this.sdNeighbour(neighbour, "POS_X");
        neighbour = Main.getChunkAt(this.pos.x + 1, this.pos.z);
        this.sdNeighbour(neighbour, "NEG_X");
        neighbour = Main.getChunkAt(this.pos.x, this.pos.z - 1);
        this.sdNeighbour(neighbour, "POS_Z");
        neighbour = Main.getChunkAt(this.pos.x, this.pos.z + 1);
        this.sdNeighbour(neighbour, "NEG_Z");
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
        if (this.allNeighbours) {
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
        const y = pos.y % 16;
        const yPos = Math.floor(pos.y / 16);
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
        const y = pos.y % 16;
        const yPos = Math.floor(Math.round(pos.y) / 16);
        if (this.subchunks[yPos] != undefined) {
            if (!(this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] = new Block(0);
            this.subchunks[yPos].blocks[pos.x][y][pos.z].skyLight = lightLevel;
        }
        else {
            //   console.log("Subchunk is undefined");
        }
    }
    updateAllSubchunks() {
        for (const sub of this.subchunks)
            Main.toUpdate.add(sub);
        // console.log("now not lazy hehehehe")
    }
    getSubchunk(y) {
        const yPos = Math.floor(Math.round(y) / 16);
        if (this.subchunks[yPos] != undefined)
            return this.subchunks[yPos];
    }
    updateSubchunkAt(y) {
        if (!this.allNeighbours)
            return;
        const yPos = Math.floor(Math.round(y) / 16);
        Main.toUpdate.add(this.subchunks[yPos]);
    }
    setBlock(pos, blockID) {
        if (pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x > 16 || pos.y > 256 || pos.z > 16) {
            throw new Error("Incorrect cordinates");
        }
        const y = pos.y % 16;
        const yPos = Math.floor(Math.round(pos.y) / 16);
        if (this.subchunks[yPos] != undefined) //&& this.subchunks[yPos].generated==true)
         {
            if (!(this.subchunks[yPos].blocks[pos.x][y][pos.z] instanceof Block))
                this.subchunks[yPos].blocks[pos.x][y][pos.z] = new Block(0);
            this.subchunks[yPos].blocks[pos.x][y][pos.z].id = blockID;
            const pushLight = (vec, lightsky, sub) => {
                lightsky ??= true;
                sub ??= this.subchunks[yPos];
                let maxIter = 100;
                if (sub.blocks[vec.x][vec.y][vec.z].lightDir != directions.UNDEF) {
                    let blockPos = new Vector(vec.x, vec.y, vec.z);
                    let k = sub.getBlockSub(blockPos);
                    while (k.block.lightDir != directions.SOURCE) {
                        blockPos = k.pos;
                        switch (k.block.lightDir) {
                            case directions.NEG_X:
                                blockPos.x--;
                                break;
                            case directions.POS_X:
                                blockPos.x++;
                                break;
                            case directions.NEG_Y:
                                blockPos.y--;
                                break;
                            case directions.POS_Y:
                                blockPos.y++;
                                break;
                            case directions.NEG_Z:
                                blockPos.z--;
                                break;
                            case directions.POS_Z:
                                blockPos.z++;
                                break;
                        }
                        if (maxIter-- < 0)
                            break;
                        k = k.sub.getBlockSub(blockPos);
                        //  console.log("stuck in while!!!",blockPos);
                    }
                    if (maxIter >= 0) {
                        // console.log("Found source!!!");
                        if (!(k.sub == this.subchunks[yPos] && k.pos.x == pos.x && k.pos.y == y && k.pos.z == pos.z))
                            Main.lightQueue.push(new LightNode(k.pos, k.sub, 15, directions.SOURCE, k.pos));
                        else
                            Main.lightRemQueue.push(new LightNode(k.pos, k.sub, 15, directions.UNDEF, k.pos));
                    }
                }
                //  let maxIter = 100
                if (lightsky && sub.blocks[vec.x][vec.y][vec.z].skyLightDir != directions.UNDEF) {
                    let blockPos = new Vector(vec.x, vec.y, vec.z);
                    let k = sub.getBlockSub(blockPos);
                    while (k.block.skyLightDir != directions.SOURCE) {
                        blockPos = k.pos;
                        switch (k.block.skyLightDir) {
                            case directions.NEG_X:
                                blockPos.x--;
                                break;
                            case directions.POS_X:
                                blockPos.x++;
                                break;
                            case directions.NEG_Y:
                                blockPos.y--;
                                break;
                            case directions.POS_Y:
                                blockPos.y++;
                                break;
                            case directions.NEG_Z:
                                blockPos.z--;
                                break;
                            case directions.POS_Z:
                                blockPos.z++;
                                break;
                        }
                        if (maxIter-- < 0)
                            break;
                        k = k.sub.getBlockSub(blockPos);
                        //  console.log("stuck in while!!!",blockPos);
                    }
                    if (maxIter >= 0) {
                        // console.log("Found skylight source!!!");
                        if (!(k.sub == this.subchunks[yPos] && k.pos.x == pos.x && k.pos.y == y && k.pos.z == pos.z))
                            Main.skyLightQueue.push(new LightNode(k.pos, k.sub, 15, directions.SOURCE, k.pos));
                        else
                            Main.skyLightRemQueue.push(new LightNode(k.pos, k.sub, 15, directions.UNDEF, k.pos));
                    }
                }
            };
            let checkSkyLight = true;
            const lightBlocks = [];
            if (blockID != 0) {
                this.subchunks[yPos].blocks[pos.x][y][pos.z].lightFBlock = 0;
                this.subchunks[yPos].blocks[pos.x][y][pos.z].skyLight = 0;
                if (pos.y > this.heightmap[pos.x][pos.z]) {
                    // Main.skyLightRemQueue.push(new LightNode(new Vector(pos.x,this.heightmap[pos.x][pos.z]%16,pos.z),this.subchunks[Math.floor(this.heightmap[pos.x][pos.z]/16)],15,directions.UNDEF,new Vector(0,0,0)))
                    while (this.heightmap[pos.x][pos.z] < pos.y) {
                        this.subchunks[Math.floor(this.heightmap[pos.x][pos.z] / 16)].blocks[pos.x][this.heightmap[pos.x][pos.z] % 16][pos.z].skyLightDir = directions.UNDEF;
                        this.subchunks[Math.floor(this.heightmap[pos.x][pos.z] / 16)].blocks[pos.x][this.heightmap[pos.x][pos.z] % 16][pos.z].skyLight = 0;
                        Main.skyLightRemQueue.push(new LightNode(new Vector(pos.x, this.heightmap[pos.x][pos.z] % 16, pos.z), this.subchunks[Math.floor(this.heightmap[pos.x][pos.z] / 16)], 15, directions.UNDEF, new Vector(0, 0, 0)));
                        // lightBlocks.push( this.subchunks[Math.floor(this.heightmap[pos.x][pos.z]/16)].getBlockSub(new Vector(pos.x+1,this.heightmap[pos.x][pos.z]%16,pos.z)));
                        //lightBlocks.push( this.subchunks[Math.floor(this.heightmap[pos.x][pos.z]/16)].getBlockSub(new Vector(pos.x-1,this.heightmap[pos.x][pos.z]%16,pos.z)));
                        //lightBlocks.push( this.subchunks[Math.floor(this.heightmap[pos.x][pos.z]/16)].getBlockSub(new Vector(pos.x,this.heightmap[pos.x][pos.z]%16,pos.z+1)));
                        //lightBlocks.push( this.subchunks[Math.floor(this.heightmap[pos.x][pos.z]/16)].getBlockSub(new Vector(pos.x,this.heightmap[pos.x][pos.z]%16,pos.z-1)));
                        this.heightmap[pos.x][pos.z]++;
                    }
                }
            }
            else {
                if (pos.y == this.heightmap[pos.x][pos.z]) {
                    while (this.subchunks[Math.floor(this.heightmap[pos.x][pos.z] / 16)].blocks[pos.x][this.heightmap[pos.x][pos.z] % 16][pos.z].id == 0) {
                        //     this.subchunks[Math.floor(this.heightmap[pos.x][pos.z]/16)].blocks[pos.x][this.heightmap[pos.x][pos.z]%16][pos.z].skyLightDir=directions.SOURCE;
                        //   this.subchunks[Math.floor(this.heightmap[pos.x][pos.z]/16)].blocks[pos.x][this.heightmap[pos.x][pos.z]%16][pos.z].skyLight=15;
                        Main.skyLightQueue.push(new LightNode(new Vector(pos.x, this.heightmap[pos.x][pos.z] % 16, pos.z), this.subchunks[Math.floor(this.heightmap[pos.x][pos.z] / 16)], 15, directions.SOURCE));
                        this.heightmap[pos.x][pos.z]--;
                    }
                    checkSkyLight = false;
                    this.heightmap[pos.x][pos.z]--;
                }
            }
            for (const k of lightBlocks)
                pushLight(k.pos, true, k.sub);
            pushLight(new Vector(pos.x, y, pos.z), checkSkyLight);
            if (pos.x > 0)
                pushLight(new Vector(pos.x - 1, y, pos.z), checkSkyLight);
            if (pos.x < 15)
                pushLight(new Vector(pos.x + 1, y, pos.z), checkSkyLight);
            if (y > 0)
                pushLight(new Vector(pos.x, y - 1, pos.z), checkSkyLight);
            if (y < 15)
                pushLight(new Vector(pos.x, y + 1, pos.z), checkSkyLight);
            if (pos.z > 0)
                pushLight(new Vector(pos.x, y, pos.z - 1), checkSkyLight);
            if (pos.z < 15)
                pushLight(new Vector(pos.x, y, pos.z + 1), checkSkyLight);
            if (blockID == 10) {
                Main.lightQueue.push(new LightNode(new Vector(pos.x, y, pos.z), this.subchunks[yPos], 15, directions.SOURCE, new Vector(pos.x, y, pos.z)));
            }
            this.updateSubchunkAt(pos.y);
            try {
                // console.log("executing block update part")
                if (pos.x == 0) {
                    Main.toUpdate.add(this.neighbours["NEG_X"].subchunks[yPos]);
                    pushLight(new Vector(15, y, pos.z), checkSkyLight, this.neighbours["NEG_X"].subchunks[yPos]);
                }
                else if (pos.x == 15) {
                    Main.toUpdate.add(this.neighbours["POS_X"].subchunks[yPos]);
                    pushLight(new Vector(0, y, pos.z), checkSkyLight, this.neighbours["POS_X"].subchunks[yPos]);
                }
                if (y == 0) {
                    Main.toUpdate.add(this.subchunks[yPos - 1]);
                    pushLight(new Vector(pos.x, 15, pos.z), checkSkyLight, this.subchunks[yPos - 1]);
                }
                else if (y == 15) {
                    Main.toUpdate.add(this.subchunks[yPos + 1]);
                    pushLight(new Vector(pos.x, 0, pos.z), checkSkyLight, this.subchunks[yPos + 1]);
                }
                if (pos.z == 0) {
                    Main.toUpdate.add(this.neighbours["NEG_Z"].subchunks[yPos]);
                    pushLight(new Vector(pos.x, y, 15), checkSkyLight, this.neighbours["NEG_Z"].subchunks[yPos]);
                }
                else if (pos.z == 15) {
                    Main.toUpdate.add(this.neighbours["POS_Z"].subchunks[yPos]);
                    pushLight(new Vector(pos.x, y, 0), checkSkyLight, this.neighbours["POS_Z"].subchunks[yPos]);
                }
            }
            catch (error) {
                console.log(error);
            }
        }
        else {
            console.log("Subchunk is undefined");
        }
    }
}