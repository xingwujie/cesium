/*global define*/
define([
        '../Core/Cartesian2',
        '../Core/Color',
        '../Core/defined',
        '../Core/destroyObject',
        '../Core/PixelFormat',
        '../Renderer/ClearCommand',
        '../Renderer/PixelDatatype',
        '../Renderer/RenderbufferFormat'
    ], function(
        Cartesian2,
        Color,
        defined,
        destroyObject,
        PixelFormat,
        ClearCommand,
        PixelDatatype,
        RenderbufferFormat) {
    "use strict";

    /**
     * @private
     */
    var CustomPostProcess = function(shader, uniforms) {
        this._texture = undefined;
        this._depthTexture = undefined;
        this._depthRenderbuffer = undefined;
        this._fbo = undefined;
        this._command = undefined;
        this._fragmentShader = shader;
        this._customUniforms = uniforms;

        var clearCommand = new ClearCommand({
            color : new Color(0.0, 0.0, 0.0, 0.0),
            depth : 1.0,
            owner : this
        });
        this._clearCommand = clearCommand;
    };

    function destroyResources(cpp) {
        cpp._fbo = cpp._fbo && cpp._fbo.destroy();
        cpp._texture = cpp._texture && cpp._texture.destroy();
        cpp._depthTexture = cpp._depthTexture && cpp._depthTexture.destroy();
        cpp._depthRenderbuffer = cpp._depthRenderbuffer && cpp._depthRenderbuffer.destroy();

        cpp._fbo = undefined;
        cpp._texture = undefined;
        cpp._depthTexture = undefined;
        cpp._depthRenderbuffer = undefined;

        if (defined(cpp._command)) {
            cpp._command.shaderProgram = cpp._command.shaderProgram && cpp._command.shaderProgram.destroy();
            cpp._command = undefined;
        }
    }

    CustomPostProcess.prototype.update = function(context) {
        var width = context.drawingBufferWidth;
        var height = context.drawingBufferHeight;

        var fxaaTexture = this._texture;
        var textureChanged = !defined(fxaaTexture) || fxaaTexture.width !== width || fxaaTexture.height !== height;
        if (textureChanged) {
            this._texture = this._texture && this._texture.destroy();
            this._depthTexture = this._depthTexture && this._depthTexture.destroy();
            this._depthRenderbuffer = this._depthRenderbuffer && this._depthRenderbuffer.destroy();

            this._texture = context.createTexture2D({
                width : width,
                height : height,
                pixelFormat : PixelFormat.RGBA,
                pixelDatatype : PixelDatatype.UNSIGNED_BYTE
            });

            if (context.depthTexture) {
                this._depthTexture = context.createTexture2D({
                    width : width,
                    height : height,
                    pixelFormat : PixelFormat.DEPTH_COMPONENT,
                    pixelDatatype : PixelDatatype.UNSIGNED_SHORT
                });
            } else {
                this._depthRenderbuffer = context.createRenderbuffer({
                    width : width,
                    height : height,
                    format : RenderbufferFormat.DEPTH_COMPONENT16
                });
            }
        }

        if (!defined(this._fbo) || textureChanged) {
            this._fbo = this._fbo && this._fbo.destroy();

            this._fbo = context.createFramebuffer({
                colorTextures : [this._texture],
                depthTexture : this._depthTexture,
                depthRenderbuffer : this._depthRenderbuffer,
                destroyAttachments : false
            });
        }

        if (!defined(this._command)) {
            this._command = context.createViewportQuadCommand(this._fragmentShader, {
                renderState : context.createRenderState(),
                owner : this
            });
        }

        if (textureChanged) {
            var that = this;
            var step = new Cartesian2(1.0 / this._texture.width, 1.0 / this._texture.height);
            this._command.uniformMap = {
                u_texture : function() {
                    return that._texture;
                },
                u_step : function() {
                    return step;
                }
            };
            for (var uniform in this._customUniforms) {
                if (this._customUniforms.hasOwnProperty(uniform)) {
                    this._command.uniformMap[uniform] = this._customUniforms[uniform];
                }
            }
        }
    };

    CustomPostProcess.prototype.execute = function(context, passState) {
        this._command.execute(context, passState);
    };

    CustomPostProcess.prototype.clear = function(context, passState, clearColor) {
        var framebuffer = passState.framebuffer;

        passState.framebuffer = this._fbo;
        Color.clone(clearColor, this._clearCommand.color);
        this._clearCommand.execute(context, passState);

        passState.framebuffer = framebuffer;
    };

    CustomPostProcess.prototype.getColorFramebuffer = function() {
        return this._fbo;
    };

    CustomPostProcess.prototype.isDestroyed = function() {
        return false;
    };

    CustomPostProcess.prototype.destroy = function() {
        destroyResources(this);
        return destroyObject(this);
    };

    return CustomPostProcess;
});
