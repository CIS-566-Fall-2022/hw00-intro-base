import {vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifCubePos: WebGLUniformLocation;
  
  unifFreq: WebGLUniformLocation;
  unifNoiseFreq: WebGLUniformLocation;
  unifNoiseAmp: WebGLUniformLocation;
  unifNoisePersistence: WebGLUniformLocation;
  unifNoiseOctaves: WebGLUniformLocation;
  
  unifLightPos: WebGLUniformLocation;
  unifLightCol: WebGLUniformLocation;
  
  unifRoughness: WebGLUniformLocation;
  unifMetallic: WebGLUniformLocation;
  
  unifCamPos: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
	this.unifTime       = gl.getUniformLocation(this.prog, "u_Time");
	this.unifCubePos    = gl.getUniformLocation(this.prog, "u_CubePos");
	
	
	this.unifFreq    = gl.getUniformLocation(this.prog, "u_Freq");
	this.unifNoiseFreq    = gl.getUniformLocation(this.prog, "u_NoiseFreq");
	this.unifNoiseAmp    = gl.getUniformLocation(this.prog, "u_NoiseAmp");
	this.unifNoisePersistence    = gl.getUniformLocation(this.prog, "u_NoisePersistence");
	this.unifNoiseOctaves    = gl.getUniformLocation(this.prog, "u_NoiseOctaves");
	
	this.unifLightPos    = gl.getUniformLocation(this.prog, "u_LightPos");
	this.unifLightCol    = gl.getUniformLocation(this.prog, "u_LightCol");
	
	this.unifRoughness    = gl.getUniformLocation(this.prog, "u_Roughness");
	this.unifMetallic    = gl.getUniformLocation(this.prog, "u_Metallic");
	
	this.unifCamPos    = gl.getUniformLocation(this.prog, "u_CamPos");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
  }
  
  setTime(myTime: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1i(this.unifTime, myTime);
    }
  }
  
  setCubePos(myPos: vec4) {
    this.use();
    if (this.unifCubePos !== -1) {
      gl.uniform4fv(this.unifCubePos, myPos);
    }
  }
  
  setFreq(myFreq: number) {
    this.use();
    if (this.unifFreq !== -1) {
      gl.uniform1f(this.unifFreq, myFreq);
    }
  }
  
  setNoiseFreq(myNoiseFreq: number) {
    this.use();
    if (this.unifNoiseFreq !== -1) {
      gl.uniform1f(this.unifNoiseFreq, myNoiseFreq);
    }
  }
  
  setNoiseAmp(myNoiseAmp: number) {
    this.use();
    if (this.unifNoiseAmp !== -1) {
      gl.uniform1f(this.unifNoiseAmp, myNoiseAmp);
    }
  }
  
  setNoisePersistence(myNoisePersistence: number) {
    this.use();
    if (this.unifNoisePersistence !== -1) {
      gl.uniform1f(this.unifNoisePersistence, myNoisePersistence);
    }
  }
  
  setNoiseOctaves(myNoiseOctaves: number) {
    this.use();
    if (this.unifNoiseOctaves !== -1) {
      gl.uniform1i(this.unifNoiseOctaves, myNoiseOctaves);
    }
  }
  
  setLightPos(myLightPos: vec4) {
    this.use();
    if (this.unifLightPos !== -1) {
      gl.uniform4fv(this.unifLightPos, myLightPos);
    }
  }
  
  setLightCol(myLightCol: vec4) {
    this.use();
    if (this.unifLightCol !== -1) {
      gl.uniform4fv(this.unifLightCol, myLightCol);
    }
  }
  
  setRoughness(myRoughness: vec4) {
    this.use();
    if (this.unifRoughness !== -1) {
      gl.uniform4fv(this.unifRoughness, myRoughness);
    }
  }
  
  setMetallic(myMetallic: vec4) {
    this.use();
    if (this.unifMetallic !== -1) {
      gl.uniform4fv(this.unifMetallic, myMetallic);
    }
  }
  
  setCamPos(myCamPos: vec4) {
    this.use();
    if (this.unifCamPos !== -1) {
      gl.uniform4fv(this.unifCamPos, myCamPos);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
