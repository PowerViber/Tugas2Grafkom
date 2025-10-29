"use strict";

// Draw front (engine + hood) and back (trunk + door)
function drawFrontnBack(bodyCombined) {
    // Requires globals: gl, bodyVAO, viewMatrix, modelViewMatrixLoc, nMatrixLoc,
    // setMaterial, bodyIndicesCount, bodyMaterialAmbient, bodyMaterialDiffuse, bodyMaterialSpecular, bodyMaterialShininess,
    // hoodAngle, trunkAngle,
    // useTextureLoc // <-- BARU

    gl.uniform1i(useTextureLoc, false); // BARU: Nonaktifkan tekstur untuk semua bagian tubuh

    gl.bindVertexArray(bodyVAO);
    setMaterial(bodyMaterialAmbient, bodyMaterialDiffuse, bodyMaterialSpecular, bodyMaterialShininess);

    const middleDepth = 2.0;
    const frontDepth = 1.0;
    const backDepth = 1.0;
    const baseFullDepth = 4.0;

    // Front: Engine (0.4) + Hood (0.1)
    const engineH = 0.4;
    const hoodH = 0.1;
    const frontCenterZ = (middleDepth/2) + (frontDepth/2);
    const hoodPivotZ = (middleDepth/2);
    const engineCenterY = -0.05;
    const hoodCenterY = 0.20;

    // Engine block
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

    // Back: Trunk (0.6) + Trunk Door (0.15)
    const trunkH = 0.6;
    const doorH = 0.15; // consider 0.2 if desired
    const backCenterZ = -(middleDepth/2) - (backDepth/2);
    const trunkPivotZ = -(middleDepth/2);
    const trunkCenterY = -0.05;
    const doorCenterY = 0.30;

    // Trunk
    var trunkM = mult(mat4(), bodyCombined);
    trunkM = mult(trunkM, translate(0.0, trunkCenterY, backCenterZ));
    trunkM = mult(trunkM, scale(1.0, trunkH, backDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(trunkM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, trunkM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);

    // Trunk door
    var doorM = mult(mat4(), bodyCombined);
    doorM = mult(doorM, translate(0.0, 0.0, trunkPivotZ));
    doorM = mult(doorM, rotateX(trunkAngle));
    doorM = mult(doorM, translate(0.0, doorCenterY, -backDepth/2));
    doorM = mult(doorM, scale(1.0, doorH, backDepth / baseFullDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(doorM));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(normalMatrix(mult(viewMatrix, doorM), true)));
    gl.drawElements(gl.TRIANGLES, bodyIndicesCount, gl.UNSIGNED_SHORT, 0);
}
