app.controller('GeoSpatialCtrl', ['$scope', '$element', '$http', '$interval', 'NgTableParams', GeoSpatialCtrl]);

function GeoSpatialCtrl($scope, $element, $http, $interval, NgTableParams) {
    
    var update_interval = 3000;

    $scope.dataupdate = false;

    $scope.map = { center: { latitude: 48.20705775, longitude: 16.38044357 }, zoom: 8 };

    $scope.places = [];
    
    function loaddata() {
        
        $scope.dataupdate = false;
        
        $http.get("data/stations.json").then(function (response) {
            return response.data.stations;
        }).then(function (places) {

            if ($scope.places.length != places.length) {
                $scope.dataupdate = !$scope.dataupdate;
            } else {

                if ($scope.places.length > 0) {
                    for (var i = 0; i < places.length; i++) {
                        if (places[i].title != $scope.places[i].title){
                            console.log('$scope.places[i]xx',$scope.places[i]);
                            console.log('NE check',places[i].title,$scope.places[i].title);
                            $scope.dataupdate = true;
                        }
                        if (places[i].employees != $scope.places[i].employees) {
                            $scope.dataupdate = true;
                        }
                    }
                }

            }

            console.log('$scope.dataupdate',$scope.dataupdate);

            for (var i = 0; i < places.length; i++) {
                places[i]['options'] = { labelClass: 'labels', labelAnchor: '12 60', labelContent: places[i].title + ' , employees: ' + places[i].employees };
            }

            $scope.places = places;
        });
    }

    $scope.callAtInterval = loaddata;

    var stopTime = $interval(function () { $scope.callAtInterval(); }, update_interval, false);

    $element.on('$destroy', function () {
        $interval.cancel(stopTime);
    });




}