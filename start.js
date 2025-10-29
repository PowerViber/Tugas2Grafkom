"use strict";

var gl;
var canvas;
var program;

// Lokasi Uniform
var modelViewMatrixLoc, viewMatrixLoc, projectionMatrixLoc, nMatrixLoc;
var ambientProductLoc, diffuseProductLoc, specularProductLoc, lightPositionLoc, shininessLoc;

// Matriks
var projectionMatrix;
var viewMatrix; // Matrix untuk kamera

// VAO (Vertex Array Objects) untuk menyimpan state buffer
var wheelVAO;
var bodyVAO;

// Informasi Geometri (jumlah indices)
var wheelIndicesCount;
var bodyIndicesCount;

// --- State Animasi Mobil ---
var carPosition = vec3(0.0, 0.0, 0.0); // Posisi body
var carRotationY = 0.0;                 // Rotasi body
var wheelRotationXRear = 0.0;           // Rotasi roda belakang (radians)
var wheelRotationXFront = 0.0;          // Rotasi roda depan (radians)
var frontWheelSteerY = 0.0;             // Rotasi belok roda depan

// Body parts animation
var hoodAngle = 0.0;    // degrees, hood open angle (rotate around X, positive = open up)
var trunkAngle = 0.0;   // degrees, trunk open angle

// Physics (acceleration)
var carVelocity = 0.0;  // units per second (forward +, backward -)
var maxSpeed = 20.0;     // max forward speed
var maxReverse = -3.0;  // max reverse speed
var accel = 6.0;        // acceleration when pressing W/S (units/s^2)
var decel = 3.0;        // natural deceleration when no input (units/s^2)
var steerSensitivity = 0.6; // yaw rate gain per speed (rad per unit distance)
var wheelRadius = 0.5;  // radius used for spin (matches geometry)
var lastTime = 0;       // for dt
var brakePressed = false; // brake state
var brakeAccel = 10.0;    // strong deceleration when braking
// front wheels roll based on motion only

// --- State Kontrol ---
var moveForward = false;
var moveBackward = false;
var turnLeft = false;
var turnRight = false;

// --- State Kamera ---
var cameraRadius = 15.0; // Jarak kamera
var cameraTheta = 1.0;
var cameraPhi = 1.0;
var cameraAt = vec3(0.0, 0.0, 0.0); // Kamera melihat ke mobil
var cameraUp = vec3(0.0, 1.0, 0.0);

// Follow mode (true = camera locks to car position). Default off so we can see car move.
var followCar = false;

// Scene-level transform (applied as a root before car/body/wheels)
var theta = [15, -15, 0];     // [rotX, rotY, rotZ] in degrees
var translationScene = [0, 0, 0]; // scene translation (x,y,z)
var scaleFactor = 1.0;         // scene scale

// Drag state (canvas drag rotates scene like digiclock)
var isDragging = false;
var lastMouseX = -1;
var lastMouseY = -1;

// Light XY mover (world-space offset applied to marker)
var lightOffset = [0.0, 0.0];
const lightMoveStep = 0.2;

// Helper: radians -> degrees (rotateX/Y expect degrees)
function rad2deg(r) { return r * 180.0 / Math.PI; }


// --- Variabel Lighting & Material (dari file start.js kamu) ---
var lightPosition = vec4(5.0, 5.0, 5.0, 0.0); // Arah cahaya
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

// Material untuk Roda (Hitam)
var wheelMaterialAmbient = vec4(0.1, 0.1, 0.1, 1.0);
var wheelMaterialDiffuse = vec4(0.2, 0.2, 0.2, 1.0);
var wheelMaterialSpecular = vec4(0.3, 0.3, 0.3, 1.0);
var wheelMaterialShininess = 50.0;

