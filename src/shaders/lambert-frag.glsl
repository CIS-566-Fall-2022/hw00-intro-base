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
precision highp int;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform int u_Time;
uniform vec4 u_CubePos;

uniform float u_Freq;
uniform float u_NoiseFreq;
uniform float u_NoiseAmp;
uniform float u_NoisePersistence;
uniform int   u_NoiseOctaves;

uniform vec4 u_LightPos;
uniform vec4 u_LightCol;

uniform vec4 u_Roughness;
uniform vec4 u_Metallic;

uniform vec4 u_CamPos;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.
				  
				  
const float PI = 3.14159f;

/////////////////////////////////////////////////////////////////////////////////////////////////
// GGX functions borrowed from my 561 implementation

vec3 fresnelReflectance(float cosViewingAngle, vec3 R) {
    float cosTheta = clamp(1.0f - cosViewingAngle, 0.0f, 1.0f);
    return R + ((1.0f - R) * pow(cosTheta, 5.0f));
}

float microfacetSelfShadow(float roughness, vec3 wo, vec3 wi, vec3 n) {
    float k = ((roughness + 1.0f) * (roughness + 1.0f)) / 8.0f;
    float nDotWo = max(0.0f, dot(n, wo));
    float nDotWi = max(0.0f, dot(n, wi));
    float schlickWo = nDotWo / ((nDotWo * (1.0f - k)) + k);
    float schlickWi = nDotWi / ((nDotWi * (1.0f - k)) + k);
    return schlickWo * schlickWi;


}

float microfacetDistrib(float roughness, vec3 n, vec3 wh) {
    float nDotWh = max(0.0f, dot(n, wh));
    float roughnessSq = roughness * roughness;
    float alphaSq = roughnessSq * roughnessSq;
    float innerDenom = (nDotWh * nDotWh * (alphaSq - 1.0f)) + 1.0f;
    float denom = PI * innerDenom * innerDenom;
    return alphaSq / denom;
}
				  
/////////////////////////////////////////////////////////////////////////////////////////////////			 


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
	float persistence = u_NoisePersistence;
	int octaves = u_NoiseOctaves;
	
	vec3 normal = normalize(fs_Nor.xyz);
	
	float myTime = float(u_Time) / u_Freq;

	float noise_Pos = fbm(u_CubePos.xyz + vec3(myTime, 0.0,0.0), amp, freq, persistence, octaves);
	float noise_Pos_fs = fbm(fs_Pos.xyz + vec3(myTime, 0.0,0.0), amp, freq, persistence, octaves);
	
	float newYVal = (fbm(u_CubePos.xyz + vec3(myTime, 0.0,0.0), amp, freq, persistence, octaves) * 2.0) + 0.25;
	newYVal = newYVal * newYVal * newYVal;
	
	vec4 diffuseColor = vec4(1,1,1, 1.0f);
	
	float noise_Col_val = fbm(u_Color.xyz, amp, freq, persistence, octaves);
	float noise_Pos_const = fbm(u_CubePos.xyz, amp, freq, persistence, octaves);
	
	// cosine color palette
    vec4 a = vec4(.41,.87, noise_Pos_const, 0);
    vec4 b = vec4(noise_Col_val,.69,.34, 0);
    vec4 c = vec4(1.0,1.0,1.0, 0.0);
    vec4 d = vec4(0.31,0.52,0.89, 0);

    vec4 noise_Col = a + b * cos(2.0 * 3.1416 * (c * u_Color + d));
	
	if (newYVal < 2.0) {
		diffuseColor = vec4(0,0,1,0) * noise_Pos_fs + noise_Col;
	}
	else if (newYVal < 4.0) {
		diffuseColor = vec4(0,1,0,0) * noise_Pos_fs + noise_Col;
	}
	else if (newYVal < 6.0) {
		diffuseColor = vec4(0.75,0.75,0.75,0) * noise_Pos_fs + noise_Col;
	}
	else if (newYVal < 8.0) {
		diffuseColor = vec4(1,1,1,0) * noise_Pos_fs + noise_Col;
	}
	else {
		diffuseColor = vec4(0.94, 0.45, 0.11 ,0) * noise_Pos_fs + noise_Col;
	}
		
		
	// GGX shading (borrowed from my 561 implementation)
	vec3 Lo = vec3(0,0,0);
	
	// attenuate intensity inverse square law
	vec3 fragToLightPos = u_LightPos.xyz - fs_Pos.xyz;
	float distanceSq = dot(fragToLightPos, fragToLightPos);
	float inverseDistanceSq = 1.0f / distanceSq;
	vec3 ithLightIrradiance = u_LightCol.xyz * inverseDistanceSq;

	// get wi, wo, wh
	vec3 wi = normalize(fragToLightPos);
	vec3 wo = normalize(u_CamPos.xyz - fs_Pos.xyz);
	vec3 wh = normalize(wo + wi);

	// R term
	vec3 R = mix(vec3(0.04), diffuseColor.xyz, u_Metallic[0]);

	// F term
	vec3 F = fresnelReflectance(max(dot(wh, wo), 0.0), R);

	// G term
	float G = microfacetSelfShadow(u_Roughness[0], wo, wi, normal);

	// D term
	float D = microfacetDistrib(u_Roughness[0], normal, wh);

	// compute cook-torrance
	vec3 f_cook_torrance = vec3(0,0,0);
	if (dot(normal, wi) >= 0.00001 && dot(normal, wo) >= 0.00001) {
		f_cook_torrance = (D*G*F) / (4.0f * dot(normal, wo) * dot(normal, wi));
	}

	// compute lambert weighting
	vec3 kd = vec3(1.0f) - F;

	kd *= (1.0f - u_Metallic[0]);

	vec3 f_lambert = diffuseColor.xyz * 0.31831015504887652430775499030746f;
	vec3 f = kd * f_lambert + f_cook_torrance;

	// accumulate total lighting on fragment
	Lo += f * ithLightIrradiance * max(0.0f, dot(wi, normal));
	
	// reinhard (HDR)
	Lo = Lo / (Lo + vec3(1.0f, 1.0f, 1.0f));

	out_Col = vec4(Lo, 1.0);
}
