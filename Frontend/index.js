'use strict';

const airportLocations = [
  {icao: 'EFHK', name: 'Helsinki (Home)', lat: 60.3172, lng: 24.9633},
  {icao: 'LOWW', name: 'Austria', lat: 48.1103, lng: 16.5697},
  {icao: 'EBBR', name: 'Bryssel, Belgium', lat: 50.9014, lng: 4.4844},
  {icao: 'LEMD', name: 'Madrid, Espanja', lat: 40.4719, lng: -3.5626},
  {icao: 'LIRF', name: 'Rooma, Italia', lat: 41.8003, lng: 12.2389},
  {icao: 'ELLX', name: 'Luxemburg', lat: 49.6266, lng: 6.2115},
  {icao: 'EPWA', name: 'Varsova, Puola', lat: 52.1657, lng: 20.9671},
  {icao: 'LFPG', name: 'Pariisi, Ranska', lat: 49.0097, lng: 2.5479},
  {icao: 'EKCH', name: 'Kööpenhamina, Tanska', lat: 55.6180, lng: 12.6560},
  {icao: 'LGAV', name: 'Ateena, Kreikka', lat: 37.9364, lng: 23.9445},
  {icao: 'UMMS', name: 'Minsk, Valko-Venäjä', lat: 53.8825, lng: 28.0307},
  {icao: 'EETN', name: 'Tallinna, Viro', lat: 59.4133, lng: 24.8328},
];

// --- GLOBE INITIALIZATION ---
const myGlobe = Globe()(document.getElementById('globeViz'))
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .pointOfView({ lat: 50, lng: 15, altitude: 1.5 }); // Centers camera on Europe

const API_BASE = 'http://localhost:5050/api';

function getUsernameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('username');
}

const username = getUsernameFromURL();

// jos ei ole pelaaja formia niin piilota hudi
if (!username) {
  document.querySelectorAll('.main-game-container').
      forEach(el => el.style.display = 'none');
} else {
  // piilota formi
  document.getElementById('authForm').style.display = 'none';

  // fetch user data
  fetch(`${API_BASE}/authenticate?username=${username}`).
      then(res => res.json()).
      then(data => {
        document.getElementById('ui-money').innerHTML = data.money;
        document.getElementById('ui-cola').innerHTML = data.coca_cola;
        document.getElementById('ui-clock').innerHTML = data.clock;
        document.getElementById('ui-location').innerHTML = data.location;
        document.getElementById(
            'ui-total-travel').innerHTML = data.total_travel_km;
      });
}

document.getElementById('authForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;

  if (username) {
    window.location.href = `?username=${username}`;
  }
});

const countryImages = {
  'LOWW': 'images/vienna.jpg',
  'EBBR': 'images/brussels.jpg',
  'LEMD': 'images/madrid.jpg',
  'LIRF': 'images/rome.jpg',
  'ELLX': 'images/luxembourg.jpg',
  'EPWA': 'images/warsaw.png',
  'LFPG': 'images/paris.jpg',
  'EKCH': 'images/copenhagen.jpg',
  'LGAV': 'images/athens.jpg',
  'UMMS': 'images/minsk.jpg',
  'EETN': 'images/tallinn.jpg',
};

let selectedDestination = null;

// funktio joka avaa valikon klikatessa kohdemaata
async function openFlightMenu(icao, name) {
  try {
    // haetaan etäisyys
    const response = await fetch(
        `${API_BASE}/get_flight_info?icao=${icao}`);
    const playerRes = await fetch(
        `${API_BASE}/authenticate?username=${username}`);

    const data = await response.json();
    const playerData = await playerRes.json();

    selectedDestination = {
      icao: icao,
      name: name,
      distance: data.distance,
    };

    // päivitetään kohdemaa ja etäisyys htmllää
    document.querySelector('#ui-flight-title').innerHTML = name;
    document.querySelector('#ui-flight-distance').innerHTML = data.distance;

    document.querySelector('#ui-cola-in-menu').innerHTML = playerData.coca_cola;

    // asetetaan pieni kone valituksi (index 0)
    const firstPlane = document.querySelector('.plane-card[data-index="0"]');

    // haetaan lennon hinta bäkistä
    await updatePrice(data.distance, 0);

    // näytetään valikko
    document.querySelector('.ui-flight-container').style.display = 'block';

    // avataan popup
    document.querySelector('.main-game-popup').style.display = 'flex';

  } catch (error) {
    console.error('Virhe lentovalikkoa avatessa:', error);
    alert('Lentotietojen haku epäonnistui!');
  }
}

// funktio hinnan hakemiseen
async function updatePrice(dist, planeIdx) {
  const response = await fetch(
      `${API_BASE}/calculate_cost?dist=${dist}&plane_idx=${planeIdx}`);
  const data = await response.json();
  document.getElementById('ui-flight-cost').innerText = data.price;
}

