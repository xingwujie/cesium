/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Math',
        './Particle'
    ], function(
        defaultValue,
        defined,
        Cartesian2,
        Cartesian3,
        CesiumMath,
        Particle) {
    "use strict";

    var PointEmitter = function(options) {
        this.initialMass = defaultValue(options.initialMass, 1.0);
        this.massVariance = defaultValue(options.massVariance, 0.0);

        this.initialDirection = Cartesian3.clone(defaultValue(options.initialDirection, Cartesian3.UNIT_Z));
        this.directionVariance = Cartesian3.clone(defaultValue(options.directionVariance, Cartesian3.ZERO));

        this.initialSpeed = defaultValue(options.initialSpeed, 1.0);
        this.speedVariance = defaultValue(options.speedVariance, 0.0);

        this.initialLife = defaultValue(options.initialLife, Number.MAX_VALUE);
        this.lifeVariance = defaultValue(options.lifeVariance, 0.0);

        var initialSize = Cartesian2.clone(options.initialSize);
        if (!defined(initialSize)) {
            initialSize = new Cartesian2(1.0, 1.0);
        }

        this.initialSize = initialSize;
        this.sizeVariance = Cartesian2.clone(defaultValue(options.sizeVariance, Cartesian2.ZERO));

        this.maximumToEmit = defaultValue(options.maximumToEmit, Number.MAX_VALUE);
    };

    function random(a, b) {
        return CesiumMath.nextRandomNumber() * (b - a) + a;
    }

    PointEmitter.prototype.emit = function(system) {
        var particles = system.particles;
        var numToEmit = Math.min(this.maximumToEmit, system.maximumParticles - particles.length);

        for (var i = 0; i < numToEmit; ++i) {
            var velocity = Cartesian3.clone(this.initialDirection);
            velocity.x += this.directionVariance.x * random(-1.0, 1.0);
            velocity.y += this.directionVariance.y * random(-1.0, 1.0);
            velocity.y += this.directionVariance.z * random(-1.0, 1.0);

            var speed = this.initialSpeed + this.speedVariance * random(-1.0, 1.0);
            Cartesian3.multiplyByScalar(velocity, speed, velocity);

            var size = Cartesian2.add(this.initialSize, Cartesian2.multiplyByScalar(this.sizeVariance, random(0.0, 1.0)));

            particles.push(new Particle({
                mass : this.initialMass + this.massVariance * random(0.0, 1.0),
                life : this.initialLife + this.lifeVariance * random(-1.0, 1.0),
                velocity :  velocity,
                size : size
            }));
        }
    };

    return PointEmitter;
});