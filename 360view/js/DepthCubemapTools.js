var DepthCubemap = /** @class */ (function () {
    function DepthCubemap() {
        this._readyCounter = 0;
    }
    DepthCubemap.prototype.IsReady = function () {
        return this._readyCounter === 6;
    };
    DepthCubemap.prototype.setupCube = function (cubeImageSources, id) {
        var _this = this;
        if (this._id === id)
            return;
        this._id = id;
        this._readyCounter = 0;
        var add1ToReadyCounter = function () {
            _this._readyCounter++;
        };
        this._canvases = cubeImageSources.map(function (src) {
            var img = document.createElement('img');
            var canvas = document.createElement('canvas');
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
                add1ToReadyCounter();
            };
            img.src = src;
            return canvas;
        });
    };
    DepthCubemap.prototype._getDistanceFromCanvas = function (faceIndex, xFactor, yFactor) {
        var canvas = this._canvases[faceIndex];
        var x = xFactor * canvas.width;
        var y = yFactor * canvas.height;
        var data = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
        var view = new DataView(new ArrayBuffer(4));
        data.reverse().forEach(function (b, i) {
            view.setUint8(i, b);
        });
        return view.getFloat32(0);
    };
    DepthCubemap.prototype.getDistance = function (direction) {
        if (!this.IsReady())
            return null;
        var _a = this._computeCanvasParameters(direction), x = _a.x, y = _a.y, faceIndex = _a.faceIndex;
        //console.log(faceIndex);
        //if( faceIndex == 1)
        console.log({ x: (_a.x * 4096).toFixed(0), y: (_a.y * 4096).toFixed(0), faceIndex: faceIndex });
        return this._getDistanceFromCanvas(faceIndex, x, y);
    };
    DepthCubemap.prototype.computeCoordinate = function (viewPosition, direction, distance) {
        if (!this.IsReady())
            return null;
        if (!distance) {
            distance = this.getDistance(direction);
        }
        return direction.clone().normalize().multiplyScalar(distance).add(viewPosition);
    };
    DepthCubemap.prototype._computeCanvasParameters = function (v) {
        v.normalize();
        var faceIndex;
        var vAbs = v.clone().absolute();
        var ma;
        var uv;
        if (vAbs.z >= vAbs.x && vAbs.z >= vAbs.y) {
            faceIndex = v.z < 0.0 ? 3 : 2;
            ma = 0.5 / vAbs.z;
            uv = new THREE.Vector2(v.z < 0.0 ? -v.x : v.x, v.z < 0.0 ? -v.y : v.y);
        }
        else if (vAbs.y >= vAbs.x) {
            faceIndex = v.y < 0.0 ? 5 : 4;
            ma = 0.5 / vAbs.y;
            uv = new THREE.Vector2(v.y < 0.0 ? -v.x : v.x, -v.z);
        }
        else {
            faceIndex = v.x < 0.0 ? 1 : 0;
            ma = 0.5 / vAbs.x;
            uv = new THREE.Vector2(-v.z, v.x < 0.0 ? v.y : -v.y);
        }
        uv = uv.multiplyScalar(ma).addScalar(0.5);
        return { x: uv.x, y: uv.y, faceIndex: faceIndex };
    };
    return DepthCubemap;
}());
THREE.Vector3.prototype.absolute = function () {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    this.z = Math.abs(this.z);
    return this;
}
