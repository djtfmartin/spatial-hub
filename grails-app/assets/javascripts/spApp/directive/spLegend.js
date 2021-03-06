(function (angular) {
    'use strict';
    angular.module('sp-legend-directive', ['map-service', 'biocache-service', 'layers-service'])
        .directive('spLegend', ['$timeout', 'MapService', 'BiocacheService', 'LayersService', '$http', 'LayoutService',
            function ($timeout, MapService, BiocacheService, LayersService, $http, LayoutService) {
                return {
                    scope: {},
                    templateUrl: '/spApp/legendContent.htm',
                    link: function (scope, element, attrs) {
                        scope.facetFilter = '';
                        scope.fq = [];
                        scope.yearMin = 1800;
                        scope.yearMax = new Date().getFullYear();

                        scope.selected = MapService.selected;

                        scope.$watch('selected', function (oldValue, newValue) {
                            scope.setAreaLayers();
                        });

                        scope.showLegend = function () {
                            scope.selected.hidelegend = false
                        };

                        scope.areaLayers = [];

                        scope.setAreaLayers = function () {
                            scope.areaLayers = [{pid: null, name: ''}].concat(MapService.areaLayers());
                        };

                        scope.updateContextualList = function () {
                            console.log(scope.selected.layer.contextualList)
                            if (scope.selected.layer !== null && scope.selected.layer.contextualPage !== undefined) {
                                LayersService.getField(scope.selected.layer.id,
                                    (scope.selected.layer.contextualPage - 1) * scope.selected.layer.contextualPageSize,
                                    scope.selected.layer.contextualPageSize, scope.selected.layer.contextualFilter).then(function (data) {
                                    scope.selected.layer.contextualList = data.data.objects;
                                    for (var i in scope.selected.layer.contextualList) {
                                        if (scope.selected.layer.contextualList.hasOwnProperty(i)) {
                                            scope.selected.layer.contextualList[i].selected = (scope.selected.layer.contextualSelection[scope.selected.layer.contextualList[i].name] !== undefined)
                                        }
                                    }
                                    console.log(scope.selected.layer.contextualList)
                                })
                            }
                        };

                        scope.info = function (item) {
                            bootbox.alert($i18n('Metadata url') + ': <a href="' + item.url + '">' + item.url + '</a>')
                        };

                        scope.contextualClearSelection = function () {
                            var key;
                            for (key in scope.selected.layer.contextualSelection) {
                                if (scope.selected.layer.contextualSelection.hasOwnProperty(key)) {
                                    delete scope.selected.layer.contextualSelection[key]
                                }
                            }
                            for (var i in scope.selected.layer.contextualList) {
                                if (scope.selected.layer.contextualList.hasOwnProperty(i)) {
                                    scope.selected.layer.contextualList[i].selected = false
                                }
                            }
                        };

                        scope.contextualClearHighlight = function () {
                            //remove highlight layer
                            scope.selected.layer.contextualHighlight = ""
                        };

                        scope.scatterplotCreateInOut = function () {

                            var inFq = scope.selected.layer.scatterplotFq;
                            var outFq = '-(' + scope.selected.layer.scatterplotFq + ')';

                            BiocacheService.newLayerAddFq(scope.selected.layer, inFq,
                                scope.selected.layer.name + " : " + $i18n("in scatterplot selection")).then(function (data) {
                                MapService.add(data)
                            });

                            BiocacheService.newLayerAddFq(scope.selected.layer, outFq,
                                scope.selected.layer.name + " : " + $i18n("out scatterplot selection")).then(function (data) {
                                MapService.add(data)
                            })
                        };

                        scope.adhocCreateInOut = function () {
                            var ids = [];
                            $.map(scope.selected.layer.adhocGroup, function (v, k) {
                                if (v) ids.push(k)
                            });

                            var inFq = 'id:' + ids.join(' OR id:');
                            var outFq = '-(id:' + ids.join(' OR id:') + ')';

                            BiocacheService.newLayerAddFq(scope.selected.layer, inFq,
                                scope.selected.layer.name + " : " + $i18n("in adhoc")).then(function (data) {
                                MapService.add(data)
                            });

                            BiocacheService.newLayerAddFq(scope.selected.layer, outFq,
                                scope.selected.layer.name + " : " + $i18n("out adhoc")).then(function (data) {
                                MapService.add(data)
                            })
                        };

                        scope.contextualCreateArea = function () {
                            var ids = [];
                            var fqs = [];
                            var objects = [];

                            for (var key in scope.selected.layer.contextualSelection) {
                                if (scope.selected.layer.contextualSelection.hasOwnProperty(key)) {
                                    var item = scope.selected.layer.contextualSelection[key];
                                    fqs.push(scope.selected.layer.id + ':"' + item.name + '"');
                                    ids.push(item.pid)
                                }
                            }

                            scope.mapObjectsList(ids, fqs, objects, 0, scope.selected.layer.displayname);
                        };

                        scope.mapObjectsList = function (ids, fqs, objects, pos, name) {
                            if (pos === ids.length) {
                                //merge
                                var metadata = $i18n('Collection of areas from layer') + ': ' + name + ';';
                                var mappingId = '';
                                for (var i = 0; i < objects.length; i++) {
                                    metadata += ', ' + objects[i].name;
                                    if (i > 0) mappingId += '~';
                                    mappingId += ids[i]
                                }
                                var layer = {
                                    name: pos + ' ' + $i18n('areas from') + ' ' + name,
                                    wkt: '',
                                    q: [fqs.join(" OR ")],
                                    legend: '',
                                    metadata: metadata,
                                    pid: mappingId,
                                    layertype: 'area'
                                };

                                MapService.add(layer)
                            } else {
                                LayersService.getObject(ids[pos]).then(function (data) {
                                    objects[pos] = data.data;
                                    scope.mapObjectsList(ids, fqs, objects, pos + 1, name)
                                })
                            }
                        };

                        scope.zoom = function (item) {
                            MapService.leafletScope.zoom(item.bbox)
                        };

                        scope.contextualHighlight = function (name) {
                            scope.selected.layer.contextualHighlight = name
                            //TODO: create highlight layer
                        };

                        scope.contextualSelectionChange = function (item) {
                            scope.selected.layer.contextualSelection[item.name] = item
                        };

                        scope.contextualPageBack = function () {
                            if (scope.selected.layer !== null && scope.selected.layer.contextualPage > 1) {
                                scope.selected.layer.contextualPage--;
                                scope.updateContextualList()
                            }
                        };

                        scope.contextualPageForward = function () {
                            if (scope.selected.layer !== null && scope.selected.layer.contextualPage < scope.selected.layer.contextualMaxPage) {
                                scope.selected.layer.contextualPage++;
                                scope.updateContextualList()
                            }
                        };

                        scope.clearContextualFilter = function () {
                            scope.selected.layer.contextualFilter = ''
                        };

                        scope.wmsLegendVisible = function () {
                            return scope.selected.layer !== null &&
                                (scope.selected.layer.layertype === 'grid' || scope.selected.layer.layertype === 'contextual') &&
                                (scope.selected.hidelegend === undefined || !scope.selected.hidelegend)
                        };

                        scope.hideLegend = function () {
                            scope.selected.hidelegend = true
                        };

                        scope.popupLegend = function () {
                            L.control.window(map, {
                                modal: false,
                                title: scope.selected.displayname,
                                content: '<img src="' + scope.selected.layer.leaflet.legendurl + '"/>'
                            }).show()
                        };

                        scope.setColor = function (color) {
                            scope.selected.layer.color = color;
                            scope.updateWMS()
                        };

                        scope.setColorType = function (colorType) {
                            scope.selected.layer.colorType = colorType;
                            scope.updateWMS()
                        };

                        scope.facetNewLayer = function () {
                            BiocacheService.newLayerAddFq(scope.selected.layer, decodeURIComponent(scope.selected.layer.sel),
                                scope.selected.layer.name + " : " + $i18n("from selected")).then(function (data) {
                                MapService.add(data)
                            })
                        };

                        scope.facetNewLayerOut = function () {
                            BiocacheService.newLayerAddFq(scope.selected.layer, decodeURIComponent('-(' + scope.selected.layer.sel + ')'),
                                scope.selected.layer.name + " : " + $i18n("from unselected")).then(function (data) {
                                MapService.add(data)
                            })
                        };

                        scope.facetsSelected = function () {
                            return scope.selected.layer !== undefined &&
                                scope.selected.layer !== null &&
                                scope.selected.layer.sel !== undefined &&
                                scope.selected.layer.sel.length > 0;
                        };

                        scope.facetsSelectedCount = function () {
                            if (scope.selected.layer !== undefined &&
                                scope.selected.layer !== null &&
                                scope.selected.layer.sel !== undefined &&
                                scope.selected.layer.sel.length > 0) {
                                return scope.selected.layer.sel.length
                            } else {
                                return 0
                            }
                        };

                        scope.facetClearSelection = function () {
                            for (var i = 0; i < scope.selected.layer.facetList[scope.selected.layer.facet].length; i++) {
                                scope.selected.layer.facetList[scope.selected.layer.facet][i].selected = false
                            }
                            scope.updateSelection()
                        };

                        scope.updateSelection = function () {
                            var sel = '';
                            var invert = false;
                            var count = 0;
                            var sum = 0;
                            for (var i = 0; i < scope.selected.layer.facetList[scope.selected.layer.facet].length; i++) {
                                if (scope.selected.layer.facetList[scope.selected.layer.facet][i].selected) {
                                    var fq = scope.selected.layer.facetList[scope.selected.layer.facet][i].fq;
                                    if (fq.startsWith('-') && (fq.endsWith(':*') || fq.endsWith('[* TO *]'))) {
                                        invert = true
                                    }
                                    count++;
                                    sum += scope.selected.layer.facetList[scope.selected.layer.facet][i].count;
                                }
                            }
                            scope.selected.layer.facetSelectionCount = sum;

                            if (count === 1) invert = false;
                            for (i = 0; i < scope.selected.layer.facetList[scope.selected.layer.facet].length; i++) {
                                if (scope.selected.layer.facetList[scope.selected.layer.facet][i].selected) {
                                    fq = scope.selected.layer.facetList[scope.selected.layer.facet][i].fq;

                                    if (invert) {
                                        if (sel.length > 0) sel += " AND ";
                                        if (fq.startsWith('-') && (fq.endsWith(':*') || fq.endsWith('[* TO *]'))) {
                                            sel += fq.substring(1)
                                        } else {
                                            sel += '-' + fq
                                        }
                                    } else {
                                        if (sel.length > 0) sel += " OR ";
                                        sel += fq
                                    }
                                }
                            }
                            if (invert) {
                                sel = '-(' + sel + ')'
                            }
                            if (scope.selected.layer !== undefined) {
                                if (sel.length === 0) {
                                    scope.selected.layer.sel = ''
                                } else {
                                    scope.selected.layer.sel = encodeURIComponent(sel)
                                }
                            }
                            scope.updateWMS();
                        };

                        scope.formatColor = function (item) {
                            var r = Number(item.red).toString(16);
                            if (r.length === 1) r = '0' + r;
                            var g = Number(item.green).toString(16);
                            if (g.length === 1) g = '0' + g;
                            var b = Number(item.blue).toString(16);
                            if (b.length === 1) b = '0' + b;
                            return r + g + b
                        };

                        scope.updateFacet = function () {
                            if (scope.selected.layer !== null && scope.selected.layer.facet !== '-1' &&
                                scope.selected.layer.facetList[scope.selected.layer.facet] === undefined) {
                                BiocacheService.facet(scope.selected.layer.facet, scope.selected.layer).then(function (data) {
                                    scope.selected.layer.facetList[scope.selected.layer.facet] = data;
                                    scope.facetClearSelection();
                                    scope.updateWMS();
                                })
                            } else {
                                scope.updateWMS();
                            }
                        };

                        scope.moveUp = function () {
                            scope.selected.layer.index++;

                            MapService.leafletScope.moveLayer(MapService.getLayer(scope.selected.layer.uid), scope.selected.layer.index)
                        };

                        scope.moveDown = function () {
                            scope.selected.layer.index--;

                            MapService.leafletScope.moveLayer(MapService.getLayer(scope.selected.layer.uid), scope.selected.layer.index)
                        };

                        scope.setVisible = function (show) {
                            scope.selected.layer.visible = show;
                            scope.selected.layer.leaflet.visible = show;
                            MapService.leafletScope.showLayer(MapService.getLayer(scope.selected.layer.uid), scope.selected.layer.visible);
                            if (show) MapService.leafletScope.moveLayer(MapService.getLayer(scope.selected.layer.uid), scope.selected.layer.index)
                        };

                        scope.getOpacity = function () {
                            if (scope.selected !== undefined && scope.selected.layer !== undefined && scope.selected.layer !== null) {
                                return scope.selected.layer.opacity
                            } else {
                                return 0
                            }
                        };

                        scope.$watch('getOpacity()', function (newValue, oldValue) {
                            if (scope.selected !== undefined && scope.selected.layer !== undefined && scope.selected.layer !== null) {
                                scope.setOpacity(scope.selected.layer.opacity)
                            }
                        });

                        scope.getSize = function () {
                            if (scope.selected !== undefined && scope.selected.layer !== undefined && scope.selected.layer !== null) {
                                return scope.selected.layer.size
                            } else {
                                return 0
                            }
                        };

                        scope.$watch('getSize()', function (newValue, oldValue) {
                            if (scope.selected !== undefined && scope.selected.layer !== undefined && scope.selected.layer !== null) {
                                scope.setSize(scope.selected.layer.size)
                            }
                        });

                        scope.setOpacity = function (opacity) {
                            scope.selected.layer.opacity = opacity;
                            scope.selected.layer.leaflet.opacity = opacity;
                            MapService.leafletScope.changeOpacity(MapService.getLayer(scope.selected.layer.uid), scope.selected.layer.opacity / 100)

                        };

                        scope.setUncertainty = function (uncertainty) {
                            scope.selected.layer.uncertainty = uncertainty;
                            scope.updateWMS()
                        };

                        scope.setSize = function (size) {
                            scope.selected.layer.size = size;
                            scope.updateWMS()
                        };

                        scope.updateWMS = function () {
                            scope.selected.layer.wms = scope.selected.layer.name + ', ' + scope.selected.layer.color + ', '
                                + scope.selected.layer.colorType + ', ' + scope.selected.layer.opacity + ', '
                                + scope.selected.layer.uncertainty + ', ' + scope.selected.layer.size;

                            if (scope.selected.layer.colorType === 'grid') {
                                scope.selected.layer.leaflet.layerParams.ENV = 'colormode%3Agrid%3Bname%3Acircle%3Bsize%3A' +
                                    scope.selected.layer.size + '%3Bopacity%3A1'
                            } else if (scope.selected.layer.colorType === '-1') {
                                if (scope.selected.layer.facet === '-1') {
                                    scope.selected.layer.leaflet.layerParams.ENV = 'color%3A' + scope.selected.layer.color + '%3Bname%3Acircle%3Bsize%3A' +
                                        scope.selected.layer.size + '%3Bopacity%3A1' +
                                        (scope.selected.layer.uncertainty ? "%3Buncertainty%3A1" : "")
                                } else {
                                    scope.selected.layer.leaflet.layerParams.ENV = 'colormode%3A' + scope.selected.layer.facet + '%3Bname%3Acircle%3Bsize%3A' +
                                        scope.selected.layer.size + '%3Bopacity%3A1' +
                                        (scope.selected.layer.uncertainty ? "%3Buncertainty%3A1" : "")
                                }
                                if (scope.selected.layer.sel !== undefined && scope.selected.layer.sel.length > 0) {
                                    scope.selected.layer.leaflet.layerParams.ENV += '%3Bsel%3A' + scope.selected.layer.sel
                                }
                            }

                            if (scope.fq.length) {
                                scope.selected.layer.leaflet.layerParams.fq = scope.fq
                            } else {
                                scope.selected.layer.leaflet.layerParams.fq = undefined
                            }

                            MapService.reMap(scope.selected);

                            $timeout(function () {
                            }, 0)
                        };

                        scope.startx = 0;
                        scope.starty = 0;
                        scope.endx = 0;
                        scope.endy = 0;
                        scope.resizing = false;

                        scope.doMouseDown = function (event) {
                            document.getElementById('chartDiv').UNSELECTABLE = "on";
                            document.getElementById('rband').UNSELECTABLE = "on";
                            document.getElementById('chartDivBack').UNSELECTABLE = "on";

                            var rband = $('#rband');
                            rband.offset($('#chartDivBack').offset());
                            scope.setPageXY(event);
                            scope.startx = event.pageX;
                            scope.starty = event.pageY;
                            scope.resizing = true;

                            rband.offset({top: scope.starty, left: scope.startx}).show();

                            // prevent default behavior of text selection
                            return false;
                        };

                        scope.setPageXY = function (event) {
                            if (event.pageX || event.pageY) {
                            } else if (event.clientX || event.clientY) {
                                event.pageX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                                event.pageY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
                            }
                        };

                        scope.doMouseDrag = function (event) {
                            if (scope.resizing) {
                                var left, top, width, height;

                                scope.setPageXY(event);

                                scope.endx = event.pageX;
                                scope.endy = event.pageY;

                                if (event.pageX > scope.startx) {
                                    left = scope.startx;
                                    width = event.pageX - scope.startx;
                                }
                                else {
                                    left = event.pageX;
                                    width = scope.startx - event.pageX;
                                }
                                if (event.pageY > scope.starty) {
                                    top = scope.starty;
                                    height = event.pageY - scope.starty;
                                }
                                else {
                                    top = event.pageY;
                                    height = scope.starty - event.pageY;
                                }

                                var rband = $('#rband');
                                rband.offset({top: top, left: left});
                                rband.css({
                                    'width': width,
                                    'height': height
                                });
                            }
                        };

                        scope.doMouseUp = function (event) {
                            if (scope.resizing) {
                                scope.resizing = false;
                                scope.chartSelection(scope.startx, scope.starty, scope.endx, scope.endy);
                            }
                        };

                        scope.clearSelection = function () {

                        };

                        scope.chartSelection = function (x1, y1, x2, y2) {
                            x1 = x1 + "";
                            x2 = x2 + "";
                            y1 = y1 + "";
                            y2 = y2 + "";
                            var back = jQuery('#chartDivBack');
                            var value = (x1.replace("px", "") - $(back[0]).offset().left)
                                + "," + (y1.replace("px", "") - $(back[0]).offset().top)
                                + "," + (x2.replace("px", "") - $(back[0]).offset().left)
                                + "," + (y2.replace("px", "") - $(back[0]).offset().top);
                            var cd = document.getElementById('chartDiv');
                            var ci = document.getElementById('chartDivBack');
                            ci.style.backgroundImage = cd.style.backgroundImage;

                            scope.scatterplotUpdate(value);
                        };

                        scope.scatterplotDownloadData = function () {
                            Util.download(scope.selected.layer.scatterplotDataUrl);
                        }

                        scope.scatterplotDownloadImage = function () {
                            Util.download(scope.selected.layer.scatterplotUrl);
                        }

                        scope.scatterplotUpdate = function (value) {
                            scope.selected.layer.scatterplotUpdating = true;
                            var task = {
                                name: 'ScatterplotDraw',
                                input: $.extend({}, scope.selected.layer)
                            };
                            task.input.opacity = task.input.opacity / 100;
                            if (value) {
                                scope.selected.layer.scatterplotSelection = value;
                                task.input.selection = value;
                            } else {
                                task.input.selection = scope.selected.layer.scatterplotSelection;
                            }
                            task.input.wkt = [{pid: scope.selected.layer.highlightWkt}];
                            $http.post('portal/postTask?sessionId=' + $SH.sessionId, task).then(function (response) {
                                scope.checkScatterplotStatus(LayersService.url() + '/tasks/status/' + response.data.id, scope.selected.layer)
                            })
                        };

                        scope.checkScatterplotStatus = function (url, layer) {
                            $http.get(url).then(function (response) {
                                scope.status = response.data.message;

                                if (response.data.status < 2) {
                                    $timeout(function () {
                                        scope.checkScatterplotStatus(url, layer)
                                    }, 500)
                                } else if (response.data.status === 2) {
                                    scope.status = 'cancelled';
                                    layer.scatterplotUpdating = false;
                                } else if (response.data.status === 3) {
                                    scope.status = 'error';
                                    layer.scatterplotUpdating = false;
                                } else if (response.data.status === 4) {

                                    $("#rband").css({
                                        'width': 0,
                                        'height': 0
                                    }).hide();

                                    scope.status = $i18n('successful');

                                    scope.finishedData = response.data;

                                    var updateNow = true;

                                    for (var k in scope.finishedData.output) {
                                        if (scope.finishedData.output.hasOwnProperty(k)) {
                                            var d = scope.finishedData.output[k];
                                            if (d.name === 'species') {
                                                var species = jQuery.parseJSON(d.file);
                                                scope.selected.layer.scatterplotUrl = species.scatterplotUrl;

                                                if (species.scatterplotSelectionExtents && species.scatterplotLayers) {
                                                    scope.selected.layer.scatterplotSelectionExtents = species.scatterplotSelectionExtents;
                                                    var fq = species.scatterplotLayers[0] + ":[" + species.scatterplotSelectionExtents[1] + " TO " + species.scatterplotSelectionExtents[3] + "] AND " +
                                                        species.scatterplotLayers[1] + ":[" + species.scatterplotSelectionExtents[0] + " TO " + species.scatterplotSelectionExtents[2] + "]";
                                                    var fqs = [fq];
                                                    scope.selected.layer.scatterplotFq = fq
                                                    if (species.scatterplotSelectionExtents.length == 0) {
                                                        scope.selected.layer.sel = undefined;
                                                        fqs = [];
                                                        scope.selected.layer.scatterplotSelectionCount = 0;
                                                    } else {
                                                        var sel = encodeURIComponent(fq);
                                                        if (sel !== scope.selected.layer.sel) {
                                                            scope.selected.layer.sel = sel;
                                                        }

                                                        scope.updateWMS();
                                                        updateNow = false;
                                                        scope.selected.layer.scatterplotSelectionCount = $i18n('counting...');
                                                        BiocacheService.count(scope.selected.layer, fqs).then(function (count) {
                                                            scope.selected.layer.scatterplotSelectionCount = count;
                                                            layer.scatterplotUpdating = false;
                                                        });

                                                        scope.selected.layer.scatterplotLabel1 = Messages.get('facet.' + species.scatterplotLayers[0]) + " : " +
                                                            species.scatterplotSelectionExtents[1].toFixed(4) + " - " + species.scatterplotSelectionExtents[3].toFixed(4);
                                                        scope.selected.layer.scatterplotLabel2 = Messages.get('facet.' + species.scatterplotLayers[1]) + " : " +
                                                            species.scatterplotSelectionExtents[0].toFixed(4) + " - " + species.scatterplotSelectionExtents[2].toFixed(4);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (updateNow) layer.scatterplotUpdating = false;
                                }
                            })
                        };

                        scope.updateScatterplot = function (width, height, background) {
                            var cd = document.getElementById('chartDiv');
                            var ci = document.getElementById('chartDivBack');
                            ci.style.backgroundImage = cd.style.backgroundImage;
                            cd.style.backgroundImage = background;
                            cd.style.width = width + 'px';
                            cd.style.height = height + 'px';
                            ci.style.width = cd.style.width;
                            ci.style.height = cd.style.height;

                            $("#rband").css({
                                'width': 0,
                                'height': 0
                            }).hide();
                        };

                        scope.colourTimeout = null;

                        scope.updateColour = function () {
                            var r = scope.selected.layer.red.toString(16);
                            if (r.length === 1) r = '0' + r;
                            var g = scope.selected.layer.green.toString(16);
                            if (g.length === 1) g = '0' + g;
                            var b = scope.selected.layer.blue.toString(16);
                            if (b.length === 1) b = '0' + b;
                            scope.selected.layer.color = r + g + b;

                            if (scope.colourTimeout !== null) clearTimeout(scope.colourTimeout);
                            scope.colourTimeout = setTimeout(function () {
                                scope.applyColour()
                            }, 500)
                        };

                        scope.applyColour = function () {
                            scope.updateWMS()
                        }
                    }

                }

            }])
}(angular));