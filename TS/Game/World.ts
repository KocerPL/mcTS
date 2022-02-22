import { Chunk } from "./Chunk.js";
export class World
{
    private Chunks:Array<Array<Chunk>> = new Array();
    public static heightMap:Array<Array<number>> = new Array(256);

    public static init()
    {
        this.genHeightMap();
    }
    public static genHeightMap()
    {
        let smooth1=Math.round(Math.random())+1;
        let smooth2=Math.round(Math.random())+1;
        let smooth3=Math.round(Math.random())+1;
        let smooth4=Math.round(Math.random())+1;
        for(let x=0; x<256;x++)
        {
           
            this.heightMap[x] = new Array();
            for(let z=0;z<256;z++)
            {
                if(x%16==0)
                smooth2=Math.round(Math.random())+1;
                if(x%8==0)
                smooth3=Math.round(Math.random())+1;
                if(x%4==0)
                smooth4=Math.round(Math.random())+1;
                this.heightMap[x][z] =smooth1*32 + smooth2*16 + smooth3*8+smooth4*4 + Math.round(Math.random()*2);
            }
        }
    }
    public static getHeight(x,z)
    {
        try
        {
        return this.heightMap[x][z];
        }
        catch(error)
        {}
        return 0;
    }
    public getBlock()
    {

    }
}