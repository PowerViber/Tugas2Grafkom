"use strict";

// Draw the middle body: top/bottom slabs, doors, steering wheel+column, pedals, and seats
function drawMiddleBody(bodyCombined) {
    // Requires globals: gl, bodyVAO, steeringWheelVAO, viewMatrix, modelViewMatrixLoc, nMatrixLoc,
    // setMaterial, bodyIndicesCount, steeringWheelIndicesCount,
    // bodyMaterialAmbient, bodyMaterialDiffuse, bodyMaterialSpecular, bodyMaterialShininess,
    // frontWheelSteerY, moveForward, brakePressed, moveBackward

    gl.bindVertexArray(bodyVAO);
    setMaterial(bodyMaterialAmbient, bodyMaterialDiffuse, bodyMaterialSpecular, bodyMaterialShininess);

    // Base dimensions
    const middleDepth = 2.0;
    const baseFullDepth = 4.0;
    const baseFullWidth = 2.0;
    const baseFullHeight = 1.0;
    const bodyWidth = 2.0;
    const bodyHeight = 1.0;
    const thinThickness = 0.1;

    // Top middle slab
    var topMiddleM = mult(mat4(), bodyCombined);
    topMiddleM = mult(topMiddleM, translate(0.0, bodyHeight / 2, 0.0));
    topMiddleM = mult(topMiddleM, scale(1.0, thinThickness / baseFullHeight, middleDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(topMiddleM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, topMiddleM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Bottom middle slab
    var bottomMiddleM = mult(mat4(), bodyCombined);
    bottomMiddleM = mult(bottomMiddleM, translate(0.0, -bodyHeight / 2, 0.0));
    bottomMiddleM = mult(bottomMiddleM, scale(1.0, thinThickness / baseFullHeight, middleDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(bottomMiddleM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, bottomMiddleM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Doors (front and rear)
    const frontDoorDepth = middleDepth / 2;
    const rearDoorDepth = middleDepth / 2;

    // Globals needed: rightDoorAngle, leftDoorAngle, rightRearDoorAngle, leftRearDoorAngle
    // Right front door (hinge at front)
    var rightFrontDoorM = mult(mat4(), bodyCombined);
    rightFrontDoorM = mult(rightFrontDoorM, translate(bodyWidth / 2, 0.0, middleDepth / 2));
    rightFrontDoorM = mult(rightFrontDoorM, rotateY(-rightDoorAngle));
    rightFrontDoorM = mult(rightFrontDoorM, translate(0.0, 0.0, -frontDoorDepth / 2));
    rightFrontDoorM = mult(rightFrontDoorM, scale(thinThickness / baseFullWidth, 0.8, frontDoorDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(rightFrontDoorM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, rightFrontDoorM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Left front door
    var leftFrontDoorM = mult(mat4(), bodyCombined);
    leftFrontDoorM = mult(leftFrontDoorM, translate(-bodyWidth / 2, 0.0, middleDepth / 2));
    leftFrontDoorM = mult(leftFrontDoorM, rotateY(leftDoorAngle));
    leftFrontDoorM = mult(leftFrontDoorM, translate(0.0, 0.0, -frontDoorDepth / 2));
    leftFrontDoorM = mult(leftFrontDoorM, scale(thinThickness / baseFullWidth, 0.8, frontDoorDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(leftFrontDoorM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, leftFrontDoorM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Right rear door (hinge in middle)
    var rightRearDoorM = mult(mat4(), bodyCombined);
    rightRearDoorM = mult(rightRearDoorM, translate(bodyWidth / 2, 0.0, 0.0));
    rightRearDoorM = mult(rightRearDoorM, rotateY(-rightRearDoorAngle));
    rightRearDoorM = mult(rightRearDoorM, translate(0.0, 0.0, -rearDoorDepth / 2));
    rightRearDoorM = mult(rightRearDoorM, scale(thinThickness / baseFullWidth, 0.8, rearDoorDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(rightRearDoorM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, rightRearDoorM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Left rear door
    var leftRearDoorM = mult(mat4(), bodyCombined);
    leftRearDoorM = mult(leftRearDoorM, translate(-bodyWidth / 2, 0.0, 0.0));
    leftRearDoorM = mult(leftRearDoorM, rotateY(leftRearDoorAngle));
    leftRearDoorM = mult(leftRearDoorM, translate(0.0, 0.0, -rearDoorDepth / 2));
    leftRearDoorM = mult(leftRearDoorM, scale(thinThickness / baseFullWidth, 0.8, rearDoorDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(leftRearDoorM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, leftRearDoorM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // --- Steering wheel ---
    gl.bindVertexArray(steeringWheelVAO);
    var steeringMaterialAmbient = vec4(0.1, 0.1, 0.1, 1.0);
    var steeringMaterialDiffuse = vec4(0.2, 0.2, 0.2, 1.0);
    var steeringMaterialSpecular = vec4(0.3, 0.3, 0.3, 1.0);
    var steeringMaterialShininess = 30.0;
    setMaterial(steeringMaterialAmbient, steeringMaterialDiffuse, steeringMaterialSpecular, steeringMaterialShininess);

    // Steering wheel rotation
    var steeringM = mult(mat4(), bodyCombined);
    steeringM = mult(steeringM, translate(0.5, 0.0, 0.7));
    steeringM = mult(steeringM, rotateZ((frontWheelSteerY / 0.6) * 720.0));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(steeringM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, steeringM), true)));
    gl.drawElements(gl.TRIANGLES, steeringWheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Steering column (body cube scaled thin)
    gl.bindVertexArray(bodyVAO);
    setMaterial(steeringMaterialAmbient, steeringMaterialDiffuse, steeringMaterialSpecular, steeringMaterialShininess);
    var columnM = mult(mat4(), bodyCombined);
    columnM = mult(columnM, translate(0.5, -0.15, 0.7));
    // columnM = mult(columnM, rotateY(-15));
    // columnM = mult(columnM, rotateX(20));
    columnM = mult(columnM, scale(0.025, 0.15, 0.025));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(columnM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, columnM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // --- Pedals ---
    // Gas pedal
    var gasPedalMaterialAmbient = vec4(0.3, 0.3, 0.3, 1.0);
    var gasPedalMaterialDiffuse = vec4(0.5, 0.5, 0.5, 1.0);
    var gasPedalMaterialSpecular = vec4(0.8, 0.8, 0.8, 1.0);
    var gasPedalMaterialShininess = 50.0;
    setMaterial(gasPedalMaterialAmbient, gasPedalMaterialDiffuse, gasPedalMaterialSpecular, gasPedalMaterialShininess);

    var gasPedalM = mult(mat4(), bodyCombined);
    gasPedalM = mult(gasPedalM, translate(0.35, -0.4, 0.8));
    gasPedalM = mult(gasPedalM, rotateX(75));
    gasPedalM = mult(gasPedalM, scale(0.05, 0.15, 0.02));

    // One pedal controls both forward and backward
    if (moveForward || moveBackward) { gasPedalM = mult(translate(0.0, -0.05, 0.0), gasPedalM); }
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(gasPedalM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, gasPedalM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Brake pedal
    var brakePedalMaterialAmbient = vec4(0.25, 0.25, 0.25, 1.0);
    var brakePedalMaterialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
    var brakePedalMaterialSpecular = vec4(0.7, 0.7, 0.7, 1.0);
    var brakePedalMaterialShininess = 50.0;
    setMaterial(brakePedalMaterialAmbient, brakePedalMaterialDiffuse, brakePedalMaterialSpecular, brakePedalMaterialShininess);

    var brakePedalM = mult(mat4(), bodyCombined);
    brakePedalM = mult(brakePedalM, translate(0.45, -0.4, 0.8));
    brakePedalM = mult(brakePedalM, rotateX(75));
    brakePedalM = mult(brakePedalM, scale(0.05, 0.15, 0.02));

    // Brake pedal responds only to braking
    if (brakePressed) { brakePedalM = mult(translate(0.0, -0.05, 0.0), brakePedalM); }
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(brakePedalM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, brakePedalM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // --- Seats ---
    setMaterial(vec4(0.2, 0.1, 0.05, 1.0), vec4(0.4, 0.2, 0.1, 1.0), vec4(0.3, 0.15, 0.1, 1.0), 20.0);

    // Driver seat
    // base
    var driverSeatBase = mult(mat4(), bodyCombined);
    driverSeatBase = mult(driverSeatBase, translate(0.45, -0.3, 0.25));
    driverSeatBase = mult(driverSeatBase, scale(0.2, 0.06, 0.1));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(driverSeatBase));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, driverSeatBase), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
    // back
    var driverSeatBack = mult(mat4(), bodyCombined);
    driverSeatBack = mult(driverSeatBack, translate(0.45, -0.1, 0.05));
    driverSeatBack = mult(driverSeatBack, rotateX(-10));
    driverSeatBack = mult(driverSeatBack, scale(0.2, 0.5, 0.04));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(driverSeatBack));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, driverSeatBack), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // RF seat
    // base
    var passengerSeatBase = mult(mat4(), bodyCombined);
    passengerSeatBase = mult(passengerSeatBase, translate(-0.45, -0.3, 0.25));
    passengerSeatBase = mult(passengerSeatBase, scale(0.2, 0.06, 0.1));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(passengerSeatBase));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, passengerSeatBase), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
    // back
    var passengerSeatBack = mult(mat4(), bodyCombined);
    passengerSeatBack = mult(passengerSeatBack, translate(-0.45, -0.1, 0.05));
    passengerSeatBack = mult(passengerSeatBack, rotateX(-10));
    passengerSeatBack = mult(passengerSeatBack, scale(0.2, 0.5, 0.04));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(passengerSeatBack));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, passengerSeatBack), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // LB seat
    // base
    var rearLeftSeatBase = mult(mat4(), bodyCombined);
    rearLeftSeatBase = mult(rearLeftSeatBase, translate(0.45, -0.3, -0.5));
    rearLeftSeatBase = mult(rearLeftSeatBase, scale(0.2, 0.06, 0.1));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(rearLeftSeatBase));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, rearLeftSeatBase), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
    // back
    var rearLeftSeatBack = mult(mat4(), bodyCombined);
    rearLeftSeatBack = mult(rearLeftSeatBack, translate(0.45, -0.1, -0.7));
    rearLeftSeatBack = mult(rearLeftSeatBack, rotateX(-10));
    rearLeftSeatBack = mult(rearLeftSeatBack, scale(0.2, 0.5, 0.04));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(rearLeftSeatBack));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, rearLeftSeatBack), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // RB seat
    // base
    var rearRightSeatBase = mult(mat4(), bodyCombined);
    rearRightSeatBase = mult(rearRightSeatBase, translate(-0.45, -0.3, -0.5));
    rearRightSeatBase = mult(rearRightSeatBase, scale(0.2, 0.06, 0.1));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(rearRightSeatBase));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, rearRightSeatBase), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
    // back
    var rearRightSeatBack = mult(mat4(), bodyCombined);
    rearRightSeatBack = mult(rearRightSeatBack, translate(-0.45, -0.1, -0.75));
    rearRightSeatBack = mult(rearRightSeatBack, rotateX(-10));
    rearRightSeatBack = mult(rearRightSeatBack, scale(0.2, 0.5, 0.04));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(rearRightSeatBack));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, rearRightSeatBack), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
}
