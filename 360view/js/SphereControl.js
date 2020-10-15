Potree.OrbitControls = class OrbitControls extends THREE.EventDispatcher{

    constructor(viewer){
        super()

        this.viewer = viewer;
        this.renderer = viewer.renderer;

        this.scene = null;
        this.sceneControls = new THREE.Scene();

        this.rotationSpeed = 5;

        this.fadeFactor = 30;

        this.rotationUpdateDelta = {yawDelta: 0, pitchDelta: 0};

        this.fov = viewer.fov;

        let dragEventEnabled = true;

        let calculateRotation = (panVector) => {
            const height = this.renderer.domElement.clientHeight;
            let yawDelta = panVector.x / height * (this.fov  / 180 * Math.PI) * 1.06;
            let pitchDelta = panVector.y / height * (this.fov  / 180 * Math.PI);
            return {yawDelta, pitchDelta};
        };

        let applyRotationDelta = (baseRotation, deltaRotation) => {
            baseRotation.yawDelta += deltaRotation.yawDelta;
            baseRotation.pitchDelta += deltaRotation.pitchDelta;
        };

        let drag = (e) => {
            if (dragEventEnabled === false) {
                dragEventEnabled = true;
                return;
            }

            if(e.drag.object !== null){
                return;
            }

            if(e.drag.startHandled === undefined){
                e.drag.startHandled = true;

                this.dispatchEvent({type: "start"});
            }

            let rotationEventDelta = calculateRotation(e.drag.lastDrag);
            applyRotationDelta(this.rotationUpdateDelta, rotationEventDelta);
        };

        let drop = e => {
            this.dispatchEvent({type: "end"});
        };

        let clampAndSaveFOV = (newFOV) => {
            this.fov = THREE.Math.clamp( newFOV, 15, 75 );
        };

        let scroll = (e) => {
            clampAndSaveFOV(this.fov - e.delta * 0.5);
        };

        let touchData = null;

        let vector2OfTouch = (touch) => {
            return new THREE.Vector2(touch.pageX, touch.pageY);
        }

        let getTouchData = (e) => {
            let touches = Array.prototype.map.call(e.touches, (touch)=>vector2OfTouch(touch));
            if (touches.length > 2){
                let getFarthestVector = (arrayOfVectors, startVectorIndex) => {
                    if (!Array.isArray(arrayOfVectors) || typeof startVectorIndex !== 'number'){
                        throw 'bed params';
                    }
                    let startVector = arrayOfVectors[startVectorIndex];
                    let maxDistance = 0;
                    let maxIndex = 0;
                    arrayOfVectors.forEach((vector, index)=>{
                        if (index === startVectorIndex) return;
                        let distance = startVector.distanceTo(vector);
                        if (distance > maxDistance) {
                            maxDistance = distance;
                            maxIndex = index;
                        }
                    });
                    return maxIndex;
                };
                let firstIndex = getFarthestVector(touches, 0);
                let secondIndex = getFarthestVector(touches, firstIndex);
                touches = [touches[firstIndex],touches[secondIndex]];
            }
            if (touches.length === 2){
                let t1 = touches[0];
                let t2 = touches[1];
                let hypotenuse = new THREE.Vector2().subVectors(t1, t2).length();
                let center = new THREE.Vector2().copy(t1).lerp(t2, 0.5);
                return {twoTouchesDistance: hypotenuse, center: center};
            } else if(touches.length === 1){
                return {twoTouchesDistance: null, center: touches[0]};
            } else return null;
        }

        let writeDownTouch = e => {
            touchData = getTouchData(e);
        };

        let touchMove = e => {
            dragEventEnabled = false;
            let newTouchData = getTouchData(e);
            {
                let panVector = new THREE.Vector2().subVectors(newTouchData.center, touchData.center);
                let rotationEventDelta = calculateRotation(panVector);
                applyRotationDelta(this.rotationUpdateDelta, rotationEventDelta);
            } //pan
            {
                if (touchData.twoTouchesDistance){
                    let scale = touchData.twoTouchesDistance / newTouchData.twoTouchesDistance
                    clampAndSaveFOV(this.fov * scale);
                }
            } // zoom
            touchData = newTouchData;
        };

        this.addEventListener("touchstart", writeDownTouch);
        this.addEventListener("touchend", writeDownTouch);
        this.addEventListener("touchmove", touchMove);
        this.addEventListener("drag", drag);
        this.addEventListener("drop", drop);
        this.addEventListener("mousewheel", scroll);
    }

    setScene(scene){
        this.scene = scene;
    }

    update(delta){

        let view = this.scene.view;

        { // apply rotation
            let progression = Math.min(1, this.fadeFactor * delta);

            let yaw = view.yaw;
            let pitch = view.pitch;

            yaw += progression * this.rotationUpdateDelta.yawDelta;
            pitch += progression * this.rotationUpdateDelta.pitchDelta;

            if (view.yaw !== yaw || view.pitch !== pitch) {
                view.yaw = yaw;
                view.pitch = pitch;
                this.scene.camera.dispatchEvent({ type: 'change' });
            }
        }

        {// decelerate over time
            let attenuation = Math.max(0, 1 - this.fadeFactor * delta);

            this.rotationUpdateDelta.yawDelta *= attenuation;
            this.rotationUpdateDelta.pitchDelta *= attenuation;
        }

        {//apply fov
            this.viewer.fov = this.fov;
        }
    }

};