#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.
precision highp float;
precision highp int;

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself
			
uniform int u_Time;

uniform vec4 u_CubePos;

uniform float u_Freq;
uniform float u_NoiseFreq;
uniform float u_NoiseAmp;
uniform float u_NoisePersistence;
uniform int   u_NoiseOctaves;

uniform vec4 u_LightPos;


in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Pos;			// 
out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.


/////////////////////////////////////////////////////////////////////////////////////////////////
// 3D FBM implementation

float random3D(vec3 input_vals) {
	return fract(sin(dot(input_vals, vec3(1340.11f, 1593.46f, 942.25f))) * 38945.13f);
}

float interpolate3D_cubic(vec3 input_vals) {
    vec3 input_fract = fract(input_vals);
	vec3 input_floor = floor(input_vals);
	
	// generate the random values associated with the 8 points on our grid
	float bottom_left_front = random3D(input_floor);
	float bottom_left_back = random3D(input_floor + vec3(0,0,1));
	float bottom_right_front = random3D(input_floor + vec3(1,0,0));
	float bottom_right_back = random3D(input_floor + vec3(1,0,1));
	float top_left_front = random3D(input_floor + vec3(0,1,0));
	float top_left_back = random3D(input_floor + vec3(0,1,1));
	float top_right_front = random3D(input_floor + vec3(1,1,0));
	float top_right_back = random3D(input_floor + vec3(1,1,1));

	float t_x = smoothstep(0.0, 1.0, input_fract.x);
	float t_y = smoothstep(0.0, 1.0, input_fract.y);
	float t_z = smoothstep(0.0, 1.0, input_fract.z);

    float interpX_bottom_front = mix(bottom_left_front, bottom_right_front, t_x);
    float interpX_bottom_back = mix(bottom_left_back, bottom_right_back, t_x);
    float interpX_top_front = mix(top_left_front, top_right_front, t_x);
    float interpX_top_back = mix(top_left_back, top_right_back, t_x);

    float interpY_front = mix(interpX_bottom_front, interpX_top_front, t_y);
    float interpY_bottom = mix(interpX_bottom_back, interpX_top_back, t_y);

    return mix(interpY_front, interpY_bottom, t_z);
}

float fbm(vec3 p, float amp, float freq, float persistence, int octaves) {
    float sum = 0.0;
    for(int i = 0; i < octaves; ++i) {
        sum += interpolate3D_cubic(p * freq) * amp;
        amp *= persistence;
        freq *= 2.0;
    }
    return sum;
}

/////////////////////////////////////////////////////////////////////////////////////////////////

void main()
{
	float amp = u_NoiseAmp;
	float freq = u_NoiseFreq;
	int octaves = u_NoiseOctaves;

	float myTime = float(u_Time) / u_Freq;

    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

	
	mat4 modelMat = u_Model;
	
	
	
	
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.

	
    vec4 modelposition = modelMat * vs_Pos;   // Temporarily store the transformed vertex positions for use below
	
	float newYVal = (fbm(vec3(u_CubePos.x + 0.1, u_CubePos.y, u_CubePos.z + 0.1) + vec3(myTime, 0.0,0.0), amp, freq, u_NoisePersistence, octaves) * 2.0) + 0.25;

	newYVal = newYVal * newYVal * newYVal;

	
	mat4 translMat = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, newYVal, 0, 1);
	mat4 scaleMat = mat4(1, 0, 0, 0, 0, newYVal * 2.0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	modelMat = modelMat * translMat * scaleMat;
	modelposition = modelMat * vs_Pos;

    fs_LightVec = u_LightPos - modelposition;  // Compute the direction in which the light source lies
	
	fs_Pos = modelposition;

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
