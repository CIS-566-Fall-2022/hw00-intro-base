import {vec3, vec4} from 'gl-matrix';
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
  color: [ 255,0,0 ],
  time_frequency: 100.0,
  noise_frequency: 1.7,
  noise_amp: 0.5,
  noise_persistence: 0.5,
  noise_octaves: 2,
  light_pos_x: 5.0,
  light_pos_y: 5.0,
  light_pos_z: 3.0,
  light_color: [ 255,255,255 ],
  mat_roughness: 0.5,
  mat_metallic: 0.5,
  'Load Scene': loadScene, // A function pointer, essentially
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let objArray: Array<Cube> = new Array(1);
let prevTesselations: number = 5;
let myTime: number = 0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  for (let x = 0; x < 1; x += 1) {
	  objArray[x] = new Cube(vec3.fromValues(0, 0, 0));
	  objArray[x].create();
	}
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
  gui.add(controls, 'time_frequency', 10.0, 500.0).step(10.0);
  
  gui.add(controls, 'noise_frequency', 0.1, 8.0).step(0.1);
  gui.add(controls, 'noise_amp', 0.1, 2.0).step(0.1); 
  gui.add(controls, 'noise_persistence', 0.1, 2.0).step(0.1);
  gui.add(controls, 'noise_octaves', 1, 8).step(1);
  
  gui.add(controls, 'light_pos_x', -10.0, 25.0).step(0.5);
  gui.add(controls, 'light_pos_y', 0.1, 10.0).step(0.1);
  gui.add(controls, 'light_pos_z', -10.0, 25.0).step(0.5);
  gui.addColor(controls, 'light_color');
  
  gui.add(controls, 'mat_roughness', 0.0, 1.0).step(0.01);
  gui.add(controls, 'mat_metallic', 0.0, 1.0).step(0.01);
  
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

  const camera = new Camera(vec3.fromValues(12.5, 2.5, 12.5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
	let color = vec3.fromValues(controls.color[0] / 255.0, controls.color[1] / 255.0, controls.color[2] / 255.0);
	let lightColor = vec3.fromValues(controls.light_color[0] * 2.0, controls.light_color[1] * 2.0, controls.light_color[2] * 2.0);
	let lightPos = vec4.fromValues(controls.light_pos_x, controls.light_pos_y, controls.light_pos_z, 1);
	let roughness_vals = vec4.fromValues(controls.mat_roughness, 0,0,0);
	let metallic_vals = vec4.fromValues(controls.mat_metallic, 0,0,0);
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    renderer.render(camera, lambert, objArray, color, myTime, controls.time_frequency, 
					controls.noise_frequency, controls.noise_amp, controls.noise_persistence, controls.noise_octaves, 
					lightPos, lightColor, roughness_vals, metallic_vals);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
	myTime = myTime + 1;
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
