(function (angular) {
    'use strict';
    angular.module('leaflet-map-controller', ['leaflet-directive', 'map-service', 'popup-service'])
        .controller('LeafletMapController', ["$scope", "LayoutService", "$http", "leafletData", "leafletBoundsHelpers",
            "MapService", '$timeout', 'leafletHelpers', 'PopupService', 'ToolsService',
            function ($scope, LayoutService, $http, leafletData, leafletBoundsHelpers, MapService, $timeout, leafletHelpers, popupService, ToolsService) {
                //ToolsService included so it is initiated

                angular.extend($scope, {
                    layercontrol: {
                        icons: {
                            uncheck: "fa fa-toggle-off",
                            check: "fa fa-toggle-on"
                        }
                    },
                    australia: {
                        lat: $SH.defaultLat,
                        lng: $SH.defaultLng,
                        zoom: $SH.defaultZoom
                    },
                    layers: {
                        baselayers: $SH.baseLayers,
                        overlays: MapService.leafletLayers
                    },
                    controls: {
                        draw: {}
                    },
                    bounds: leafletBoundsHelpers.createBoundsFromArray([
                        [51.508742458803326, -0.087890625],
                        [51.508742458803326, -0.087890625]
                    ])

                });

                MapService.leafletScope = $scope;

                $scope.baseMap = $SH.defaultBaseLayer;
                $scope.getBaseMap = function () {
                    return $scope.baseMap
                };

                $scope.setBaseMap = function (key) {
                    leafletHelpers.safeApply($scope, function (scp) {
                        $scope.baseMap = key;
                        scp.baselayer = key;
                        leafletData.getMap().then(function (map) {
                            leafletData.getLayers().then(function (leafletLayers) {
                                if (map.hasLayer(leafletLayers.baselayers[key])) {
                                    return;
                                }

                                for (var i in scp.layers.baselayers) {
                                    if (scp.layers.baselayers.hasOwnProperty(i)) {
                                        if (map.hasLayer(leafletLayers.baselayers[i])) {
                                            map.removeLayer(leafletLayers.baselayers[i]);
                                        }
                                    }
                                }

                                map.addLayer(leafletLayers.baselayers[key]);
                            });
                        });
                    });


                    leafletData.getMap().then(function (map) {
                        leafletData.getLayers().then(function (leafletLayers) {

                            map.fire('baselayerchange', leafletLayers.baselayers[key]);
                        })
                    })
                };

                $scope.invalidate = function () {
                    leafletData.getMap().then(function (map) {
                        $(window).trigger('resize');
                        map.invalidateSize()
                    });
                };

                $scope.zoom = function (bounds) {
                    var b = bounds;
                    if ((bounds + '').startsWith('POLYGON')) {
                        //convert POLYGON box to bounds
                        var split = bounds.split(',');
                        var p1 = split[1].split(' ');
                        var p2 = split[3].split(' ');
                        b = [[Math.min(p1[1], p2[1]), Math.min(p1[0], p2[0])], [Math.max(p1[1], p2[1]), Math.max(p1[0], p2[0])]]
                    }
                    if (bounds && bounds.length === 4) {
                        b = [[bounds[1], bounds[0]], [bounds[3], bounds[2]]]
                    }
                    leafletData.getMap().then(function (map) {
                        map.fitBounds(b);
                    });
                };

                $scope.zoomToPoint = function (latlng, level) {
                    leafletData.getMap().then(function (map) {
                        map.setView(latlng, level)
                    });
                };

                $scope.resetZoom = function () {
                    leafletData.getMap().then(function (map) {
                        map.panTo(L.latLng(-25, 132));
                        map.setZoom(4)
                    });
                };

                $scope.showLayer = function (layer, show) {
                    leafletData.getMap().then(function (map) {
                        leafletData.getLayers().then(function (leafletLayers) {
                            var ly;
                            for (var k in $scope.layers.overlays) {
                                if ($scope.layers.overlays.hasOwnProperty(k)) {
                                    if ($scope.layers.overlays[k] === layer) {
                                        ly = leafletLayers.overlays[k];
                                        break;
                                    }
                                }
                            }

                            if (map.hasLayer(ly)) {
                                ly.visible = show
                            }
                        })
                    })
                };

                $scope.moveLayer = function (layer, newIndex) {
                    leafletData.getMap().then(function (map) {
                        leafletData.getLayers().then(function (leafletLayers) {
                            var ly;
                            var oldLy;
                            for (var k in $scope.layers.overlays) {
                                if ($scope.layers.overlays.hasOwnProperty(k)) {
                                    if ($scope.layers.overlays[k] === layer) {
                                        ly = leafletLayers.overlays[k];
                                    }
                                    if ($scope.layers.overlays[k].index === newIndex) {
                                        oldLy = $scope.layers.overlays[k];
                                    }
                                }
                            }

                            if (map.hasLayer(ly)) {
                                if (oldLy !== undefined) {
                                    oldLy.index = ly.index;
                                    oldLy.setZIndex(oldLy.index)
                                }

                                ly.index = newIndex;
                                ly.setZIndex(newIndex);
                            }
                        })
                    })
                };

                $scope.$watch('layers.overlays', function (newOverlayLayers) {
                    var overlaysArray = [];
                    leafletData.getLayers().then(function (leafletLayers) {
                        var key;
                        for (key in newOverlayLayers) {
                            if (newOverlayLayers.hasOwnProperty(key)) {
                                var ly = newOverlayLayers[key];

                                overlaysArray.push(ly);

                                if (ly.index !== undefined && leafletLayers.overlays[key].setZIndex) {
                                    leafletLayers.overlays[key].setZIndex(newOverlayLayers[key].index);
                                }
                            }
                        }

                        $scope.overlaysArray = overlaysArray;
                    });
                }, true);

                $scope.toggleExpandLeft = function (context) {
                    if ($("#right-panel")[0].style.marginLeft == "0px") {
                        $("#left-panel")[0].style.marginLeft = "0px";
                        $("#right-panel")[0].style.marginLeft = "420px";
                    } else {
                        $("#left-panel")[0].style.marginLeft = "-420px";
                        $("#right-panel")[0].style.marginLeft = "0px";
                    };
                    $(window).trigger('resize');
                    context.invalidateSize()
                };

                $scope.toggleExpandUp = function (context) {
                    if (!context) {
                        context = this;
                    }
                    if (getComputedStyle($("body")[0]).paddingTop == "0px") {
                        $(".navbar-default").show();
                        $("body")[0].style.paddingTop = "";
                    } else {
                        $("body")[0].style.paddingTop = "0px";
                        $(".navbar-default").hide();
                    };

                    // var headerHeight = getComputedStyle($('.navbar-default')[0]).height.replace("px","").replace("auto", "0");
                    // $("#map").height($(window).height() - headerHeight);
                    // // $("#legend").height($(window).height() - headerHeight - 210);
                    // $("body")[0].style.paddingTop = headerHeight + "px";
                    // $("#defaultPanel").height($(window).height() - headerHeight - 20 - getComputedStyle($('#spMenu')[0]).height.replace("px","").replace("auto", "0"));

                    //
                    $(window).trigger('resize');
                    context.invalidateSize()
                };

                $scope.addPointsToMap = function (data) {
                    leafletData.getMap().then(function () {
                        leafletData.getLayers().then(function (baselayers) {
                            var drawnItems = baselayers.overlays.draw;
                            var pt;
                            for (pt in data) {
                                if (data.hasOwnProperty(pt)) {
                                    var g;
                                    if (data[pt] instanceof Array) {
                                        g = [data[pt][1], data[pt][2]];
                                    } else {
                                        g = data[pt].geometry.replace("POINT(", "").replace(")", "").split(" ");
                                    }
                                    var m = L.marker([g[1], g[0]])
                                        .bindLabel(data[pt].name, {noHide: true});
                                    drawnItems.addLayer(m)
                                }
                            }
                        })
                    })
                };
                $scope.addWktToMap = function (data) {
                    $scope.deleteDrawing();
                    leafletData.getMap().then(function () {
                        leafletData.getLayers().then(function (baselayers) {
                            var drawnItems = baselayers.overlays.draw;
                            var geojsonLayer = L.geoJson(wellknown.parse(data[0]));
                            drawnItems.addLayer(geojsonLayer)
                        })
                    })
                };

                $scope.changeParams = function (layer, params) {
                    leafletData.getMap().then(function (map) {
                        leafletData.getLayers().then(function (leafletLayers) {
                            var ly;
                            for (var k in $scope.layers.overlays) {
                                if ($scope.layers.overlays.hasOwnProperty(k)) {
                                    if ($scope.layers.overlays[k] === layer) {
                                        ly = leafletLayers.overlays[k];
                                        break;
                                    }
                                }
                            }

                            if (map.hasLayer(ly)) {
                                if (ly.setParams) {
                                    var p = ly.wmsParams;
                                    p.ENV = params.ENV;
                                    p.uppercase = false;
                                    if (params.fq && params.fq.length) {
                                        p.fq = params.fq
                                    } else {
                                        delete p.fq
                                    }

                                    if (p.sld_body !== undefined) {
                                        p.sld_body = params.sld_body
                                    }
                                    ly.setParams(p)
                                }
                            }
                            $timeout(function () {
                            }, 0)
                        });
                    });
                };

                $scope.changeOpacity = function (layer, opacity) {
                    leafletData.getMap().then(function (map) {
                        leafletData.getLayers().then(function (leafletLayers) {
                            var ly;
                            for (var k in $scope.layers.overlays) {
                                if ($scope.layers.overlays.hasOwnProperty(k)) {
                                    if ($scope.layers.overlays[k] === layer) {
                                        ly = leafletLayers.overlays[k];
                                        break;
                                    }
                                }
                            }

                            if (map.hasLayer(ly)) {
                                if (ly.setOpacity) {
                                    ly.setOpacity(opacity);
                                }

                                if (ly.getLayers && ly.eachLayer) {
                                    ly.eachLayer(function (lay) {
                                        if (lay.setOpacity) {
                                            lay.setOpacity(opacity);
                                        }
                                    });
                                }
                            }
                            $timeout(function () {
                            }, 0)
                        });
                    });

                };

                $scope.deleteDrawing = function (layerToIgnore) {
                    leafletData.getMap().then(function () {
                        leafletData.getLayers().then(function (baselayers) {
                            var drawnItems = baselayers.overlays.draw;
                            var layers = drawnItems.getLayers();
                            for (var i = layers.length - 1; i >= 0; i--) {
                                if (layers[i] !== layerToIgnore)
                                    drawnItems.removeLayer(layers[i])
                            }
                        })
                    })
                };

                $scope.setupTriggers = function () {
                    leafletData.getMap().then(function (map) {
                        leafletData.getLayers().then(function (baselayers) {

                            var drawnItems = baselayers.overlays.draw;

                            L.control.scale({position: 'bottomright'}).addTo(map);

                            new L.Control.InfoPanel({
                                data: []
                            }).addTo(map);

                            new L.Control.FullScreen({
                                data: []
                            }).addTo(map);

                            new L.Control.Expand({
                                toggleExpandUp: $scope.toggleExpandUp,
                                toggleExpandLeft: $scope.toggleExpandLeft
                            }).addTo(map);

                            map.on('draw:created', function (e) {
                                var layer = e.layer;
                                $scope.deleteDrawing(layer);

                                drawnItems.addLayer(layer);

                                var type = e.layerType;
                                var geoJSON = layer.toGeoJSON();
                                var wkt;
                                if (type === "circle") {
                                    var radius = layer.getRadius();
                                    wkt = Util.createCircle(geoJSON.geometry.coordinates[0], geoJSON.geometry.coordinates[1], radius);
                                    $scope.$emit('setWkt', [wkt]);
                                } else if (type === "marker") {
                                    $scope.$emit('setWkt', ['point', geoJSON.geometry.coordinates[0], geoJSON.geometry.coordinates[1]]);
                                } else {
                                    wkt = 'POLYGON ((';
                                    for (var i = 0; i < geoJSON.geometry.coordinates[0].length; i++) {
                                        if (i > 0) wkt += ', ';
                                        wkt += geoJSON.geometry.coordinates[0][i][0] + ' ' + geoJSON.geometry.coordinates[0][i][1]
                                    }
                                    wkt += '))';
                                    $scope.$emit('setWkt', [wkt]);
                                }

                            });

                            map.on('click', function (e) {
                                var latlng = e.latlng;
                                if (LayoutService.areaCtrlAreaValue !== 'drawPolygon') {
                                    popupService.click(latlng)
                                }
                            });

                            //all setup finished
                            if ($spMapLoaded !== undefined) {
                                $spMapLoaded(event);
                            }
                        })
                    });
                };

                $timeout(function () {
                    $(window).trigger('resize');
                    $scope.invalidate();
                    $timeout(function () {
                        $scope.setupTriggers();
                    }, 0)
                }, 0)

            }])
}(angular));