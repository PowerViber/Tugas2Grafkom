"use strict";

var gl;
var canvas;
var program;

// Uniform locations
var modelViewMatrixLoc, viewMatrixLoc, projectionMatrixLoc, nMatrixLoc;
var ambientProductLoc, diffuseProductLoc, specularProductLoc, lightPositionLoc, shininessLoc;

// Matrices
var projectionMatrix;
var viewMatrix;

// VAOs
var wheelVAO;
var bodyVAO;
var steeringWheelVAO;

// Index counts
var wheelIndicesCount;
var bodyIndicesCount;
var steeringWheelIndicesCount;

// Car animation state
var carPosition = vec3(0.0, 0.0, 0.0);
var carRotationY = 0.0;
var wheelRotationXRear = 0.0;
var wheelRotationXFront = 0.0;
var frontWheelSteerY = 0.0;

// Body parts animation
var hoodAngle = 0.0;
var trunkAngle = 0.0;
var rightDoorAngle = 0.0;
var leftDoorAngle = 0.0;
var rightRearDoorAngle = 0.0;
var leftRearDoorAngle = 0.0;
var handBrakeAngle = 0.0;
var handBrakeEngaged = false;

// Physics
var carVelocity = 0.0;
var maxSpeed = 20.0;
var maxReverse = -3.0;
var accel = 6.0;
var decel = 3.0;
var steerSensitivity = 0.6;
var wheelRadius = 0.5;
var lastTime = 0;
var brakePressed = false;
var brakeAccel = 10.0;

// Controls
var moveForward = false;
var moveBackward = false;
var turnLeft = false;
var turnRight = false;

// Camera state
var cameraRadius = 15.0;
var cameraTheta = 1.0;
var cameraPhi = 1.0;
var cameraAt = vec3(0.0, 0.0, 0.0);
var cameraUp = vec3(0.0, 1.0, 0.0);

var followCar = false;

// Scene transform
var theta = [15, -15, 0];
var translationScene = [0, 0, 0];
var scaleFactor = 1.0;

// Drag state
var isDragging = false;
var lastMouseX = -1;
var lastMouseY = -1;

// Light control
var lightOffset = [0.0, 0.0];
const lightMoveStep = 0.2;

function rad2deg(r) { return r * 180.0 / Math.PI; }

