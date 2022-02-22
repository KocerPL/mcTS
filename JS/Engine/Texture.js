import { Loader } from "./Loader.js";
export class Texture {
    static SIZE = (1024 / 16);
    static blocksGrid = Loader.image("/JS/Engine/Textures/Blocks.png");
    static crossHair = Loader.image("/JS/Engine/Textures/crosshair.png");
    x;
    y;
    dx;
    dy;
    constructor(x, y) {
        this.x = 1 / (Texture.SIZE * x);
        this.y = 1 / (Texture.SIZE * y);
        this.dx = 1 / ((Texture.SIZE * x) + Texture.SIZE);
        this.dy = 1 / ((Texture.SIZE * y) + Texture.SIZE);
    }
}
