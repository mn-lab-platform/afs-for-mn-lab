define([
    'knockout',
    'viewmodels/report',
    'templates/views/report-templates/custom_report.htm',
    'jquery'
], function(ko, ReportViewModel, customReportTemplate, $) {
    console.log('[custom_report] component loading...');

    var HOP_BASE = window.HOP_BASE || '/static/3dhop/js_sors/';
    var HOP_SCRIPTS = [
        'spidergl.js',              
        'presenter.js',
        'nexus.js',
        'ply.js',
        'trackball_turntable.js',

        'init.js',
        'helpers.js'
    ].map(function(s){ return HOP_BASE + s; });

    // singleton promise — brak podwójnego ładowania między zakładkami
    function ensure3DHOP() {
        if (typeof window.Presenter !== 'undefined') {
            console.log('[custom_report] 3DHOP already ready (Presenter present).');
            return Promise.resolve();
        }
        if (window.__HOP_PROM) {
            console.log('[custom_report] reusing existing 3DHOP load promise.');
            return window.__HOP_PROM;
        }

        //  jQuery  globalnie 
        if (typeof window.jQuery === 'undefined' && typeof $ !== 'undefined') {
            window.jQuery = window.$ = $;
        }

        console.log('[custom_report] loading 3DHOP from', HOP_BASE);
        window.__HOP_PROM = HOP_SCRIPTS.reduce(function(p, src) {
            return p.then(function(){
                return new Promise(function(resolve, reject){
                    if (document.querySelector('script[src="'+src+'"]')) {
                        console.log('[custom_report] script already in DOM:', src);
                        resolve(); return;
                    }
                    var s = document.createElement('script');
                    s.src = src;
                    s.async = false;
                    s.onload = function(){ console.log('[custom_report] loaded:', src); resolve(); };
                    s.onerror = function(){ console.error('[custom_report] failed:', src); reject(new Error('Failed '+src)); };
                    document.head.appendChild(s);
                });
            });
        }, Promise.resolve()).then(function(){
            if (typeof window.Presenter === 'undefined') {
                throw new Error('3DHOP not ready after load (Presenter undefined)');
            }
        }).catch(function(e){
            delete window.__HOP_PROM; // pozwól spróbować ponownie następnym razem
            throw e;
        });

        return window.__HOP_PROM;
    }

    return ko.components.register('custom_report', {
        viewModel: function(params) {
            console.log('[custom_report] viewModel init with params:', params);

            if (params && params.configForm === true) {
                console.log('[custom_report] configForm=true → skip viewer init (editor mode).');
                ReportViewModel.apply(this, [params]);
                return;
            }

            var self = this;
            var presenter = null;

            params.configKeys = params.configKeys || [];
            console.log('[custom_report] config keys:', params.configKeys);

            ReportViewModel.apply(this, [params]);
            console.log('[custom_report] ReportViewModel applied. report:', this.report);

            // === Model URL resolver (preferujemy 'path') ===
            // Jeśli kiedyś zmienisz MEDIA_URL, ustaw window.MEDIA_URL globalnie.
            // U Ciebie teraz to '/files/'.
            const MEDIA = (window.MEDIA_URL || '/files/').replace(/\/+$/, '/') ;

            self.resolveModelUrl = function () {
                console.log('[custom_report] Resolving model URL (File/file_details, path-first)…');

                const res = params?.report?.report_json?.resource;
                if (!res) {
                    console.warn('[custom_report] report_json.resource missing');
                    return null;
                }

                // Zbierz wszystkie file_details ze wszystkich bloków "File"
                const details = Array.isArray(res.File)
                    ? res.File.flatMap(f => f?.file_details || [])
                    : [];

                if (!details.length) {
                    console.warn('[custom_report] No file_details[] in resource.File');
                    return null;
                }

                // Wybierz pierwszy wpis, w którym JAKIEKOLWIEK z pól kończy się na .nxz/.nxs/.ply
                const is3d = s => /\.(nxz|nxs|ply)$/i.test(String(s || '').toLowerCase());
                const pick = details.find(d => is3d(d?.path) || is3d(d?.url) || is3d(d?.name)) || details[0];

                // 1) PRIORYTET: path → MEDIA + path (bo path ma rozszerzenie i stabilną relację do MEDIA_URL)
                if (pick?.path) {
                    const url = MEDIA + String(pick.path).replace(/^\/+/, '');
                    console.log('[custom_report] Using path →', url);
                    return url; // np. /files/uploadedfiles/gargo.nxz
                }

                // 2) Fallback: url z rozszerzeniem (czasem url bywa bez rozszerzenia, wtedy pomijamy)
                if (pick?.url && is3d(pick.url)) {
                    console.log('[custom_report] Using url with extension →', pick.url);
                    return pick.url;
                }

                // 3) Last resort: sama nazwa → MEDIA + 'uploadedfiles/' + name
                if (pick?.name && is3d(pick.name)) {
                    const url = MEDIA + 'uploadedfiles/' + String(pick.name).replace(/^\/+/, '');
                    console.log('[custom_report] Using name →', url);
                    return url;
                }

                console.warn('[custom_report] Could not build model URL from file_details');
                return null;
            };


            // Minimalna detekcja — wystarczy Presenter
            self.are3DHopScriptsLoaded = function() {
                var ok = (typeof window.Presenter !== 'undefined');
                console.log('[custom_report] are3DHopScriptsLoaded =', ok, 'Presenter:', !!window.Presenter, 'init3dhop:', !!window.init3dhop);
                return ok;
            };

            self.load3DHopScripts = function() {
                return ensure3DHOP();
            };

            // ===== Ustawienie sceny 3DHOP =====
            self.setup3dhop = function() {
                console.log('[custom_report] Setting up 3DHOP...');

                if (typeof window.Presenter === 'undefined') {
                    console.error('[custom_report] 3DHOP Presenter not loaded');
                    return;
                }

                // Resolve once & cache
                if (!self.modelUrl) self.modelUrl = self.resolveModelUrl();

                if (!self.modelUrl) {
                    console.error('[custom_report] No model URL found. Set params.modelUrl / params.modelNodeId or attach a .nxz/.nxs/.ply to this resource.');
                    return;
                }

                console.log('[custom_report] Creating Presenter on #draw-canvas with URL:', self.modelUrl);
                presenter = new window.Presenter('draw-canvas');
                window.presenter = presenter; // część helperów oczekuje globalnego presenter

                console.log('[custom_report] Setting scene...');
                presenter.setScene({
                    meshes: { ResourceModel: { url: self.modelUrl } },
                    modelInstances: { Model1: { mesh: 'ResourceModel' } },
                    space: { centerMode: 'scene', radiusMode: 'scene' },
                    config: {
                        showClippingPlanes  : true,
                        showClippingBorder  : true,
                        clippingBorderSize  : 0.5,
                        clippingBorderColor : [0.0, 1.0, 1.0]
                    }
                });
                console.log('[custom_report] Scene set successfully');

                presenter._onEndPickingPoint = self.onEndPick;
                presenter._onEndMeasurement  = self.onEndMeasure;
                presenter._onPickedSpot      = self.onPickedSpot;
                presenter._onPickedInstance  = self.onPickedInstance;
            };

            // ===== Toolbar & callbacki (Twoje, bez zmian istotnych) =====
            self.actionsToolbar = function(action) {
                console.log('[custom_report] Toolbar action:', action);
                if (!presenter) { console.error('[custom_report] Presenter not initialized'); return; }
                if (action == 'home') presenter.resetTrackball();
                else if (action == 'zoomin') presenter.zoomIn();
                else if (action == 'zoomout') presenter.zoomOut();
                else if (action == 'light' || action == 'light_on') {
                    var on = presenter.isLightTrackballEnabled();
                    presenter.enableLightTrackball(!on);
                    console.log('[custom_report] Light trackball ->', !on);
                }
                else if (action == 'pick' || action == 'pick_on') {
                    presenter.enablePickpointMode(!presenter.isPickpointModeEnabled());
                    self.pickpointSwitch();
                }
                else if (action == 'measure' || action == 'measure_on') {
                    presenter.enableMeasurementTool(!presenter.isMeasurementToolEnabled());
                    self.measureSwitch();
                }
                else if (action == 'hotspot' || action == 'hotspot_on') {
                    if (typeof window.HOP_ALL !== 'undefined') presenter.toggleSpotVisibility(HOP_ALL, true);
                    presenter.enableOnHover(!presenter.isOnHoverEnabled());
                    self.hotspotSwitch();
                }
                else if (action == 'sections' || action == 'sections_on') {
                    $('#sections-box').toggleClass('active');
                    if (typeof window.sectiontoolReset === 'function') window.sectiontoolReset();
                    if (typeof window.sectiontoolSwitch === 'function') window.sectiontoolSwitch();
                }
            };

            self.onEndPick = function(point) {
                var x = point[0].toFixed(2), y = point[1].toFixed(2), z = point[2].toFixed(2);
                $('#pickpoint-output').html('[ '+x+' , '+y+' , '+z+' ]');
                console.log('[custom_report] Point picked:', x, y, z);
            };
            self.onEndMeasure = function(measure) {
                $('#measure-output').html(measure.toFixed(2) + ' mm');
                console.log('[custom_report] Measurement:', measure.toFixed(2) + ' mm');
            };
            self.onPickedSpot = function(id) {
                console.log('[custom_report] Hotspot picked:', id);
            };
            self.onPickedInstance = function(id) {
                console.log('[custom_report] Instance picked:', id);
            };

            self.pickpointSwitch = function() {
                var on = presenter.isPickpointModeEnabled();
                $('#pick').toggleClass('active', on);
                console.log('[custom_report] Pickpoint ->', on);
            };
            self.measureSwitch = function() {
                var on = presenter.isMeasurementToolEnabled();
                $('#measure').toggleClass('active', on);
                console.log('[custom_report] Measure ->', on);
            };
            self.hotspotSwitch = function() {
                var on = presenter.isOnHoverEnabled();
                $('#hotspot').toggleClass('active', on);
                console.log('[custom_report] Hotspot ->', on);
            };

            self.bindToolbarEvents = function() {
                console.log('[custom_report] Binding toolbar events...');
                $('#home').off('click').on('click', function(){ self.actionsToolbar('home'); });
                $('#zoomin').off('click').on('click', function(){ self.actionsToolbar('zoomin'); });
                $('#zoomout').off('click').on('click', function(){ self.actionsToolbar('zoomout'); });
                $('#light').off('click').on('click', function(){ self.actionsToolbar('light'); });
                $('#pick').off('click').on('click', function(){ self.actionsToolbar('pick'); });
                $('#measure').off('click').on('click', function(){ self.actionsToolbar('measure'); });
                $('#hotspot').off('click').on('click', function(){ self.actionsToolbar('hotspot'); });
                $('#sections').off('click').on('click', function(){ self.actionsToolbar('sections'); });
                $('#sections_on').off('click').on('click', function(){ self.actionsToolbar('sections_on'); });
                console.log('[custom_report] Toolbar events bound.');
            };

            self.init3dhopViewer = function() {
                console.log('[custom_report] Initializing 3DHOP viewer...');
                self.load3DHopScripts()
                    .then(function() {
                        console.log('[custom_report] 3DHOP scripts loaded (Presenter present?)', !!window.Presenter);

                        if (typeof window.init3dhop === 'function') {
                            try { console.log('[custom_report] Calling init3dhop...'); window.init3dhop(); }
                            catch (e) { console.warn('[custom_report] init3dhop error:', e); }
                        } else {
                            console.warn('[custom_report] init3dhop not found (ok if your bundle doesn’t export it).');
                        }

                        // Najpierw spróbuj zbudować presenter (ustawia window.presenter)
                        self.setup3dhop();

                        // Odpalaj tylko jeśli presenter faktycznie powstał
                        if (window.presenter) {
                            if (typeof window.sectiontoolInit === 'function') {
                                try { window.sectiontoolInit(); } catch(e) { console.warn('[custom_report] sectiontoolInit error:', e); }
                            } else {
                                console.warn('[custom_report] sectiontoolInit not found.');
                            }
                            if (typeof window.resizeCanvas === 'function') {
                                try { window.resizeCanvas(800, 600); } catch(e) { console.warn('[custom_report] resizeCanvas error:', e); }
                            } else {
                                console.warn('[custom_report] resizeCanvas not found.');
                            }
                        } else {
                            console.warn('[custom_report] presenter not ready → skipping sectiontoolInit/resizeCanvas');
                        }

                        self.bindToolbarEvents();
                        console.log('[custom_report] 3DHOP initialized (attempt) complete');
                    })
                    .catch(function(error) {
                        console.error('[custom_report] Failed to load 3DHOP scripts:', error);
                    });
            };

            console.log('[custom_report] Delay done → starting 3DHOP init...');
            self.init3dhopViewer();

            console.log('[custom_report] viewModel initialization completed');
        },
        template: customReportTemplate,
    });
});
