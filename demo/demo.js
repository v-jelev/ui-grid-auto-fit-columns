angular.module('autoFitColumnsExample', [
    'ui.grid.autoFitColumns',
    'ui.grid.pagination',
    'ui.grid.resizeColumns'
])
.config(['$provide', function ($provide) {
  $provide.decorator('$rootScope', ['$delegate', function ($delegate) {
    var _emit = $delegate.$emit;

    $delegate.$emit = function () {
      console.log.apply(console, arguments);
      _emit.apply(this, arguments);
    };

    return $delegate;
  }]);
}])
    .controller('MainController', MainController);

MainController.$inject = ['$http'];
function MainController($http){
    function sortByLength(a, b) {
        return (a || '').length - (b || '').length;
    }
    this.gridOptions = {
        paginationPageSizes: [25, 50, 100, 200, 500],
        paginationPageSize: 500,
        enableFiltering: true,
        enableColumnMenus: false,
        columnDefs: [
            { name: 'id', type: 'number', width: 40 },
            { name: 'name' },
            { name: 'address.city', minWidth: 150 }, //respect width
            { name: 'address.state' },
            { name: 'address.zip' },
            { name: 'age' },
            { name: 'age again', field: 'age', displayName: 'age again' }, //works ok with aliases
            { field: 'age', displayName: 'third age in a row' }, //works ok with aliases
            { name: 'guid' },
            { name: 'registered', cellFilter: 'date:"yyyy-MM-dd"' }, //can handle filters
            { name: 'registered', displayName: 'registered2', cellFilter: 'date:"medium"' },
            { name: 'picture' },
            { name: 'company' },
            { name: 'email' },
            { name: 'phone' },
            { name: 'about', maxWidth: 322 },
            { name: 'friends[0].name', displayName: '1st friend' }, //works fine with "flat entities"
            { name: 'friends[1].name', displayName: '2nd friend' },
            { name: 'friends[2].name', displayName: '3rd friend' }
      ],
      data: [
         {
            "id": 0,
            "guid": "de3db502-0a33-4e47-a0bb-35b6235503ca",
            "isActive": false,
            "balance": "$3,489.00",
            "picture": "http://placehold.it/32x32",
            "age": 30,
            "name": "Sandoval Mclean",
            "gender": "male",
            "company": "Zolavo",
            "email": "sandovalmclean@zolavo.com",
            "phone": "+1 (902) 569-2412",
            "address": {
            "street": 317,
            "city": "Blairstown",
            "state": "Maine",
            "zip": 390
            },
            "about": "Fugiat velit laboris sit est. Amet eu consectetur reprehenderit proident irure non. Adipisicing mollit veniam enim veniam officia anim proident excepteur deserunt consectetur aliquip et irure. Elit aliquip laborum qui elit consectetur sit proident adipisicing.\r\n",
            "registered": "1991-02-21T23:02:31+06:00",
            "friends": [
            {
                "id": 0,
                "name": "Rosanne Barrett"
            },
            {
                "id": 1,
                "name": "Nita Chase"
            },
            {
                "id": 2,
                "name": "Briggs Stark"
            }
            ]
        }
      ]
    };

    

    // $http.get('500_complex.json')
    //     .then(function(response) {
    //         this.gridOptions.data = response.data;
    //     }.bind(this));

}
