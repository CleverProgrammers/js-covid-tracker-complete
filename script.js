const startUIDropdown = (data) => {
    $('.ui.dropdown').dropdown({
        values: data,
        onChange: function(value, text){
            changeCountrySelection(value);
        }
    });
}

window.onload = () => {
    initMap();
    getCountriesData();
    getHistoricalData();
    getWorldCoronaData();
    setHoverState();
}


var map;
var infoWindow;
let coronaGlobalData;
let coronaHystoricalData;
let mapCircles = [];
let countrySelection = 'worldwide';
let mapCenter = {lat: 34.80746, lng: -40.4796}
let worldwideSelect = {
    name: "Worldwide",
    value: "worldwide",
    selected: true
}
var casesTypeColors = {
    cases: {
        hex: '#CC1034',
        rgb: 'rgb(204, 16, 52)',
        half_op: 'rgba(204, 16, 52, 0.5)',
        multiplier: 800
    },
    recovered: {
        hex: '#7dd71d',
        rgb: 'rgb(125, 215, 29)',
        half_op: 'rgba(125, 215, 29, 0.5)',
        multiplier: 1200
    },
    deaths: {
        hex: '#fb4443',
        rgb: 'rgb(251, 68, 67)',
        half_op: 'rgba(251, 68, 67, 0.5)',
        multiplier: 2000
    }
}

function initMap() {
    map = L.map('map', {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 3
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map); 
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
    let chartData = buildChartData(coronaHystoricalData, casesType);
    updateData(chartData, casesTypeColors[casesType].rgb, casesTypeColors[casesType].half_op);
}

const changeMapTitle = (casesType) => {
    let casesText = casesType.charAt(0).toUpperCase() + casesType.slice(1)
    document.querySelector('.map-header h4').textContent = `Coronavirus ${casesText}`;
    document.querySelector('.chart-container .cases-type').textContent = casesText;
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
        map.removeLayer(circle);
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
    console.log("setView");
    map.setView([lat, long], zoom);
}

const getCountriesData = () => {
    fetch("https://disease.sh/v3/covid-19/countries")
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
        setMapCountryCenter(data.countryInfo.lat, data.countryInfo.long, 4);
    })
}

const getWorldCoronaData = () => {
    fetch("https://disease.sh/v3/covid-19/all")
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        updateDate(data.updated);
        setStatsData(data);
        setMapCountryCenter(mapCenter.lat, mapCenter.lng, 3);
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
    fetch("https://disease.sh/v3/covid-19/historical/all?lastdays=120")
    .then((response)=>{
        return response.json()
    }).then((data)=>{
        coronaHystoricalData = data;
        let chartData = buildChartData(data, 'cases');
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

        var circle = L.circle([countryCenter.lat, countryCenter.lng], {
            color: casesTypeColors[casesType].hex,
            fillColor: casesTypeColors[casesType].hex,
            fillOpacity: 0.4,
            radius: Math.sqrt(country[casesType])*casesTypeColors[casesType].multiplier
        }).addTo(map);

        var html = `
            <div class="info-container">
                <div class="info-flag" style="background-image: url(${country.countryInfo.flag});">
                </div>
                <div class="info-name">
                    ${country.country}
                </div>
                <div class="info-confirmed">
                    Cases: ${numeral(country.cases).format('0,0')}
                </div>
                <div class="info-recovered">
                    Recovered: ${numeral(country.recovered).format('0,0')}
                </div>
                <div class="info-deaths">   
                    Deaths: ${numeral(country.deaths).format('0,0')}
                </div>
            </div>
        `

        circle.bindPopup(html);
        mapCircles.push(circle);
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

