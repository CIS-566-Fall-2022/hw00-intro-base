import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

// XZ plane
class Grid extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec3;
  sideLength: number;
  resolution: number;

  constructor(center: vec3, sideLength: number, resolution: number) {
    super(); // Call the constructor of the super class. This is required.
    this.center = center;
    this.sideLength = sideLength;
    this.resolution = resolution;
  }

  create() {
    let vertsPerSide = this.resolution + 1;
    let totalVerts = vertsPerSide * vertsPerSide;
    let corner = vec3.fromValues(this.center[0] - this.sideLength / 2.0, this.center[1], this.center[2] - this.sideLength / 2.0);

    this.indices = new Uint32Array(this.resolution * this.resolution * 6);
    this.normals = new Float32Array(totalVerts * 4);
    this.positions = new Float32Array(totalVerts * 4);
    
    let dx = 1.0 / vertsPerSide * this.sideLength;
    for (let i = 0; i < totalVerts; ++i) {
      let j = i * 4;

      this.normals[j] = 0;
      this.normals[j + 1] = 1;
      this.normals[j + 2] = 0;
      this.normals[j + 3] = 0;

      this.positions[j] = corner[0] + ((i % vertsPerSide) * dx);
      this.positions[j + 1] = corner[1];
      this.positions[j + 2] = corner[2] + ((i / vertsPerSide) * dx);
      this.positions[j + 3] = 1;
    }

    let nextIdx = 0;
    // up to but not including last vertex on a side
    for (let x = 0; x < this.resolution; ++x) {
      for (let z = 0; z < this.resolution; ++z) {
        let cornerVert = z * vertsPerSide + x;

        this.indices[nextIdx] = cornerVert;
        this.indices[nextIdx + 1] = cornerVert + 1;
        this.indices[nextIdx + 2] = cornerVert + vertsPerSide;

        this.indices[nextIdx + 3] = cornerVert + 1;
        this.indices[nextIdx + 4] = cornerVert + vertsPerSide;
        this.indices[nextIdx + 5] = cornerVert + vertsPerSide + 1;

        nextIdx += 6;
      }
    }

    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
  }
};

export default Grid;
