import {mat4, vec4} from 'gl-matrix';
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

  render(camera: Camera, time: number, meshColor : Array<number>, prog: ShaderProgram, drawables: Array<Drawable>, rotates : boolean) {
    let model = mat4.create();
    let viewProj = mat4.create();

    let color = vec4.fromValues(meshColor[0] / 255.0, 
                                meshColor[1] / 255.0, 
                                meshColor[2] / 255.0, meshColor[3]);
    let camPos = vec4.fromValues(camera.controls.eye[0], 
                                  camera.controls.eye[1], 
                                  camera.controls.eye[2], 
                                  1);
    mat4.identity(model);
    let sunPos : Array<number> = [3.5 * Math.cos(time / 400.0), 3.5 * Math.sin(time / 400.0), 0, 1];
    prog.setLightPos(vec4.fromValues(sunPos[0], sunPos[1], sunPos[2], sunPos[3]));
    if (rotates)
    {
      mat4.scale(model, model, [2,2,2])
      mat4.translate(model, model, [sunPos[0], sunPos[1], sunPos[2]]);
      prog.setLightPos(camPos);
    }
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(color);
    prog.setTime(time);
    prog.setCamPos(camPos)
    
    for (let drawable of drawables) {
      prog.draw(drawable);
    }
  }
};

export default OpenGLRenderer;
