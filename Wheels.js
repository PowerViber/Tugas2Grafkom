"use strict";

// Draw all four wheels and their rim markers
function drawWheels(bodyCombined) {
    // Requires globals: gl, viewMatrix, modelViewMatrixLoc, nMatrixLoc,
    // wheelVAO, bodyVAO, setMaterial, wheelMaterialAmbient, wheelMaterialDiffuse,
    // wheelMaterialSpecular, wheelMaterialShininess, wheelIndicesCount, bodyIndicesCount,
    // frontWheelSteerY, wheelRotationXFront, wheelRotationXRear

    // Local helper: radians -> degrees (avoid cross-file dependency)
    const r2d = (r) => (r * 180.0 / Math.PI);

    // Bind wheel texture and enable texturing
    if (typeof wheelTexture !== 'undefined' && wheelTexture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, wheelTexture);
        gl.uniform1i(textureSamplerLoc, 0);
        gl.uniform1i(useTextureLoc, true);
    } else {
        gl.uniform1i(useTextureLoc, false);
    }

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
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateY(r2d(-frontWheelSteerY)));
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateX(r2d(wheelRotationXFront)));
    frontLeftWheelMatrix = mult(frontLeftWheelMatrix, rotateZ(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(frontLeftWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, frontLeftWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Front-Right Wheel
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);
    var frontRightWheelMatrix = mult(mat4(), bodyCombined);
    frontRightWheelMatrix = mult(frontRightWheelMatrix, translate(-sideDist, heightDist, frontDist));
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateY(r2d(-frontWheelSteerY)));
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateX(r2d(wheelRotationXFront)));
    frontRightWheelMatrix = mult(frontRightWheelMatrix, rotateZ(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(frontRightWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, frontRightWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Back-Left Wheel
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);
    var backLeftWheelMatrix = mult(mat4(), bodyCombined);
    backLeftWheelMatrix = mult(backLeftWheelMatrix, translate(sideDist, heightDist, backDist));
    backLeftWheelMatrix = mult(backLeftWheelMatrix, rotateX(r2d(wheelRotationXRear)));
    backLeftWheelMatrix = mult(backLeftWheelMatrix, rotateZ(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(backLeftWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, backLeftWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Back-Right Wheel
    gl.bindVertexArray(wheelVAO);
    setMaterial(wheelMaterialAmbient, wheelMaterialDiffuse, wheelMaterialSpecular, wheelMaterialShininess);
    var backRightWheelMatrix = mult(mat4(), bodyCombined);
    backRightWheelMatrix = mult(backRightWheelMatrix, translate(-sideDist, heightDist, backDist));
    backRightWheelMatrix = mult(backRightWheelMatrix, rotateX(r2d(wheelRotationXRear)));
    backRightWheelMatrix = mult(backRightWheelMatrix, rotateZ(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(backRightWheelMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, backRightWheelMatrix), true)));
    gl.drawElements(gl.TRIANGLES, wheelIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Optional: leave texture state enabled; render() draws wheels last.
    // If needed elsewhere, we could disable here with gl.uniform1i(useTextureLoc, false);
}
