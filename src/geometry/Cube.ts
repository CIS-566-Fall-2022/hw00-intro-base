import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }

  create() {
    this.indices = new Uint32Array(36);
    this.normals = new Float32Array(24);
    this.positions = new Float32Array(24);
    // Vertex position definition from each face perspective
    // front vertices:
    //  - left-bottom-front
    let lbf = new Float32Array([-0.5, -0.5, 0.5, 1]);
    //  - right-bottom-front
    let rbf = new Float32Array([0.5, -0.5, 0.5, 1]);
    //  - right-top-front
    let rtf = new Float32Array([0.5, 0.5, 0.5, 1]);
    //  - left-top-front
    let ltf = new Float32Array([-0.5, 0.5, 0.5, 1]);
    // back vertices: 
    // - left-bottom-back
    let lbb = new Float32Array([0.5, -0.5, -0.5, 1]);
    // right-bottom-back
    let rbb = new Float32Array([-0.5, -0.5, -0.5, 1]);
    // right-top-back
    let rtb = new Float32Array([-0.5, 0.5, -0.5, 1]);
    // left-top-back
    let ltb = new Float32Array([0.5, 0.5, -0.5, 1]);
    // Normals defintition:
    //  - front normal
    let fn = new Float32Array([0, 0, 1, 0]);
    //  - back normal
    let bn = new Float32Array([0, 0, -1, 0]);
    //  - right side normal
    let rn = new Float32Array([1, 0, 0, 0]);
    //  - left side normal
    let ln = new Float32Array([-1, 0, 0, 0]);
    //  - ceil normal
    let cn = new Float32Array([0, 1, 0, 0]);
    //  - ground normal
    let gn = new Float32Array([0, -1, 0, 0]);

    // Face definition order: front, right, back, left, bottom, top
    this.positions = Float32Array.of(...lbf, ...rbf, ...rtf, ...ltf,
                                ...rbf, ...lbb, ...ltb, ...rtf,
                                ...lbb, ...rbb, ...rtb, ...ltb,
                                ...rbb, ...lbf, ...ltf, ...rtb,
                                ...rbf, ...lbf, ...rbb, ...lbb,
                                ...ltf, ...rtf, ...ltb, ...rtb);

    this.normals = Float32Array.of(...fn, ...fn, ...fn, ...fn,
                                  ...rn, ...rn, ...rn, ...rn,
                                  ...bn, ...bn, ...bn, ...bn,
                                  ...ln, ...ln, ...ln, ...ln,
                                  ...gn, ...gn, ...gn, ...gn,
                                  ...cn, ...cn, ...cn, ...cn);
    // Index definition
    let idxCounter = 0;
    let idxArrayCounter = 0;
    for (let i = 0; i < 6; i++) {
      this.indices[idxArrayCounter++] = idxCounter;
      this.indices[idxArrayCounter++] = idxCounter + 1;
      this.indices[idxArrayCounter++] = idxCounter + 2;
      this.indices[idxArrayCounter++] = idxCounter;
      this.indices[idxArrayCounter++] = idxCounter + 2;
      this.indices[idxArrayCounter++] = idxCounter + 3;
      idxCounter += 4;
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

    console.log(`Created cube`);
  }
};

export default Cube;
