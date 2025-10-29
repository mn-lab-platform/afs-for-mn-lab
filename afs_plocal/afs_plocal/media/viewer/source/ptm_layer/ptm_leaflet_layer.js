define([
	'leaflet',
    './ptm_webgl_setup.js'
], function(L, PtmWebglSetup) {

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const _PtmLayer = L.ImageOverlay.extend({
        options: {
            bias: undefined,
            scale: undefined,
            textures: undefined,
            opacity: 1,
            alt: 'Leaflet PTM Layer',
            interactive: false,
            crossOrigin: false,
            errorOverlayUrl: '',
            zIndex: 1,
            className: '',
            decoding: 'auto',
            fps: 30.0,
        },

        initialize(bounds, options) {
            this._bounds = L.latLngBounds(bounds);
            this.canvas = undefined;
            this.gl = undefined;
            this.renderer = undefined;
            this.lightVector = [0.0, 0.0, 1.0];
            this.rotationAngle = 0;
            L.Util.setOptions(this, options);
        },

        onAdd() {
            if (!this.canvas) {
                this.canvas = L.DomUtil.create("canvas");
                L.DomUtil.addClass(this.canvas, 'leaflet-zoom-animated');
                this.renderer = PtmWebglSetup.PtmRenderer(this.canvas);
                this.renderer.setPtmBias(this.options.bias);
                this.renderer.setPtmScale(this.options.scale);
                this.renderer.loadTextures(this.options.textures);
                this.getPane().appendChild(this.canvas);

                if (this._bounds) {
                    this._reset();
                }
            }
            this.runAnimation();
        },

        setLightVector(x, y, z) {
            this.renderer.setLightVector(x, y, z);
        },

        runAnimation() {
            const timeBetweenFrames = 1000 / this.options.fps;
            let previousFrameTime = 0;

            const animate = (currentTime) => {
                if (!this.renderer) return;

                this._animationFrame = requestAnimationFrame(animate);

                if (currentTime - previousFrameTime >= timeBetweenFrames) {
                    previousFrameTime = currentTime;
                    this.renderer.drawFrame();
                }
            };

            this._animationFrame = requestAnimationFrame(animate);
        },

        onRemove() {
            if (this._animationFrame) {
                cancelAnimationFrame(this._animationFrame);
                this._animationFrame = null;
            }

            if (this.canvas) {
                this.canvas.remove();
                this.renderer = undefined;
                this.gl = undefined;
                this.canvas = undefined;
            }
        },

        setOpacity(opacity) {
            return this;
        },

        setStyle(styleOpts) {
            return this;
        },

        bringToFront() {
            if (this._map) {
                L.DomUtil.toFront(this._canvas);
            }
            return this;
        },

        bringToBack() {
            if (this._map) {
                L.DomUtil.toBack(this._canvas);
            }
            return this;
        },

        setUrl(url) {
            this._url = url;
            return this;
        },

        setBounds(bounds) {
            this._bounds = L.latLngBounds(bounds);

            if (this._map) {
                this._reset();
            }
            return this;
        },

        getEvents() {
            const events = {
                zoom: this._reset,
                viewreset: this._reset
            };

            if (this._zoomAnimated) {
                events.zoomanim = this._animateZoom;
            }

            return events;
        },

        setZIndex(value) {
            this.options.zIndex = value;
            this._updateZIndex();
            return this;
        },

        getBounds() {
            return this._bounds;
        },

        getElement() {
            return this._canvas;
        },

        _animateZoom(e) {
            const scale = this._map.getZoomScale(e.zoom);
            const offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;

            L.DomUtil.setTransform(this.canvas, offset, scale);
        },

        _reset() {
            const canvas = this.canvas;
            const bounds = new L.Bounds(
                this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
                this._map.latLngToLayerPoint(this._bounds.getSouthEast()));
            const size = bounds.getSize();

            L.DomUtil.setPosition(canvas, bounds.min);

            if (!this._size || Math.abs(this._size.x - size.x) > 1 || Math.abs(this._size.y - size.y) > 1) {
                this._size = size.clone();

                canvas.style.width = `${size.x}px`;
                canvas.style.height = `${size.y}px`;

                if (this.renderer) {
                    this.renderer.onResize && this.renderer.onResize(size.x, size.y);
                }
            }
        },

        _updateZIndex() {
            if (this._canvas && this.options.zIndex !== undefined && this.options.zIndex !== null) {
                this._canvas.style.zIndex = this.options.zIndex;
            }
        },

        _overlayOnError() {
            this.fire('error');
            const errorUrl = this.options.errorOverlayUrl;
            if (errorUrl && this._url !== errorUrl) {
                this._url = errorUrl;
            }
        },

        getCenter() {
            return this._bounds.getCenter();
        }
    });

    return {
        PtmLayer: _PtmLayer
    };
});


