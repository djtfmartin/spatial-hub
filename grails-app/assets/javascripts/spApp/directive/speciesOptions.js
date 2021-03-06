(function (angular) {
    'use strict';
    angular.module('species-options-directive', ['map-service', 'lists-service'])
        .directive('speciesOptions', ['MapService', 'ListsService', '$timeout', 'LayoutService',
            function (MapService, ListsService, $timeout, LayoutService) {

                return {
                    scope: {
                        _value: '=value',
                        _areaIncludes: '=?areaIncludes',
                        _spatialValidity: '=?spatialValidity',
                        _endemicIncludes: '=?endemicIncludes'
                    },
                    templateUrl: '/spApp/speciesOptionsContent.htm',
                    link: function (scope, element, attrs) {

                        //defaults
                        if (scope._areaIncludes === undefined) scope._areaIncludes = false;
                        if (scope._spatialValidity === undefined) scope._spatialValidity = true;
                        if (scope._endemicIncludes === undefined) scope._endemicIncludes = false;

                        //kosher includes
                        if (scope._value.spatiallyValid === undefined) scope._value.spatiallyValid = true;
                        if (scope._value.spatiallySuspect === undefined) scope._value.spatiallySuspect = false;

                        //area includes
                        if (scope._value.includeExpertDistributions === undefined) scope._value.includeExpertDistributions = scope._areaIncludes;
                        if (scope._value.includeChecklists === undefined) scope._value.includeChecklists = scope._areaIncludes;
                        if (scope._value.includeAnimalMovement === undefined) scope._value.includeAnimalMovement = scope._areaIncludes;

                        //endemic includes
                        if (scope._value.includeEndemic === undefined) scope._value.includeEndemic = false;

                        LayoutService.addToSave(scope);

                        //TODO: include _value.fq
                    }
                }

            }])
}(angular));