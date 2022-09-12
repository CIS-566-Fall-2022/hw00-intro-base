import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Cube from './geometry/Cube';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  color:[0, 1, 0, 1],
  shaders: 0,
  'Load Scene': loadScene // A function pointer, essentially
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;
let prevColor: number[] = [1, 0, 0, 1];
let starttime: number = Date.now();

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.addColor(controls, 'color');
  gui.add(controls, 'shaders', {Lambert: 0, Custom: 1});
  gui.add(controls, 'Load Scene');
  

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();
  prevColor = [0, 1, 0, 0.3];

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);
  //lambert.setGeometryColor(vec4.fromValues(controls.color[0]/255.0, controls.color[1]/255.0, controls.color[2]/255.0, controls.color[3]));

  const custom = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);
  //custom.setGeometryColor(vec4.fromValues(controls.color[0]/255.0, controls.color[1]/255.0, controls.color[2]/255.0, controls.color[3]));

  

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    //prevColor = controls.color;
    
    if(controls.color != prevColor){
      prevColor = controls.color;
      lambert.setGeometryColor(vec4.fromValues(controls.color[0]/255.0, controls.color[1]/255.0, controls.color[2]/255.0, controls.color[3]));
      custom.setGeometryColor(vec4.fromValues(controls.color[0]/255.0, controls.color[1]/255.0, controls.color[2]/255.0, controls.color[3]));
    }
    
    console.log(Date.now() - starttime);
    lambert.setTime(Date.now() - starttime);
    custom.setTime(Date.now() - starttime);
    if(controls.shaders == 0){
      renderer.render(camera, lambert, [
        //icosphere,
        //square,
        cube
      ]);
    }else{
      renderer.render(camera, custom, [
        // icosphere,
        // square,
        cube,
      ]);
    }


    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();

