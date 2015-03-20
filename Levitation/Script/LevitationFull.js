
var App = new function () {

    // Variables
    var
        debug = false,
        camera,
		scene,
		renderer = null,
		canvas = null,
		context = null,
        info = $("#information"),
		$container = $('#container'),
		width = $container.width(),
		height = $container.height(),
		projector = new THREE.Projector(),
		center = new THREE.Vector3(),
		orbitCamera = true,
		orbitValue = 0,
		image = null,
		running = true,

		surface = null,
		surfaceVerts = [],

		DAMPEN = .9,
		AGGRESSION = 400,
		DEPTH = 520,
		NEAR = 1,
		FAR = 10000,
		X_RESOLUTION = 20,
		Y_RESOLUTION = 20,
		SURFACE_WIDTH = 340,
		SURFACE_HEIGHT = 340,

		magnitude = 3,
        orbitSpeed = 0.01,
        showWireframes = false,
        useLightsource = true;
        currentLightSource = 0;
        wireframeOpacity = 0,
        elasticity = 0.001,

        pointerDownTime = 0,
        pointerDownX = 0,
        pointerDownY = 0,
        changeOrbitAmount = "",
        musicPlaying = true;

        pointerDownDuration = 0,
        pointerDownDistanceX = 0,
        pointerDownDistanceY = 0;


    this.init = function () {

        // add listeners
        addEventListeners();

        // create our stuff
        renderer = new THREE.WebGLRenderer();
        camera = new THREE.Camera(45, width / height, NEAR, FAR);
        scene = new THREE.Scene();

        canvas = document.createElement('canvas');
        canvas.width = SURFACE_WIDTH;
        canvas.height = SURFACE_HEIGHT;

        // use antialias:false to make lines more visible
        context = canvas.getContext("experimental-webgl", { antialias: false, preserveDrawingBuffer: true });

        // position the camera
        camera.position.y = 220;
        camera.position.z = DEPTH;

        // start the renderer
        renderer.setSize(width, height);
        $container.append(renderer.domElement);

        createObjects();
        this.addLights();
        update();
    }


    this.pause = function() {
        if (!running) {
            running = true;
        }
        else {
            running = false;
        }
        update();
    }

    this.toggleMusic = function () {
        musicPlaying = !musicPlaying;
        if (musicPlaying == true) {
            document.getElementById('backgroundAudio').play();
        }
        else {
            document.getElementById('backgroundAudio').pause();
        }
    }

    this.reset = function () {
        window.location.reload();
    }

    this.addLights = function() {

        //currentLightSource = 3;

        if (currentLightSource == 0) {
            currentLight = new THREE.PointLight(0xffffff);
            currentLight.position.x = 10;
            currentLight.position.y = 100;
            currentLight.position.z = 10;
            scene.addLight(currentLight);
        }
        else if (currentLightSource == 1) {
            currentLight = new THREE.PointLight(0x767676);
            currentLight.position.x = 10;
            currentLight.position.y = 100;
            currentLight.position.z = 20;
            scene.addLight(currentLight);
        }
        else if (currentLightSource == 2) {
            currentLight = new THREE.PointLight(0x37ff28);
            currentLight.position.x = 10;
            currentLight.position.y = 100;
            currentLight.position.z = 10;
            scene.addLight(currentLight);
        }
        else {
            currentLight = new THREE.PointLight(0x37ff28);
            currentLight.position.x = 40;
            currentLight.position.y = 40;
            currentLight.position.z = 0;
            scene.addLight(currentLight);
        }

    }

    this.toggleLight = function () {
        useLightsource = !useLightsource;
        if (useLightsource == true) {
            this.addLights();
        }
        else {
            scene.removeLight(currentLight);
        }
    }

    this.changeLightSource = function () {
        currentLightSource++;
        if (currentLightSource > 3)
        {
            currentLightSource = 0;
        }
        if (useLightsource == true) {
            scene.removeLight(currentLight);
            this.addLights();
        }
        else {
            this.toggleLight();
        }
    }


    function displayInformation() {
        if (debug === true) {
            var display = "";
            display += "orbitSpeed: " + orbitSpeed + "&nbsp;&nbsp;&nbsp;";
            display += "magnitude: " + magnitude + "&nbsp;&nbsp;&nbsp;";
            display += "elasticity: " + orbitSpeed + "&nbsp;&nbsp;&nbsp;";
            display += "dampen: " + DAMPEN + "&nbsp;&nbsp;&nbsp;";
            display += "aggression: " + AGGRESSION + "&nbsp;&nbsp;&nbsp;";
            display += "pointerDownDuration: " + pointerDownDuration + "&nbsp;&nbsp;&nbsp;";
            display += "pointerDownDistanceX: " + pointerDownDistanceX + "&nbsp;&nbsp;&nbsp;";
            display += "pointerDownDistanceY: " + pointerDownDistanceY + "&nbsp;&nbsp;&nbsp;";
            display += "changeOrbitAmount: " + changeOrbitAmount + "&nbsp;&nbsp;&nbsp;";
            info.html(display);
        }
    }


    function createObjects() {
        var planeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: ImageUtils.loadTexture("Images/MicrosoftLogo.png"), shading: THREE.SmoothShading }),
			planeMaterialWire = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, wireframe: true });

        surface = new THREE.Mesh(new Plane(SURFACE_WIDTH, SURFACE_HEIGHT, X_RESOLUTION, Y_RESOLUTION), [planeMaterial, planeMaterialWire]);
        surface.rotation.x = -Math.PI * .5;
        surface.overdraw = true;
        scene.addChild(surface);

        // go through each vertex
        surfaceVerts = surface.geometry.vertices;
        sCount = surfaceVerts.length;

        // create the verts for the mesh
        while (sCount--) {
            var vertex = surfaceVerts[sCount];
            vertex.springs = [];
            vertex.velocity = new THREE.Vector3();

            // connect this vertex to the ones around it
            if (vertex.position.x > (-SURFACE_WIDTH * .5)) {
                // connect to left
                vertex.springs.push({ start: sCount, end: sCount - 1 });
            }

            if (vertex.position.x < (SURFACE_WIDTH * .5)) {
                // connect to right
                vertex.springs.push({ start: sCount, end: sCount + 1 });
            }

            if (vertex.position.y < (SURFACE_HEIGHT * .5)) {
                // connect above
                vertex.springs.push({ start: sCount, end: sCount - (X_RESOLUTION + 1) });
            }

            if (vertex.position.y > (-SURFACE_HEIGHT * .5)) {
                // connect below
                vertex.springs.push({ start: sCount, end: sCount + (X_RESOLUTION + 1) });
            }
        }
    }


    function addEventListeners() {
        document.onselectstart = function () { return false; };

        window.addEventListener("contextmenu", function (e) { if (e.preventDefault) { e.preventDefault(); } }, false);
        window.addEventListener("selectstart", function (e) { if (e.preventDefault) { e.preventDefault(); } }, false);
        window.addEventListener("dragstart", function (e) { if (e.preventDefault) { e.preventDefault(); } }, false);
        document.addEventListener("MSGestureHold", function (e) { e.preventDefault(); }, false);
        window.addEventListener("MSHoldVisual", function (e) { e.preventDefault(); });

        $(window).resize(callbacks.windowResize);
        $(window).keydown(callbacks.keyDown);

        $(document.body).mousedown(callbacks.mouseDown);
        $(document.body).mouseup(callbacks.mouseUp);
        $(document.body).click(callbacks.mouseClick);

        if (window.navigator.pointerEnabled) {
            document.addEventListener("PointerMove", callbacks.pointerMove, false);
            document.addEventListener("PointerDown", callbacks.pointerDown, false);
            document.addEventListener("PointerUp", callbacks.pointerUp, false);
        }
        else if (window.navigator.msPointerEnabled) {
            document.addEventListener("MSPointerMove", callbacks.pointerMove, false);
            document.addEventListener("MSPointerDown", callbacks.pointerDown, false);
            document.addEventListener("MSPointerUp", callbacks.pointerUp, false);
        }
        else if (window.navigator.webkitPointerEnabled) {
            document.addEventListener("WebKitPointerMove", callbacks.pointerMove, false);
            document.addEventListener("WebKitPointerDown", callbacks.pointerDown, false);
            document.addEventListener("WebKitPointerUp", callbacks.pointerUp, false);
        }



    }


    function updatePlane() {
        var ratio = 1 / Math.max(image.width / SURFACE_WIDTH, image.height / SURFACE_HEIGHT);
        var scaledWidth = image.width * ratio;
        var scaledHeight = image.height * ratio;
        context.drawImage(image, 0, 0, image.width, image.height, (SURFACE_WIDTH - scaledWidth) * .5, (SURFACE_HEIGHT - scaledHeight) * .5, scaledWidth, scaledHeight);

        var newPlaneMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, map: ImageUtils.loadTexture(canvas.toDataURL("image/png")), shading: THREE.SmoothShading });
        surface.materials[0] = newPlaneMaterial;
    }


    function update() {
        displayInformation();
        orbitValue += orbitSpeed;
        camera.position.x = Math.sin(orbitValue) * DEPTH;
        camera.position.z = Math.cos(orbitValue) * DEPTH;
        camera.update();

        if (showWireframes == true && wireframeOpacity < 1) {
            wireframeOpacity += 0.02;
        }
        else if (showWireframes == false && wireframeOpacity > 0) {
            wireframeOpacity -= 0.02;
        }
        surface.materials[1].opacity = wireframeOpacity;

        var v = surfaceVerts.length;
        while (v--) {
            var vertex = surfaceVerts[v],
				acceleration = new THREE.Vector3(0, 0, -vertex.position.z * elasticity),
				springs = vertex.springs,
				s = springs.length;

            vertex.velocity.addSelf(acceleration);

            while (s--) {
                var spring = springs[s],
					extension = surfaceVerts[spring.start].position.z - surfaceVerts[spring.end].position.z;

                acceleration = new THREE.Vector3(0, 0, extension * elasticity * 50);
                surfaceVerts[spring.end].velocity.addSelf(acceleration);
                surfaceVerts[spring.start].velocity.subSelf(acceleration);
            }

            vertex.position.addSelf(vertex.velocity);
            vertex.velocity.multiplyScalar(DAMPEN);
        }

        surface.geometry.computeFaceNormals(true);
        surface.geometry.__dirtyVertices = true;
        surface.geometry.__dirtyNormals = true;

        rAF(render);
    }


    function render() {
        if (renderer) {
            renderer.render(scene, camera);
        }

        if (running) {
            update();
        }
    }

    function disturbSurface(event, magnitude) {
        if (running) {
            var mouseX = event.offsetX || (event.clientX - 220);
            var mouseY = event.offsetY || event.clientY;

            var vector = new THREE.Vector3((mouseX / width) * 2 - 1, -(mouseY / height) * 2 + 1, 0.5);
            projector.unprojectVector(vector, camera);

            var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize()),
				intersects = ray.intersectObject(surface);

            if (intersects.length) {
                var iPoint = intersects[0].point,
				 	xVal = Math.floor((iPoint.x / SURFACE_WIDTH) * X_RESOLUTION),
					yVal = Math.floor((iPoint.z / SURFACE_HEIGHT) * Y_RESOLUTION);

                xVal += X_RESOLUTION / 2;
                yVal += Y_RESOLUTION / 2;

                index = (yVal * (X_RESOLUTION + 1)) + xVal;

                if (index >= 0 && index < surfaceVerts.length) {
                    surfaceVerts[index].velocity.z += magnitude;
                }
            }
        }
    }

    this.toggleMesh = function() {
        showWireframes = !showWireframes;
    }

    function changeOrbitSpeed(amount, accelerate) {
        var targetSpeed;
        if (accelerate == true) {
            targetSpeed = orbitSpeed + amount * 3;
        }
        else {
            targetSpeed = orbitSpeed + amount;
        }

        if (targetSpeed > -0.16 && targetSpeed < 0.16) {
            orbitSpeed = targetSpeed;
        }
    }

    function addInertia() {
    }

    callbacks = {

        mouseDown: function () {
            document.addEventListener('mousemove', callbacks.mouseMove, false);
            addInertia();
        },
        mouseMove: function (event) {
            disturbSurface(event, magnitude);
        },
        mouseClick: function (event) {
            disturbSurface(event, magnitude * 5);
        },
        mouseUp: function (event) {
            document.removeEventListener('mousemove', callbacks.mouseMove, false);
        },
        pointerDown: function (event) {
            pointerDownTime = new Date().getTime();
            pointerDownX = event.x;
            pointerDownY = event.y;
            //addInertia();
        },
        pointerMove: function (event) {
            disturbSurface(event, magnitude * 6);
        },
        pointerUp: function (event) {
            pointerDownDuration = new Date().getTime() - pointerDownTime;
            pointerDownDistanceX = pointerDownX - event.x;
            pointerDownDistanceY = pointerDownY - event.y;

            if (pointerDownDuration > 120 && pointerDownDuration < 1000 && pointerDownDistanceY > -80 && pointerDownDistanceY < 80) {
                changeOrbitAmount = pointerDownDistanceX / 200 * 0.01;
                changeOrbitSpeed(changeOrbitAmount, event.shiftKey);
            }
        },
        windowResize: function () {
            if (camera) {
                width = $container.width(),
				height = $container.height(),
				camera.aspect = width / height,
				renderer.setSize(width, height);
                camera.updateProjectionMatrix();
            }
        },
        keyDown: function (event) {

            if (camera) {
                switch (event.keyCode) {

                    case 37: // Left Arrow
                        changeOrbitAmount = 0.01;
                        changeOrbitSpeed(changeOrbitAmount, event.shiftKey);
                        break;

                    case 39: // Right Arrow
                        changeOrbitAmount = -0.01;
                        changeOrbitSpeed(changeOrbitAmount, event.shiftKey);
                        break;

                    case 64: // A: Toggle Audio
                        App.toggleMusic();
                        break;

                    case 68: // D: Toggle Debug
                        debug = !debug;
                        if (debug == true) {
                            info.css("display", "block");
                        }
                        else {
                            info.css("display", "none");
                        }
                        break;

                    case 76: // L: Light
                        App.toggleLight();
                        break;

                    case 77: // M: Toggle Mesh
                        App.toggleMesh();
                        break;

                    case 80: // P: Pause / Toggle Running
                        App.pause();
                        break;

                    case 82: // R: Reset
                        App.reset();
                        break;

                    case 83: // S: Source
                        App.changeLightSource();
                        break;

                    default:
                        //alert(event.keyCode);
                }

                camera.update();
            }
        }
    };
};

$(document).ready(function () {
    App.init();
});

window.rAF = (
    function () {
        return window.requestAnimationFrame ||
               window.msRequestAnimationFrame ||
               window.mozRequestAnimationFrame ||
               window.oRequestAnimationFrame ||
               window.webkitRequestAnimationFrame ||
               function (callback) { window.setTimeout(callback, 1000 / 60); };
    }
)();