// Lighting & material
var lightPosition = vec4(5.0, 5.0, 5.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var wheelMaterialAmbient = vec4(0.1, 0.1, 0.1, 1.0);
var wheelMaterialDiffuse = vec4(0.2, 0.2, 0.2, 1.0);
var wheelMaterialSpecular = vec4(0.3, 0.3, 0.3, 1.0);
var wheelMaterialShininess = 50.0;

var bodyMaterialAmbient = vec4(0.0, 1.0, 0.0, 1.0);
var bodyMaterialDiffuse = vec4(0.0, 1.0, 0.0, 1.0);
var bodyMaterialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var bodyMaterialShininess = 100.0;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

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

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    var normalLoc = gl.getAttribLocation(program, "aNormal");

    // --- Setup VAOs ---
    // Wheels VAO
    wheelVAO = gl.createVertexArray();
    gl.bindVertexArray(wheelVAO);
    var wheelGeom = createWheelGeometry(0.4, 0.3, 20);
    wheelIndicesCount = wheelGeom.indices.length;
    var vBufferWheel = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferWheel);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(wheelGeom.vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    var nBufferWheel = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferWheel);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(wheelGeom.normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);
    var iBufferWheel = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBufferWheel);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wheelGeom.indices), gl.STATIC_DRAW);

    // Body VAO (cube)
    bodyVAO = gl.createVertexArray();
    gl.bindVertexArray(bodyVAO);
    var bodyGeom = createCubeGeometry(2.0, 1.0, 4.0);
    bodyIndicesCount = bodyGeom.indices.length;
    var vBufferBody = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferBody);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bodyGeom.vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    var nBufferBody = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferBody);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bodyGeom.normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);
    var iBufferBody = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBufferBody);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bodyGeom.indices), gl.STATIC_DRAW);

    // Steering wheel VAO (torus)
    steeringWheelVAO = gl.createVertexArray();
    gl.bindVertexArray(steeringWheelVAO);
    var steeringGeom = createSteeringWheelGeometry(0.25, 0.03, 20);
    steeringWheelIndicesCount = steeringGeom.indices.length;
    var vBufferSteering = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferSteering);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(steeringGeom.vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    var nBufferSteering = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferSteering);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(steeringGeom.normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);
    var iBufferSteering = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBufferSteering);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(steeringGeom.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    // --- Projection & light ---
    projectionMatrix = perspective(60.0, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

    // Listeners
    setupEventListeners();

    canvas.style.cursor = 'grab';
    lastTime = performance.now();
    requestAnimationFrame(render);
}

function setupEventListeners() {
    window.onkeydown = function(event) {
        switch (event.key) {
            case 'w': case 'W': moveForward = true; break;
            case 's': case 'S': moveBackward = true; break;
            case 'a': case 'A': turnLeft = true; break;
            case 'd': case 'D': turnRight = true; break;
            case 'e': case 'E': brakePressed = true; break;
            case 'r': case 'R':
                cameraRadius = 15.0; cameraTheta = 1.0; cameraPhi = 1.0; cameraAt = vec3(0.0, 0.0, 0.0);
                carPosition = vec3(0.0, 0.0, 0.0); carRotationY = 0.0; frontWheelSteerY = 0.0;
                wheelRotationXRear = 0.0; wheelRotationXFront = 0.0; carVelocity = 0.0;
                hoodAngle = 0.0; trunkAngle = 0.0; rightDoorAngle = 0.0; leftDoorAngle = 0.0; rightRearDoorAngle = 0.0; leftRearDoorAngle = 0.0;
                handBrakeAngle = 0.0; handBrakeEngaged = false;
                theta = [15, -15, 0]; translationScene = [0, 0, 0]; scaleFactor = 1.0;
                lightOffset = [0.0, 0.0];
                const ids = ['LightX','LightY','HoodAngle','TrunkAngle','RightDoorAngle','LeftDoorAngle','RightRearDoorAngle','LeftRearDoorAngle'];
                const vals = ['LightXVal','LightYVal','HoodAngleVal','TrunkAngleVal','RightDoorAngleVal','LeftDoorAngleVal','RightRearDoorAngleVal','LeftRearDoorAngleVal'];
                ids.forEach((id,i)=>{ const el=document.getElementById(id); if(el) el.value='0'; const vl=document.getElementById(vals[i]); if(vl) vl.textContent='0'; });
                const speedEl2 = document.getElementById('SpeedVal'); if (speedEl2) speedEl2.textContent = '0.00';
                brakePressed = false;
                break;
            case 'f': case 'F': followCar = !followCar; if (followCar) { cameraAt = carPosition; } break;
            case 'p': case 'P':
                // Toggle hand brake
                handBrakeEngaged = !handBrakeEngaged;
                handBrakeAngle = handBrakeEngaged ? 45.0 : 0.0;
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

    // Buttons
    document.getElementById("ButtonForward").onmousedown = () => moveForward = true;
    document.getElementById("ButtonForward").onmouseup = () => moveForward = false;
    document.getElementById("ButtonBackward").onmousedown = () => moveBackward = true;
    document.getElementById("ButtonBackward").onmouseup = () => moveBackward = false;
    document.getElementById("ButtonTurnLeft").onmousedown = () => turnLeft = true;
    document.getElementById("ButtonTurnLeft").onmouseup = () => turnLeft = false;
    document.getElementById("ButtonTurnRight").onmousedown = () => turnRight = true;
    document.getElementById("ButtonTurnRight").onmouseup = () => turnRight = false;

    // Zoom
    const zoomStep = 1.1;
    document.getElementById("ButtonCamZoomIn").onclick = () => scaleFactor *= zoomStep;
    document.getElementById("ButtonCamZoomOut").onclick = () => scaleFactor /= zoomStep;

    // Drag
    canvas.onmousedown = function(e){ isDragging=true; lastMouseX=e.clientX; lastMouseY=e.clientY; canvas.style.cursor='grabbing'; e.preventDefault(); };
    canvas.onmouseup = function(){ isDragging=false; canvas.style.cursor='grab'; };
    canvas.onmouseleave = function(){ isDragging=false; canvas.style.cursor='grab'; };
    canvas.onmousemove = function(e){ if(!isDragging) return; var dx=e.clientX-lastMouseX; var dy=e.clientY-lastMouseY; theta[1]+=dx*0.5; theta[0]+=dy*0.5; lastMouseX=e.clientX; lastMouseY=e.clientY; e.preventDefault(); };

    canvas.addEventListener('wheel', (e)=>{ e.preventDefault(); const dir=Math.sign(e.deltaY); const step=1.1; if(dir>0) scaleFactor/=step; else if(dir<0) scaleFactor*=step; }, {passive:false});

    // Sliders
    const lightXInput = document.getElementById('LightX');
    const lightYInput = document.getElementById('LightY');
    const lightXVal = document.getElementById('LightXVal');
    const lightYVal = document.getElementById('LightYVal');
    if (lightXInput) { lightXInput.value=String(lightOffset[0]); if(lightXVal) lightXVal.textContent=Number(lightOffset[0]).toFixed(1); lightXInput.addEventListener('input',(e)=>{ const v=parseFloat(e.target.value); if(!isNaN(v)){ lightOffset[0]=v; if(lightXVal) lightXVal.textContent=v.toFixed(1);} }); }
    if (lightYInput) { lightYInput.value=String(lightOffset[1]); if(lightYVal) lightYVal.textContent=Number(lightOffset[1]).toFixed(1); lightYInput.addEventListener('input',(e)=>{ const v=parseFloat(e.target.value); if(!isNaN(v)){ lightOffset[1]=v; if(lightYVal) lightYVal.textContent=v.toFixed(1);} }); }

    const hoodInput = document.getElementById('HoodAngle');
    const trunkInput = document.getElementById('TrunkAngle');
    const hoodVal = document.getElementById('HoodAngleVal');
    const trunkVal = document.getElementById('TrunkAngleVal');
    if (hoodInput) { hoodInput.value=String(hoodAngle.toFixed(0)); if(hoodVal) hoodVal.textContent=hoodAngle.toFixed(0); hoodInput.addEventListener('input', (e)=>{ const v=Math.max(0, Math.min(45, parseFloat(e.target.value))); hoodAngle=v; if(hoodVal) hoodVal.textContent=v.toFixed(0); }); }
    if (trunkInput) { trunkInput.value=String(trunkAngle.toFixed(0)); if(trunkVal) trunkVal.textContent=trunkAngle.toFixed(0); trunkInput.addEventListener('input', (e)=>{ const v=Math.max(0, Math.min(45, parseFloat(e.target.value))); trunkAngle=v; if(trunkVal) trunkVal.textContent=v.toFixed(0); }); }

    const rightDoorInput = document.getElementById('RightDoorAngle');
    const leftDoorInput = document.getElementById('LeftDoorAngle');
    const rightDoorVal = document.getElementById('RightDoorAngleVal');
    const leftDoorVal = document.getElementById('LeftDoorAngleVal');
    if (rightDoorInput) { rightDoorInput.value=String(rightDoorAngle.toFixed(0)); if(rightDoorVal) rightDoorVal.textContent=rightDoorAngle.toFixed(0); rightDoorInput.addEventListener('input',(e)=>{ const v=Math.max(0, Math.min(90, parseFloat(e.target.value))); rightDoorAngle=v; if(rightDoorVal) rightDoorVal.textContent=v.toFixed(0); }); }
    if (leftDoorInput) { leftDoorInput.value=String(leftDoorAngle.toFixed(0)); if(leftDoorVal) leftDoorVal.textContent=leftDoorAngle.toFixed(0); leftDoorInput.addEventListener('input',(e)=>{ const v=Math.max(0, Math.min(90, parseFloat(e.target.value))); leftDoorAngle=v; if(leftDoorVal) leftDoorVal.textContent=v.toFixed(0); }); }

    const rightRearDoorInput = document.getElementById('RightRearDoorAngle');
    const leftRearDoorInput = document.getElementById('LeftRearDoorAngle');
    const rightRearDoorVal = document.getElementById('RightRearDoorAngleVal');
    const leftRearDoorVal = document.getElementById('LeftRearDoorAngleVal');
    if (rightRearDoorInput) { rightRearDoorInput.value=String(rightRearDoorAngle.toFixed(0)); if(rightRearDoorVal) rightRearDoorVal.textContent=rightRearDoorAngle.toFixed(0); rightRearDoorInput.addEventListener('input',(e)=>{ const v=Math.max(0, Math.min(90, parseFloat(e.target.value))); rightRearDoorAngle=v; if(rightRearDoorVal) rightRearDoorVal.textContent=v.toFixed(0); }); }
    if (leftRearDoorInput) { leftRearDoorInput.value=String(leftRearDoorAngle.toFixed(0)); if(leftRearDoorVal) leftRearDoorVal.textContent=leftRearDoorAngle.toFixed(0); leftRearDoorInput.addEventListener('input',(e)=>{ const v=Math.max(0, Math.min(90, parseFloat(e.target.value))); leftRearDoorAngle=v; if(leftRearDoorVal) leftRearDoorVal.textContent=v.toFixed(0); }); }
}

function updateCarState(dt) {
    const steerSpeed = 0.05;
    const maxSteer = 0.6;

    if (turnRight) { frontWheelSteerY = Math.min(maxSteer, frontWheelSteerY + steerSpeed); }
    else if (turnLeft) { frontWheelSteerY = Math.max(-maxSteer, frontWheelSteerY - steerSpeed); }
    else { if (Math.abs(frontWheelSteerY) < steerSpeed) frontWheelSteerY = 0; else if (frontWheelSteerY > 0) frontWheelSteerY -= steerSpeed; else frontWheelSteerY += steerSpeed; }

    // Jika hand brake aktif, mobil tidak bisa bergerak
    if (handBrakeEngaged) {
        // Hentikan mobil secara bertahap
        if (carVelocity > 0) carVelocity = Math.max(0, carVelocity - brakeAccel * dt);
        else if (carVelocity < 0) carVelocity = Math.min(0, carVelocity + brakeAccel * dt);
        return; // Skip update posisi jika hand brake aktif
    }

    const a = accel; const d = decel;
    if (brakePressed) {
        if (carVelocity > 0) carVelocity = Math.max(0, carVelocity - brakeAccel * dt);
        else if (carVelocity < 0) carVelocity = Math.min(0, carVelocity + brakeAccel * dt);
    } else if (moveForward && !moveBackward) { carVelocity += a * dt; }
      else if (moveBackward && !moveForward) { carVelocity -= a * dt; }
      else { if (carVelocity > 0) carVelocity = Math.max(0, carVelocity - d * dt); else if (carVelocity < 0) carVelocity = Math.min(0, carVelocity + d * dt); }

    if (carVelocity > maxSpeed) carVelocity = maxSpeed;
    if (carVelocity < maxReverse) carVelocity = maxReverse;

    carRotationY += (-frontWheelSteerY) * carVelocity * steerSensitivity * dt;

    carPosition[0] += Math.sin(carRotationY) * carVelocity * dt;
    carPosition[2] += Math.cos(carRotationY) * carVelocity * dt;

    wheelRotationXRear += (carVelocity / wheelRadius) * dt;
    if (Math.abs(carVelocity) > 1e-3) { wheelRotationXFront += (carVelocity / wheelRadius) * dt; }
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

    var dt = 0.016;
    if (typeof timestamp === 'number') { dt = Math.max(0, Math.min(0.05, (timestamp - lastTime) / 1000.0)); lastTime = timestamp; }

    updateCarState(dt);
    const speedEl = document.getElementById('SpeedVal'); if (speedEl) speedEl.textContent = carVelocity.toFixed(2);

    var eye = vec3(0.0, 0.0, 15.0);
    var at = vec3(0.0, 0.0, 0.0);
    viewMatrix = lookAt(eye, at, cameraUp);
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

    // Light marker
    var lightMarkerPos;
    if (lightPosition[3] === 0.0) { var ldir = normalize(vec3(lightPosition[0], lightPosition[1], lightPosition[2])); lightMarkerPos = scale(6.0, ldir); }
    else { lightMarkerPos = vec3(lightPosition[0], lightPosition[1], lightPosition[2]); }

    var sceneRoot = mat4();
    sceneRoot = mult(sceneRoot, translate(translationScene[0], translationScene[1], translationScene[2]));
    sceneRoot = mult(sceneRoot, rotateX(theta[0]));
    sceneRoot = mult(sceneRoot, rotateY(theta[1]));
    sceneRoot = mult(sceneRoot, rotateZ(theta[2]));
    sceneRoot = mult(sceneRoot, scale(scaleFactor, scaleFactor, scaleFactor));
    if (followCar) { sceneRoot = mult(sceneRoot, translate(-carPosition[0], -carPosition[1], -carPosition[2])); }

    var lightMarkerModel = mat4();
    lightMarkerModel = mult(lightMarkerModel, translate(lightMarkerPos[0] + lightOffset[0], lightMarkerPos[1] + lightOffset[1], lightMarkerPos[2]));
    var lightMarkerBase = mult(sceneRoot, lightMarkerModel);
    lightMarkerModel = mult(lightMarkerModel, scale(0.2, 0.2, 0.2));
    var lightMarkerCombined = mult(sceneRoot, lightMarkerModel);
    var markerWorldPos = mult(lightMarkerBase, vec4(0.0, 0.0, 0.0, 1.0));
    var markerEyePos = mult(viewMatrix, markerWorldPos);
    gl.uniform4fv(lightPositionLoc, flatten(vec4(markerEyePos[0], markerEyePos[1], markerEyePos[2], 1.0)));
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.6, 0.6, 0.0, 1.0), vec4(1.0, 1.0, 0.0, 1.0), vec4(0.2, 0.2, 0.0, 1.0), 20.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(lightMarkerCombined));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, lightMarkerCombined), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Body transform combined
    gl.bindVertexArray(bodyVAO);
    setMaterial(bodyMaterialAmbient, bodyMaterialDiffuse, bodyMaterialSpecular, bodyMaterialShininess);
    var bodyModelMatrix = mat4();
    bodyModelMatrix = mult(bodyModelMatrix, translate(carPosition[0], carPosition[1], carPosition[2]));
    bodyModelMatrix = mult(bodyModelMatrix, rotateY(rad2deg(carRotationY)));
    var bodyCombined = mult(sceneRoot, bodyModelMatrix);

    // Draw middle, front/back, wheels
    drawMiddleBody(bodyCombined);
    drawFrontnBack(bodyCombined);
    drawWheels(bodyCombined);

    requestAnimationFrame(render);
}

