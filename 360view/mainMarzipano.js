(function () {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;

  let dividerWidth = 2;

  var APP_DATA = {
    scenes: tails,
    name: "Project Title",
    settings: {
      mouseViewMode: "drag",
      autorotateEnabled: false,
      fullscreenButton: false,
      viewControlButtons: false,
    },
  };

  // Grab elements from DOM.
  var panoElement = document.querySelector("#pano");
  var sceneNameElement = document.querySelector(".sceneName");
  var mapWrapper = document.querySelector("#mapWrapper");
  var mapListToggleElement = document.querySelector("#mapToggleIcon");

  // Detect whether we are on a touch device.
  document.body.classList.add("no-touch");
  window.addEventListener("touchstart", function () {
    document.body.classList.remove("no-touch");
    document.body.classList.add("touch");
  });

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: APP_DATA.settings.mouseViewMode,
    },
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  viewer.addEventListener("viewChange", function () {
    let fov = viewer.view().fov();
    let yaw = viewer.view().yaw();
    viewChangeObservable.notify({ fov, yaw });
  });

  let scene = createScene(currentScene);
  switchScene(scene);

  function createScene(sceneData) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      "../assets/img/360view/" +
        urlPrefix +
        "/" +
        sceneData.name +
        "/{z}/{f}/{y}/{x}.jpg",
      {
        cubeMapPreviewUrl:
          "../assets/img/360view/" +
          urlPrefix +
          "/" +
          sceneData.name +
          "/preview.jpg",
      }
    );
    var geometry = new Marzipano.CubeGeometry(sceneData.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(
      sceneData.faceSize,
      (180 * Math.PI) / 180,
      (140 * Math.PI) / 180
    );
    var view = new Marzipano.RectilinearView(
      sceneData.initialViewParameters,
      limiter
    );

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true,
    });

    return {
      data: sceneData,
      scene: scene,
      view: view,
    };
  }

  // Set handler for scene list toggle.
  mapListToggleElement.addEventListener("click", toggleMapList);

  function switchScene(scene) {
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    updateSceneName(scene);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = scene.data.id;
  }

  //***------------- */
  toggleMapList();

  function toggleMapList() {
    let asideMenu = document.querySelector(".aside-mapBtn");
    let mapToggleIcon = document.querySelector(".mapToggleIcon");
    console.log("mapToggleIcon", mapToggleIcon.offsetWidth);

    mapWrapper.classList.toggle("enabled");
    asideMenu.classList.toggle("enabled");

    mapListToggleElement.classList.toggle("checked-map");

    if (mapWrapper.classList.contains("enabled")) {
      mapWrapper.style.transform = "translateX(100%)";
      asideMenu.style.transform = "translateX(100%)";
    } else {
      mapWrapper.style.transform = "translateX(0px)";
      // asideMenu.style.transform = `translateX(-${mapToggleIcon.offsetWidth})px`;
      asideMenu.style.transform = `translateX(-${mapToggleIcon.offsetWidth}px)`;
    }
    mapListToggleElement.classList.toggle("enabled");
  }

  //OBS
  switchPhoto360Observable.subscribe((data) => {
    currentScene = tails.find((scene) => scene.name == pointName);
    let scene = createScene(currentScene);
    switchScene(scene);
  });
})();
