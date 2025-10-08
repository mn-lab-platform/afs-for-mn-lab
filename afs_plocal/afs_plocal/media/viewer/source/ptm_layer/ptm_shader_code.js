define([], function() {
    const PTM_VERTEX_SHADER = `
        attribute vec2 aVertexPosition;
        varying highp vec2 vUserPose;

        void main(void) {
            gl_Position = vec4(aVertexPosition, 1.0, 1.0);
            vUserPose = gl_Position.xy;
        }
    `;

    const PTM_FRAGMENT_RELIGHTING_SHADER = `
        precision highp float;

        uniform vec3 scale_1_x_y;
        uniform vec3 scale_x2_xy_y2;
        uniform vec3 bias_1_x_y;
        uniform vec3 bias_x2_xy_y2;

        varying highp vec2 vUserPose;

        uniform sampler2D uCoef_rgb;
        uniform sampler2D uCoef_1_x_y;
        uniform sampler2D uCoef_x2_xy_y2;
        uniform vec3 uLightVector;

        void main(void) {
            vec3 L = uLightVector;
            highp vec2 textureCoord = vUserPose.xy / 2.0 + vec2(0.5, 0.5);

            vec3 chroma = texture2D(uCoef_rgb, textureCoord).xyz;
            vec3 coeff_1_x_y = texture2D(uCoef_1_x_y, textureCoord).xyz;
            coeff_1_x_y = (coeff_1_x_y - bias_1_x_y) * scale_1_x_y;
            vec3 coeff_x2_xy_y2 = texture2D(uCoef_x2_xy_y2, textureCoord).xyz;
            coeff_x2_xy_y2 = (coeff_x2_xy_y2 - bias_x2_xy_y2) * scale_x2_xy_y2;

            float lum = coeff_x2_xy_y2.x * L.x * L.x +
                        coeff_x2_xy_y2.y * L.x * L.y +
                        coeff_x2_xy_y2.z * L.y * L.y +
                        coeff_1_x_y.y * L.x +
                        coeff_1_x_y.z * L.y +
                        coeff_1_x_y.x;

            gl_FragColor = vec4(chroma * lum, 1.0);
        }
    `;

    return {
        PTM_VERTEX_SHADER,
        PTM_FRAGMENT_RELIGHTING_SHADER
    };
});