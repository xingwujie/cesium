attribute vec3 position3DHigh;
attribute vec3 position3DLow;
attribute vec3 normal;
attribute vec4 color;

#ifndef DEBUG_SHOW_VOLUME
// emulated noperspective
varying float v_WindowZ;
varying vec4 v_color;

vec4 depthClampFarPlane(vec4 vertexInClipCoordinates)
{
    v_WindowZ = (0.5 * (vertexInClipCoordinates.z / vertexInClipCoordinates.w) + 0.5) * vertexInClipCoordinates.w;
    vertexInClipCoordinates.z = min(vertexInClipCoordinates.z, vertexInClipCoordinates.w);
    return vertexInClipCoordinates;
}
#else
vec4 depthClampFarPlane(vec4 vertexInClipCoordinates)
{
    return vertexInClipCoordinates;
}
#endif

const float delta = -11500.0;//-100000.0;

void main()
{
    v_color = color;
    
    vec4 position = czm_computePosition();
    gl_Position = depthClampFarPlane(czm_modelViewProjectionRelativeToEye * (position + vec4(delta * normal, 0.0)));
}
