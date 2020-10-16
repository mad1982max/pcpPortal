(function () {
    var Marzipano = window.Marzipano;
    var bowser = window.bowser;

    var APP_DATA = {
        "scenes": tails,
        "name": "Project Title",
        "settings": {
            "mouseViewMode": "drag",
            "autorotateEnabled": false,
            "fullscreenButton": false,
            "viewControlButtons": false
        }
    };

    // Grab elements from DOM.
    var panoElement = document.querySelector('#pano');
    var sceneNameElement = document.querySelector('#titleBar .sceneName');
    var mapListElement = document.querySelector('#mapList');
    var mapListToggleElement = document.querySelector('#mapToggle');


    // panoElement.addEventListener('mousedown', mousedownFn);
    // panoElement.addEventListener('touchstart', mousedownFn);

    // function mousedownFn() {
    //     panoElement.addEventListener('mousemove', rotateMapFn);
    //     panoElement.addEventListener('touchmove', rotateMapFn);

    //     function rotateMapFn() {
    //         var scene = viewer.scene();
    //         var view = scene.view();
    //         var yaw = view.yaw();
    //         rotationObservable.notify(yaw)
    //     }
    //     panoElement.addEventListener('mouseup', mouseupFn);

    //     function mouseupFn() {
    //         panoElement.removeEventListener('mousemove', rotateMapFn);
    //     }
    // }

    // Detect whether we are on a touch device.
    document.body.classList.add('no-touch');
    window.addEventListener('touchstart', function () {
        document.body.classList.remove('no-touch');
        document.body.classList.add('touch');
    });

    // Use tooltip fallback mode on IE < 11.
    if (bowser.msie && parseFloat(bowser.version) < 11) {
        document.body.classList.add('tooltip-fallback');
    }

    // Viewer options.
    var viewerOpts = {
        controls: {
            mouseViewMode: APP_DATA.settings.mouseViewMode
        }
    };

    // Initialize viewer.
    var viewer = new Marzipano.Viewer(panoElement, viewerOpts);    

    viewer.addEventListener('viewChange', function() {
        let fov = viewer.view().fov();
        let yaw = viewer.view().yaw();
        viewChangeObservable.notify({fov,yaw})
    })

    let scene = createScene(currentScene);
    switchScene(scene);

    // let fov = viewer.view().fov();
    // let yaw = viewer.view().yaw();
    // viewChangeObservable.notify({fov,yaw})


    function createScene(sceneData) {
        var urlPrefix = "tiles";
        var source = Marzipano.ImageUrlSource.fromString(
            "../assets/img/360view/" + urlPrefix + "/" + sceneData.name + "/{z}/{f}/{y}/{x}.jpg", {
                cubeMapPreviewUrl: "../assets/img/360view/" + urlPrefix + "/" + sceneData.name + "/preview.jpg"
            });
        var geometry = new Marzipano.CubeGeometry(sceneData.levels);

        var limiter = Marzipano.RectilinearView.limit.traditional(sceneData.faceSize, 180 * Math.PI / 180, 140 * Math.PI / 180);
        var view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);

        

        var scene = viewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
        });

        return {
            data: sceneData,
            scene: scene,
            view: view
        };
    }

    // Set handler for scene list toggle.
    mapListToggleElement.addEventListener('click', togglemapList);

    function switchScene(scene) {
        scene.view.setParameters(scene.data.initialViewParameters);
        scene.scene.switchTo();
        updateSceneName(scene);
    }

    function updateSceneName(scene) {
        sceneNameElement.innerHTML = scene.data.id;
    }

    //***------------- */
    togglemapList();

    function togglemapList() {
        mapListElement.classList.toggle('enabled');
        mapListToggleElement.classList.toggle('checked-map');

        if (mapListElement.classList.contains('enabled')) {
            mapListElement.style.transform = `translateX(100%)`;
        } else {
            mapListElement.style.transform = `translateX(0)`;
        }
        mapListToggleElement.classList.toggle('enabled');
    }

    //OBS
    switchPhoto360Observable.subscribe((data) => {
        currentScene = tails.find(scene => scene.name == pointName)
        let scene = createScene(currentScene);
        switchScene(scene);
    });

})();