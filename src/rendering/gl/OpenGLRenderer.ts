import {mat4, vec3, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>, ucolor: vec3, myTime: number, myFreq: number,
  myNoiseFreq: number, myNoiseAmp: number, myNoisePersistence: number, myNoiseOctaves: number, myLightPos: vec4, myLightCol: vec3, 
  myRoughness: vec4, myMetallic: vec4) {
    let model = mat4.create();
    let viewProj = mat4.create();
    let color = vec4.fromValues(ucolor[0], ucolor[1], ucolor[2], 1);
	let lightColor = vec4.fromValues(myLightCol[0], myLightCol[1], myLightCol[2], 1);
	let camPos = vec4.fromValues(camera.controls.eye[0], camera.controls.eye[1], camera.controls.eye[2], 1);

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(color);
	prog.setTime(myTime);
	prog.setFreq(myFreq);
	prog.setNoiseFreq(myNoiseFreq);
	prog.setNoiseAmp(myNoiseAmp);
	prog.setNoisePersistence(myNoisePersistence);
	prog.setNoiseOctaves(myNoiseOctaves);
	prog.setLightPos(myLightPos);
	prog.setLightCol(lightColor);
	
	prog.setRoughness(myRoughness);
	prog.setMetallic(myMetallic);
	
	prog.setCamPos(camPos);

	for (let z = 0; z < 100; z += 1) {
		for (let x = 0; x < 100; x += 1) {
			let model = mat4.create();
			mat4.fromScaling(model, vec3.fromValues(0.1,0.1,0.1));
			mat4.translate(model, model, vec3.fromValues(x, 0,z));
			prog.setModelMatrix(model);
			prog.setCubePos(vec4.fromValues(x / 10.0, 0,z / 10.0, 1));
			
			
			
			prog.draw(drawables[0]);
			
		}
	}
  }
};

export default OpenGLRenderer;
