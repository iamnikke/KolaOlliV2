'use strict';

let selectedDestination = null;

// funktio joka avaa valikon klikatessa kohdemaata
async function openFlightMenu(icao, name) {
    try {
        // haetaan etäisyys backistä
        const response = await fetch(`http://127.0.0.1:5050/api/get_flight_info?icao=${icao}`);
        const data = await response.json();

        selectedDestination = {
            icao: icao,
            name: name,
            distance: data.distance
        };

        // päivitetään kohdemaa ja etäisyys htmllää
        document.querySelector('#ui-flight-title').innerHTML = name;
        document.querySelector('#ui-flight-distance').innerHTML = data.distance;

        // asetetaan pieni kone valituksi (index 0)
        const firstPlane = document.querySelector('.plane-card[data-index="0"]');

        // haetaan lennon hinta bäkistä
        await updatePrice(data.distance, 0)

        // näytetään valikko
        document.querySelector('.ui-flight-container').style.display = 'block';

    } catch (error) {
        console.error("Virhe lentovalikkoa avatessa:", error);
        alert("Lentotietojen haku epäonnistui!");
    }
}

// Apufunktio hinnan hakemiseen (jotta koodia ei tarvitse toistaa)
async function updatePrice(dist, planeIdx) {
    const response = await fetch(`http://127.0.0.1:5050/api/calculate_cost?dist=${dist}&plane_idx=${planeIdx}`);
    const data = await response.json();
    document.getElementById('ui-flight-cost').innerText = data.price;
}

async function selectPlane(element) {
    // Visuaalinen valinta
    document.querySelectorAll('.plane-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');

    // Haetaan tiedot
    const planeIdx = element.dataset.index;
    const dist = selectedDestination.distance;

    // Päivitetään piilotettu kenttä
    document.getElementById('selected-plane-index').value = planeIdx;

    // Haetaan hinta Pythonista
    await updatePrice(dist, planeIdx);
}

// Etsitään kaikki maanvalintanapit
document.querySelectorAll(".ui-select-country").forEach(button => {
    button.addEventListener("click", (event) => {
        // Otetaan ICAO-koodi napin ID:stä (esim. "LOWW")
        const icao = event.currentTarget.id;
        // Otetaan maan nimi napin tekstistä (esim. "Austria")
        const name = event.currentTarget.innerText;

        // Kutsutaan funktiota joka avaa valikon
        openFlightMenu(icao, name);
    });
});
