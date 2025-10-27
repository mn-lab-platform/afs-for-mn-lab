console.log("viewer_report.js loaded");

define([
    'knockout',
    'viewmodels/report',
    'templates/views/report-templates/viewer_report.htm',
], function(ko, ReportViewModel, viewerReportTemplate) {
    
    return ko.components.register('viewer_report', {
        viewModel: function(params) {
            params.configKeys = [];
            
            ReportViewModel.apply(this, [params]);
            
            const self = this;
            self.viewerInitialized = false;
            
            this.onPtmViewerRendered = function() {
                if (self.viewerInitialized) {
                    console.log("Viewer already initialized, skipping");
                    return;
                }
                
                const viewerEl = document.getElementById('ptmViewer');
                if (!viewerEl) {
                    console.error("ptmViewer element not found");
                    return;
                }

                // Check if PTM containers already exist
                const existingContainers = viewerEl.querySelectorAll('.ptm-container');
                if (existingContainers.length > 0) {
                    console.log("PTM containers already exist, skipping initialization");
                    return;
                }

                self.viewerInitialized = true;
                viewerEl.innerHTML = '';
                
                console.log("Initializing PTM viewer...");
                const tileId = params.report?.report_json?.resource?.File?.[0]?.['@tile_id'];
                require(['../../viewer/index.js'], function(viewer) {
                    try {
                        viewer.init("ptmViewer", {
                            imageServerBaseUrl: "/iiifserver/iiif/3",
                            manifestFileUrl: `/rti-manifest/${tileId}`
                        });
                    } catch (e) {
                        console.error("Error initializing viewer:", e);
                        viewerEl.innerHTML = "<p>Error loading viewer: " + e.message + "</p>";
                    }
                });
            };
        },
        template: viewerReportTemplate,
    });
});