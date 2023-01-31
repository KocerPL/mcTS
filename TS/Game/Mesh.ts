import {Vector} from "../Engine/Utils/Vector.js"
export class Mesh
{
    vertices:Array<number>=[];
    indices:Array<number>=[];
    tCoords:Array<number>=[];
    lightLevels:Array<number>=[];
    fb:Array<number> =[];
    count:number;
    constructor()
    {
        this.reset();
    }

    public add(mesh:Mesh)
    {
        this.vertices= this.vertices.concat(mesh.vertices);
        this.indices= this.indices.concat(mesh.indices);
        this.tCoords= this.tCoords.concat(mesh.tCoords);
        this.lightLevels= this.lightLevels.concat(mesh.lightLevels);
        this.fb= this.fb.concat(mesh.fb);
        this.count = this.indices.length;
        
    }
    public reset()
    {
        this.vertices = new Array();
        this.indices = new Array();
        this.tCoords = new Array();
        this.fb = new Array();
        this.lightLevels = new Array();
        this.count = 0;
    }
    
}