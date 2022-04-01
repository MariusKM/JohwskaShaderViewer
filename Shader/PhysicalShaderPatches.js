
const fragVars =` 
uniform float time;
uniform sampler2D emMap;
uniform sampler2D opMap;\n `;

const fragTransmissionMod =` 
#ifdef USE_TRANSMISSION
float transmissionAlpha = 1.0;
float transmissionFactor = transmission;
float thicknessFactor = thickness;
#ifdef USE_TRANSMISSIONMAP
transmissionFactor *= texture2D( transmissionMap, vUv ).r;
#endif
#ifdef USE_THICKNESSMAP
thicknessFactor *= texture2D( thicknessMap, vUv ).g;
#endif
vec3 pos = vWorldPosition;
vec3 v = normalize( cameraPosition - pos );
vec3 n = inverseTransformDirection( normal, viewMatrix );
vec4 transmission = getIBLVolumeRefraction(n, v, roughnessFactor, material.diffuseColor, material.specularColor, material.specularF90,pos*(6.0*sin( time )), modelMatrix, viewMatrix, projectionMatrix, ior, thicknessFactor,attenuationColor, attenuationDistance );
totalDiffuse = mix( totalDiffuse, transmission.rgb, transmissionFactor );
transmissionAlpha = mix( transmissionAlpha, transmission.a, transmissionFactor );
#endif
 `;


const fragLightMapMod =` 
#if defined( RE_IndirectDiffuse )
#ifdef USE_LIGHTMAP
vec4 lightMapTexel = texture2D( lightMap, vUv2 );
vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
irradiance += lightMapIrradiance;
#endif
#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
iblIrradiance += getIBLIrradiance( geometry.normal*(6.0*sin( time )) );
#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
radiance += getIBLRadiance( geometry.viewDir, geometry.normal*(0.5+abs(sin( time*0.5 ))), material.roughness );
#ifdef USE_CLEARCOAT
clearcoatRadiance += getIBLRadiance( geometry.viewDir*(6.0*sin( time )), geometry.clearcoatNormal, material.clearcoatRoughness );
#endif
#endif
 `;


const fragOutMod =
`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= transmissionAlpha + 0.1;
#endif
vec4 emCol = texture2D(emMap,vUv);
vec4 opCol = texture2D(opMap,vUv);
gl_FragColor = emCol * (opCol.r*10.0)+vec4( outgoingLight, diffuseColor.a )* (1.0-opCol.r);`;


export  {
    fragVars,
    fragTransmissionMod,
    fragLightMapMod,
    fragOutMod
};
