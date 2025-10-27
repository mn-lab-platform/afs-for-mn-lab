define([
    './ui/leaflet_map.js',
    './ui/light_sphere.js',
    './ptm_layer/ptm_layer_factory.js'
], function(leafletMap, lightSphere, ptmLayerFactory) {

    function generateUniqueId () {
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function createChildDiv(parent, options) {
        const newDom = document.createElement("div");
        newDom.className = options.className;
        newDom.id = generateUniqueId();
        parent.appendChild(newDom);
        return newDom;
    }

    class _PtmViewer {
        constructor(domElement, createOptions) {
            this.dom = createChildDiv(domElement, {className: "ptm-container"});
            this.options = createOptions;
            this.createUi();
            this.createPtmLayer(createOptions.imageServerBaseUrl, createOptions.manifestFileUrl);
        }

        createUi() {
            this.mapDom = document.createElement("div");
            this.mapDom.className = "ptm-map";
            this.mapDom.id = generateUniqueId() + "-map";
            this.dom.appendChild(this.mapDom);
            this.map = leafletMap.setupLeafletGui(this.mapDom.id);
            this.initializeSphereWidget();
            this.registerCanvasResizeListener();

            this.map.on('rotate', (e) => {
                this.updateRotation(e.angle);
                this.resetSphereWidget();
            });
        }

        initializeSphereWidget() {
            this.sphereDom = document.createElement("canvas");
            this.sphereDom.className = "ptm-sphere";
            let parentHeight = this.dom.clientHeight;
            console.log(parentHeight);
            this.sphereDom.width = parentHeight * 0.20;
            this.sphereDom.height = parentHeight * 0.20;
            this.sphereDom.id = generateUniqueId() + "-sphere";
            this.dom.appendChild(this.sphereDom);
            this.sphere = lightSphere.setupSphereGui(this.sphereDom);
            this.sphere.onLightDirectionChanged = (x, y) => {
                let r =  Math.sqrt(x * x + y * y);
                if (r > 1.0) {
                    x /= r;
                    y /= r;
                    r = 1.0
                }
                const z = Math.sqrt(1 - r);
                const { rotated_x, rotated_y } = this.rotateLightVector(x, y, this.layer ? this.layer.rotationAngle : 0);
                console.log(`Rotating with angle ${this.layer ? this.layer.rotationAngle : 0}`);
                this.layer.setLightVector(rotated_x, rotated_y, z);
            };
        }

        resetSphereWidget() {
            if (this.sphereDom) {
                this.dom.removeChild(this.sphereDom);
            }
            this.initializeSphereWidget();
        }

        registerCanvasResizeListener() {
            window.addEventListener('resize', () => {
                if (this.sphereDom) {
                    this.dom.removeChild(this.sphereDom);
                }
                this.initializeSphereWidget();
            });
        }

        rotateLightVector(x, y, angleDegrees) {
            const theta = angleDegrees * Math.PI / 180;
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            return {
                rotated_x: x * cos - y * sin,
                rotated_y: x * sin + y * cos
            };
        }

        async updateRotation(angle) {
            if (this.layer) {
                this.map.removeLayer(this.layer);
            }
            this.layer = await ptmLayerFactory.ptmLayerFromCantaloupeServer(
                this.options.imageServerBaseUrl,
                this.options.manifestFileUrl,
                angle
            );
            this.layer.addTo(this.map);
            this.layer.rotationAngle = angle;
        }

        async createPtmLayer(imageServerBaseUrl, manifestFileUrl) {
            this.layer = await ptmLayerFactory.ptmLayerFromCantaloupeServer(imageServerBaseUrl, manifestFileUrl);
            const mapBounds = [this.layer.options.imageHeight / 2,
            this.layer.options.imageWidth / 2];
            this.map.setView(mapBounds, -3);
            
            console.log("Layer created");
            this.map.whenReady(() => {
                this.layer.addTo(this.map);
                console.log("view set");
                this.map.zoomIn(0);
            });
        }


    }

    function PtmViewer(domElement, createOptions) {
        return new _PtmViewer(domElement, createOptions);
    }

    return {
        PtmViewer: PtmViewer
    };
});