// Material untuk Body (Hijau)
var bodyMaterialAmbient = vec4(0.0, 1.0, 0.0, 1.0);
var bodyMaterialDiffuse = vec4(0.0, 1.0, 0.0, 1.0);
var bodyMaterialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var bodyMaterialShininess = 100.0;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0); // Warna background abu-abu
    gl.enable(gl.DEPTH_TEST);

    // Load shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // --- 1. Dapatkan Lokasi Atribut & Uniform ---
    // Uniforms
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    viewMatrixLoc = gl.getUniformLocation(program, "uViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    nMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");
    ambientProductLoc = gl.getUniformLocation(program, "uAmbientProduct");
    diffuseProductLoc = gl.getUniformLocation(program, "uDiffuseProduct");
    specularProductLoc = gl.getUniformLocation(program, "uSpecularProduct");
    lightPositionLoc = gl.getUniformLocation(program, "uLightPosition");
    shininessLoc = gl.getUniformLocation(program, "uShininess");

    // Atribut (kita akan gunakan di dalam VAO)
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    var normalLoc = gl.getAttribLocation(program, "aNormal");
    // (Kita belum pakai texture, tapi bisa ditambahkan di sini)
    

    //------------------------------------------------------------------------------------------------------//


    // --- 2. Buat Geometri dan Setup VAO ---
    
    // --- VAO untuk Roda ---
    wheelVAO = gl.createVertexArray();
    gl.bindVertexArray(wheelVAO);
    var wheelGeom = createWheelGeometry(0.4, 0.3, 20); // Radius 0.5, Tebal 0.3
    wheelIndicesCount = wheelGeom.indices.length;
    
    // Buffer Posisi Roda
    var vBufferWheel = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferWheel);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(wheelGeom.vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0); // 3-dimensi (x,y,z)
    gl.enableVertexAttribArray(positionLoc);

    // Buffer Normal Roda
    var nBufferWheel = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferWheel);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(wheelGeom.normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0); // 3-dimensi (nx,ny,nz)
    gl.enableVertexAttribArray(normalLoc);
    
    // Buffer Indices Roda
    var iBufferWheel = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBufferWheel);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wheelGeom.indices), gl.STATIC_DRAW);

    // --- VAO untuk Body (Kubus) ---
    bodyVAO = gl.createVertexArray();
    gl.bindVertexArray(bodyVAO);
    var bodyGeom = createCubeGeometry(2.0, 1.0, 4.0); // Lebar 2, Tinggi 1, Panjang 4
    bodyIndicesCount = bodyGeom.indices.length;

    // Buffer Posisi Body
    var vBufferBody = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferBody);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bodyGeom.vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // Buffer Normal Body
    var nBufferBody = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferBody);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bodyGeom.normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    // Buffer Indices Body
    var iBufferBody = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBufferBody);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bodyGeom.indices), gl.STATIC_DRAW);

    // Unbind VAO (good practice)
    gl.bindVertexArray(null);

    //------------------------------------------------------------------------------------------------------//

    // --- 3. Setup Matriks & Lighting Global ---
    projectionMatrix = perspective(60.0, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    // Set Light (hanya sekali karena tidak berubah)
    gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

    //------------------------------------------------------------------------------------------------------//

    // --- 4. Setup Event Listeners ---
    setupEventListeners();

    //------------------------------------------------------------------------------------------------------//

    // --- 5. Mulai Render Loop ---
    // UX: nicer cursor for draggable canvas
    canvas.style.cursor = 'grab';
    // Start animation loop with timestamp
    lastTime = performance.now();
    requestAnimationFrame(render);
}

