
class DepthCubemap{
    private _canvases: HTMLCanvasElement[];
    public IsReady(): boolean{
        return this._readyCounter === 6;
    }
    private _readyCounter: number;
    private _id: string;

    constructor() {
        this._readyCounter = 0;
    }

    setupCube(cubeImageSources: string[], id: string) {
        if (this._id === id) return;
        this._id = id;

        this._readyCounter = 0;
        const add1ToReadyCounter = ()=>{
            this._readyCounter++;
        }
        this._canvases = cubeImageSources.map(function (src){
            const img = document.createElement('img');
            const canvas = document.createElement('canvas');
            img.onload = function(){
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
                add1ToReadyCounter();
            };
            img.src = src;
            return canvas;
        });
    }

    private _getDistanceFromCanvas(faceIndex: number, xFactor: number, yFactor: number){
        const canvas = this._canvases[faceIndex];
        const x = xFactor * canvas.width;
        const y = yFactor * canvas.height;
        const data = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
        const view = new DataView(new ArrayBuffer(4));
        data.reverse().forEach(function (b, i) {
            view.setUint8(i, b);
        });
        return view.getFloat32(0);
    }

    getDistance(direction: Vector3){
        if (!this.IsReady()) return null;
        const {x, y, faceIndex} = this._computeCanvasParameters(direction);
        return  this._getDistanceFromCanvas(faceIndex, x, y);
    }

    computeCoordinate(viewPosition: Vector3, direction: Vector3, distance: number|undefined): Vector3|null {
        if (!this.IsReady()) return null;
        if (!distance) {
            distance = this.getDistance(direction);
        }
        return direction.clone().normalize().multiplyScalar(distance).add(viewPosition);
    }

    private _computeCanvasParameters(v: Vector3){
        v.normalize();
        let faceIndex;
        const vAbs: Vector3 = v.clone().absolute();
        let ma: number;
        let uv: Vector2;
        if(vAbs.z >= vAbs.x && vAbs.z >= vAbs.y)
        {
            faceIndex = v.z < 0.0 ? 3 : 2;
            ma = 0.5 / vAbs.z;
            uv = new Vector2(v.z < 0.0 ? -v.x : v.x, v.z < 0.0 ? -v.y : v.y); // for fi==2 y+- ; for 3 ???
        }
        else if(vAbs.y >= vAbs.x)
        {
            faceIndex = v.y < 0.0 ? 5 : 4;
            ma = 0.5 / vAbs.y;
            uv = new Vector2(v.y < 0.0 ? -v.x : v.x, -v.z); // for fi==5 x+- ; for fi==4 y+-
        }
        else
        {
            faceIndex = v.x < 0.0 ? 1 : 0;
            ma = 0.5 / vAbs.x;
            uv = new Vector2(-v.z, v.x < 0.0 ? v.y : -v.y); // for fi==1 x+- & y+-
        }
        uv = uv.multiplyScalar(ma).addScalar(0.5);

        return {x: uv.x, y: uv.y, faceIndex};
    }
}
class Vector3{
    x: number;
    y: number;
    z: number;
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z)
    }
    absolute(): Vector3 {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        this.z = Math.abs(this.z);
        return this;
    }
    normalize(): Vector3 {
        throw '';
        return this;
    }
    multiplyScalar(scalar: number): Vector3 {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }
    add(otherVector: Vector3): Vector3 {
        this.x += otherVector.x;
        this.y += otherVector.y;
        this.z += otherVector.z;
        return this;
    }
}
class Vector2{
    x: number;
    y: number;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    multiplyScalar(scalar: number): Vector2 {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    addScalar(scalar: number): Vector2 {
        this.x += scalar;
        this.y += scalar;
        return this;
    }
}
/*THREE.Vector3.prototype.absolute = function () {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    this.z = Math.abs(this.z);
    return this;
}//*/
