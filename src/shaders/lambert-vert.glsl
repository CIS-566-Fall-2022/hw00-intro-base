#version 300 es

// #define PASSTHROUGH

// #define NORMAL_DISPLACEMENT

#define DISPLACEMENT_SCALE 0.4

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;

in vec4 vs_Pos;
in vec4 vs_Nor;

uniform vec4 u_Color;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;
out vec4 fs_Pos;

const vec4 lightPos = vec4(5, 5, 3, 1);

uniform float u_Time;

void main()
{
    fs_Col = u_Color;

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);

    vec4 modelPosition = u_Model * vs_Pos;

    vec4 displacedPos = modelPosition;

#ifndef PASSTHROUGH
    displacedPos.y *= mix(0.1, 0.8, (cos(u_Time / 500.0) + 1.0) / 2.0);
    displacedPos.x += sin(u_Time / 250.0 + displacedPos.y);
    displacedPos.z += 2.0 * (sin(displacedPos.y) + cos(displacedPos.x));

#ifdef NORMAL_DISPLACEMENT
    float uvScale = 10.0;
    float displacementNormal = sin(displacedPos.x * uvScale) + cos(displacedPos.y * uvScale) + sin(displacedPos.z * uvScale);
    displacedPos.xyz += displacementNormal.xyz * vs_Nor.xyz * 0.2;
#else
    float uvScale = 7.0;
    displacedPos.xyz += vec3(sin(displacedPos.z * uvScale), cos(displacedPos.x * uvScale), sin(displacedPos.y * uvScale)) * 0.3;
#endif

    float displacementFactor = abs(fract(u_Time / 7682.39) * 2.0 - 1.0);
    displacementFactor = smoothstep(0., 1., displacementFactor) * DISPLACEMENT_SCALE;
    displacedPos = mix(modelPosition, displacedPos, displacementFactor);
#endif

    fs_LightVec = lightPos - displacedPos;

    fs_Pos = displacedPos;

    gl_Position = u_ViewProj * displacedPos;
}