// --- Geometry helpers ---
function createWheelGeometry(radius, height, segments) {
    const vertices = []; const normals = []; const indices = []; let index = 0; const halfHeight = height / 2;
    for (let i = 0; i <= segments; i++) { const angle = (i / segments) * 2 * Math.PI; const x = radius * Math.cos(angle); const z = radius * Math.sin(angle); const nx = Math.cos(angle); const nz = Math.sin(angle); vertices.push(vec3(x, halfHeight, z)); normals.push(vec3(nx, 0, nz)); vertices.push(vec3(x, -halfHeight, z)); normals.push(vec3(nx, 0, nz)); }
    const sideVertices = (segments + 1) * 2; for (let i = 0; i < segments; i++) { const i0 = i * 2; const i1 = i0 + 1; const i2 = i0 + 2; const i3 = i0 + 3; indices.push(i0, i1, i2); indices.push(i1, i3, i2); }
    index = sideVertices;
    const topCenterIndex = index++; vertices.push(vec3(0, halfHeight, 0)); normals.push(vec3(0, 1, 0)); for (let i = 0; i <= segments; i++) { const angle = (i / segments) * 2 * Math.PI; const x = radius * Math.cos(angle); const z = radius * Math.sin(angle); vertices.push(vec3(x, halfHeight, z)); normals.push(vec3(0, 1, 0)); }
    const topStartIndex = topCenterIndex + 1; for (let i = 0; i < segments; i++) { indices.push(topCenterIndex, topStartIndex + i, topStartIndex + i + 1); }
    index += (segments + 1);
    const bottomCenterIndex = index++; vertices.push(vec3(0, -halfHeight, 0)); normals.push(vec3(0, -1, 0)); for (let i = 0; i <= segments; i++) { const angle = (i / segments) * 2 * Math.PI; const x = radius * Math.cos(angle); const z = radius * Math.sin(angle); vertices.push(vec3(x, -halfHeight, z)); normals.push(vec3(0, -1, 0)); }
    const bottomStartIndex = bottomCenterIndex + 1; for (let i = 0; i < segments; i++) { indices.push(bottomCenterIndex, bottomStartIndex + i + 1, bottomStartIndex + i); }
    return { vertices, normals, indices };
}

