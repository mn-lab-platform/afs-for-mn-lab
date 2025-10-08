define(['../leaflet/leaflet-src.esm.js'], function(L) {

    const mapCreationOptions = {
        crs: L.CRS.Simple,
        minZoom: -10,
        maxZoom: 10,
    };

    const Position = L.Control.extend({ 
        _container: null,
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            var latlng = L.DomUtil.create('div', 'mouseposition');
            latlng.style = `
                background-color: #FFFFFF64;
                padding: 5px
            `
            this._latlng = latlng;
            return latlng;
        },

        updateHTML: function(event) {
            var latlng = event.latlng.lat.toFixed(1) + " " + event.latlng.lng.toFixed(1);
            this._latlng.innerHTML = latlng;
        }
    });

    const RotateButton = L.Control.extend({
        _container: null,
        options: {
            position: 'topleft'
        },

        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control rotate-button');
            container.style.backgroundColor = 'white';
            container.style.padding = '5px';
            container.style.cursor = 'pointer';
            container.title = 'Rotate Map';

            container.innerHTML = '↻';

            this.currentRotationAngle = 0;
            this.highlightClass = '';

            L.DomEvent.on(container, 'click', (e) => {
                L.DomEvent.stopPropagation(e); 
                L.DomEvent.preventDefault(e); 

                const borderClasses = {
                    0: 'no-highlight',
                    90: 'right-highlight',
                    180: 'bottom-highlight',
                    270: 'left-highlight'
                }
                
                const classToRemove = borderClasses[this.currentRotationAngle];
                this.currentRotationAngle = (this.currentRotationAngle + 90) % 360;
                const classToAdd = borderClasses[this.currentRotationAngle];

                container.classList.remove(classToRemove);
                container.classList.add(classToAdd);
                
                map.fire('rotate', {angle: this.currentRotationAngle});
            });

            L.DomEvent.on(container, 'dblclick', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
            });

            return container;
        },

        rotate: function(event) {
            console.log("Rotate button clicked");
        }
    });

    function setupLeafletGui(id) {
        const map = L.map(id, mapCreationOptions);

        const position = new Position();
        map.addControl(position);
        map.addEventListener('mousemove', (event) => { position.updateHTML(event) });

        const rotateButton = new RotateButton();
        map.addControl(rotateButton);

        return map;
    }

    return {
        setupLeafletGui: setupLeafletGui
    };
});