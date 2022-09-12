#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform float u_Time;
// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.




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
    vec3 pos = fs_Pos.xyz;
    vec3 q = vec3(0.3, 0.4, 0.5);
    float rand = perlin3D(pos);
    
    float r = cos(0.0001 * u_Time + rand) / 2.f + 0.3 * sin(fs_Pos.x * fs_Pos.y) + 0.7;
    float g = sin(0.0010 * u_Time + rand) / 3.f + 0.3 * cos(fs_Pos.y) + 0.7;
    float b = sin(0.0016 * u_Time + rand) / 2.f + 0.4 * sin(fs_Pos.z) + 0.7;
    
    vec4 color_final = vec4(r, g, b, 1.0);
    out_Col = color_final;
    
}