function setupEventListeners() {
    // Kontrol mobil (bisa ditahan)
    window.onkeydown = function(event) {
        switch (event.key) {
            case 'w': case 'W': moveForward = true; break;
            case 's': case 'S': moveBackward = true; break;
            case 'a': case 'A': turnLeft = true; break;
            case 'd': case 'D': turnRight = true; break;
            // Brake
            case 'e': case 'E': brakePressed = true; break;
            case 'r': case 'R':
                // Reset camera and car state if things go out of view
                cameraRadius = 15.0;
                cameraTheta = 1.0;
                cameraPhi = 1.0;
                cameraAt = vec3(0.0, 0.0, 0.0);
                carPosition = vec3(0.0, 0.0, 0.0);
                carRotationY = 0.0;
                frontWheelSteerY = 0.0;
                wheelRotationXRear = 0.0;
                wheelRotationXFront = 0.0;
                carVelocity = 0.0;
                hoodAngle = 0.0;
                trunkAngle = 0.0;
                // Reset scene transforms (free-cam style)
                theta = [15, -15, 0];
                translationScene = [0, 0, 0];
                scaleFactor = 1.0;
                // Reset light offset
                lightOffset = [0.0, 0.0];
                // Sync sliders if present
                const lightXInput2 = document.getElementById('LightX');
                const lightYInput2 = document.getElementById('LightY');
                const lightXVal2 = document.getElementById('LightXVal');
                const lightYVal2 = document.getElementById('LightYVal');
                if (lightXInput2) lightXInput2.value = '0';
                if (lightYInput2) lightYInput2.value = '0';
                if (lightXVal2) lightXVal2.textContent = '0.0';
                if (lightYVal2) lightYVal2.textContent = '0.0';
                const hoodEl2 = document.getElementById('HoodAngle');
                const trunkEl2 = document.getElementById('TrunkAngle');
                const hoodLab2 = document.getElementById('HoodAngleVal');
                const trunkLab2 = document.getElementById('TrunkAngleVal');
                if (hoodEl2) hoodEl2.value = '0';
                if (trunkEl2) trunkEl2.value = '0';
                if (hoodLab2) hoodLab2.textContent = '0';
                if (trunkLab2) trunkLab2.textContent = '0';
                const speedEl2 = document.getElementById('SpeedVal');
                if (speedEl2) speedEl2.textContent = '0.00';
                brakePressed = false;
                break;
            case 'f': case 'F':
                // Toggle follow camera mode
                followCar = !followCar;
                if (followCar) {
                    cameraAt = carPosition;
                }
                break;
        }
    };
    window.onkeyup = function(event) {
        switch (event.key) {
            case 'w': case 'W': moveForward = false; break;
            case 's': case 'S': moveBackward = false; break;
            case 'a': case 'A': turnLeft = false; break;
            case 'd': case 'D': turnRight = false; break;
            case 'e': case 'E': brakePressed = false; break;
        }
    };
    
    // Buttons (alternatif)
    document.getElementById("ButtonForward").onmousedown = () => moveForward = true;
    document.getElementById("ButtonForward").onmouseup = () => moveForward = false;
    document.getElementById("ButtonBackward").onmousedown = () => moveBackward = true;
    document.getElementById("ButtonBackward").onmouseup = () => moveBackward = false;
    document.getElementById("ButtonTurnLeft").onmousedown = () => turnLeft = true;
    document.getElementById("ButtonTurnLeft").onmouseup = () => turnLeft = false;
    document.getElementById("ButtonTurnRight").onmousedown = () => turnRight = true;
    document.getElementById("ButtonTurnRight").onmouseup = () => turnRight = false;

    // Zoom In Out
    const zoomStep = 1.1;
    document.getElementById("ButtonCamZoomIn").onclick = () => scaleFactor *= zoomStep;
    document.getElementById("ButtonCamZoomOut").onclick = () => scaleFactor /= zoomStep;

    // Canvas drag
    canvas.onmousedown = function(e) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    };
    canvas.onmouseup = function() { isDragging = false; canvas.style.cursor = 'grab'; };
    canvas.onmouseleave = function() { isDragging = false; canvas.style.cursor = 'grab'; };
    canvas.onmousemove = function(e) {
        if (!isDragging) return;
        var deltaX = e.clientX - lastMouseX;
        var deltaY = e.clientY - lastMouseY;
        // Match digiclock feel: yaw = deltaX*0.5, pitch = deltaY*0.5
        theta[1] += deltaX * 0.5;
        theta[0] += deltaY * 0.5;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        e.preventDefault();
    };

    // Scroll wheel
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const dir = Math.sign(e.deltaY);
        if (dir > 0) scaleFactor /= zoomStep; else if (dir < 0) scaleFactor *= zoomStep;
    }, { passive: false });

    // Lighting sliders
    const lightXInput = document.getElementById('LightX');
    const lightYInput = document.getElementById('LightY');
    const lightXVal = document.getElementById('LightXVal');
    const lightYVal = document.getElementById('LightYVal');
    if (lightXInput) {
        lightXInput.value = String(lightOffset[0]);
        if (lightXVal) lightXVal.textContent = Number(lightOffset[0]).toFixed(1);
        lightXInput.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) { lightOffset[0] = v; if (lightXVal) lightXVal.textContent = v.toFixed(1); }
        });
    }
    if (lightYInput) {
        lightYInput.value = String(lightOffset[1]);
        if (lightYVal) lightYVal.textContent = Number(lightOffset[1]).toFixed(1);
        lightYInput.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) { lightOffset[1] = v; if (lightYVal) lightYVal.textContent = v.toFixed(1); }
        });
    }

    // Body Sliders
    const hoodInput = document.getElementById('HoodAngle');
    const trunkInput = document.getElementById('TrunkAngle');
    const hoodVal = document.getElementById('HoodAngleVal');
    const trunkVal = document.getElementById('TrunkAngleVal');
    if (hoodInput) {
        hoodInput.value = String(hoodAngle.toFixed(0));
        if (hoodVal) hoodVal.textContent = hoodAngle.toFixed(0);
        hoodInput.addEventListener('input', (e) => {
            const v = Math.max(0, Math.min(45, parseFloat(e.target.value)));
            hoodAngle = v;
            if (hoodVal) hoodVal.textContent = v.toFixed(0);
        });
    }
    if (trunkInput) {
        trunkInput.value = String(trunkAngle.toFixed(0));
        if (trunkVal) trunkVal.textContent = trunkAngle.toFixed(0);
        trunkInput.addEventListener('input', (e) => {
            const v = Math.max(0, Math.min(45, parseFloat(e.target.value)));
            trunkAngle = v;
            if (trunkVal) trunkVal.textContent = v.toFixed(0);
        });
    }
}

