#version 300 es

// #define PASSTHROUGH

precision highp float;

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

uniform vec4 u_Color;
uniform float u_Time;

out vec4 out_Col;

vec3 random3(vec3 p) {
    return fract(sin(vec3(dot(p, vec3(185.3, 563.9, 887.2)),
                          dot(p, vec3(593.1, 591.2, 402.1)),
                          dot(p, vec3(938.2, 723.4, 768.9))
                    )) * 58293.492);
}

vec4 random4(vec4 p) {
    return fract(sin(vec4(dot(p, vec4(127.1, 311.7, 921.5, 465.8)),
                          dot(p, vec4(269.5, 183.3, 752.4, 429.1)),
                          dot(p, vec4(420.6, 631.2, 294.3, 910.8)),
                          dot(p, vec4(213.7, 808.1, 126.8, 572.0))
                    )) * 43758.5453);
}

float surflet(vec4 p, vec4 gridPoint) {
    vec4 t2 = abs(p - gridPoint);
    vec4 t = vec4(1.f) - 6.f * pow(t2, vec4(5.f)) + 15.f * pow(t2, vec4(4.f)) - 10.f * pow(t2, vec4(3.f));
    vec4 gradient = random4(gridPoint) * 2. - vec4(1.);
    vec4 diff = p - gridPoint;
    float height = dot(diff, gradient);
    return height * t.x * t.y * t.z * t.w;
}

float perlin(vec4 p) {
	float surfletSum = 0.f;

	for (int dx = 0; dx <= 1; ++dx) {
		for (int dy = 0; dy <= 1; ++dy) {
			for (int dz = 0; dz <= 1; ++dz) {
                for (int dw = 0; dw <= 1; ++dw) {
				    surfletSum += surflet(p, floor(p) + vec4(dx, dy, dz, dw));
                }
			}
		}
	}

	return surfletSum;
}


struct WorleyInfo {
    float dist;
    vec3 color;
};

WorleyInfo worley(vec3 uv) {
    vec3 uvInt = floor(uv);
    vec3 uvFract = uv - uvInt;
    float minDist = 1.0f;

    vec3 color;
    for (int x = -1; x <= 1; ++x) {
        for (int y = -1; y <= 1; ++y) {
            for (int z = -1; z <= 1; ++z) {
                vec3 neighbor = vec3(float(x), float(y), float(z));
                vec3 point = random3(uvInt + neighbor);
                vec3 diff = neighbor + point - uvFract;
                float dist = length(diff);
                if (dist < minDist) {
                    minDist = dist;
                    color = random3(point);
                }
            }
        }
    }

    WorleyInfo worleyInfo;
    worleyInfo.dist = minDist;
    worleyInfo.color = color;
    return worleyInfo;
}

void main()
{
#ifdef PASSTHROUGH
    vec4 diffuseColor = u_Color;
    float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
    diffuseTerm = clamp(diffuseTerm, 0., 1.);
    float ambientTerm = 0.2;
    float lightIntensity = diffuseTerm + ambientTerm;
    out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
#else
    float perlin1 = perlin(vec4(fs_Pos.xyz, u_Time / 1000.f));
    float perlin2 = perlin(vec4(fs_Pos.xyz * 2.f, u_Time / 2000.f));
    float perlin3 = perlin(vec4(fs_Pos.xyz * 4.f, u_Time / 4000.f));

    WorleyInfo swirlyWorley = worley(fs_Pos.xyz + perlin1 + perlin2 + perlin3);

    vec3 swirlyDiffuseColor = swirlyWorley.color * fs_Col.rgb;
    float swirlyEmissionStrength = smoothstep(0.6, 0.1, swirlyWorley.dist) * 0.75;
    vec3 swirlyEmissionColor = swirlyWorley.color * swirlyEmissionStrength;

    WorleyInfo circlesWorley1 = worley(fs_Pos.xyz * 10. + vec3(u_Time / 1200.f));
    WorleyInfo circlesWorley2 = worley(vec3(circlesWorley1.dist * 1.5));

    vec3 circlesDiffuseColor = vec3(clamp(circlesWorley2.dist * 2.0, 0., 1.));
    vec3 circlesEmissionColor = circlesDiffuseColor * fs_Col.rgb * 0.3;

    float mixFactor = (perlin(vec4(fs_Pos.xyz, 0)) + 1.0) / 2.0;
    mixFactor = smoothstep(0.4, 0.8, mixFactor);
    mixFactor = smoothstep(0.0, 1.0, mixFactor);
    vec3 mixDiffuseColor = mix(swirlyDiffuseColor, circlesDiffuseColor, mixFactor);
    vec3 mixEmissionColor = mix(swirlyEmissionColor, circlesEmissionColor, mixFactor);

    float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
    diffuseTerm = clamp(diffuseTerm, 0., 1.);

    float ambientTerm = 0.05;
    float lightIntensity = diffuseTerm + ambientTerm;

    vec3 lambertianColor = mixDiffuseColor.rgb * lightIntensity;
    vec3 emissionColor = mixEmissionColor;

    out_Col = vec4(lambertianColor + emissionColor, 1);
#endif
}
