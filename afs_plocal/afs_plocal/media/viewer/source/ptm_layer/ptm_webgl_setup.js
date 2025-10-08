define([
    './ptm_shader_code.js'
], function(shaderCode) {

    function clearCanvasToBlack(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function createShader(gl, shaderType, shaderSource) {
        const shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderSource)
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const errorMessage = gl.getShaderInfoLog(shader);
            console.error(errorMessage);
            return;
        }
        return shader;
    }

    function createPtmShaderProgram(gl) {
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, shaderCode.PTM_VERTEX_SHADER);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, 
                                            shaderCode.PTM_FRAGMENT_RELIGHTING_SHADER);
        if (vertexShader === undefined || fragmentShader === undefined) {
            return;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        return program;
    }

    function createPlaneForDrawing(gl, program) {
        const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
        const plane_points = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
        const planePointsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, planePointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(plane_points), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, planePointsBuffer);
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);
    }

    function createUniformsDictionary(gl, program) {
        return {
            lightVector: gl.getUniformLocation(program, "uLightVector"),
            textures: {
                0: gl.getUniformLocation(program, "uCoef_rgb"),
                1: gl.getUniformLocation(program, "uCoef_1_x_y"),
                2: gl.getUniformLocation(program, "uCoef_x2_xy_y2")
            },
            scale1xy: gl.getUniformLocation(program, "scale_1_x_y"),
            scalex2xyy2: gl.getUniformLocation(program, "scale_x2_xy_y2"),
            bias1xy: gl.getUniformLocation(program, "bias_1_x_y"),
            biasx2xyy2: gl.getUniformLocation(program, "bias_x2_xy_y2"),
        };
    }

    function loadTexture(gl, url, index, uniform) {
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, 
                gl.UNSIGNED_BYTE, new Uint8Array([240, 240, 240, 255]));
        gl.uniform1i(uniform, index);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };
        image.src = url;
        return texture;
    }

    class _PtmRenderer {
        constructor(canvas) {
            const gl = canvas.getContext("webgl");
            this.gl = gl;
            clearCanvasToBlack(gl);
            this.canvas = canvas;
            this.program = createPtmShaderProgram(gl);
            this.uniforms = createUniformsDictionary(gl, this.program);
            this.textures = [undefined, undefined, undefined];
            createPlaneForDrawing(gl, this.program);
        }

        setPtmBias(bias) {
            const gl = this.gl;
            const biasFirstUniform = this.uniforms.bias1xy;
            const biasSecondUniform = this.uniforms.biasx2xyy2;
            gl.uniform3f(biasFirstUniform, bias[3], bias[4], bias[5]);
            gl.uniform3f(biasSecondUniform, bias[6], bias[7], bias[8]);
        }

        setPtmScale(scale) {
            const gl = this.gl;
            const scaleFirstUniform = this.uniforms.scale1xy;
            const scaleSecondUniform = this.uniforms.scalex2xyy2;
            gl.uniform3f(scaleFirstUniform, scale[3], scale[4], scale[5]);
            gl.uniform3f(scaleSecondUniform, scale[6], scale[7], scale[8]);
        }

        setLightVector(x, y, z) {
            const gl = this.gl;
            const lightUniform = this.uniforms.lightVector;
            gl.uniform3f(lightUniform, x, y, z);
        }

        loadTextures(urls) {
            const gl = this.gl;
            const texturesUniforms = this.uniforms.textures;
            for (let i = 0; i < urls.length; i++) {
                this.textures[i] = loadTexture(gl, urls[i], i, texturesUniforms[i]);
            }
        }

        drawFrame() {
            const gl = this.gl;
            const canvas_width = parseFloat(this.canvas.style.width);
            const canvas_height = parseFloat(this.canvas.style.height);
            this.canvas.width = canvas_width;
            gl.viewportWidth = canvas_width;
            this.canvas.height = canvas_height;
            gl.viewportHeight = canvas_height;
            gl.viewport(0, 0, canvas_width, canvas_height);
            
            gl.clearColor(0.5, 0.5, 0.5, 0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

    }

    function PtmRenderer(canvas) {
        return new _PtmRenderer(canvas);
    }

    return {
        PtmRenderer: PtmRenderer
    }

});