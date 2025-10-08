define([
    './source/PtmLeaflet.js'
], function(PtmLeaflet) {
    return {
        init: function(domId, options) {
            const dom = document.getElementById(domId);
            return PtmLeaflet.PtmViewer(dom, options);
        }
    }
});