async function selectPlane(element) {
  // Visuaalinen valinta
  document.querySelectorAll('.plane-card').
      forEach(card => card.classList.remove('selected'));
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
document.querySelectorAll('.ui-select-country').forEach(button => {
  button.addEventListener('click', (event) => {
    // Otetaan ICAO-koodi napin ID:stä (esim. "LOWW")
    const icao = event.currentTarget.id;
    // Otetaan maan nimi napin tekstistä (esim. "Austria")
    const name = event.currentTarget.innerText;

    // Kutsutaan funktiota joka avaa valikon
    openFlightMenu(icao, name);
  });
});

// move player Configuration
let currentFlightData = null;

// päivittää kaikki tiedot
const updatePlayerUI = (user) => {
  document.getElementById('ui-money').textContent = parseFloat(user.money).
      toFixed(2);
  document.getElementById('ui-location').textContent = user.location;
  document.getElementById('ui-total-travel').textContent = parseFloat(
      user.total_travel_km).toFixed(2);
  document.getElementById('ui-cola').textContent = user.coca_cola;
  if (user.clock) {
    document.getElementById('ui-clock').textContent = user.clock;
  }
};

let currentFines = 0;
let currentSalesProfit = 0;

// Select Country
document.querySelectorAll('.ui-select-country').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const icao = e.currentTarget.id;

    try {
      const response = await fetch(`${API_BASE}/get_flight_info?icao=${icao}`);
      const data = await response.json();

      currentFlightData = data;

      document.getElementById('ui-flight-distance').textContent = data.distance;
      document.getElementById('btn-fly').style.display = 'block';
    } catch (err) {
      console.error('Flight info fetch failed:', err);
    }
  });
});

// Move Player
document.getElementById('btn-fly').addEventListener('click', async () => {
  if (!currentFlightData) return;

  const colaLoad = document.getElementById('ui-cola-quantity').value;
  const selectedPlane = document.querySelector('.plane-card.selected');
  const planeCapacity = selectedPlane.getAttribute('data-capacity');

  try {
    const response = await fetch(`${API_BASE}/move_player`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username: username,
        icao: currentFlightData.to,
        distance: currentFlightData.distance,
        load: colaLoad,
        capacity: planeCapacity,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // päivitä ui
      currentSalesProfit = data.sales_profit || 0;
      updatePlayerUI(data.user);

      // piilota flight menu
      document.querySelector('.ui-flight-container').style.display = 'none';

      myGlobe.arcsData([
        {
          startLat: currentFlightData.start_lat,
          startLng: currentFlightData.start_lng,
          endLat: currentFlightData.end_lat,
          endLng: currentFlightData.end_lng,
          color: ['#00ff00', '#ff0000'], // Green to Red arc
        }]).
          arcColor('color').
          arcDashLength(0.4).
          arcDashGap(0.2).
          arcDashAnimateTime(2000); // Animation speed

      if (data.caught) {
        currentFines = data.fines;
        document.getElementById(
            'bribe-fine-text').textContent = `Jäit kiinni ylilastista! Sakko: ${data.fines}€`;
        document.getElementById('ui-bribe-screen').style.display = 'block';
      } else {
        showSuccessScreen();
      }

      // näytä success näkymä
      const destIcao = currentFlightData.to;
      const screenElement = document.getElementById('ui-success-screen');

      document.getElementById('country-image').src = countryImages[destIcao] ||
          'images/default_airport.jpg';
      document.getElementById(
          'success-message').textContent = `Tervetuloa kohteeseen ${destIcao}!`;
      screenElement.style.display = 'block';
    } else {
      alert(`Virhe: ${data.message}`);
    }
  } catch (err) {
    console.error('Move request failed:', err);
  }
});
document.getElementById('btn-pay-fine').
    addEventListener('click', () => submitBribeChoice('no'));
document.getElementById('btn-attempt-bribe').
    addEventListener('click', () => submitBribeChoice('yes'));

async function submitBribeChoice(choice) {
  try {
    const response = await fetch(`${API_BASE}/handle_bribe`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username: username,
        fines: currentFines,
        choice: choice,
      }),
    });

    const data = await response.json();

    if (data.success) {
      updatePlayerUI(data.user);
      document.getElementById('ui-bribe-screen').style.display = 'none';
      alert(data.message); // Kertoo onnistuiko lahjonta vai tuplaantuiko sakot

      // Näytetään onnistumisruutu sakkojen/lahjonnan selvittelyn jälkeen
      showSuccessScreen();
    } else {
      alert(`Virhe: ${data.message}`);
    }
  } catch (err) {
    console.error('Bribe request failed:', err);
  }
}

// Apufunktio onnistumisruudun näyttämiseen
function showSuccessScreen() {
  const destIcao = currentFlightData.to;
  const screenElement = document.getElementById('ui-success-screen');

  document.getElementById('country-image').src = countryImages[destIcao] ||
      'images/default_airport.jpg';
  document.getElementById(
      'success-message').textContent = `Tervetuloa kohteeseen ${destIcao}!`;

  // Näytä tienattu summa
  if (currentSalesProfit > 0) {
    document.getElementById(
        'success-sales-message').textContent = `Myit colat ja tienasit ${currentSalesProfit.toFixed(
        2)} €!`;
  } else {
    document.getElementById(
        'success-sales-message').textContent = `Et ottanut colaa mukaan, joten et tienannut mitään.`;
  }

  screenElement.style.display = 'block';
}

// Kotiinpaluu napin logiikka
document.getElementById('btn-return-home').
    addEventListener('click', async () => {
      try {
        const response = await fetch(`${API_BASE}/return_home`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({username: username}),
        });

        const data = await response.json();

        if (data.success) {
          updatePlayerUI(data.user);

          document.getElementById('ui-success-screen').style.display = 'none';

          document.querySelector('.main-game-popup').style.display = 'none';

          myGlobe.arcsData([]);

          selectedDestination = null;
          currentFlightData = null;

          // Nollataan valikko ja näytetään ilmoitus
          alert(
              `Lensit takaisin kotiin! Faija toi sinulle töistä ${data.added_cola} colaa!`);
        } else {
          alert(`Virhe: ${data.message}`);
        }
      } catch (err) {
        console.error('Return request failed:', err);
      }
    });