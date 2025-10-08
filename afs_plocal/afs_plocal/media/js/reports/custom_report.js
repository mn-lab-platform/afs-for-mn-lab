define([
    'knockout',
    'viewmodels/report',
    'templates/views/report-templates/custom_report.htm'
], function(ko, ReportViewModel, customReportTemplate) {
    console.log('Custom report component loading...');
    
    return ko.components.register('custom_report', {
        viewModel: function(params) {
            console.log('Custom report viewModel initializing with params:', params);
            var self = this;
            var presenter = null;
            
            params.configKeys = params.configKeys || [];
            console.log('Config keys set:', params.configKeys);
            
            ReportViewModel.apply(this, [params]);
            console.log('ReportViewModel applied, self.report:', this.report);
            self.are3DHopScriptsLoaded = function() {
                return typeof window.Presenter !== 'undefined' && 
                       typeof window.init3dhop === 'function';
            };            
            // Load 3DHOP scripts dynamically
            self.load3DHopScripts = function() {
                // Jeśli skrypty są już załadowane, nie ładuj ponownie
                if (self.are3DHopScriptsLoaded()) {
                    console.log('3DHOP scripts already loaded');
                    return Promise.resolve();
                }

                return new Promise(function(resolve, reject) {
                    console.log('Loading 3DHOP scripts dynamically...');
                    
                    var scripts = [
                        '/static/3dhop/js_sors/spidergl.js',
                        '/static/3dhop/js_sors/presenter.js',
                        '/static/3dhop/js_sors/nexus.js',
                        '/static/3dhop/js_sors/ply.js',
                        '/static/3dhop/js_sors/trackball_turntable.js',
                        '/static/3dhop/js_sors/trackball_pantilt.js',
                        '/static/3dhop/js_sors/trackball_rail.js',
                        '/static/3dhop/js_sors/init.js',
                        '/static/3dhop/js_sors/helpers.js'
                    ];
                    
                    function loadScript(src) {
                        return new Promise(function(resolve, reject) {
                            // Sprawdź czy skrypt już istnieje
                            var existingScript = document.querySelector('script[src="' + src + '"]');
                            if (existingScript) {
                                console.log('Script already loaded:', src);
                                resolve();
                                return;
                            }

                            var script = document.createElement('script');
                            script.src = src;
                            script.onload = function() {
                                console.log('Loaded:', src);
                                resolve();
                            };
                            script.onerror = function() {
                                console.error('Failed to load:', src);
                                reject(new Error('Failed to load script: ' + src));
                            };
                            document.head.appendChild(script);
                        });
                    }
                    
                    var loadSequentially = function(index) {
                        if (index >= scripts.length) {
                            console.log('All 3DHOP scripts loaded');
                            resolve();
                            return;
                        }
                        
                        loadScript(scripts[index])
                            .then(function() {
                                loadSequentially(index + 1);
                            })
                            .catch(reject);
                    };
                    
                    loadSequentially(0);
                });
            };

            self.setup3dhop = function() { 
                console.log('Setting up 3DHOP...');
                
                if (typeof window.Presenter === 'undefined') {
                    console.error('3DHOP Presenter not loaded');
                    return;
                }
                
                console.log('Creating new Presenter instance...');
                presenter = new window.Presenter("draw-canvas");
                
                // Ustaw globalną zmienną presenter dla kompatybilności z init.js
                window.presenter = presenter;

                console.log('Presenter created:', presenter);

                console.log('Setting scene...');
                presenter.setScene({
                    meshes: {
                        "Gargoyle" : { url: "/static/3dhop/models/gargo.nxz" }
                    },
                    modelInstances : {
                        "Model1" : { mesh : "Gargoyle" } 
                    },
                    space: {
                      centerMode: "scene",
                      radiusMode: "scene"
                    },
                    config : {
                      showClippingPlanes  : true,
                      showClippingBorder  : true,
                      clippingBorderSize  : 0.5,
                      clippingBorderColor : [0.0, 1.0, 1.0]
                    }
                });
                console.log('Scene set successfully');

                presenter._onEndPickingPoint = self.onEndPick;
                presenter._onEndMeasurement = self.onEndMeasure;
                presenter._onPickedSpot = self.onPickedSpot;
                presenter._onPickedInstance = self.onPickedInstance;          
        
            };

            self.actionsToolbar = function(action) {
                console.log('Toolbar action triggered:', action);
                
                if(!presenter) {
                    console.error('Presenter not initialized');
                    return;
                }
                
                if(action=='home') {
                    console.log('Resetting trackball...');
                    presenter.resetTrackball(); 
                }
                else if(action=='zoomin') {
                    console.log('Zooming in...');
                    presenter.zoomIn();
                }
                else if(action=='zoomout') {
                    console.log('Zooming out...');
                    presenter.zoomOut(); 
                }
                else if(action=='light' || action=='light_on') {
                    var currentLightState = presenter.isLightTrackballEnabled();
                    console.log('Current light trackball state:', currentLightState);
                    
                    presenter.enableLightTrackball(!currentLightState);
                    console.log('Light trackball toggled to:', !currentLightState);
                }
                else if(action=='pick' || action=='pick_on') { 
                    console.log('Toggling pickpoint mode...');
                    presenter.enablePickpointMode(!presenter.isPickpointModeEnabled()); 
                    self.pickpointSwitch(); 
                }
                else if(action=='measure' || action=='measure_on') { 
                    console.log('Toggling measurement tool...');
                    presenter.enableMeasurementTool(!presenter.isMeasurementToolEnabled()); 
                    self.measureSwitch(); 
                }
                else if(action=='hotspot'|| action=='hotspot_on') { 
                    console.log('Toggling hotspot visibility...');
                    presenter.toggleSpotVisibility(HOP_ALL, true); 
                    presenter.enableOnHover(!presenter.isOnHoverEnabled()); 
                    self.hotspotSwitch(); 
                }
                else if(action=='sections' || action=='sections_on') { 
                    console.log('Toggling sections tool...');
                    // Toggle sections box visibility
                    $('#sections-box').toggleClass('active');
                    // Initialize sections if not already done
                    if (typeof window.sectiontoolReset === 'function') {
                        window.sectiontoolReset(); 
                    }
                    if (typeof window.sectiontoolSwitch === 'function') {
                        window.sectiontoolSwitch(); 
                    }
                } 
            };

            // Add the callback functions
            self.onEndPick = function(point) {
                // point.toFixed(2) sets the number of decimals when displaying the picked point
                var x = point[0].toFixed(2);
                var y = point[1].toFixed(2);
                var z = point[2].toFixed(2);
                $('#pickpoint-output').html("[ "+x+" , "+y+" , "+z+" ]");
                console.log('Point picked:', x, y, z);
            };

            self.onEndMeasure = function(measure) {
                // measure.toFixed(2) sets the number of decimals when displaying the measure
                // depending on the model measure units, use "mm","m","km" or whatever you have
                $('#measure-output').html(measure.toFixed(2) + " mm");
                console.log('Measurement taken:', measure.toFixed(2) + " mm");
            };

            self.onPickedSpot = function(id) {
                console.log('Hotspot picked:', id);
                switch(id) {
                    case 'Wing'   : alert("Wing Hotspot Clicked"); break;
                    case 'Sphere' : alert("Basis Hotspot Clicked"); break;
                }
            };

            self.onPickedInstance = function(id) {
                console.log('Instance picked:', id);
                switch(id) {
                    case 'Gargo' : alert("Gargoyle Model Clicked "); break;
                }
            };

            // Add switch functions for UI feedback
            self.pickpointSwitch = function() {
                var isEnabled = presenter.isPickpointModeEnabled();
                $('#pick').toggleClass('active', isEnabled);
                console.log('Pickpoint mode:', isEnabled ? 'enabled' : 'disabled');
            };

            self.measureSwitch = function() {
                var isEnabled = presenter.isMeasurementToolEnabled();
                $('#measure').toggleClass('active', isEnabled);
                console.log('Measurement tool:', isEnabled ? 'enabled' : 'disabled');
            };

            self.hotspotSwitch = function() {
                var isEnabled = presenter.isOnHoverEnabled();
                $('#hotspot').toggleClass('active', isEnabled);
                console.log('Hotspot mode:', isEnabled ? 'enabled' : 'disabled');
            };

            self.bindToolbarEvents = function() {
                console.log('Binding toolbar events...');
                
                $('#home').off('click').on('click', function() { 
                    console.log('Home button clicked');
                    self.actionsToolbar('home'); 
                });
                $('#zoomin').off('click').on('click', function() { 
                    console.log('Zoom in button clicked');
                    self.actionsToolbar('zoomin'); 
                });
                $('#zoomout').off('click').on('click', function() { 
                    console.log('Zoom out button clicked');
                    self.actionsToolbar('zoomout'); 
                });
                $('#light').off('click').on('click', function() { 
                    console.log('Light button clicked');
                    self.actionsToolbar('light'); 
                });
                $('#pick').off('click').on('click', function() { 
                    console.log('Pick button clicked');
                    self.actionsToolbar('pick'); 
                });
                $('#measure').off('click').on('click', function() { 
                    console.log('Measure button clicked');
                    self.actionsToolbar('measure'); 
                });
                $('#hotspot').off('click').on('click', function() { 
                    console.log('Hotspot button clicked');
                    self.actionsToolbar('hotspot'); 
                });
                
                // Bind both sections buttons
                $('#sections').off('click').on('click', function() { 
                    console.log('Sections button clicked');
                    if (typeof window.sectiontoolSwitch === 'function') {
                        window.sectiontoolSwitch();
                    }
                });
                $('#sections_on').off('click').on('click', function() { 
                    console.log('Sections ON button clicked');
                    if (typeof window.sectiontoolSwitch === 'function') {
                        window.sectiontoolSwitch();
                    }
                });
                
                console.log('Toolbar events bound successfully');
            };

            self.init3dhopViewer = function() {
                console.log('Initializing 3DHOP viewer...');
                
                self.load3DHopScripts()
                    .then(function() {
                        console.log('3DHOP scripts loaded, waiting for initialization...');
                        
                        setTimeout(function() {
                            if (self.are3DHopScriptsLoaded()) {
                                try {
                                    console.log('Calling init3dhop...');
                                    window.init3dhop();
                                    console.log('init3dhop completed');
                                    
                                    self.setup3dhop();
                                    window.sectiontoolInit();
                                    if (typeof window.resizeCanvas === 'function') {
                                        console.log('Resizing canvas to 800x600...');
                                        window.resizeCanvas(800, 600);
                                        console.log('Canvas resized');
                                    } else {
                                        console.warn('resizeCanvas function not available');
                                    }
                                    
                                    self.bindToolbarEvents();
                                    
                                    console.log('3DHOP initialized successfully');
                                } catch (error) {
                                    console.error('Error initializing 3DHOP:', error);
                                }
                            } else {
                                console.error('3DHOP functions still not available after loading scripts');
                            }
                        }, 1000);
                    })
                    .catch(function(error) {
                        console.error('Failed to load 3DHOP scripts:', error);
                    });
            };

            // Inicjalizuj tylko raz
            if (!window._3dhop_initialized) {
                window._3dhop_initialized = true;
                setTimeout(function() {
                    console.log('Component initialization delay completed, starting 3DHOP init...');
                    self.init3dhopViewer();
                }, 500);
            }
            
            console.log('Custom report viewModel initialization completed');
        },
        template: customReportTemplate,
    });
});