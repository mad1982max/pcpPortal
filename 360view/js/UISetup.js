
(function (){
    {
        var pin_default = new THREE.TextureLoader().load('pin-black.svg');
        var pin_highlighted = new THREE.TextureLoader().load( "pin-red.svg" );
        var queryParamNames = {
            pointCloudName: 'name',
            layer: 'layer',
            sub: 'sub'
        };
    } // constants
    {
        function exchangeDictionary(base, donor){
            Object.keys(base).forEach(function (key) {
                delete base[key];
            })
            Object.entries(donor).forEach(function (entry) {
                base[entry[0]] = entry[1];
            })
        }
    } // utils
    {
        function addOtherPoints(viewer, config, exceptPointName, requestedLayerInfo){
            requestedLayerInfo = requestedLayerInfo || {layer:'?',sub:'?'};
            let meshDictionary = {};
            config.pointProfiles
                .filter(function (pointProfile){ return pointProfile.name !== exceptPointName})
                .filter(function (pointProfile){ return pointProfile.belongsToLayer(requestedLayerInfo); })
                .forEach(function (pointProfile){
                    const material = new THREE.SpriteMaterial( { map: pin_default } );
                    const sprite = new THREE.Sprite( material );
                    sprite.scale.set(0.5,0.7,1);
                    sprite.position.copy(pointProfile.position);
                    this.viewer.scene.scene.add( sprite );
                    meshDictionary[sprite.uuid] = {pointProfile, object3d: sprite};
                }, this);
            return meshDictionary;
        }
        function addPointCloud(pointProfile) {
            Potree.loadPointCloud(pointProfile.fullPathToPointCloud(), pointProfile.name, e => {
                if (e.type !== 'pointcloud_loaded') return;

                let scene = viewer.scene;
                let pointcloud = e.pointcloud;

                let material = pointcloud.material;
                material.size = 0.1;
                material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
                material.shape = Potree.PointShape.SQUARE;
                material.visible = false;

                scene.addPointCloud(pointcloud);
            });
        }
        function create360(pointProfile, lod, callback) {
            const geometry = new THREE.CubeGeometry(150,150,150);
            geometry.scale( - 1, 1, 1 );
            geometry.rotateX(Math.PI/2);
            let loaded = 0;
            const textureLoadedCallback = function (){
                loaded++;
                if (loaded === 6 && callback) callback(cube);
            };
            const cubeMaterials = pointProfile.fullPathToCubeSides(lod).map(function (path) {
                return new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(path, textureLoadedCallback), side: THREE.DoubleSide});
            });
            const cube = new THREE.Mesh(geometry, cubeMaterials);
            cube.position.copy(pointProfile.position);
            cube.setRotationFromEuler(pointProfile.rotation);
            return cube;
        }
    } // add scene elements
    {
        function addTouchEventsReflection(viewer) {
            {
                this.addEventListener('touchstart', function (e) {
                    e = e.event;
                    if (e.touches.length !== 1) return;
                    let touch = e.touches[0];
                    let event = new MouseEvent('mousemove', {
                        clientX: touch.pageX,
                        clientY: touch.pageY
                    });
                    viewer.renderer.domElement.dispatchEvent(event);
                })
                this.addEventListener('ClickNoMove', function (e) {
                    if (e.skipMouseUpEvent) return;
                    let position = e.position;
                    let event = new MouseEvent('mouseup', {
                        clientX: position.x,
                        clientY: position.y,
                        button: THREE.MOUSE.LEFT
                    });
                    event.fake = true;
                    viewer.renderer.domElement.dispatchEvent(event);
                });
            }
            {
                this.addEventListener('ClickNoMove', onDocumentMouseDown(viewer, meshDictionary, function (uuid) {
                    this.viewer.scene.removeAllMeasurements();
                    const pointProfile = this.getProfileByMeshUuid(uuid);
                    switchPhoto360Observable.notify(pointProfile.name)
                }.bind(this)));

                let mouseMoveEventListener = onDocumentMouseDown(viewer, meshDictionary);
                this.addEventListener('mousemove', function (event) {
                    let uuid = mouseMoveEventListener(event);
                    viewer.renderer.domElement.style.cursor = uuid ? 'pointer' : 'default';
                    Object.values(meshDictionary).map(function (o) { return o.object3d; }).forEach(function (mesh) {
                        mesh.material.map = pin_default;
                    })
                    if (uuid) {
                        let selectedMesh = meshDictionary[uuid].object3d;
                        selectedMesh.material.map = pin_highlighted;
                    }
                });
            }
        }
        function subscribeAndDispatchEvents(viewer) {
            let domElement = viewer.renderer.domElement;
            let subscriber = this;
            {
                let touchPosition = null;
                domElement.addEventListener('touchstart', function (e) {
                    if (e.touches.length !== 1) touchPosition = null;
                    let touch = e.touches[0];
                    touchPosition = new THREE.Vector2(touch.pageX, touch.pageY);

                    subscriber.dispatchEvent({
                        type: 'touchstart',
                        event: e
                    });
                });

                domElement.addEventListener('touchend', function (e) {
                    if (!touchPosition) return;
                    //if (e.touches.length !== 0 && e.changedTouches.length !== 1) return;
                    let changedTouch = e.changedTouches[0];
                    let changedPosition = new THREE.Vector2(changedTouch.pageX, changedTouch.pageY);
                    if (changedPosition.equals(touchPosition)){
                        subscriber.dispatchEvent({
                            type: 'ClickNoMove',
                            position: touchPosition
                        });
                    }
                });

                domElement.addEventListener('touchmove', function (e) {
                    if (!touchPosition) return;
                    let changedTouch = e.changedTouches[0];
                    let changedPosition = new THREE.Vector2(changedTouch.pageX, changedTouch.pageY);
                    if (!changedPosition.equals(touchPosition)) touchPosition = null;
                });
            } // touch events handling
            {
                let mouse = null;
                domElement.addEventListener('mousedown', function (e) {
                    if (e.button !== 0) return;
                    mouse = new THREE.Vector2(e.pageX, e.pageY);
                });

                domElement.addEventListener('mouseup', function (e) {
                    if (!mouse) return;
                    if (!e.fake && e.pageX === mouse.x && e.pageY === mouse.y){
                        subscriber.dispatchEvent({
                            type: 'ClickNoMove',
                            position: mouse,
                            skipMouseUpEvent: true
                        });
                    }
                    mouse = null;
                });

                domElement.addEventListener('mousemove', function (e) {
                    let changedPosition = new THREE.Vector2(e.pageX, e.pageY);
                    if (mouse && !changedPosition.equals(mouse)) {
                        mouse = null;
                    }
                    subscriber.dispatchEvent({
                        type: 'mousemove',
                        position: changedPosition
                    });
                });
            } // mouse events handling
        }
    } // events setup
    {
        function rollbackUI(viewer) {
            let scene = new Potree.Scene(viewer.renderer);
            viewer.setScene(scene);
        }
        function onDocumentMouseDown(viewer, objectsMap, selectProfileCallback) {
            let domElement = viewer.renderer.domElement;

            let raycaster = new THREE.Raycaster();

            let normalizedPosition = function (vector) {
                let normalizedPosition = new THREE.Vector2();
                normalizedPosition.copy(vector);

                normalizedPosition.x /= domElement.clientWidth;
                normalizedPosition.y /= domElement.clientHeight;

                normalizedPosition.multiplyScalar(2);

                normalizedPosition.subScalar(1);

                normalizedPosition.y *= -1;

                return normalizedPosition;
            }

            return function ( event ) {
                let camera = viewer.scene.camera;

                let normalized = normalizedPosition(event.position);
                raycaster.setFromCamera(normalized , camera );

                let Objects = Object.values(objectsMap).map(o=>o.object3d);
                let intersects = raycaster.intersectObjects(Objects);

                if ( intersects.length > 0 ) {

                    let object = intersects[0].object;
                    let {pointProfile} = objectsMap[object.uuid];
                    if (pointProfile && selectProfileCallback && typeof selectProfileCallback === 'function') selectProfileCallback(object.uuid);
                    return object.uuid;
                }

            }
        }
        function setupViewer(){
            let viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

            viewer.setEDLEnabled(true);
            viewer.setPointBudget(500*1000);
            viewer.loadSettingsFromURL();
            viewer.setEDLEnabled(false);

            return viewer;
        }
    } // general

    let profileLoaded = false;
    let meshDictionary = {};

    function SceneControl(pointConfig) {
        const self = this;
        let viewer = setupViewer();
        //viewer.inputHandler.logMessages = true;
        addTouchEventsReflection.call(this, viewer);
        subscribeAndDispatchEvents.call(this, viewer);

        Object.defineProperties(this, {
            pointConfig: { value: pointConfig, enumerable: true },
            viewer: { value: viewer, enumerable: true },
        });
    }

    SceneControl.prototype = Object.defineProperties(Object.assign(Object.create(THREE.EventDispatcher.prototype), {
        constructor: SceneControl,
        setProfile: function (pointProfile) {
            Validator.validateInstance(pointProfile, PointProfile);
            const viewer = this.viewer;
            const self = this;
            const yaw = viewer.scene.view.yaw;
            if (profileLoaded) rollbackUI(this.viewer);
            {
                let config = this.pointConfig;
                {
                    const layerInfo = pointProfile.getLayerInfo();
                    const basePosition = pointProfile.position;
                    config.pointProfiles.sort(function (item1, item2){
                        const item1check = item1.belongsToLayer(layerInfo);
                        const item2check = item2.belongsToLayer(layerInfo);
                        if (item1check){
                            if (item2check){
                                // compare distances
                                const distance1 = item1.position.distanceToSquared(basePosition);
                                const distance2 = item2.position.distanceToSquared(basePosition);
                                if (distance1 === distance2) return 0; // it's almost impossible
                                return (distance1 > distance2) ? 1 : -1;
                            }
                            else return -1;
                        } else {
                            if (item2check) {
                                return 1;
                            } else {
                                return 0;
                            }
                        }
                    });
                } // sorting pointConfigs by distance to selected pointConfig position and its layerInfo */
                exchangeDictionary(meshDictionary, addOtherPoints.call(this, viewer, config, pointProfile.name, pointProfile.getLayerInfo()));
                const lowQuality360 = this.currentSphereMesh = create360(pointProfile, '1');
                viewer.scene.scene.add(lowQuality360);
                const onLoad = function (highQuality360){
                    viewer.scene.scene.add(highQuality360);
                    viewer.scene.scene.remove(self.currentSphereMesh);
                    self.currentSphereMesh = highQuality360;
                }; // switch to high quality textures
                create360(pointProfile, '3', onLoad);
                if (pointProfile.name > 2) {
                    create360(pointProfile, '4', onLoad);
                    console.info('Conoco specific code here!');
                }
                addPointCloud(pointProfile);
                this.viewer.scene.view.position.copy(pointProfile.position);
            }
            {
                viewer.scene.camera.addEventListener('change', function () {
                    let _angle = null
                    const eventObj = Object.defineProperties({},{
                        angle: {
                            get: function () {
                                return _angle !== null ? _angle : _angle = self.lookAzimuth;
                            }
                        },
                        type: { value: 'cameraRotationChange' }
                    });
                    self.dispatchEvent(eventObj);
                })
            } // camera rotation change
            viewer.scene.scene.remove(viewer.scene.scene.children.find(value => value.type === 'LineSegments')); // remove weird mesh next to (0,0,0)
            viewer.scene.view.pitch = 0;
            viewer.scene.view.yaw = yaw;
            setTimeout(function (){viewChangeObservable.notify({ yaw: self.lookAzimuth });}, 2000);
            profileLoaded = true;
        },
        getProfileByIndex: function (profileIndex) {
            Validator.validateNumber(profileIndex);
            if (profileIndex >= this.pointConfig.pointProfiles.length) throw 'index out of range of array';
            return config.pointProfiles[profileIndex];
        },
        getProfileByMeshUuid: function (uuid) {
            if (!meshDictionary) return;
            let {pointProfile} = meshDictionary[uuid];
            return pointProfile;
        },
        getProfileByName: function(pointCloudName) {
            for(const profile of this.pointConfig.pointProfiles){
                if (profile.name == pointCloudName){
                    return profile;
                }
            }
            return null;
        },
        getProfileByQuery: function(){
            let pointCloudName = Potree.utils.getParameterByName(queryParamNames.pointCloudName);
            return this.getProfileByName(pointCloudName);
        },
        pointCloudSetVisible: function(visibility){
            viewer.scene.pointclouds.forEach(function (pointCloud) {
                pointCloud.material.visible = visibility;
            });
        },
        toggleVisibilityOtherPoints: function (otherPointsBudget, values) {
            Validator.validateNumber(otherPointsBudget);
            Validator.validateArray(values, Validator.validateNumber);
            const maxDistance = values[values.length - 1];
            const minDistance = values[0];

            const currentProfile = this.getProfileByQuery();
            let countOfEnabledPoints = 0;
            for (const obj of Object.values(meshDictionary)){
                const object3d = obj.object3d;
                const pointProfile = obj.pointProfile;
                const distance = pointProfile.position.distanceTo(currentProfile.position);

                object3d.visible = distance < maxDistance && distance > minDistance && countOfEnabledPoints < otherPointsBudget;
                if (object3d.visible) countOfEnabledPoints++;
            }

            this.dispatchEvent({type:'displayedOtherPointsChanged', values, otherPointsBudget});
        },
    }), {
        currentSphereMesh: { value: null, writable: true, enumerable: true },
        pointBudget: {
            get: function() {
                return this.viewer.getPointBudget();
            },
            set: function(pb) {
                this.viewer.setPointBudget(pb);
            }
        },
        lookAzimuth: {
            get: function () {
                const lookVector = viewer.scene.camera.getWorldDirection();
                return Math.atan2(lookVector.x, lookVector.y);
            }
        },
        countOfOtherPoints: {
            get: function (){
                return Object.keys(meshDictionary).length;
            }
        },
        countOfViewedOtherPoints: {
            get: function () {
                return Object.values(meshDictionary)
                    .reduce(function (prev, curr){ return prev + curr.object3d.visible; }, 0)
            }
        }
    });

    function UIControl(sceneControl){
        Validator.validateInstance(sceneControl, SceneControl);
        (document.head || document.getElementsByTagName('head')[0]).insertAdjacentHTML("beforeend", '<style></style>');
        Object.defineProperties(this, {
            sceneControl: { value: sceneControl },
            styleSheet: { value: document.styleSheets[document.styleSheets.length - 1] }
        });
        this.pointBudgetSliderSetup();
        this.pointCloudVisibilityControlSetup();
        jQuery.fn.init.prototype.showHide = function (show){
            if(show){
                this.show();
            } else {
                this.hide();
            }
        }
        this.potreeUIVisibilityControlSetup();
        this.customUIToggleSetup();
        this.potreeUISetup();
        this.sphereVisibilityControlSetup();
        this.addRangeSlider();
        this.addOtherPointsBudgetSlider();
    }
    UIControl.prototype = Object.defineProperties(Object.assign(Object.create(Object.prototype), {
        constructor: UIControl,
        pointBudgetSliderSetup: function(){
            $('#pointBudgetSlider').slider({
                value: this.sceneControl.pointBudget,
                min: 100*1000,
                max: 10*1000*1000,
                step: 1000,
                slide: function( event, ui ) { this.sceneControl.pointBudget = ui.value; }.bind(this)
            });
            $('#pointBudgetTitle>span:first-child')[0].textContent = 'Point Budget:';
            this.sceneControl.viewer.addEventListener('point_budget_changed', function(){
                $('#pointBudgetTitle>span:last-child')[0].textContent = Potree.utils.addCommas(this.sceneControl.pointBudget);
                $('#pointBudgetSlider').slider({ value: this.sceneControl.pointBudget });
            }.bind(this));
            this.sceneControl.viewer.dispatchEvent({'type': 'point_budget_changed'});
        },
        pointCloudVisibilityControlSetup: function () {
            let uIControlContext = this;
            $('#pointCloudVisibilityControl>label>input').change(function() {
                uIControlContext.sceneControl.pointCloudSetVisible(this.checked);
            });
        },
        potreeUIVisibilityControlSetup: function () {
            const styleSheet = this.styleSheet;
            $('#potreeUIVisibilityControl>label>input').change(function() {
                let visible = this.checked;
                $('#potree_render_area').css("left", "0px");
                if (styleSheet.rules.length > 0) styleSheet.removeRule(0);
                if (!visible) styleSheet.insertRule('#potree_sidebar_container,#potree_render_area>img{display:none;}');
            });
        },
        customUIToggleSetup: function () {
            let showHideButton = $('#showHideButton').button({
                icon: 'ui-icon-caret-1-n'
            }).click(function () {
                let menu = $('#menu');
                menu.toggleClass('hide');
                let isHidden = menu.hasClass('hide');
                showHideButton.button("option", "icon", 'ui-icon-caret-1-'+ (isHidden? 'n' : 's'));
            })
            showHideButton.click();
        },
        potreeUISetup: function () {
            this.styleSheet.insertRule("#potree_sidebar_container,#potree_render_area>img{display:none;}");
            this.sceneControl.viewer.loadGUI();
        },
        sphereVisibilityControlSetup: function () {
            $('#sphereVisibilityControl>label>input').change(function() {
                let visible = this.checked;
                Object.values(meshDictionary).map(function (o) { return o.object3d; }).forEach(function (mesh) {
                    mesh.visible = visible;
                })
            });
        },
        addRangeSlider: function () {
            const self = this;
            const sceneControl = this.sceneControl;
            const rangeSlider = $('#sphereRangeSlider');
            const rangeDisplayingSpan = $('#otherPointsRangeControl>p>span:last-child');
            const setTitle = function(values){
                rangeDisplayingSpan.text(values[0] + ' - ' + values[1]);
            };
            rangeSlider.slider({
                range: true,
                values: [0.1, 150],
                min: 0.1,
                max: 150,
                step: 0.1,
                slide: function( event, ui ) {
                    setTitle(ui.values);
                    sceneControl.toggleVisibilityOtherPoints(self.otherPointsBudgetSliderValue, ui.values);
                }
            });
            setTitle([0.1, 150]);
            sceneControl.addEventListener('displayedOtherPointsChanged',
                function (event){
                    rangeSlider.slider( "option", "values", event.values );
                    setTitle(event.values);
                }
            );
        },
        addOtherPointsBudgetSlider: function () {
            const self = this;
            const sceneControl = this.sceneControl;
            const budgetSlider = $('#otherPointsBudgetSlider');
            const budgetDisplayingSpan = $('#otherPointsBudgetControl>p>span:last-child');
            const setTitle = function(value){
                budgetDisplayingSpan.text(value);
            };
            const maxCount = sceneControl.countOfOtherPoints;
            budgetSlider.slider({
                value: maxCount,
                min: 0,
                max: maxCount,
                step: 1,
                slide: function( event, ui ) {
                    setTitle(ui.value);
                    sceneControl.toggleVisibilityOtherPoints(ui.value, self.rangeSliderValues);
                }
            });
            setTitle(maxCount);
            sceneControl.addEventListener('displayedOtherPointsChanged',
                function (event){
                    budgetSlider.slider( "option", "value", event.otherPointsBudget );
                    setTitle(event.otherPointsBudget);
                }
            );
        },
    }), {
        rangeSliderValues: {
            get: function () {
                return $('#sphereRangeSlider').slider( "option", "values" );
            }
        },
        otherPointsBudgetSliderValue: {
            get: function () {
                return $('#otherPointsBudgetSlider').slider( "option", "value" );
            }
        },
    });

    window.SceneControl = SceneControl;
    window.UIControl = UIControl;
})();
