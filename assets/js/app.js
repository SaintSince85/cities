angular.module("coc", [])
    .run(function ($templateCache) {

        $templateCache.put('game.tpl.html',
            '<div class="" >' +
                'Create city: <input type="text" ng-model="gameCtrl.cityName" ng-keypress="($event.which === 13)?gameCtrl.createCity():0" /><button ng-click="gameCtrl.createCity()">Create</button><br>' +
                '<div class="cities">' +
                    '<div class="city" ng-repeat="city in gameCtrl.data.cities" ng-class="{current: city.getName()===gameCtrl.data.city.getName()}" ng-click="gameCtrl.data.city = city">' +
                        '<fieldset class="city-name-cont">' +
                            '<legend>'+
                                '<span class="city-name" ng-bind="city.getName()" ></span>' +
                            '</legend>' +
                            '<div class="gold" >' +
                                '<span class="gold icon" ng-bind="city.getGoldValue()"></span>' +
                            '</div>'+
                            '<div class="buildings" >' +
                                '<div class="icon"></div>' +
                                '<div class="count" >' +
                                    '<div class="built-count">' +
                                        '<span>Built: </span><span ng-bind="city.getBuildingCount()"></span>' +
                                    '</div>' +
                                    '<div class="queued-count">' +
                                        '<span>Queued: </span><span ng-bind="city.getQueueCount()"></span>' +
                                    '</div>' +
                                    '<div class="in-progress-count">' +
                                        '<span>In progress: </span><span ng-bind="city.getInProgressCount()"></span>' +
                                    '</div>' +
                                '</div>'+
                            '</div>'+
                        '</fieldset>' +
                    '</div>' +
                '</div>' +
            '</div>');

        $templateCache.put('city.tpl.html',
            '<div class="city-cont"  ng-if="gameCtrl.data.city!==undefined">' +
                '<fieldset class="city-name-cont">' +
                    '<legend>'+
                        '<span class="city-name" ng-bind="gameCtrl.data.city.getName()" ></span></span>' +
                        '<span class="city">city</span>' +
                    '</legend>' +
                    '<div class="gold" >' +
                        '<fieldset>' +
                              '<legend>Gold:</legend>' +
                               '<span class="gold icon" ng-bind="gameCtrl.data.city.getGoldValue()"></span>' +
                         '</fieldset>' +
                    '</div>'+
                    '<div class="buildings-cont" >' +
                        '<fieldset>' +
                            '<legend>Building:</legend>' +
                            '<div class="buildings">' +
                                '<div ng-repeat="cityBuilding in gameCtrl.data.city.buildings" ' +
                                    ' ng-class="{built: (hasBuilding=(building=gameCtrl.data.city.getBuilding(cityBuilding.getType()))!==undefined) && building.isBuilt(), '+
                                    ' \'not-built\': !hasBuilding, '+
                                    ' \'work-in-progress\': building.isWorkInProgress(), ' +
                                    ' \'in-process\': building.isInProcess() }" ' +
                                    ' class="building-cont {{cityBuilding.buildingTypeCss}}" ' +
                                    ' title="{{ gameCtrl.getTitle(cityBuilding, building) }}" ' +
                                    '>' +
                                    '<div class="building icon {{\'level-\' + building.getLevel()}} {{cityBuilding.buildingTypeCss}}"></div>' +
                                    '<div class="level" ng-if="hasBuilding && building.getLevel()>0">' +
                                        '<span class="level" ng-bind="building.getLevel()"></span>' +
                                    '</div>' +
                                    '<div class="building-type" ng-bind="cityBuilding.getType()"></div>' +
                                    '<div class="progressbar">' +
                                        '<div class="progress" ng-style="{width: building.getProgress() + \'%\'}"></div>' +
                                        '<div class="progress-percentage" ng-bind="building.getProgress() + \'%\'"></div>' +
                                    '</div>' +
                                    '<button ng-click="gameCtrl.buildOrUpgrade(cityBuilding.getType(), cityBuilding.buildingWorkCost)" ' +
                                       ' ng-disabled="building.isWorkInProgress()" '+
                                       ' ng-bind="cityBuilding.work + \' [$\' + cityBuilding.buildingWorkCost + \']\'" ></button>' +
                                '</div>' +
                            '</div>' +
                       '</fieldset>' +
                    '</div>' +
                '</fieldset>' +
            '</div>');
    })
    .factory("config", function () {
        return {
            TIME_INTERVAL_TO_INCREMENT_GOLD: 60000 , //60000  1000
            TIME_INTERVAL_TO_BUILD_BUILDING: 30000, //30000  10000
            TIME_INTERVAL_TO_UPGRADE_BUILDING: 30000, //30000 10000

            COST_TO_BUILD_BUILDING: 1,
            COST_TO_UPGRADE_BUILDING: 1,

            INITIAL_CITY_GOLD: 10,

            MAX_BUILD_UPGRADE: 2,

            BUILDING_TYPES:["Town hall", "Supermarket", "Restaurant", "Expo center", "Train station"]

        };
    })
    .factory("CityFactory", function ($interval, $timeout, config) {

        return {
            create: function(name){
                var city={
                    name : name,
                    gold : config.INITIAL_CITY_GOLD,
                    buildings: {},
                    buildingCnt: 0,
                    workCnt: 0,
                    queue: []
                };

                function incrementGold(){
                    city.gold++;
                    console.log(city.name + ": " + city.gold + " [gold]");
                }

                function buildingBuilt(){
                    city.workCnt--;
                    checkToPickUpWork();
                }

                function reachedTaskLimit(){
                     return city.workCnt==config.MAX_BUILD_UPGRADE;
                }

                function buildBuilding(building, task){
                    city.workCnt++;
                    if(task==="build"){
                        building.build(function (){
                            city.buildingCnt++;
                            buildingBuilt();
                        });
                    }else{
                        building.upgrade(buildingBuilt);
                    }
                }

                function checkToPickUpWork(){
                    if(!reachedTaskLimit()){
                        var work = city.queue.shift();
                        if(angular.isDefined(work)){
                            buildBuilding(work.building, work.task);
                        }
                    }
                }

                $interval(incrementGold, config.TIME_INTERVAL_TO_INCREMENT_GOLD);

                return{
                    getName: function(){
                        return city.name;
                    },
                    getGoldValue: function (){
                        return angular.copy(city.gold);
                    },
                    buildBuilding: function (building){
                        if(this.hasBuilding(building.getType()) && building.isBuilt()){
                            alert("Building type exists in city!");
                            return;
                        }
                        city.gold = city.gold - building.getBuildCost();
                        console.log("Gold deducted for building " + building.getType());
                        city.buildings[building.getType()] = building;
                        city.queue.push({building: building, task:"build"});
                        if(reachedTaskLimit()){
                            alert("Building creation is queued!");
                            return;
                        }
                        checkToPickUpWork();
                    },
                    upgradeBuilding: function (buildingOrBuldingType){
                        var building = angular.isString(buildingOrBuldingType) ? this.getBuilding(building.getType()) : buildingOrBuldingType;
                        if( !(this.hasBuilding( building.getType()) && building.isBuilt() ) ) {
                            alert("Building type does not exists in city!");
                            return;
                        }

                        city.gold = city.gold - building.getUpgradeCost();
                        console.log("Gold deducted for building " + building.getType());
                        city.queue.push({building: building, task:"upgrade"});
                        if(reachedTaskLimit()){
                            alert("Building upgrade is queued!");
                            return;
                        }
                        checkToPickUpWork();
                    },

                    hasBuilding: function(buildingType){
                        return angular.isDefined(city.buildings[buildingType]);
                    },
                    getBuilding: function (buildingType){
                        return city.buildings[buildingType];
                    },
                    getBuildingCount: function(){
                        return city.buildingCnt;
                    },
                    getQueueCount: function(){
                       return city.queue.length;
                    },
                     getInProgressCount: function(){
                        return city.workCnt;
                     }
                }
            }
        };
    })
    .factory("BuildingFactory", function ($timeout, $interval, config) {

        return {
            create : function (type, city){
                 var building = {
                      city: city,
                      type : type,
                      level : -1,
                      isBuilt : false,
                      workInProgress: false,
                      isInProcess: false,
                      progress: undefined,
                 };

                 function process(time, callback){
                     building.progress = 0;
                     $interval(function (){
                        building.progress++;
                        if(building.progress===100){
                            building.workInProgress = false;
                            callback();
                        }
                     }, time/100, 100);
                 }

                 return {
                        getType: function(){
                            return building.type;
                        },

                        getLevel: function(){
                            return building.level;
                        },

                        getBuildCost: function (){
                            return config.COST_TO_BUILD_BUILDING;
                        },

                        getBuildTime: function (){
                            return config.TIME_INTERVAL_TO_BUILD_BUILDING;
                        },

                        getUpgradeCost: function (){
                            return config.COST_TO_UPGRADE_BUILDING;
                        },

                        getUpgradeTime : function(){
                            return config.TIME_INTERVAL_TO_UPGRADE_BUILDING;
                        },


                        build : function(callback){
                            building.isInProcess = true;
                            if(angular.isDefined(callback)){
                                building.isInProcess = false;
                                building.workInProgress = true;
                                process(this.getBuildTime(), function (){
                                    building.level = 0;
                                    building.isBuilt = true;
                                    console.log(building.type + " built!");
                                    callback();
                                });
                            }else{
                                building.city.buildBuilding(this);
                            }
                        },

                        isBuilt: function(){
                            return building.isBuilt;
                        },

                        isWorkInProgress: function (){
                            return building.workInProgress;
                        },
                        isInProcess: function (){
                            return building.isInProcess;
                        },
                        getProgress: function(){
                            return building.progress;
                        },
                        upgrade : function(callback){
                            building.isInProcess = true;
                            if(this.isBuilt() && angular.isDefined(callback)){
                                building.isInProcess = false;
                                building.workInProgress = true;
                                process(this.getUpgradeTime(), function(){
                                    building.level++;
                                    console.log(building.type + " upgraded to level " + building.level);
                                    callback();
                                });
                            }else{
                                building.city.upgradeBuilding(this);
                            }
                        }
                 }
            }
        }


        return new Building();
    })

