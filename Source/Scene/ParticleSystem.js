/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/Matrix4',
        './BillboardCollection',
        './Particle'
    ], function(
        defaultValue,
        defined,
        Matrix4,
        BillboardCollection,
        Particle) {
    "use strict";

    var ParticleSystem = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        this.particles = defaultValue(options.particles, []);
        this.forces = defaultValue(options.forces, []);
        this.emitter = options.emitter;
        this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
        this.maximumParticles = 1000.0;

        this._billboardCollection = undefined;
    };

    function removeBillboard(system, particle) {
        system._billboardCollection.remove(particle._billboard);
    }

    function updateBillboard(system, particle) {
        var billboard = particle._billboard;
        if (!defined(billboard)) {
            billboard = particle._billboard = system._billboardCollection.add();
            billboard.setImageIndex(0);
            billboard.setWidth(particle.size.x);
            billboard.setHeight(particle.size.y);
        }

        billboard.setPosition(particle.position);
    }

    function createTextureAtlas(system, context) {
        var collection = system._billboardCollection;
        if (defined(collection.getTextureAtlas())) {
            return;
        }

        var canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        var context2D = canvas.getContext('2d');
        context2D.beginPath();
        context2D.arc(8, 8, 8, 0, Math.PI * 2.0, true);
        context2D.closePath();
        context2D.fillStyle = 'rgb(255, 255, 255)';
        context2D.fill();

        var textureAtlas = context.createTextureAtlas({
            image : canvas
        });
        collection.setTextureAtlas(textureAtlas);
    }

    ParticleSystem.prototype.update = function(context, frameState, commandList) {
        if (!defined(this._billboardCollection)) {
            this._billboardCollection = new BillboardCollection();
        }

        createTextureAtlas(this, context);

        var particles = this.particles;
        var emitter = this.emitter;

        // update particles and remove dead particles
        var length = particles.length;
        for (var i = 0; i < length; ++i) {
            var particle = particles[i];
            if (!particle.update(this.forces)) {
                removeBillboard(this, particle);
                particles[i] = particles[length - 1];
                --i;
                --length;
            } else {
                updateBillboard(this, particle);
            }
        }
        particles.length = length;

        // emit new particles if an emitter is attached.
        // the emission counts as the particle "update"
        if (defined(emitter)) {
            emitter.emit(this);
        }

        this._billboardCollection.modelMatrix = this.modelMatrix;
        this._billboardCollection.update(context, frameState, commandList);
    };

    return ParticleSystem;
});