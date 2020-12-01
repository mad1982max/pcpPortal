
function GeneralPointConfig(pointCloudRootPath, arrayOfPointProfiles, pointCloudPath, cubeSidesPaths, cubeTexturesPath, depthSidesNames, pathToDepthTextures) {
    Validator.validateString(pointCloudRootPath);
    Validator.validateArray(arrayOfPointProfiles, function(item){Validator.validateInstance(item, PointProfile);});
    Validator.validateString(pointCloudPath);
    Validator.validateArray(cubeSidesPaths, Validator.validateString);
    Validator.validateString(cubeTexturesPath)
    Validator.validateArray(depthSidesNames, Validator.validateString);
    Validator.validateString(pathToDepthTextures)

    this.pointCloudRootPath = pointCloudRootPath;
    this.pointProfiles = arrayOfPointProfiles;
    this.pointCloudPath = pointCloudPath;
    this.cubeSidesPaths = cubeSidesPaths;
    this.cubeTexturesPath = cubeTexturesPath;
    this.depthSidesNames = depthSidesNames;
    this.pathToDepthTextures = pathToDepthTextures;
}
function PointProfile(generalPointConfig, name, position, euler360rotation) {
    Validator.validateInstance(generalPointConfig, GeneralPointConfig);
    Validator.validateString(name);
    Validator.validateInstance(position, THREE.Vector3);
    Validator.validateInstance(euler360rotation, THREE.Euler);

    this.name = name;
    this.position = position;
    this.rotation = euler360rotation;

    euler360rotation.setFromVector3(euler360rotation.toVector3().multiplyScalar(Math.PI).divideScalar(180));

    let fullRootPath = function () {
        return generalPointConfig.pointCloudRootPath + '/' + name;
    }

    this.fullPathToPointCloud = function() {
        return fullRootPath() + '/' + generalPointConfig.pointCloudPath;
    }

    this.fullPathToCubeSides = function (lod) {
        Validator.validateString(lod);
        const partialPath = fullRootPath() + '/' + generalPointConfig.cubeTexturesPath + '/' + lod + '/';
        return generalPointConfig.cubeSidesPaths.map(function (localPath) {
            return partialPath + localPath;
        });
    }

    this.fullPathToDepthCubeImages = function () {
        const partialPath = fullRootPath() + '/' + generalPointConfig.pathToDepthTextures + '/';
        return generalPointConfig.depthSidesNames.map(function (depthSideName) {
            return partialPath + depthSideName;
        })
    }

    this.belongsToLayer = function (layerInfo) {
        if (layerInfo.layer === '?' && layerInfo.sub === '?') return true;
        const actualLayerInfo = this.getLayerInfo();
        return actualLayerInfo.layer === layerInfo.layer && actualLayerInfo.sub === layerInfo.sub;
    }

    this.getLayerInfo = function () {
        const z = this.position.z;

        if (z < 27) {
            return { layer: 'level_22.8', sub: '_' };
        }
        if (z < 35) {
            return { layer: 'level_27.8', sub: z < 32.7 ? 'sub_0' : 'sub_1' };
        }
        if (z < 45) {
            return { layer: 'level_37.8', sub: '_' };
        }
        if (z < 57) {
            return { layer: 'level_47.8', sub: z < 52.7 ? 'sub_0' : 'sub_1' };
        }
        return { layer: 'level_58.0', sub: z < 60 ? 'sub_0' : 'sub_1' };
    }
}
