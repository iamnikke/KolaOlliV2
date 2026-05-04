# KolaOlliV2
Metropolian Ohjelmointi 2 -projektityö.

### Kehittäjät:
Nikke Marttila, Aaro Tanner ja Matti Pihlajaviita

***

## Backend käynnistys
Aja yhdessä terminaalissa tämä:

``
cd backend
python3 app.py
``

## Frontend käynnistys
Aja toisessa terminaalissa tämä:

``
cd frontend
python3 -m http.server 3000
``

## SQL käynnistys
``
mysql.server start 
``

***

# Kehityssuunnitelma
Käytännössä kehitetään screeneittäin peliä niin, että jaetaan tasaisesti kaikille full-stack (Html, CSS, Python) roolia.

## Screen 1: Pelin alustus
* Pelin alustus (**Nikke**)
  * Käyttäjän hakeminen / luominen tietokantaan (**Nikke**)


## Screen 2: Perusnäkymä
* Kohdemaan valinta napit (**Nikke**)
* Perus kelluva tilasto hud (**Nikke**)
* Kattavampi tilastonäkymä (**Matti**)

## Screen 3: Matkan määrittely pop-up
* Dynaaminen title riippuen valitusta kohdemaasta ()
* Etäisyyden laskenta kotoa valittuun kohdemaahan (**Nikke**)
* Riittävästi rahaa validointi ()
* Matkustusmuodon valitseminen (**Matti**)
  * Lentokone vaihtoehtojen hakeminen
  * Hinnan laskenta etäisyyteen perustuen
  * Validointi: Jos rahat ei riitä, niin valitsin disabled
* Coca-colan määrä valitsin elementti (**Matti, Aaro**)
  * Minimi 0, maksimi käyttäjän saldo

## Screen 4: Matka käynnissä
* S3:sta passatun kohdemaan mukaan välinäkymässä käytetty materiaali (kuva, video, musiikki?) renderöinti fronttiin ()
* Back-end logiikka (**Aaro**)
  * Vähennä rahat ja colat tietokannasta
  * Logiikka kiinnijäämiselle
    * Jos jää kiinni, niin siirtymä S5
  * Logiikka matkan onnistumiselle
    * Päivitä tilastot
    * Siirtymä S6

## Screen 5: Lahjonta / kiinnijääminen
* Logiikka sakon määrälle (**Aaro**)
* Logiikka lahjonnan summalle (**Aaro**)
* Frontissa: maksa sakko tai yritä lahjoa (**Aaro**)
  * Näytä summat napeissa 
* Pieni viive rakentamaan jännitystä lahjonnan tuloksesta
* Logiikka lahjonnan onnistumiselle (**Aaro**)
  * Lahjonta epäonnistuu
    * Päivitä statsit
    * Siirtymä S7: Game over
  * Lahjonta onnistuu
    * Päivitä statsit
    * Siirtymä S6
* Sakko maksetaan suoraan
  * Päivitä statsit
  * Siirtymä S6

## Screen 6: Kohdemaassa
* Paikallinen tunnelma
  * Kuva/video tausta (**Aaro**)
  * Paikallinen radio soi
  * Mahdollisuus upottaa easter eggejä
* Vain yksi valinta: Palaa kotiin (**Aaro**)
  * Logiikka sille
    * Siirrä pelaaja
  * Päivitä statsit

## Screen 7: Game over
* Näytä pelaajan tilastot
* Vain yksi valinta: Aloita alusta
  * Logiikka: Poista nykyinen käyttäjä tietue
  * Siirtymä S1: Pelin alustus





