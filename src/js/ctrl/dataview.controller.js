app.controller('DataViewCtrl', ['$scope', '$element', '$window', '$http', '$interval', 'NgTableParams', DataViewCtrl]);

function DataViewCtrl($scope, $element, $window, $http, $interval, NgTableParams) {

    var update_interval = 3000;

    var mobileView = 992;

    $scope.dataupdate = false;

    $scope.mobiletable = [];

    $scope.iframeHeight = window.innerHeight;


    var w = angular.element($window);
    $scope.$watch(
        function () {
            return $window.innerWidth;
        },
        function (value) {
            $scope.windowWidth = value;
        },
        true
        );

    w.bind('resize', function () {
        $scope.$apply();
    });


    $scope.issuesclosed = 0;
    $scope.issuesopen = 0;

    var init_load = false;

    function loaddata() {

        $scope.dataupdate = false;

        d3.csv("data/issues.csv", function (d) {
            return {
                customername: d['Customer name'],
                subtimestamp: Date.parse(d['Submission Timestamp']),
                email: d['customer email address'],
                description: d['Description'],
                status: d['Status'],
                closedtimestamp: Date.parse(d['Closed Timestamp']),
                employeename: d['Employee name']
            };
        }, function (data) {
            $scope.issuesclosed = 0;
            $scope.issuesopen = 0;
            for (var i = 0; i < data.length; i++) {
                if (data[i].status == "Closed") {
                    $scope.issuesclosed = $scope.issuesclosed + 1;
                    console.log('Issue open', $scope.issuesclosed);
                } else {
                    $scope.issuesopen = $scope.issuesopen + 1;
                }
            }

            $scope.mobiletable = data;

            console.log('Data!!!', data);

            $scope.tp = new NgTableParams({}, { dataset: data });
        });

    };

    $scope.callAtInterval = loaddata;
      
    //init load of data at program start 
    if (init_load == false) {
        loaddata();
        init_load = true;
    }

    var stopTime = $interval(function () { $scope.callAtInterval(); }, update_interval, false);

    $element.on('$destroy', function () {
        $interval.cancel(stopTime);
    });


}