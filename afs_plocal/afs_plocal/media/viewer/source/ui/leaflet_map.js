define(['leaflet'], function(L) {

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

    const RotateSlider = L.Control.extend({
        _container: null,
        options: {
            position: 'topleft'
        },

        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control rotate-slider');
            container.style.background = 'rgba(255,255,255,0.95)';
            container.style.padding = '10px 16px';
            container.style.width = '260px';
            container.style.height = 'auto';
            container.style.borderRadius = '10px';
            container.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.gap = '8px';
            container.title = 'Rotate Map';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 0;
            slider.max = 359;
            slider.value = 0;
            slider.step = 1;
            slider.style.width = '180px';
            slider.style.margin = '0 0 8px 0';
            slider.style.accentColor = '#1976d2';

            const controlPanel = document.createElement('div');
            controlPanel.style.display = 'flex';
            controlPanel.style.alignItems = 'center';
            controlPanel.style.justifyContent = 'center';
            controlPanel.style.gap = '12px';

            const label = document.createElement('span');
            label.textContent = '0°';
            label.style.userSelect = 'none';
            label.style.fontSize = '1.6rem'; // increased font size
            label.style.fontWeight = '600';
            label.style.minWidth = '36px';
            label.style.textAlign = 'center';

            const decreaseAngleButton = document.createElement('button');
            decreaseAngleButton.textContent = '−';
            decreaseAngleButton.style.fontSize = '1.6rem';
            decreaseAngleButton.style.fontWeight = 'bold';
            decreaseAngleButton.style.width = '32px';
            decreaseAngleButton.style.height = '32px';
            decreaseAngleButton.style.borderRadius = '6px';
            decreaseAngleButton.style.border = '1px solid #ccc';
            decreaseAngleButton.style.background = '#fafbfc';
            decreaseAngleButton.style.cursor = 'pointer';
            decreaseAngleButton.style.transition = 'border 0.2s, box-shadow 0.2s';
            decreaseAngleButton.addEventListener('mouseenter', () => {
                decreaseAngleButton.style.borderColor = '#1976d2';
                decreaseAngleButton.style.boxShadow = '0 0 0 2px rgba(25,118,210,0.15)';
            });
            decreaseAngleButton.addEventListener('mouseleave', () => {
                decreaseAngleButton.style.borderColor = '#ccc';
                decreaseAngleButton.style.boxShadow = 'none';
            });

            const incrementAngleButton = document.createElement('button');
            incrementAngleButton.textContent = '+';
            incrementAngleButton.style.fontSize = '1.6rem';
            incrementAngleButton.style.fontWeight = 'bold';
            incrementAngleButton.style.width = '32px';
            incrementAngleButton.style.height = '32px';
            incrementAngleButton.style.borderRadius = '6px';
            incrementAngleButton.style.border = '1px solid #ccc';
            incrementAngleButton.style.background = '#fafbfc';
            incrementAngleButton.style.cursor = 'pointer';
            incrementAngleButton.style.transition = 'border 0.2s, box-shadow 0.2s';
            incrementAngleButton.addEventListener('mouseenter', () => {
                incrementAngleButton.style.borderColor = '#1976d2';
                incrementAngleButton.style.boxShadow = '0 0 0 2px rgba(25,118,210,0.15)';
            });
            incrementAngleButton.addEventListener('mouseleave', () => {
                incrementAngleButton.style.borderColor = '#ccc';
                incrementAngleButton.style.boxShadow = 'none';
            });

            decreaseAngleButton.addEventListener('click', () => {
                let angle = parseInt(slider.value);
                angle = (angle - 1 + 360) % 360;
                slider.value = angle;
                label.textContent = `${angle}°`;
                map.fire('rotate', {angle: angle});
            });

            incrementAngleButton.addEventListener('click', () => {
                let angle = parseInt(slider.value);
                angle = (angle + 1) % 360;
                slider.value = angle;
                label.textContent = `${angle}°`;
                map.fire('rotate', {angle: angle});
            });

            controlPanel.appendChild(decreaseAngleButton);
            controlPanel.appendChild(label);
            controlPanel.appendChild(incrementAngleButton);

            let debounceTimeout = null;
            slider.addEventListener('input', (e) => {
                label.textContent = `${slider.value}°`;
                if (debounceTimeout) clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    map.fire('rotate', {angle: parseInt(slider.value)});
                }, 200);
            });

            container.appendChild(slider);
            container.appendChild(controlPanel);

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            return container;
        }
    });

    function setupLeafletGui(id) {
        const map = L.map(id, mapCreationOptions);

        const position = new Position();
        map.addControl(position);
        map.addEventListener('mousemove', (event) => { position.updateHTML(event) });

        const rotateSlider = new RotateSlider();
        map.addControl(rotateSlider);

        return map;
    }

    return {
        setupLeafletGui: setupLeafletGui
    };
});