function updateCarState(dt) {
    // Konstanta kecepatan
    const steerSpeed = 0.05;
    const maxSteer = 0.6; // radians

    // 1. Turning
    if (turnRight) {
        frontWheelSteerY = Math.min(maxSteer, frontWheelSteerY + steerSpeed);
    } else if (turnLeft) {
        frontWheelSteerY = Math.max(-maxSteer, frontWheelSteerY - steerSpeed);
    } else {
        // Kembali lurus
        if (Math.abs(frontWheelSteerY) < steerSpeed) frontWheelSteerY = 0;
        else if (frontWheelSteerY > 0) frontWheelSteerY -= steerSpeed;
        else frontWheelSteerY += steerSpeed;
    }

    // 2. Gas / Rem / Mundur
    const a = accel;
    const d = decel;
    if (brakePressed) {
        if (carVelocity > 0) carVelocity = Math.max(0, carVelocity - brakeAccel * dt);
        else if (carVelocity < 0) carVelocity = Math.min(0, carVelocity + brakeAccel * dt);
    } else if (moveForward && !moveBackward) {
        carVelocity += a * dt;
    } else if (moveBackward && !moveForward) {
        carVelocity -= a * dt;
    } else {
        if (carVelocity > 0) {
            carVelocity = Math.max(0, carVelocity - d * dt);
        } else if (carVelocity < 0) {
            carVelocity = Math.min(0, carVelocity + d * dt);
        }
    }

    // Clamp speeds
    if (carVelocity > maxSpeed) carVelocity = maxSpeed;
    if (carVelocity < maxReverse) carVelocity = maxReverse;

    // 3. Body Rotation
    // Yaw rate proportional to speed and steer angle
    carRotationY += (-frontWheelSteerY) * carVelocity * steerSensitivity * dt;

    // 4. Update posisi mobil
    carPosition[0] += Math.sin(carRotationY) * carVelocity * dt;
    carPosition[2] += Math.cos(carRotationY) * carVelocity * dt;

    // 5. Update rotasi roda
    // 5. Update roda berputar berdasarkan kecepatan linear
    // Belakang selalu berputar mengikuti gerak
    wheelRotationXRear += (carVelocity / wheelRadius) * dt; // radians
    // Depan hanya berputar jika menyentuh tanah dan bergerak
    if (Math.abs(carVelocity) > 1e-3) {
        wheelRotationXFront += (carVelocity / wheelRadius) * dt;
    }
}

