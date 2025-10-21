define([
    './ptm_leaflet_layer.js'
], function(ptmLeafletLayer) {

    async function downloadInfoJson(url) {
        const data = await fetch(url);
        const json = await data.json();
        return json;
    }

    function ptmParametersFromManifest(manifestJson) {
        const imageHeight = manifestJson.items[0].height;
        const imageWidth = manifestJson.items[0].width;

        const params = {
            width: imageWidth,
            height: imageHeight
        }

        const metadata = manifestJson.metadata;
        metadata.forEach(entry => {
            const label = entry.label.en[0];
            if (label === "PTM Bias Coefficients") {
                params.bias = entry.value.none[0].split(",").map(x => parseFloat(x));
            }
            else if (label === "PTM Scale Coefficients") {
                params.scale = entry.value.none[0].split(",").map(x => parseFloat(x));
            }
        });

        return params;
    }

    // image base url http://localhost:8183/iiif/3
    async function ptmLayerFromCantaloupeServer(imageServerBaseUrl, manifestFileUrl, rotation=0) {
        console.log("Fetching manifest from:", manifestFileUrl);
        console.log("Image Server Base URL:", imageServerBaseUrl);
        const manifestJson = await downloadInfoJson(manifestFileUrl);
        const ptmParams = ptmParametersFromManifest(manifestJson);

        const annotations = manifestJson.items[0].items[0].items;

        const textures = annotations.map(annotation => {
            const serviceId = annotation.body.service[0].id;
            return `${serviceId}/full/max/${rotation}/default.jpg`;
        });

        const bounds = [
            [0, 0], [ptmParams.height, ptmParams.width]
        ];

        const options = {
            bias: ptmParams.bias,
            scale: ptmParams.scale,
            textures: textures,
            imageWidth: ptmParams.width,
            imageHeight: ptmParams.height,
            fps: 30.0
        }

        return new ptmLeafletLayer.PtmLayer(bounds, options);
    }

    return {
        ptmLayerFromCantaloupeServer: ptmLayerFromCantaloupeServer
    };
});