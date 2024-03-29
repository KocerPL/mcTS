import { Vector } from "./Vector";

export class Matrix4
{
    private _data: number[] = [];
    private constructor()
    {
        this._data = [
            1.0, 0, 0, 0,
            0, 1.0, 0, 0,
            0, 0, 1.0, 0,
            0, 0, 0, 1.0
        ];
        // console.log(args);
    }
    static identity()
    {
        return new Matrix4();
    }
    static projection(fov:number,nearPlane:number,farPlane:number,aspectRatio:number)
    {
        const mat = new Matrix4();
        // (h/w)*1/tan(fov/2)   0            0          0
        // 0                    1/tan(fov/2) 0          0
        // 0                    0            zf/(zf-zn) (zf/(zf-zn))*zn
        // 0                    0            1          0
        const fovRel = 1/Math.tan((fov/2)*(Math.PI/180));
        //console.log(fovRel);
        //console.log(aspectRatio);
        this.clearMat(mat);
        //console.log(aspectRatio*fovRel);
        mat._data[0] = aspectRatio*fovRel;
        mat._data[5] = fovRel;
        mat._data[10] = (farPlane/(farPlane-nearPlane));
        mat._data[11]=   -((farPlane)/(farPlane-nearPlane))*nearPlane;
        mat._data[14]=1;
        return mat;
    }
    static clearMat(mat:Matrix4)
    {
        for(let i=0;i<mat._data.length;i++)
        {
            mat._data[i]=0;
        }
    }
    static invert(m)
    {
        const inv=[];
        let det;
        let i;

        inv[0] = m._data[5]  * m._data[10] * m._data[15] - 
             m._data[5]  * m._data[11] * m._data[14] - 
             m._data[9]  * m._data[6]  * m._data[15] + 
             m._data[9]  * m._data[7]  * m._data[14] +
             m._data[13] * m._data[6]  * m._data[11] - 
             m._data[13] * m._data[7]  * m._data[10];

        inv[4] = -m._data[4]  * m._data[10] * m._data[15] + 
              m._data[4]  * m._data[11] * m._data[14] + 
              m._data[8]  * m._data[6]  * m._data[15] - 
              m._data[8]  * m._data[7]  * m._data[14] - 
              m._data[12] * m._data[6]  * m._data[11] + 
              m._data[12] * m._data[7]  * m._data[10];

        inv[8] = m._data[4]  * m._data[9] * m._data[15] - 
             m._data[4]  * m._data[11] * m._data[13] - 
             m._data[8]  * m._data[5] * m._data[15] + 
             m._data[8]  * m._data[7] * m._data[13] + 
             m._data[12] * m._data[5] * m._data[11] - 
             m._data[12] * m._data[7] * m._data[9];

        inv[12] = -m._data[4]  * m._data[9] * m._data[14] + 
               m._data[4]  * m._data[10] * m._data[13] +
               m._data[8]  * m._data[5] * m._data[14] - 
               m._data[8]  * m._data[6] * m._data[13] - 
               m._data[12] * m._data[5] * m._data[10] + 
               m._data[12] * m._data[6] * m._data[9];

        inv[1] = -m._data[1]  * m._data[10] * m._data[15] + 
              m._data[1]  * m._data[11] * m._data[14] + 
              m._data[9]  * m._data[2] * m._data[15] - 
              m._data[9]  * m._data[3] * m._data[14] - 
              m._data[13] * m._data[2] * m._data[11] + 
              m._data[13] * m._data[3] * m._data[10];

        inv[5] = m._data[0]  * m._data[10] * m._data[15] - 
             m._data[0]  * m._data[11] * m._data[14] - 
             m._data[8]  * m._data[2] * m._data[15] + 
             m._data[8]  * m._data[3] * m._data[14] + 
             m._data[12] * m._data[2] * m._data[11] - 
             m._data[12] * m._data[3] * m._data[10];

        inv[9] = -m._data[0]  * m._data[9] * m._data[15] + 
              m._data[0]  * m._data[11] * m._data[13] + 
              m._data[8]  * m._data[1] * m._data[15] - 
              m._data[8]  * m._data[3] * m._data[13] - 
              m._data[12] * m._data[1] * m._data[11] + 
              m._data[12] * m._data[3] * m._data[9];

        inv[13] = m._data[0]  * m._data[9] * m._data[14] - 
              m._data[0]  * m._data[10] * m._data[13] - 
              m._data[8]  * m._data[1] * m._data[14] + 
              m._data[8]  * m._data[2] * m._data[13] + 
              m._data[12] * m._data[1] * m._data[10] - 
              m._data[12] * m._data[2] * m._data[9];

        inv[2] = m._data[1]  * m._data[6] * m._data[15] - 
             m._data[1]  * m._data[7] * m._data[14] - 
             m._data[5]  * m._data[2] * m._data[15] + 
             m._data[5]  * m._data[3] * m._data[14] + 
             m._data[13] * m._data[2] * m._data[7] - 
             m._data[13] * m._data[3] * m._data[6];

        inv[6] = -m._data[0]  * m._data[6] * m._data[15] + 
              m._data[0]  * m._data[7] * m._data[14] + 
              m._data[4]  * m._data[2] * m._data[15] - 
              m._data[4]  * m._data[3] * m._data[14] - 
              m._data[12] * m._data[2] * m._data[7] + 
              m._data[12] * m._data[3] * m._data[6];

        inv[10] = m._data[0]  * m._data[5] * m._data[15] - 
              m._data[0]  * m._data[7] * m._data[13] - 
              m._data[4]  * m._data[1] * m._data[15] + 
              m._data[4]  * m._data[3] * m._data[13] + 
              m._data[12] * m._data[1] * m._data[7] - 
              m._data[12] * m._data[3] * m._data[5];

        inv[14] = -m._data[0]  * m._data[5] * m._data[14] + 
               m._data[0]  * m._data[6] * m._data[13] + 
               m._data[4]  * m._data[1] * m._data[14] - 
               m._data[4]  * m._data[2] * m._data[13] - 
               m._data[12] * m._data[1] * m._data[6] + 
               m._data[12] * m._data[2] * m._data[5];

        inv[3] = -m._data[1] * m._data[6] * m._data[11] + 
              m._data[1] * m._data[7] * m._data[10] + 
              m._data[5] * m._data[2] * m._data[11] - 
              m._data[5] * m._data[3] * m._data[10] - 
              m._data[9] * m._data[2] * m._data[7] + 
              m._data[9] * m._data[3] * m._data[6];

        inv[7] = m._data[0] * m._data[6] * m._data[11] - 
             m._data[0] * m._data[7] * m._data[10] - 
             m._data[4] * m._data[2] * m._data[11] + 
             m._data[4] * m._data[3] * m._data[10] + 
             m._data[8] * m._data[2] * m._data[7] - 
             m._data[8] * m._data[3] * m._data[6];

        inv[11] = -m._data[0] * m._data[5] * m._data[11] + 
               m._data[0] * m._data[7] * m._data[9] + 
               m._data[4] * m._data[1] * m._data[11] - 
               m._data[4] * m._data[3] * m._data[9] - 
               m._data[8] * m._data[1] * m._data[7] + 
               m._data[8] * m._data[3] * m._data[5];

        inv[15] = m._data[0] * m._data[5] * m._data[10] - 
              m._data[0] * m._data[6] * m._data[9] - 
              m._data[4] * m._data[1] * m._data[10] + 
              m._data[4] * m._data[2] * m._data[9] + 
              m._data[8] * m._data[1] * m._data[6] - 
              m._data[8] * m._data[2] * m._data[5];

        det = m._data[0] * inv[0] + m._data[1] * inv[4] + m._data[2] * inv[8] + m._data[3] * inv[12];

        if (det == 0)
            return false;

        det = 1.0 / det;
        const invOut = [];
        for (i = 0; i < 16; i++)
            invOut[i] = inv[i] * det;
        const outMat  = new Matrix4();
        outMat._data= invOut;
        return outMat;

    }
    //TODO: vectors
    public static view(x:number,y:number,z:number,pitch:number,yaw:number)
    {
        const rPitch = pitch*(Math.PI/180);
        const rYaw = yaw*(Math.PI/180);
        const cosYaw = Math.cos(rYaw);
        const sinYaw = Math.sin(rYaw);
        const cosPitch = Math.cos(rPitch);
        const sinPitch = Math.sin(rPitch);
        const mat = Matrix4.identity();
        mat._data = 
     [
         -sinYaw,cosYaw,0,(x*sinYaw)-(y*cosYaw),
         -sinPitch,-sinPitch*sinYaw,cosPitch,(sinPitch*((x*cosYaw)+(y*sinYaw)))-(z*cosPitch),
         -cosPitch*cosYaw,-cosPitch*sinYaw,-sinPitch,(cosPitch*((x*cosYaw)+(y*sinYaw)))+(z*sinPitch),
         0,0,0,1
     ];
        //console.log(mat);
        return Matrix4.invert(mat);
    }
    static viewFPS(eye:Vector,yaw:number,pitch:number)
    {
    //view2
        let view2 = new Matrix4();
        view2= view2.rotateX(pitch);
        view2 =view2.rotateY(yaw);
        view2 =view2.translate(-eye.x,-eye.y,-eye.z);
        return view2;

    }
    scale(x,y,z)
    {
        const scale = new Matrix4;
        scale._data =[x,0,0,0,
            0,y,0,0
            ,0,0,z,0,
            0,0,0,1];
        return Matrix4.mult(this,scale);
    }
    static hackyInverse(mat) // works only for rotation and translation!!
    {
        const copyTransp = this.transpose(mat);
        copyTransp[12] = mat[12];
        copyTransp[13] = mat[13];
        copyTransp[14] = mat[14];
        copyTransp[15] = mat[15];
        copyTransp[3] = -mat[3];
        copyTransp[7] = -mat[7];
        copyTransp[11] = -mat[11];
        return copyTransp;
    }
    static getDeterminant(mat)
    {
    //crosses!
        const leftdown = (mat[0]*mat[5]*mat[10]*mat[15])+(mat[1]*mat[6]*mat[11]*mat[12])+(mat[2]*mat[7]*mat[8]*mat[13])+(mat[1]*mat[4]*mat[9]*mat[14]);
        const rightdown = (mat[3]*mat[6]*mat[9]*mat[12])+(mat[0]*mat[7]*mat[10]*mat[13])+(mat[1]*mat[4]*mat[11]*mat[14])+(mat[2]*mat[5]*mat[8]*mat[15]);
        return leftdown-rightdown ;
    }
    translate(x,y,z)
    {
        const transl = new Matrix4();
        transl._data[3] = x;
        transl._data[7]=y;
        transl._data[11] = z;
        return Matrix4.mult(this,transl);
    }
    rotateX(degrees)
    {
        const radians = degrees*(Math.PI/180);
        const rotMatrix = new Matrix4();
        rotMatrix._data[5]= Math.cos(radians);
        rotMatrix._data[6]=-Math.sin(radians);
        rotMatrix._data[9]= Math.sin(radians);
        rotMatrix._data[10]=Math.cos(radians);
        return Matrix4.mult(this,rotMatrix);
    }
    rotateY(degrees)
    {
        const radians = degrees*(Math.PI/180);
        const rotMatrix = new Matrix4();
        rotMatrix._data[0]= Math.cos(radians);
        rotMatrix._data[2]=-Math.sin(radians);
        rotMatrix._data[8]= Math.sin(radians);
        rotMatrix._data[10]=Math.cos(radians);
  
        return Matrix4.mult(this,rotMatrix);
    }
    rotateZ(degrees)
    {
        const radians = degrees*(Math.PI/180);
        const rotMatrix = new Matrix4();
        rotMatrix._data[0]= Math.cos(radians);
        rotMatrix._data[1]=-Math.sin(radians);
        rotMatrix._data[4]= Math.sin(radians);
        rotMatrix._data[5]=Math.cos(radians);
        return Matrix4.mult(this,rotMatrix);
    }
    static rotateX(mat:Matrix4,degrees:number)
    {
        const radians = degrees*(Math.PI/180);
        const rotMatrix = new Matrix4();
        rotMatrix._data[5]= Math.cos(radians);
        rotMatrix._data[6]=-Math.sin(radians);
        rotMatrix._data[9]= Math.sin(radians);
        rotMatrix._data[10]=Math.cos(radians);
        return Matrix4.mult(mat,rotMatrix);
    }
    static rotateY(mat:Matrix4,degrees)
    {
        const radians = degrees*(Math.PI/180);
        const rotMatrix = new Matrix4();
        rotMatrix._data[0]= Math.cos(radians);
        rotMatrix._data[2]=-Math.sin(radians);
        rotMatrix._data[8]= Math.sin(radians);
        rotMatrix._data[10]=Math.cos(radians);
        return this.mult(mat,rotMatrix);
    }
    static rotateZ(mat:Matrix4,degrees)
    {
        const radians = degrees*(Math.PI/180);
        const rotMatrix = new Matrix4();
        rotMatrix[0]._data= Math.cos(radians);
        rotMatrix[1]._data=-Math.sin(radians);
        rotMatrix[4]._data= Math.sin(radians);
        rotMatrix[5]._data=Math.cos(radians);
        return this.mult(mat,rotMatrix);
    }
    static mult(mat1:Matrix4,mat2:Matrix4)
    {
        const multiplied = new Matrix4();
        for(let i=0;i<4;i++)
        {
            multiplied._data[i] = (mat1._data[0]*mat2._data[i])+(mat1._data[1]*mat2._data[4+i])+(mat1._data[2]*mat2._data[8+i])+(mat1._data[3]*mat2._data[12+i]);
            multiplied._data[i+4] = (mat1._data[4]*mat2._data[i])+(mat1._data[5]*mat2._data[4+i])+(mat1._data[6]*mat2._data[8+i])+(mat1._data[7]*mat2._data[12+i]);
            multiplied._data[i+8] = (mat1._data[8]*mat2._data[i])+(mat1._data[9]*mat2._data[4+i])+(mat1._data[10]*mat2._data[8+i])+(mat1._data[11]*mat2._data[12+i]);
            multiplied._data[i+12] =(mat1._data[12]*mat2._data[i])+(mat1._data[13]*mat2._data[4+i])+(mat1._data[14]*mat2._data[8+i])+(mat1._data[15]*mat2._data[12+i]);
        }
        return multiplied;
    }
    static transpose(mat:Matrix4)
    {
        const transp= new Matrix4();
        transp._data[0] = mat._data[0];
        transp._data[1]= mat._data[4];
        transp._data[2] = mat._data[8];
        transp._data[3]= mat._data[12];
        transp._data[4] = mat._data[2];
        transp._data[5] = mat._data[5];
        transp._data[6] = mat._data[9];
        transp._data[7]=mat._data[13];
        transp._data[8]= mat._data[2];
        transp._data[9]=mat._data[6];
        transp._data[10] = mat._data[10];
        transp._data[11] =mat._data[14];
        transp._data[12] = mat._data[3];
        transp._data[13]= mat._data[7];
        transp._data[14] = mat._data[11];
        transp._data[15] = mat._data[15];
        return transp;
    }
    public toFloat32Array(): Float32Array {
        return new Float32Array( this._data );
    }
}