function setMaterial(ambient, diffuse, specular, shininess) {
    var ambientProduct = mult(lightAmbient, ambient);
    var diffuseProduct = mult(lightDiffuse, diffuse);
    var specularProduct = mult(lightSpecular, specular);
    
    gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(specularProductLoc, flatten(specularProduct));
    gl.uniform1f(shininessLoc, shininess);
}

function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute dt 
    var dt = 0.016;
    if (typeof timestamp === 'number') {
        dt = Math.max(0, Math.min(0.05, (timestamp - lastTime) / 1000.0)); // clamp dt for stability
        lastTime = timestamp;
    }

    // 1. Update State
    updateCarState(dt);
    const speedEl = document.getElementById('SpeedVal');
    if (speedEl) speedEl.textContent = carVelocity.toFixed(2);

    // 2. Setup Kamera
    var eye = vec3(0.0, 0.0, 15.0);
    var at = vec3(0.0, 0.0, 0.0);
    viewMatrix = lookAt(eye, at, cameraUp);
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

    // --- Light marker (yellow cube) ---
    var lightMarkerPos;
    if (lightPosition[3] === 0.0) {
        var ldir = normalize(vec3(lightPosition[0], lightPosition[1], lightPosition[2]));
        lightMarkerPos = scale(6.0, ldir); 
    } else {
        lightMarkerPos = vec3(lightPosition[0], lightPosition[1], lightPosition[2]);
    }

    // Scene root transform (digiclock style): T -> Rx -> Ry -> Rz -> S -> (optional follow translation)
    var sceneRoot = mat4();
    sceneRoot = mult(sceneRoot, translate(translationScene[0], translationScene[1], translationScene[2]));
    sceneRoot = mult(sceneRoot, rotateX(theta[0]));
    sceneRoot = mult(sceneRoot, rotateY(theta[1]));
    sceneRoot = mult(sceneRoot, rotateZ(theta[2]));
    sceneRoot = mult(sceneRoot, scale(scaleFactor, scaleFactor, scaleFactor));

    // Follow car by 
    if (followCar) {
        sceneRoot = mult(sceneRoot, translate(-carPosition[0], -carPosition[1], -carPosition[2]));
    }

    //------------------------------------------------------------------------------------------------------//

    // Light marker model matrix
    var lightMarkerModel = mat4();
    lightMarkerModel = mult(lightMarkerModel, translate(lightMarkerPos[0] + lightOffset[0], lightMarkerPos[1] + lightOffset[1], lightMarkerPos[2]));
    // Base (no scale) used to sample the marker's world position
    var lightMarkerBase = mult(sceneRoot, lightMarkerModel);
    // Now add scale just for drawing the cube
    lightMarkerModel = mult(lightMarkerModel, scale(0.2, 0.2, 0.2)); // small cube
    // Apply scene root so marker follows scene orientation/scale
    var lightMarkerCombined = mult(sceneRoot, lightMarkerModel);
    // Upload light as POSITIONAL at the marker location (in view space), so shading comes from the marker
    var markerWorldPos = mult(lightMarkerBase, vec4(0.0, 0.0, 0.0, 1.0));
    var markerEyePos = mult(viewMatrix, markerWorldPos);
    gl.uniform4fv(lightPositionLoc, flatten(vec4(markerEyePos[0], markerEyePos[1], markerEyePos[2], 1.0)));
    gl.bindVertexArray(bodyVAO);
    // Yellow material
    setMaterial(vec4(0.6, 0.6, 0.0, 1.0), vec4(1.0, 1.0, 0.0, 1.0), vec4(0.2, 0.2, 0.0, 1.0), 20.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(lightMarkerCombined));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, lightMarkerCombined), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    //------------------------------------------------------------------------------------------------------//
    
    // === MULAI HIERARCHICAL MODELLING ===

    // 3. Gambar BODY MOBIL dalam 3 bagian: depan (hood), tengah (body), belakang (trunk)
    gl.bindVertexArray(bodyVAO);
    setMaterial(bodyMaterialAmbient, bodyMaterialDiffuse, bodyMaterialSpecular, bodyMaterialShininess);

    var bodyModelMatrix = mat4();
    bodyModelMatrix = mult(bodyModelMatrix, translate(carPosition[0], carPosition[1], carPosition[2]));
    bodyModelMatrix = mult(bodyModelMatrix, rotateY(rad2deg(carRotationY)));
    var bodyCombined = mult(sceneRoot, bodyModelMatrix);

    // Dimensions
    const middleDepth = 2.0; // tengah
    const frontDepth = 1.0;  // depan (hood)
    const backDepth = 1.0;   // belakang (trunk)
    const baseFullDepth = 4.0; // depth of base cube geometry

    // Middle (body): center at 0, scale z to 0.5 of base (2/4)
    var midM = mult(mat4(), bodyCombined);
    midM = mult(midM, scale(1.0, 1.0, middleDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(midM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, midM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Front split: Engine (0.4) + Hood (0.1)
    const engineH = 0.4;
    const hoodH = 0.1;
    const frontCenterZ = (middleDepth/2) + (frontDepth/2); // 1.5
    const hoodPivotZ = (middleDepth/2); // 1.0
    const engineCenterY = -0.05; // stacks into total 0.5 height [-0.25,0.25]
    const hoodCenterY = 0.20;

    // Engine 
    var engineM = mult(mat4(), bodyCombined);
    engineM = mult(engineM, translate(0.0, engineCenterY, frontCenterZ));
    engineM = mult(engineM, scale(1.0, engineH, frontDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(engineM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, engineM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Hood
    var hoodM = mult(mat4(), bodyCombined);
    hoodM = mult(hoodM, translate(0.0, 0.0, hoodPivotZ));
    hoodM = mult(hoodM, rotateX(-hoodAngle));
    hoodM = mult(hoodM, translate(0.0, hoodCenterY, frontDepth/2));
    hoodM = mult(hoodM, scale(1.0, hoodH, frontDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(hoodM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, hoodM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Back split: Trunk (0.6) + TrunkDoor (0.2)
    const trunkH = 0.6;
    const doorH = 0.15;
    const backCenterZ = -(middleDepth/2) - (backDepth/2); // -1.5
    const trunkPivotZ = -(middleDepth/2); // -1.0
    const trunkCenterY = -0.05;
    const doorCenterY = 0.30;

    // Trunk
    var trunkM = mult(mat4(), bodyCombined);
    trunkM = mult(trunkM, translate(0.0, trunkCenterY, backCenterZ));
    trunkM = mult(trunkM, scale(1.0, trunkH, backDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(trunkM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, trunkM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // TrunkDoor
    var doorM = mult(mat4(), bodyCombined);
    doorM = mult(doorM, translate(0.0, 0.0, trunkPivotZ));
    doorM = mult(doorM, rotateX(trunkAngle));
    doorM = mult(doorM, translate(0.0, doorCenterY, -backDepth/2));
    doorM = mult(doorM, scale(1.0, doorH, backDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(doorM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, doorM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    //------------------------------------------------------------------------------------------------------//
    
    // 4. Gambar Roda
    gl.bindVertexArray(wheelVAO); // Aktifkan VAO Roda (sekali saja)
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);

    // Posisi relatif roda thd body
    const frontDist = 1.5;
    const backDist = -1.5;
    const sideDist = 1.0;
    const heightDist = -0.3;

    // Roda Depan Kiri
    var frontLeftWheelMatrix = mult(mat4(), bodyCombined); // Mulai dari salinan matrix body (sudah termasuk sceneRoot)
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, translate(sideDist, heightDist, frontDist));
    // Pastikan belok (yaw) terjadi terhadap sumbu Y (dunia/karoseri) lalu orientasi roda ditegakkan
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateY(rad2deg(-frontWheelSteerY))); // Belok (dibalik agar arah roda sesuai body)
    // Always render with last known rotation so wheels don't snap back when stopped
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateX(rad2deg(wheelRotationXFront)));
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateZ(90)); // Tegakkan roda (sumbu Y -> X)
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(frontLeftWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, frontLeftWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Marker DKiri
    var markerFL = mult(mat4(), frontLeftWheelMatrix);
    markerFL = mult(markerFL, translate(0.0, 0.0, 0.5)); // ke permukaan luar roda (radius 0.5)
    markerFL = mult(markerFL, scale(0.1, 0.1, 0.1)); // kecilkan
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.1, 0.4, 0.1, 1.0), vec4(0.0, 1.0, 0.0, 1.0), vec4(0.2, 0.2, 0.2, 1.0), 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(markerFL));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, markerFL), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(wheelVAO); // kembali ke VAO roda
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);

    // Roda Depan Kanan
    var frontRightWheelMatrix = mult(mat4(), bodyCombined);
    frontRightWheelMatrix = mult(frontRightWheelMatrix, translate(-sideDist, heightDist, frontDist));
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateY(rad2deg(-frontWheelSteerY))); // Belok (dibalik agar arah roda sesuai body)
    // Always render with last known rotation so wheels don't snap back when stopped
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateX(rad2deg(wheelRotationXFront)));
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateZ(90)); // Tegakkan roda (sumbu Y -> X)
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(frontRightWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, frontRightWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Marker DKanan
    var markerFR = mult(mat4(), frontRightWheelMatrix);
    markerFR = mult(markerFR, translate(0.0, 0.0, 0.5));
    markerFR = mult(markerFR, scale(0.1, 0.1, 0.1));
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.1, 0.4, 0.1, 1.0), vec4(0.0, 1.0, 0.0, 1.0), vec4(0.2, 0.2, 0.2, 1.0), 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(markerFR));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, markerFR), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);

    // Roda Belakang Kiri
    var backLeftWheelMatrix = mult(mat4(), bodyCombined);
    backLeftWheelMatrix = mult(backLeftWheelMatrix, translate(sideDist, heightDist, backDist));
    // Terapkan rolling setelah orientasi lokal: urutan kode = T -> Rx -> Rz (urutan aplikasi: Rz lalu Rx)
        backLeftWheelMatrix = mult(backLeftWheelMatrix, rotateX(rad2deg(wheelRotationXRear)));
    backLeftWheelMatrix = mult(backLeftWheelMatrix, rotateZ(90));
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(backLeftWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, backLeftWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Marker BKiri
    var markerBL = mult(mat4(), backLeftWheelMatrix);
    markerBL = mult(markerBL, translate(0.0, 0.0, 0.5));
    markerBL = mult(markerBL, scale(0.1, 0.1, 0.1));
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.4, 0.1, 0.1, 1.0), vec4(1.0, 0.0, 0.0, 1.0), vec4(0.2, 0.2, 0.2, 1.0), 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(markerBL));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, markerBL), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);

    // Roda Belakang Kanan
    var backRightWheelMatrix = mult(mat4(), bodyCombined);
    backRightWheelMatrix = mult(backRightWheelMatrix, translate(-sideDist, heightDist, backDist));
        backRightWheelMatrix = mult(backRightWheelMatrix, rotateX(rad2deg(wheelRotationXRear)));
    backRightWheelMatrix = mult(backRightWheelMatrix, rotateZ(90));
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(backRightWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, backRightWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Marker BKanan
    var markerBR = mult(mat4(), backRightWheelMatrix);
    markerBR = mult(markerBR, translate(0.0, 0.0, 0.5));
    markerBR = mult(markerBR, scale(0.1, 0.1, 0.1));
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.4, 0.1, 0.1, 1.0), vec4(1.0, 0.0, 0.0, 1.0), vec4(0.2, 0.2, 0.2, 1.0), 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(markerBR));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, markerBR), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);

    requestAnimationFrame(render);
}


