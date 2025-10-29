"use strict";

// Draw all four wheels and their rim markers
function drawWheels(bodyCombined) {
    // Requires globals: gl, viewMatrix, modelViewMatrixLoc, nMatrixLoc,
    // wheelVAO, bodyVAO, setMaterial, wheelMaterialAmbient, wheelMaterialDiffuse,
    // wheelMaterialSpecular, wheelMaterialShininess, wheelIndicesCount, bodyIndicesCount,
    // frontWheelSteerY, wheelRotationXFront, wheelRotationXRear

    // Material for wheels
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);

    // Positions relative to body
    const frontDist = 1.5;
    const backDist = -1.5;
    const sideDist = 1.0;
    const heightDist = -0.3;

    // Front-Left Wheel
    var frontLeftWheelMatrix = mult(mat4(), bodyCombined);
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, translate(sideDist, heightDist, frontDist));
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateY(rad2deg(-frontWheelSteerY)));
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateX(rad2deg(wheelRotationXFront)));
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateZ(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(frontLeftWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, frontLeftWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Rim marker (front-left)
    var markerFL = mult(mat4(), frontLeftWheelMatrix);
    markerFL = mult(markerFL, translate(0.0, 0.0, 0.5));
    markerFL = mult(markerFL, scale(0.1, 0.1, 0.1));
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.1, 0.4, 0.1, 1.0), vec4(0.0, 1.0, 0.0, 1.0), vec4(0.2, 0.2, 0.2, 1.0), 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(markerFL));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, markerFL), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Front-Right Wheel
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);
    var frontRightWheelMatrix = mult(mat4(), bodyCombined);
    frontRightWheelMatrix = mult(frontRightWheelMatrix, translate(-sideDist, heightDist, frontDist));
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateY(rad2deg(-frontWheelSteerY)));
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateX(rad2deg(wheelRotationXFront)));
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateZ(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(frontRightWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, frontRightWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Rim marker (front-right)
    var markerFR = mult(mat4(), frontRightWheelMatrix);
    markerFR = mult(markerFR, translate(0.0, 0.0, 0.5));
    markerFR = mult(markerFR, scale(0.1, 0.1, 0.1));
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.1, 0.4, 0.1, 1.0), vec4(0.0, 1.0, 0.0, 1.0), vec4(0.2, 0.2, 0.2, 1.0), 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(markerFR));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, markerFR), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Back-Left Wheel
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);
    var backLeftWheelMatrix = mult(mat4(), bodyCombined);
    backLeftWheelMatrix = mult(backLeftWheelMatrix, translate(sideDist, heightDist, backDist));
    backLeftWheelMatrix = mult(backLeftWheelMatrix, rotateX(rad2deg(wheelRotationXRear)));
    backLeftWheelMatrix = mult(backLeftWheelMatrix, rotateZ(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(backLeftWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, backLeftWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Rim marker (back-left)
    var markerBL = mult(mat4(), backLeftWheelMatrix);
    markerBL = mult(markerBL, translate(0.0, 0.0, 0.5));
    markerBL = mult(markerBL, scale(0.1, 0.1, 0.1));
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.4, 0.1, 0.1, 1.0), vec4(1.0, 0.0, 0.0, 1.0), vec4(0.2, 0.2, 0.2, 1.0), 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(markerBL));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, markerBL), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Back-Right Wheel
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);
    var backRightWheelMatrix = mult(mat4(), bodyCombined);
    backRightWheelMatrix = mult(backRightWheelMatrix, translate(-sideDist, heightDist, backDist));
    backRightWheelMatrix = mult(backRightWheelMatrix, rotateX(rad2deg(wheelRotationXRear)));
    backRightWheelMatrix = mult(backRightWheelMatrix, rotateZ(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(backRightWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, backRightWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Rim marker (back-right)
    var markerBR = mult(mat4(), backRightWheelMatrix);
    markerBR = mult(markerBR, translate(0.0, 0.0, 0.5));
    markerBR = mult(markerBR, scale(0.1, 0.1, 0.1));
    gl.bindVertexArray(bodyVAO);
    setMaterial(vec4(0.4, 0.1, 0.1, 1.0), vec4(1.0, 0.0, 0.0, 1.0), vec4(0.2, 0.2, 0.2, 1.0), 10.0);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(markerBR));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, markerBR), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
}
