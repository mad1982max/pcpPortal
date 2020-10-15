
class DepthCubemap{
    private canvases: HTMLCanvasElement[];

    constructor(cubeImageSources: string[]) {
        this.canvases = cubeImageSources.map(function (src){
            const img = document.createElement('img');
            const canvas = document.createElement('canvas');
            img.onload = function(){
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
            };
            img.src = src;
            return canvas;
        });
    }

    getDistanceFromCanvas(faceIndex: number, xFactor: number, yFactor: number){
        const canvas = this.canvases[faceIndex];
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
        const {x, y, faceIndex} = this.computeCanvasParameters(direction);
        return  this.getDistanceFromCanvas(faceIndex, x, y);
    }

    computeCoordinate(viewPosition: Vector3, direction: Vector3, distance: number|undefined): Vector3{
        if (!distance) {
            distance = this.getDistance(direction);
        }
        return direction.clone().normalize().multiplyScalar(distance).add(viewPosition);
    }

    computeCanvasParameters(v: Vector3){
        v.normalize();
        let faceIndex = 0;
        const vAbs: Vector3 = v.clone().absolute();
        let ma: number;
        let uv: Vector2;
        if(vAbs.z >= vAbs.x && vAbs.z >= vAbs.y)
        {
            faceIndex = v.z < 0.0 ? 5 : 4;
            ma = 0.5 / vAbs.z;
            uv = new Vector2(v.z < 0.0 ? -v.x : v.x, -v.y);
        }
        else if(vAbs.y >= vAbs.x)
        {
            faceIndex = v.y < 0.0 ? 3 : 2;
            ma = 0.5 / vAbs.y;
            uv = new Vector2(v.x, v.y < 0.0 ? -v.z : v.z);
        }
        else
        {
            faceIndex = v.x < 0.0 ? 1 : 0;
            ma = 0.5 / vAbs.x;
            uv = new Vector2(v.x < 0.0 ? v.z : -v.z, -v.y);
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
