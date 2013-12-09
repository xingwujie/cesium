/*global define*/
define([
        '../Core/defaultValue',
        '../Core/Cartesian3',
        '../Core/Math',
        './Particle'
    ], function(
        defaultValue,
        Cartesian3,
        CesiumMath,
        Particle) {
    "use strict";

    var PointEmitter = function(options) {
        this.initialMass = defaultValue(options.initialMass, 1.0);
        this.massVariance = defaultValue(options.massVariance, 0.0);

        this.initialVelocity = Cartesian3.clone(defaultValue(options.initialVelocity, Cartesian3.UNIT_Z));
        this.velocityVariance = Cartesian3.clone(defaultValue(options.velocityVariance, Cartesian3.ZERO));

        this.initialSpeed = defaultValue(options.initialSpeed, 1.0);
        this.speedVariance = defaultValue(options.speedVariance, 0.0);

        this.initialLife = defaultValue(options.initialLife, Number.MAX_VALUE);
        this.lifeVariance = defaultValue(options.lifeVariance, 0.0);
    };

    function random(a, b) {
        return CesiumMath.nextRandomNumber() * (b - a) + a;
    }

    PointEmitter.prototype.emit = function(system) {
        var particles = system.particles;
        var numToEmit = system.maximumParticles - particles.length;

        for (var i = 0; i < numToEmit; ++i) {
            var velocity = Cartesian3.add(this.initialVelocity, Cartesian3.multiplyByScalar(this.velocityVariance, random(-1.0, 1.0)));
            var speed = this.initialSpeed + this.speedVariance * random(-1.0, 1.0);
            Cartesian3.multiplyByScalar(velocity, speed, velocity);

            particles.push(new Particle({
                mass : this.initialMass + this.massVariance * random(0.0, 1.0),
                life : this.initialLife + this.lifeVariance * random(-1.0, 1.0),
                velocity :  velocity
            }));
        }
    };

    return PointEmitter;
});