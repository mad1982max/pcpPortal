var DepthCubemap = /** @class */ (function () {
    function DepthCubemap(cubeImageSources) {
        this.canvases = cubeImageSources.map(function (src) {
            var img = document.createElement('img');
            var canvas = document.createElement('canvas');
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
            };
            img.src = src;
            return canvas;
        });
    }
    DepthCubemap.prototype.getDistanceFromCanvas = function (faceIndex, xFactor, yFactor) {
        var canvas = this.canvases[faceIndex];
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
        var _a = this.computeCanvasParameters(direction), x = _a.x, y = _a.y, faceIndex = _a.faceIndex;
        return this.getDistanceFromCanvas(faceIndex, x, y);
    };
    DepthCubemap.prototype.computeCoordinate = function (viewPosition, direction, distance) {
        if (!distance) {
            distance = this.getDistance(direction);
        }
        return direction.clone().normalize().multiplyScalar(distance).add(viewPosition);
    };
    DepthCubemap.prototype.computeCanvasParameters = function (v) {
        v.normalize();
        var faceIndex = 0;
        var vAbs = v.clone().absolute();
        var ma;
        var uv;
        if (vAbs.z >= vAbs.x && vAbs.z >= vAbs.y) {
            faceIndex = v.z < 0.0 ? 5 : 4;
            ma = 0.5 / vAbs.z;
            uv = new THREE.Vector2(v.z < 0.0 ? -v.x : v.x, -v.y);
        }
        else if (vAbs.y >= vAbs.x) {
            faceIndex = v.y < 0.0 ? 3 : 2;
            ma = 0.5 / vAbs.y;
            uv = new THREE.Vector2(v.x, v.y < 0.0 ? -v.z : v.z);
        }
        else {
            faceIndex = v.x < 0.0 ? 1 : 0;
            ma = 0.5 / vAbs.x;
            uv = new THREE.Vector2(v.x < 0.0 ? v.z : -v.z, -v.y);
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
