import {vec3} from 'gl-matrix';
import {vec4} from 'gl-matrix';

const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';

import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  'Shader': 0,
  'Color': [ 0, 128, 255 ],
  'Shaders': 'Lambert',

};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let time: vec4 = vec4.fromValues(0, 0, 0, 0);
let color: vec4; 

let prevTesselations: number = 5;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(3, 0, 0), 1, controls.tesselations);
  icosphere.create();
  
  square = new Square(vec3.fromValues(-2, 0, 0));
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
  gui.add(controls, 'Load Scene');
  gui.addColor(controls, 'Color');
  gui.add(controls, 'Shader', 0, 1).step(1);
  gui.add(controls, 'Shaders', [ 'Lambert', 'Perlin Noise', 'Transform' ] );

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

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);
  const perlin = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/perlin-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/perlin-frag.glsl')),
  ]);
  const transform = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/transform-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);
  // This function will be called every frame
  function tick() {
    time = vec4.fromValues(time[0] + 0.01,0,0,0);
    color = vec4.fromValues(controls.Color[0] /255, controls.Color[1] / 255, controls.Color[2] / 255, 1);
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(3, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    var shader;
    if(controls.Shaders == 'Lambert'){
      shader = lambert;
      renderer.render(camera, time, color, shader, [
        cube,  icosphere,
      ]);
    }
    if(controls.Shaders == 'Perlin Noise'){
      shader = perlin;
      renderer.render(camera, time, color, shader, [
        cube,  icosphere,
      ]);
    }
    if(controls.Shaders == 'Transform'){
      shader = transform;
      renderer.render(camera, time, color, shader, [
        cube,  
      ]);
    }
    // renderer.render(camera, time, color, shader, [
    //   cube,  
    // ]);

    // if(controls.Shader == 0){
    //   renderer.render(camera, time, color, lambert, [
    //     icosphere,      
    //   ]);
    //   renderer.render(camera, time, color, lambert, [
    //     cube,
    //   ]);
    // }else {
    //   renderer.render(camera, time, color, perlin, [
    //     icosphere,      
    //   ]);
    //   renderer.render(camera, time, color, perlin, [
    //     cube,
    //   ]);
    // }

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
