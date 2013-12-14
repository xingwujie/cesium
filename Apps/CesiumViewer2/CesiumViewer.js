/*global define*/
define([
        'Core/defined',
        'Core/Cartesian2',
        'Core/Cartesian3',
        'Core/Cartographic',
        'Core/Ellipsoid',
        'Core/Transforms',
        'DynamicScene/CzmlDataSource',
        'DynamicScene/GeoJsonDataSource',
        'Scene/ParticleSystem',
        'Scene/PerformanceDisplay',
        'Scene/PointEmitter',
        'Widgets/checkForChromeFrame',
        'Widgets/Viewer/Viewer',
        'Widgets/Viewer/viewerDragDropMixin',
        'Widgets/Viewer/viewerDynamicObjectMixin',
        'domReady!'
    ], function(
        defined,
        Cartesian2,
        Cartesian3,
        Cartographic,
        Ellipsoid,
        Transforms,
        CzmlDataSource,
        GeoJsonDataSource,
        ParticleSystem,
        PerformanceDisplay,
        PointEmitter,
        checkForChromeFrame,
        Viewer,
        viewerDragDropMixin,
        viewerDynamicObjectMixin) {
    "use strict";
    /*global console*/

    /*
     * 'debug'  : true/false,   // Full WebGL error reporting at substantial performance cost.
     * 'lookAt' : CZML id,      // The CZML ID of the object to track at startup.
     * 'source' : 'file.czml',  // The relative URL of the CZML file to load at startup.
     * 'stats'  : true,         // Enable the FPS performance display.
     * 'theme'  : 'lighter',    // Use the dark-text-on-light-background theme.
     */
    var endUserOptions = {};
    var queryString = window.location.search.substring(1);
    if (queryString !== '') {
        var params = queryString.split('&');
        for ( var i = 0, len = params.length; i < len; ++i) {
            var param = params[i];
            var keyValuePair = param.split('=');
            if (keyValuePair.length > 1) {
                endUserOptions[keyValuePair[0]] = decodeURIComponent(keyValuePair[1].replace(/\+/g, ' '));
            }
        }
    }

    var loadingIndicator = document.getElementById('loadingIndicator');

    checkForChromeFrame('cesiumContainer').then(function(prompting) {
        if (!prompting) {
            startup();
        } else {
            loadingIndicator.style.display = 'none';
        }
    }).otherwise(function(e) {
        loadingIndicator.style.display = 'none';
        console.error(e);
        if (document.getElementsByClassName('cesium-widget-errorPanel').length < 1) {
            window.alert(e);
        }
    });

    function endsWith(str, suffix) {
        var strLength = str.length;
        var suffixLength = suffix.length;
        return (suffixLength < strLength) && (str.indexOf(suffix, strLength - suffixLength) !== -1);
    }

    function startup() {
        var viewer = new Viewer('cesiumContainer');
        viewer.extend(viewerDragDropMixin);
        viewer.extend(viewerDynamicObjectMixin);

        var showLoadError = function(name, error) {
            var title = 'An error occurred while loading the file: ' + name;
            viewer.cesiumWidget.showErrorPanel(title, error);
            console.error(error);
        };

        viewer.dropError.addEventListener(function(viewerArg, name, error) {
            showLoadError(name, error);
        });

        var scene = viewer.scene;
        var context = scene.getContext();
        if (endUserOptions.debug) {
            context.setValidateShaderProgram(true);
            context.setValidateFramebuffer(true);
            context.setLogShaderCompilation(true);
            context.setThrowOnWebGLError(true);
        }

        if (defined(endUserOptions.source)) {
            var source;
            var sourceUrl = endUserOptions.source.toUpperCase();
            if (endsWith(sourceUrl, '.GEOJSON') || //
                endsWith(sourceUrl, '.JSON') || //
                endsWith(sourceUrl, '.TOPOJSON')) {
                source = new GeoJsonDataSource();
            } else if (endsWith(sourceUrl, '.CZML')) {
                source = new CzmlDataSource();
            } else {
                loadingIndicator.style.display = 'none';

                showLoadError(endUserOptions.source, 'Unknown format.');
            }

            if (defined(source)) {
                source.loadUrl(endUserOptions.source).then(function() {
                    viewer.dataSources.add(source);

                    if (defined(endUserOptions.lookAt)) {
                        var dynamicObject = source.getDynamicObjectCollection().getById(endUserOptions.lookAt);
                        if (defined(dynamicObject)) {
                            viewer.trackedObject = dynamicObject;
                        } else {
                            var error = 'No object with id "' + endUserOptions.lookAt + '" exists in the provided source.';
                            showLoadError(endUserOptions.source, error);
                        }
                    }
                }, function(error) {
                    showLoadError(endUserOptions.source, error);
                }).always(function() {
                    loadingIndicator.style.display = 'none';
                });
            }
        } else {
            loadingIndicator.style.display = 'none';
        }

        if (endUserOptions.stats) {
            scene.getPrimitives().add(new PerformanceDisplay());
        }

        var theme = endUserOptions.theme;
        if (defined(theme)) {
            if (endUserOptions.theme === 'lighter') {
                document.body.classList.add('cesium-lighter');
                viewer.animation.applyThemeChanges();
            } else {
                var error = 'Unknown theme: ' + theme;
                viewer.cesiumWidget.showErrorPanel(error);
                console.error(error);
            }
        }
        
        var ellipsoid = Ellipsoid.WGS84;
        var center = ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-75.59777, 40.03883, 500000.0));
        var transform = Transforms.eastNorthUpToFixedFrame(center);
        
        var size = 5.0;
        
        var gravity = function(particle) {
            var gravitationalForce = Cartesian3.multiplyByScalar(Cartesian3.UNIT_Z, -9.8 * particle.mass);
            Cartesian3.add(gravitationalForce, particle.velocity, particle.velocity);
        }
        
		var collision = function(particle) {
			if (particle.position.z > 0) {
				return;
			}

			particle.position.z = -particle.position.z;
			particle.velocity.z = -particle.velocity.z;
		}
        
        var emitter = new PointEmitter({
            initialDirection : Cartesian3.UNIT_Z,
            directionVariance : new Cartesian3(0.5, 0.5, 0.0),
            initialSpeed : 2000.0,
            speedVariance : 500.0,
            initialLife : 500.0,
            lifeVariance : 200.0,
            initialSize : new Cartesian2(size, size),
            maximumToEmit : 100.0,
        });
        var system = new ParticleSystem({
            emitter : emitter,
            forces : [gravity, collision],
            modelMatrix : transform,
            maximumParticles : 2500.0
        });
        
        scene.getPrimitives().add(system);
        
        var eye = new Cartesian3(500000.0, 0.0, 500000.0);
        var target = Cartesian3.ZERO;
        var up = Cartesian3.cross(Cartesian3.UNIT_Z, eye);
        Cartesian3.cross(eye, up, up);
        
        scene.getCamera().transform = transform;
        scene.getCamera().controller.lookAt(eye, target, up);
        scene.getScreenSpaceCameraController().setEllipsoid(Ellipsoid.UNIT_SPHERE);
    }
});