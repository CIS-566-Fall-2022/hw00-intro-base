#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

uniform float u_Time;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Pos;

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.
vec3 random3(vec3 p ) {
    float x = fract(sin((dot(p, vec3(127.1,311.7,191.999)))) * 43758.5453);
    float y = fract(sin((dot(p, vec3(269.5,183.3,154.645)))) * 43758.5453);
    float z = fract(sin((dot(p, vec3(420.6,631.2,183.453)))) * 43758.5453);

    return vec3(x, y, z);
}


float surflet3D(vec3 p, vec3 gridPoint) {
    // Compute the distance between p and the grid point along each axis, and warp it with a
    // quintic function so we can smooth our cells
    vec3 t2 = abs(p - gridPoint);

    vec3 poweroffive = vec3(t2.x * t2.x * t2.x * t2.x * t2.x, t2.y * t2.y * t2.y * t2.y * t2.y, t2.z * t2.z * t2.z * t2.z * t2.z);
    vec3 poweroffour = vec3(t2.x * t2.x * t2.x * t2.x, t2.y * t2.y * t2.y * t2.y , t2.z * t2.z * t2.z * t2.z );
    vec3 powerofthree = vec3(t2.x * t2.x * t2.x, t2.y * t2.y * t2.y, t2.z * t2.z * t2.z);


    vec3 t = vec3(1.f) - 6.f * poweroffive + 15.f * poweroffour - 10.f * powerofthree;
    // Get the random vector for the grid point (assume we wrote a function random2
    // that returns a vec2 in the range [0, 1])
    vec3 gradient = random3(gridPoint) * 2.f - vec3(1.f, 1.f, 1.f);
    // Get the vector from the grid point to P
    vec3 diff = p - gridPoint;
    // Get the value of our height field by dotting grid->P with our gradient
    float height = dot(diff, gradient);
    // Scale our height field (i.e. reduce it) by our polynomial falloff function
    return height * t.x * t.y * t.z;
}
//
float perlin3D(vec3 p) {
    float surfletSum = 0.f;
    // Iterate over the four integer corners surrounding uv
    for(int dx = 0; dx <= 1; ++dx) {
        for(int dy = 0; dy <= 1; ++dy) {
            for(int dz = 0; dz <= 1; ++dz) {
                surfletSum += surflet3D(p, (floor(p) + vec3(dx, dy, dz)));
            }
        }
    }
    return surfletSum;
}


void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.
    vec4 noisepos = vec4(sin(perlin3D(vs_Pos.xyz) * u_Time * 0.5));
    float noise = perlin3D(vs_Pos.xyz);
    //float t = sin(0.02 * float(u_Time)/ 100.f);
    float t = 0.8 * sin(0.001 * float(u_Time));
    
    vec4 pos = vs_Pos + noise * fs_Nor;
    vec4 target_pos = vs_Nor * 0.04f;
    
    
    vec4 modelposition = u_Model * (pos);
    modelposition = mix(modelposition, target_pos, t);
    //vec4 modelposition = u_Model * vs_Pos;   // Temporarily store the transformed vertex positions for use below
    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies
    modelposition += vec4(0.5 * sin(u_Time * 0.14/100.0f + noisepos[0]),
                          0.5 * cos(u_Time * 0.24/100.0f),
                          0.5 * sin(u_Time * 0.04/100.0f),
                             0);

    fs_Pos = modelposition;
    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
