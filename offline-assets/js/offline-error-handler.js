// Offline Error Handler - Maneja errores comunes en modo offline
(function() {
    'use strict';

    // Mock de objetos WordPress comunes
    if (typeof window.wp === 'undefined') {
        window.wp = {
            i18n: {
                setLocaleData: function() {
                    // Mock silencioso para setLocaleData
                    return true;
                },
                __: function(text) {
                    return text;
                },
                _x: function(text) {
                    return text;
                },
                _n: function(single, plural, number) {
                    return number === 1 ? single : plural;
                }
            },
            hooks: {
                addAction: function() { return true; },
                addFilter: function() { return true; },
                removeAction: function() { return true; },
                removeFilter: function() { return true; },
                doAction: function() { return true; },
                applyFilters: function(tag, value) { return value; }
            },
            data: {
                select: function() { return {}; },
                dispatch: function() { return {}; }
            },
            ajax: {
                post: function() {
                    return Promise.resolve({});
                }
            }
        };
    }

    // Mock de elementorFrontendConfig
    if (typeof window.elementorFrontendConfig === 'undefined') {
        window.elementorFrontendConfig = {
            environmentMode: {
                edit: false,
                wpPreview: false,
                isScriptDebug: false
            },
            i18n: {
                shareOnFacebook: 'Compartir en Facebook',
                shareOnTwitter: 'Compartir en Twitter',
                pinIt: 'Pinear',
                download: 'Descargar',
                downloadImage: 'Descargar imagen',
                fullscreen: 'Pantalla completa',
                zoom: 'Zoom',
                share: 'Compartir',
                playVideo: 'Reproducir video',
                previous: 'Anterior',
                next: 'Siguiente',
                close: 'Cerrar'
            },
            is_rtl: false,
            breakpoints: {
                xs: 0,
                sm: 480,
                md: 768,
                lg: 1025,
                xl: 1440,
                xxl: 1600
            },
            responsive: {
                breakpoints: {
                    mobile: {
                        label: 'Mobile',
                        value: 767,
                        default_value: 767,
                        direction: 'max',
                        is_enabled: true
                    },
                    mobile_extra: {
                        label: 'Mobile Extra',
                        value: 880,
                        default_value: 880,
                        direction: 'max',
                        is_enabled: false
                    },
                    tablet: {
                        label: 'Tablet',
                        value: 1024,
                        default_value: 1024,
                        direction: 'max',
                        is_enabled: true
                    },
                    tablet_extra: {
                        label: 'Tablet Extra',
                        value: 1200,
                        default_value: 1200,
                        direction: 'max',
                        is_enabled: false
                    },
                    laptop: {
                        label: 'Laptop',
                        value: 1366,
                        default_value: 1366,
                        direction: 'max',
                        is_enabled: false
                    },
                    widescreen: {
                        label: 'Widescreen',
                        value: 2400,
                        default_value: 2400,
                        direction: 'min',
                        is_enabled: false
                    }
                }
            },
            version: '3.30.2',
            is_static: false,
            experimentalFeatures: {},
            urls: {
                assets: 'offline-assets/'
            },
            settings: {
                page: [],
                editorPreferences: []
            },
            kit: {
                active_breakpoints: ['viewport_mobile', 'viewport_tablet'],
                global_image_lightbox: 'yes',
                lightbox_enable_counter: 'yes',
                lightbox_enable_fullscreen: 'yes',
                lightbox_enable_zoom: 'yes',
                lightbox_enable_share: 'yes',
                lightbox_title_src: 'title',
                lightbox_description_src: 'description'
            },
            post: {
                id: 0,
                title: 'Offline Page',
                excerpt: ''
            }
        };
    }

    // Mock de monitorErrorLog si no existe
    if (typeof window.monitorErrorLog === 'undefined') {
        window.monitorErrorLog = function() {
            // Mock silencioso para monitorErrorLog
            return true;
        };
    }
    
    // Interceptar llamadas AJAX cuando jQuery esté disponible
    function setupAjaxInterception() {
        if (typeof jQuery !== 'undefined' && jQuery.ajaxPrefilter) {
            jQuery.ajaxPrefilter(function(options, originalOptions, jqXHR) {
                // Interceptar llamadas a admin-ajax.php
                if (options.url && options.url.includes('admin-ajax.php')) {
                    jqXHR.abort();
                    return false;
                }
                
                // Interceptar llamadas a LiteSpeed Cache
                if (options.url && (options.url.includes('litespeed') || options.url.includes('lscache'))) {
                    jqXHR.abort();
                    return false;
                }
            });
        }
    }
    
    // Interceptar fetch API
    if (typeof window.fetch !== 'undefined') {
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string') {
                if (url.includes('admin-ajax.php') || url.includes('litespeed') || url.includes('lscache')) {
                    return Promise.reject(new Error('Offline mode: External request blocked'));
                }
            }
            return originalFetch.apply(this, arguments);
        };
    }
    
    // Configurar interceptación cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAjaxInterception);
    } else {
        setupAjaxInterception();
    }

    // También configurar cuando jQuery esté disponible
    if (typeof jQuery === 'undefined') {
        const checkJQuery = setInterval(function() {
            if (typeof jQuery !== 'undefined') {
                clearInterval(checkJQuery);
                setupAjaxInterception();
            }
        }, 100);
    } else {
        setupAjaxInterception();
    }
    
    // Suprimir errores comunes de consola
    const originalConsoleError = console.error;
    console.error = function() {
        const message = arguments[0];
        if (typeof message === 'string') {
            // Suprimir errores específicos de modo offline
            if (message.includes('Failed to load resource') ||
                message.includes('net::ERR_ABORTED') ||
                message.includes('admin-ajax.php') ||
                message.includes('litespeed') ||
                message.includes('elementorFrontendConfig') ||
                message.includes('setLocaleData')) {
                return;
            }
        }
        originalConsoleError.apply(console, arguments);
    };
    
})();