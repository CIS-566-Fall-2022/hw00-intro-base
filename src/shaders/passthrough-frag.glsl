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

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec3 fs_ViewVec;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.


// Copied from 5600 slides. 

vec3 random3(vec3 p)
{
    return fract(sin(vec3(dot(p,vec3(127.1, 311.7, 234)),
                          dot(p,vec3(269.5, 183.3, 123)),
                          dot(p, vec3(420.6, 631.2, 411))
                    )) * 43758.5453);
}


float surflet(vec3 p, vec3 gridPoint)
{
    // Compute the distance between p and the grid point along each axis, and warp it with a
    // quintic function so we can smooth our cells
    vec3 t2 = abs(p - gridPoint);
    vec3 t = vec3(1.0) - 6.0 * pow(t2, vec3(5.0)) + 15.0 * pow(t2, vec3(4.0)) - 10.0 * pow(t2, vec3(3.0));
    // Get the random vector for the grid point (assume we wrote a function random2
    // that returns a vec2 in the range [0, 1])
    vec3 gradient = random3(vec3(gridPoint)) * 2.0 - vec3(1, 1, 1);
    // Get the vector from the grid point to P
    vec3 diff = p - gridPoint;
    // Get the value of our height field by dotting grid->P with our gradient
    float height = dot(diff, gradient);
    // Scale our height field (i.e. reduce it) by our polynomial falloff function
    return height * t.x * t.y * t.z;
}

float perlinNoise3D(vec3 p)
{
	float surfletSum = 0.f;
	// Iterate over the four integer corners surrounding uv
	for(int dx = 0; dx <= 1; dx++) {
		for(int dy = 0; dy <= 1; dy++) {
			for(int dz = 0; dz <= 1; dz++) {
				surfletSum += surflet(p, floor(p) + vec3(dx, dy, dz));
			}
		}
	}
	return surfletSum;
}


void main()
{
        // Material base color (before shading)
        vec4 diffuseColor = u_Color;
        float noise = perlinNoise3D(vec3(fs_Pos) * 25.0);
        diffuseColor = mix(u_Color, vec4(1, 1, 1, 1), noise); 
        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        float exponent = 5.0;
        float specularIntensity = max(pow(dot(normalize((vec3(fs_LightVec) + vec3(fs_ViewVec)) / 2.0), normalize(vec3(fs_Nor))), exponent), 0.0);
        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm + specularIntensity ;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}