function createCubeGeometry(width, height, depth) {
    const w = width / 2, h = height / 2, d = depth / 2;
    const vertices = [ vec3(-w,-h,d), vec3(w,-h,d), vec3(w,h,d), vec3(-w,h,d), vec3(-w,-h,-d), vec3(-w,h,-d), vec3(w,h,-d), vec3(w,-h,-d), vec3(-w,h,-d), vec3(-w,h,d), vec3(w,h,d), vec3(w,h,-d), vec3(-w,-h,-d), vec3(w,-h,-d), vec3(w,-h,d), vec3(-w,-h,d), vec3(w,-h,-d), vec3(w,h,-d), vec3(w,h,d), vec3(w,-h,d), vec3(-w,-h,-d), vec3(-w,-h,d), vec3(-w,h,d), vec3(-w,h,-d) ];
    const normals = [ vec3(0,0,1), vec3(0,0,1), vec3(0,0,1), vec3(0,0,1), vec3(0,0,-1), vec3(0,0,-1), vec3(0,0,-1), vec3(0,0,-1), vec3(0,1,0), vec3(0,1,0), vec3(0,1,0), vec3(0,1,0), vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1,0), vec3(1,0,0), vec3(1,0,0), vec3(1,0,0), vec3(1,0,0), vec3(-1,0,0), vec3(-1,0,0), vec3(-1,0,0), vec3(-1,0,0) ];
    const indices = [0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23];
    return { vertices, normals, indices };
}

function createSteeringWheelGeometry(radius, thickness, segments) {
    const vertices = []; const normals = []; const indices = []; const majorRadius = radius; const minorRadius = thickness;
    for (let i = 0; i <= segments; i++) { const theta = (i / segments) * 2 * Math.PI; for (let j = 0; j <= segments; j++) { const phi = (j / segments) * 2 * Math.PI; const x = (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta); const y = (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta); const z = minorRadius * Math.sin(phi); vertices.push(vec3(x, y, z)); const centerX = majorRadius * Math.cos(theta); const centerY = majorRadius * Math.sin(theta); const nx = x - centerX; const ny = y - centerY; const nz = z; const len = Math.sqrt(nx*nx + ny*ny + nz*nz); normals.push(vec3(nx/len, ny/len, nz/len)); } }
    for (let i = 0; i < segments; i++) { for (let j = 0; j < segments; j++) { const first = i * (segments + 1) + j; const second = first + segments + 1; indices.push(first, second, first + 1); indices.push(second, second + 1, first + 1); } }
    return { vertices, normals, indices };
}
