const startUIDropdown = (data) => {
    $('.ui.dropdown').dropdown({
        values: data,
        onChange: function(value, text){
            changeCountrySelection(value);
        }
    });
}

window.onload = () => {
    getCountriesData();
    getHistoricalData();
    getWorldCoronaData();
    setHoverState();
}


var map;
var infoWindow;
let coronaGlobalData;
let mapCircles = [];
let countrySelection = 'worldwide';
let mapCenter = {lat: 34.80746, lng: -40.4796}
let worldwideSelect = {
    name: "Worldwide",
    value: "worldwide",
    selected: true
}
var casesTypeColors = {
    cases: '#CC1034',
    active: '#9d80fe',
    recovered: '#7dd71d',
    deaths: '#fb4443'
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        zoom: 2,
        styles: mapStyle,
        mapTypeControl: false,
        fullscreenControl: false, 
        streetViewControl: false
    });
    infoWindow = new google.maps.InfoWindow();
}

const changeCountrySelection = (countryCode) => {
    if(countryCode !== countrySelection){
        if(countryCode == worldwideSelect.value){
            getWorldCoronaData(countryCode);
        } else {
            getCountryCoronaData(countryCode);
        }
        countrySelection = countryCode;
    }
}

const changeDataSelection = (casesType) => {
    setSelectedTab(casesType);
    changeMapTitle(casesType);
    clearTheMap();
    showDataOnMap(coronaGlobalData, casesType);
}

const changeMapTitle = (casesType) => {
    let casesText = casesType.charAt(0).toUpperCase() + casesType.slice(1)
    document.querySelector('.map-header h4').textContent = `Coronavirus ${casesText}`;
}

const setHoverState = () => {
    $('.card').hover(function() {
        $(this).find('.tab-selection').not('.selected').fadeIn(200);
    }, function(){
        $(this).find('.tab-selection').not('.selected').fadeOut(200);
    })
}

const  updateDate = (dateTimestamp) => {
    let date = moment(dateTimestamp).format("[Last Updated] MMMM DD, YYYY");
    document.querySelector('.map-header .date').textContent = date;
}

const clearTheMap = () => {
    for(let circle of mapCircles){
        circle.setMap(null);
    }
}

const setSelectedTab = (casesType) => {
    const tabs = document.querySelectorAll('.tab-selection');
    for(let tab of tabs){
        tab.classList.remove('selected');
        tab.style.display = 'none';
    }
    const activeTab = document.querySelector(`.${casesType} .tab-selection`);
    activeTab.classList.add('selected');
}

const setMapCountryCenter = (lat, long, zoom) => {
    map.setZoom(zoom);
    map.panTo({ lat: lat, lng: long })
}

const getCountriesData = () => {
    fetch("https://corona.lmao.ninja/v2/countries")
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        coronaGlobalData = data;
        setCountrySelection(data);
        showDataOnMap(data);
        let sortedData = sortData(data);
        showDataInTable(sortedData);
    })
}

const sortData = (data) => {
    let sortedData  = [...data]
    sortedData.sort((a, b)=>{
        if(a.cases > b.cases){
            return -1;
        } else {
            return 1
        }
    })
    return sortedData
}

const setCountrySelection = (data) => {
    let countries = [];
    countries.push(worldwideSelect)
    data.forEach((country)=>{
        countries.push({
            name: country.country,
            value: country.countryInfo.iso2
        })
    })
    startUIDropdown(countries);
}

const getCountryCoronaData = (countryCode) => {
    const url = `https://disease.sh/v3/covid-19/countries/${countryCode}`;
    fetch(url)
    .then((response)=>{
        return response.json();
    }).then((data)=>{
        updateDate(data.updated);
        setStatsData(data);
        setMapCountryCenter(data.countryInfo.lat, data.countryInfo.long, 3);
    })
}

const getWorldCoronaData = () => {
    fetch("https://disease.sh/v3/covid-19/all")
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        updateDate(data.updated);
        setStatsData(data);
        setMapCountryCenter(mapCenter.lat, mapCenter.lng, 2);
    })
}

const setStatsData = (data) => {
    let addedCases = numeral(data.todayCases).format('+0,0');
    let addedRecovered = numeral(data.todayRecovered).format('+0,0');
    let addedDeaths = numeral(data.todayDeaths).format('+0,0');
    let totalCases = numeral(data.cases).format('0.0a');
    let totalRecovered = numeral(data.recovered).format('0.0a');
    let totalDeaths = numeral(data.deaths).format('0.0a');
    document.querySelector('.total-number').innerHTML = addedCases;
    document.querySelector('.recovered-number').innerHTML = addedRecovered;
    document.querySelector('.deaths-number').innerHTML = addedDeaths;
    document.querySelector('.cases-total').innerHTML = `${totalCases} Total`;
    document.querySelector('.recovered-total').innerHTML = `${totalRecovered} Total`;
    document.querySelector('.deaths-total').innerHTML = `${totalDeaths} Total`;
}

const getHistoricalData = () => {
    fetch("https://corona.lmao.ninja/v2/historical/all?lastdays=120")
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        let chartData = buildChartData(data);
        buildChart(chartData);
    })
}

const openInfoWindow = () => {
    infoWindow.open(map);
}

const showDataOnMap = (data, casesType="cases") => {

    data.map((country)=>{
        let countryCenter = {
            lat: country.countryInfo.lat,
            lng: country.countryInfo.long
        }

        var countryCircle = new google.maps.Circle({
            strokeColor: casesTypeColors[casesType],
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: casesTypeColors[casesType],
            fillOpacity: 0.40,
            map: map,
            center: countryCenter,
            radius: country[casesType]
        });

        mapCircles.push(countryCircle);

        var html = `
            <div class="info-container">
                <div class="info-flag" style="background-image: url(${country.countryInfo.flag});">
                </div>
                <div class="info-name">
                    ${country.country}
                </div>
                <div class="info-confirmed">
                    Total: ${numeral(country.cases).format('0,0')}
                </div>
                <div class="info-recovered">
                    Recovered: ${numeral(country.recovered).format('0,0')}
                </div>
                <div class="info-deaths">   
                    Deaths: ${numeral(country.deaths).format('0,0')}
                </div>
            </div>
        `

        var infoWindow = new google.maps.InfoWindow({
            content: html,
            position: countryCircle.center
        });
        google.maps.event.addListener(countryCircle, 'mouseover', function() {
            infoWindow.open(map);
        });

        google.maps.event.addListener(countryCircle, 'mouseout', function(){
            infoWindow.close();
        })

    })

}

const showDataInTable = (data) => {
    var html = '';
    data.forEach((country)=>{
        html += `
        <tr>
            <td>${country.country}</td>
            <td class="table-cases-number" >${numeral(country.cases).format('0,0')}</td>
        </tr>
        `
    })
    document.getElementById('table-data').innerHTML = html;
}