.controller("gameController", function ($scope, $interval, config, CityFactory, BuildingFactory) {
    var _this = this;

    function getBuildings(city){
        var building, buildingType, buildings = [], buildingTypes=config.BUILDING_TYPES;
        for(var i=0; i<buildingTypes.length; i++){
            buildingType = buildingTypes[i];
            building = BuildingFactory.create(buildingType, city);
            building.buildingTypeCss = getBuildingTypeCss(buildingType);
            buildings.push(building);
        }
        return buildings;
    }

    function build(buildingType){
        var building = BuildingFactory.create(buildingType,_this.data.city);
        building.build();
    }

    function upgrade(buildingType){
        _this.data.city.getBuilding(buildingType).upgrade();
    }

    function getBuildingTypeCss(buildingType){
        return buildingType.toLowerCase().replace(/\s/g, "-");
    }

    function getBuildingWorkCost(cityBuilding, building){
       return angular.isDefined(building) && building.isBuilt() ? cityBuilding.getUpgradeCost() : cityBuilding.getBuildCost();
    }

    _this.data = {
       city: undefined,
       cities: []
    };

    _this.createCity = function (){
        if(angular.isUndefined(_this.cityName) || _this.cityName.length===0){
            alert("Provide a name for the city to be created!");
            return;
        }
        var city = CityFactory.create(_this.cityName);
        city.buildings = getBuildings(city);
        _this.data.cities.push(city);
        _this.data.city = city;
        _this.cityName = "";
    };

    _this.buildOrUpgrade = function (buildingType, buildingWorkCost){
        if( (_this.data.city.getGoldValue() - buildingWorkCost) < 0 ){
            alert("Not enough gold!!");
        }else{
            var fn = _this.data.city.hasBuilding(buildingType) ? upgrade : build;
            fn(buildingType);
        }
    };

    _this.getTitle = function (cityBuilding, building){
        var title;
        cityBuilding.buildingWorkCost = getBuildingWorkCost(cityBuilding, building);
        if(angular.isDefined(building) && building.isBuilt() ){
            cityBuilding.work = 'Upgrade';
            title = cityBuilding.getType() + ' upgrade cost $' + cityBuilding.buildingWorkCost;
        }else{
            cityBuilding.work = 'Build';
            title = cityBuilding.getType() + ' construction cost $' + cityBuilding.buildingWorkCost;
        }
        if(angular.isDefined(building)){
            if(building.isInProcess()){
                title = "Waiting for permission from city officials to build a " + building.getType() + "!";
            }else if( building.isWorkInProgress()){
                 if (building.isBuilt()){
                     title =  building.getType() + " upgrading work in progress!";
                 }else{
                     title = building.getType() + " construction work in progress!";
                 }
            }
        }
        return title;
    };

});

