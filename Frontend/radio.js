const icaoToCountry = {
    'EFHK': 'FI',
    'LOWW': 'AT',
    'EBBR': 'BE',
    'LEMD': 'ES',
    'LIRF': 'IT',
    'EPWA': 'PL',
    'LFPG': 'FR',
    'EKCH': 'DK',
    'LGAV': 'GR',
    'EYVI': 'LT'
};

async function playLocalRadio(icao) {
    let countryCode = icaoToCountry[icao];
    if (!countryCode) return;

    let player = document.getElementById('radio-player');

    player.pause();
    player.src = "";
    player.load();

    try {
        let response = await fetch('https://all.api.radio-browser.info/json/stations/bycountrycodeexact/' + countryCode + '?limit=1&order=clickcount&reverse=true');
        let stations = await response.json();

        if (stations.length > 0) {
            let station = stations[0];
            player.src = station.url_resolved;

            player.play().catch(function(error) {
                console.log("Toisto vaatii klikkauksen");
            });

            console.log("Soitetaan: " + station.name);
        }
    } catch (error) {
        console.log("Virhe radion latauksessa");
    }
}

function stopRadio() {
    const player = document.getElementById('radio-player');
    if (player) {
        player.pause();
        player.src = "";
    }
}