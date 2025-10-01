console.log("viewer_report.js loaded finally");

define([
    'knockout',
    'viewmodels/report',
    'templates/views/report-templates/viewer_report.htm',
], function(ko, ReportViewModel, viewerReportTemplate) {

    var viewerInitialized = false;
    
    return ko.components.register('viewer_report', {
        viewModel: function(params) {
            params.configKeys = [];
            
            ReportViewModel.apply(this, [params]);
            
            var self = this;
            
            // Only initialize once across all instances
            if (!viewerInitialized) {
                viewerInitialized = true;
                
                setTimeout(function() {
                    var viewerEl = document.getElementById('ptmViewer');
                    if (!viewerEl) {
                        console.error("ptmViewer element not found");
                        return;
                    }

                    // Clear any existing content
                    viewerEl.innerHTML = '';
                    
                    console.log("Initializing PTM viewer...");
                    
                    require(['../../viewer/index.js'], function(viewer) {
                        try {
                            viewer.init("ptmViewer", {
                                imageGroupId: "test",
                                imageServerBaseUrl: "http://localhost:8183/iiif/3/",
                                manifestFileUrl: "http://localhost:3000/pap18_1609/new_manifest.json"
                            });
                        } catch (e) {
                            console.error("Error initializing viewer:", e);
                            viewerEl.innerHTML = "<p>Error loading viewer: " + e.message + "</p>";
                        }
                    });
                }, 500);
            }
        },
        template: viewerReportTemplate,
    });
});