// =================================================================
// FUNGSI GEOMETRI
// (Ditempatkan di sini agar file mandiri)
// =================================================================

/**
 * Membuat geometri silinder (untuk roda).
 * Menghasilkan vertices, normals, dan indices.
 * Versi ini menggunakan vec3 untuk vertices dan normals.
 */
function createWheelGeometry(radius, height, segments) {
    const vertices = [];
    const normals = [];
    const indices = [];
    let index = 0;
    const halfHeight = height / 2;

    // --- Sisi Samping (Tapak Roda) ---
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const nx = Math.cos(angle);
        const nz = Math.sin(angle);

        vertices.push(vec3(x, halfHeight, z));
        normals.push(vec3(nx, 0, nz));
        vertices.push(vec3(x, -halfHeight, z));
        normals.push(vec3(nx, 0, nz));
    }
    const sideVertices = (segments + 1) * 2;
    for (let i = 0; i < segments; i++) {
        const i0 = i * 2; const i1 = i0 + 1;
        const i2 = i0 + 2; const i3 = i0 + 3;
        indices.push(i0, i1, i2);
        indices.push(i1, i3, i2);
    }
    index = sideVertices;

    // --- Sisi Atas (Cap Atas / Velg) ---
    const topCenterIndex = index++;
    vertices.push(vec3(0, halfHeight, 0));
    normals.push(vec3(0, 1, 0));
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        vertices.push(vec3(x, halfHeight, z));
        normals.push(vec3(0, 1, 0));
    }
    const topStartIndex = topCenterIndex + 1;
    for (let i = 0; i < segments; i++) {
        indices.push(topCenterIndex, topStartIndex + i, topStartIndex + i + 1);
    }
    index += (segments + 1);

    // --- Sisi Bawah (Cap Bawah) ---
    const bottomCenterIndex = index++;
    vertices.push(vec3(0, -halfHeight, 0));
    normals.push(vec3(0, -1, 0));
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        vertices.push(vec3(x, -halfHeight, z));
        normals.push(vec3(0, -1, 0));
    }
    const bottomStartIndex = bottomCenterIndex + 1;
    for (let i = 0; i < segments; i++) {
        indices.push(bottomCenterIndex, bottomStartIndex + i + 1, bottomStartIndex + i);
    }

    return { vertices, normals, indices };
}

