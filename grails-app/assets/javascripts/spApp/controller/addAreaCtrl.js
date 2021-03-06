(function (angular) {
    'use strict';
    angular.module('add-area-ctrl', ['map-service', 'layers-service', 'predefined-areas-service'])
        .controller('AddAreaCtrl', ['LayoutService', '$scope', 'MapService', '$timeout', 'LayersService',
            '$uibModalInstance', 'PredefinedAreasService', 'data',
            function (LayoutService, $scope, MapService, $timeout, LayersService, $uibModalInstance, PredefinedAreasService, inputData) {

                $scope.inputData = inputData;

                $scope.step = 'default';
                $scope.area = 'drawBoundingBox';

                if (inputData !== undefined && inputData.importArea === true) {
                    $scope.area = 'importShapefile';
                }

                $scope.defaultAreas = PredefinedAreasService.getList();
                $scope.selectedArea = {
                    name: $i18n('new area'),
                    wkt: '',
                    q: [],
                    legend: '',
                    metadata: '',
                    wms: ''
                };
                $scope.locationRadius = 10;
                $scope.location = '';
                $scope.areaname = '';
                $scope.intersect = {};

                $scope.uploadingFile = false;
                $scope.uploadProgress = 0;

                $scope.selectionDone = false;

                $scope.circle = {
                    longitude: '',
                    latitude: '',
                    radius: '10'
                };

                $scope.myAreaName = $i18n("new area");

                $scope.$watch('area', function (newValue) {
                    // used by click info popup to check if click came while drawing polygon
                    LayoutService.areaCtrlAreaValue = newValue;
                });

                LayoutService.addToSave($scope);

                $scope.ok = function () {
                    if ($scope.step === 'default') {
                        $scope.step = $scope.area;
                        if ($scope.area === 'drawBoundingBox') {
                            LayoutService.openPanel('area', $scope.area, false)
                        } else if ($scope.area === 'drawPolygon') {
                            LayoutService.openPanel('area', $scope.area, false)
                        } else if ($scope.area === 'drawPointRadius') {
                            LayoutService.openPanel('area', $scope.area, false)
                        } else if ($scope.area === 'pointOnLayer') {
                            LayoutService.openPanel('area', $scope.area, false)
                        } else if ($scope.area === 'addressRadius') {
                        } else if ($scope.area === 'pointRadius') {
                        } else if ($scope.area === 'gazetteer') {
                        } else if ($scope.area.startsWith('preset_')) {
                            for (var i = 0; i < $scope.defaultAreas.length; i++) {
                                if ($scope.area.endsWith($scope.defaultAreas[i].name.replace(' ', '_'))) {
                                    $scope.selectedArea.name = $scope.defaultAreas[i].name;
                                    $scope.selectedArea.wkt = $scope.defaultAreas[i].wkt;
                                    break;
                                }
                            }
                            $scope.addToMapAndClose();
                        } else if ($scope.area === 'importShapefile' || $scope.area === 'importKML') {
                            $scope.uploadProgress = 0;
                        } else if ($scope.area === 'environmentalEnvelope') {
                            LayoutService.openPanel('envelope', $scope.area, false)
                        } else if ($scope.area === 'wkt') {
                        }
                    } else {
                        var mapNow = true;
                        if ($scope.area === 'drawBoundingBox') {
                            //n/a
                        } else if ($scope.area === 'drawPolygon') {
                            //n/a
                        } else if ($scope.area === 'drawPointRadius') {
                            //n/a
                        } else if ($scope.area === 'pointOnLayer') {
                            //n/a
                        } else if ($scope.area === 'addressRadius') {
                            $scope.useAddress()
                        } else if ($scope.area === 'pointRadius') {
                            $scope.createCircle()
                        } else if ($scope.area === 'gazetteer') {
                        } else if ($scope.area.startsWith('preset_')) {
                            //n/a
                        } else if ($scope.area === 'importShapefile') {
                            var featureIdxs = $scope.areaList.filter(function (area) {
                                return area.selected
                            }).map(function (area) {
                                return area.id
                            }).join();

                            LayersService.createArea($scope.myAreaName, $scope.fileName, $scope.shapeId, featureIdxs).then(function (response) {
                                $scope.setPid(response.data.id, true)
                            });

                            mapNow = false
                        } else if ($scope.area === 'importKML') {
                            //n/a
                        } else if ($scope.area === 'environmentalEnvelope') {
                            //n/a
                        } else if ($scope.area === 'wkt') {
                        }
                        if (mapNow) {
                            $scope.addToMapAndClose();
                        }
                    }
                };

                $scope.addToMapAndClose = function () {
                    var closingLater = false;
                    if ($scope.selectedArea.obj !== undefined) {
                        $scope.selectedArea.obj.layertype = 'area';
                        $scope.selectedArea.obj.source =
                            MapService.add($scope.selectedArea.obj)
                    } else {
                        if ($scope.selectedArea.wkt !== undefined && $scope.selectedArea.wkt.length > 0) {
                            if ($scope.selectedArea.area !== undefined && $scope.selectedArea.q !== undefined) {
                                $scope.selectedArea.layertype = 'area';
                                MapService.add($scope.selectedArea);
                            } else {
                                closingLater = true;
                                LayersService.createFromWkt($scope.selectedArea.wkt, $scope.selectedArea.name, '').then(function (data) {
                                    LayersService.getObject(data.data.id).then(function (data) {
                                        data.data.layertype = 'area';
                                        data.data.wkt = $scope.selectedArea.wkt;
                                        MapService.add(data.data);
                                        $scope.$close()
                                    })
                                })
                            }
                        }
                    }
                    if (!closingLater)
                        $scope.$close()
                };

                $scope.set = function (wms, legend, metadata, q, wkt, name) {
                    $scope.selectedArea = {
                        wms: wms,
                        legend: legend,
                        metadata: metadata,
                        q: q,
                        wkt: wkt,
                        name: name
                    }
                };

                $scope.createCircle = function () {
                    $scope.setWkt(Util.createCircle($scope.circle.longitude, $scope.circle.latitude, $scope.circle.radius * 1000))
                };

                $scope.useAddress = function () {
                    var coords = $scope.location.split(',');
                    $scope.selectedArea.name = $scope.areaname;
                    $scope.setWkt(Util.createCircle(coords[1] * 1, coords[0] * 1, $scope.locationRadius * 1000))
                };

                $scope.selectShpArea = function () {
                    var selected = "";
                    var userSelectedArea = $scope.areaList.filter(function (area) {
                        return area.selected
                    });
                    if (userSelectedArea.length === $scope.areaList.length) {
                        selected = "all";
                        $scope.checkAll = true;
                    } else {
                        selected = userSelectedArea.map(function (area) {
                            return area.id
                        }).join();
                        $scope.checkAll = false;
                    }
                    $scope.shpImg = LayersService.getShpImageUrl($scope.shapeId, selected);
                };

                $scope.toggleAllAreaCheckbox = function () {
                    angular.forEach($scope.areaList, function (area) {
                        area.selected = $scope.checkAll;
                    });
                    $scope.shpImg = LayersService.getShpImageUrl($scope.shapeId, "all");
                };

                $scope.uploadFile = function (file) {

                    if ($scope.area === 'importShapefile' && file.type !== 'application/zip') {
                        bootbox.alert($i18n("The uploaded file must be shape zipped file"));
                        return;
                    }

                    $scope.uploadingFile = true;

                    LayersService.uploadAreaFile(file, $scope.area, $scope.myAreaName, file.name).then(function (response) {

                        $scope.fileName = file.name;
                        if ($scope.area === 'importShapefile') {
                            $scope.shapeId = response.data.shapeId;
                            $scope.areaHeader = [];
                            if (response.data.area.length > 0) {
                                $scope.areaHeader = Object.keys(response.data.area[0].values);
                                $scope.shpImg = LayersService.getShpImageUrl($scope.shapeId, "all");
                            }
                            $scope.areaList = response.data.area;
                        } else if ($scope.area === 'importKML') {
                            if (response.data.shapeId) {
                                $scope.setPid(response.data.shapeId, true);
                                $scope.step = 'default';
                            }
                        }
                        $scope.myAreaName = file.name;
                        $scope.selectionDone = true;
                        file.result = response.data;
                        $scope.uploadingFile = false;
                    }, function (response) {
                        $scope.errorMsg = response.status + ': ' + response.data;
                        $scope.uploadingFile = false;
                    }, function (evt) {
                        $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
                    });
                };

                $scope.showWkt = function () {
                    MapService.leafletScope.addWktToMap([$scope.selectedArea.wkt])
                };

                $scope.setWkt = function (wkt) {
                    $scope.selectedArea.wkt = wkt
                };

                $scope.setPid = function (pid, mapNow) {
                    LayersService.getObject(pid).then(function (obj) {
                        obj = obj.data;
                        $scope.selectedArea.obj = obj;
                        $scope.selectedArea.name = obj.name.length > 0 ? obj.name : $i18n('area');
                        LayersService.getField(obj.fid, 0, 0, '').then(function (data) {
                            if (data.data === undefined || data.data.id === undefined || !data.data.indb) {
                                LayersService.getWkt(pid).then(function (wkt) {
                                    $scope.selectedArea.wkt = wkt
                                })
                            } else {
                                $scope.selectedArea.q = obj.fid + ':"' + obj.name + '"';
                                $scope.selectedArea.obj.q = $scope.selectedArea.q
                            }
                            $scope.selectedArea.pid = obj.pid;
                            $scope.selectedArea.wms = obj.wmsurl;

                            if (mapNow) {
                                $scope.addToMapAndClose();
                            }
                        })
                    })
                };

                $scope.isDisabled = function () {
                    if ($scope.step === 'default') {
                    } else if ($scope.area === 'addressRadius') {
                        return $scope.location.length === 0
                    } else if ($scope.area === 'pointRadius') {
                        return $scope.circle.longitude.length === 0 || $scope.circle.latitude.length === 0
                    } else if ($scope.area === 'gazetteer') {
                        return $scope.selectedArea.pid === undefined
                    } else if ($scope.area.startsWith('preset_')) {
                    } else if ($scope.area === 'importShapefile' || $scope.area === 'importKML') {
                        if ($scope.areaList) {
                            return $scope.areaList.filter(function (area) {
                                    return area.selected
                                }) === 0
                        } else {
                            return true
                        }
                    } else if ($scope.area === 'environmentalEnvelope') {
                    } else if ($scope.area === 'wkt') {
                        return $scope.selectedArea.wkt === undefined || $scope.selectedArea.wkt.length === 0
                    }
                    return false
                };

                $scope.isLoggedIn = $scope.isLoggedIn = $SH.userId !== undefined && $SH.userId !== null && $SH.userId.length > 0;
                $scope.isNotLoggedIn = !$scope.isLoggedIn;
            }])
}(angular));