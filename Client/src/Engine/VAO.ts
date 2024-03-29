import { CanvaManager } from "./CanvaManager.js";
const gl = CanvaManager.gl;
export class VAO
{
    private ID:WebGLVertexArrayObject;
    constructor()
    {
        this.ID =gl.createVertexArray();
        this.bind();
    }
    public addPtr(location:number,length:number,stride:number,offset:number,type?):void
    {
        gl.vertexAttribPointer(location,length,type??gl.FLOAT,false,stride,offset);
        gl.enableVertexAttribArray(location);
    }
    public bind():void
    {
        gl.bindVertexArray(this.ID);
    }
    public static unbind():void
    {
        gl.bindVertexArray(null);
    }
}