/**
 * Membuat geometri kubus (untuk body).
 * Menghasilkan vertices, normals, dan indices.
 */
function createCubeGeometry(width, height, depth) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const vertices = [
        // Depan
        vec3(-w, -h,  d), vec3( w, -h,  d), vec3( w,  h,  d), vec3(-w,  h,  d),
        // Belakang
        vec3(-w, -h, -d), vec3(-w,  h, -d), vec3( w,  h, -d), vec3( w, -h, -d),
        // Atas
        vec3(-w,  h, -d), vec3(-w,  h,  d), vec3( w,  h,  d), vec3( w,  h, -d),
        // Bawah
        vec3(-w, -h, -d), vec3( w, -h, -d), vec3( w, -h,  d), vec3(-w, -h,  d),
        // Kanan
        vec3( w, -h, -d), vec3( w,  h, -d), vec3( w,  h,  d), vec3( w, -h,  d),
        // Kiri
        vec3(-w, -h, -d), vec3(-w, -h,  d), vec3(-w,  h,  d), vec3(-w,  h, -d)
    ];

    const normals = [
        // Depan
        vec3( 0,  0,  1), vec3( 0,  0,  1), vec3( 0,  0,  1), vec3( 0,  0,  1),
        // Belakang
        vec3( 0,  0, -1), vec3( 0,  0, -1), vec3( 0,  0, -1), vec3( 0,  0, -1),
        // Atas
        vec3( 0,  1,  0), vec3( 0,  1,  0), vec3( 0,  1,  0), vec3( 0,  1,  0),
        // Bawah
        vec3( 0, -1,  0), vec3( 0, -1,  0), vec3( 0, -1,  0), vec3( 0, -1,  0),
        // Kanan
        vec3( 1,  0,  0), vec3( 1,  0,  0), vec3( 1,  0,  0), vec3( 1,  0,  0),
        // Kiri
        vec3(-1,  0,  0), vec3(-1,  0,  0), vec3(-1,  0,  0), vec3(-1,  0,  0)
    ];
    
    const indices = [
         0,  1,  2,    0,  2,  3,  // Depan
         4,  5,  6,    4,  6,  7,  // Belakang
         8,  9, 10,    8, 10, 11, // Atas
        12, 13, 14,   12, 14, 15, // Bawah
        16, 17, 18,   16, 18, 19, // Kanan
        20, 21, 22,   20, 22, 23  // Kiri
    ];

    return { vertices, normals, indices };
}