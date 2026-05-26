# Historia Bellum – Projektbeskrivning för Claude Code

## Vad är detta?
En interaktiv historiekarta där användaren kan utforska krig, slag, händelser och nyckelpersoner genom tiderna. Kartan är navet – man klickar på märken för att läsa berättelser, se inblandade personer och förstå historiska sammanhang.

Projektet byggs modulärt: ett land/region åt gången. Grunden (databas, API, UI) byggs en gång – att lägga till ett nytt land handlar sedan mest om att seeda ny data.

---

## Tech stack (bestämt)

### Frontend
- **React** via **Vite**
- **react-leaflet** + **OpenStreetMap** – gratis, ingen API-nyckel
- **Vanilla CSS** – ingen UI-komponentbibliotek
- **Typsnitt**: Cinzel (rubriker, logotyp) + EB Garamond (brödtext)
- Google Fonts: `https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap`

### Backend
- **Node.js + Express** – tunt API-lager
- **PostgreSQL** – relationsdatabas
- **Seed-data från JSON** – `sweden.json` används för att populera databasen initialt

### Projektstruktur
```
/
├── /client          ← React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.jsx
│   └── vite.config.js
├── /server          ← Node + Express
│   ├── /routes
│   ├── /db
│   │   ├── schema.sql
│   │   └── seed.js   ← läser sweden.json och populerar Postgres
│   └── index.js
├── /data
│   └── sweden.json   ← seed-data, källa för initial import
└── CLAUDE.md
```

### Lokal utvecklingsmiljö
- **OS**: Windows med Git Bash
- **Postgres**: körs i Docker

```yaml
# docker-compose.yml (i projektroten)
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: historia_bellum
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: localdev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Starta: `docker compose up -d`
Stoppa: `docker compose down`
Connection string: `postgresql://admin:localdev@localhost:5432/historia_bellum`

### Hosting (löses senare)
- Frontend: Vercel eller Netlify
- Backend + Postgres: Railway, Render eller Supabase

---

## Databasschema (PostgreSQL)

```sql
-- Länder/moduler
CREATE TABLE countries (
  id           VARCHAR(10) PRIMARY KEY,  -- 'se', 'jp', 'viking'
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  default_lat  DECIMAL(9,6),
  default_lng  DECIMAL(9,6),
  default_zoom INT DEFAULT 5
);

-- Eror per land
CREATE TABLE eras (
  id          VARCHAR(50) PRIMARY KEY,   -- 'stormakt', 'vikingatid'
  country_id  VARCHAR(10) REFERENCES countries(id),
  label       VARCHAR(100) NOT NULL,
  year_from   INT,
  year_to     INT
);

-- Personer
CREATE TABLE persons (
  id          VARCHAR(20) PRIMARY KEY,   -- 'se_p001'
  name        VARCHAR(200) NOT NULL,
  born        INT,
  died        INT,
  initials    VARCHAR(10),
  description TEXT,
  wikipedia   VARCHAR(500),
  country_id  VARCHAR(10) REFERENCES countries(id)
);

-- Händelser (slag, events, nyckelpersoner)
CREATE TABLE events (
  id                  VARCHAR(20) PRIMARY KEY,  -- 'se_e001'
  country_id          VARCHAR(10) REFERENCES countries(id),
  conflict_id         VARCHAR(50) REFERENCES conflicts(id),  -- nullable
  type                VARCHAR(20) NOT NULL,      -- 'battle' | 'event' | 'person'
  era_id              VARCHAR(50) REFERENCES eras(id),
  name                VARCHAR(200) NOT NULL,
  date                VARCHAR(100),
  year                INT NOT NULL,
  lat                 DECIMAL(9,6) NOT NULL,
  lng                 DECIMAL(9,6) NOT NULL,
  modern_location     VARCHAR(200),
  historical_context  VARCHAR(200),
  description         TEXT,
  notes               TEXT,                      -- nullable, kontroverser/djupare kontext
  wikipedia           VARCHAR(500)
);

-- Koppling händelse ↔ person
CREATE TABLE event_persons (
  event_id   VARCHAR(20) REFERENCES events(id),
  person_id  VARCHAR(20) REFERENCES persons(id),
  role       VARCHAR(200),
  PRIMARY KEY (event_id, person_id)
);

-- Konflikter (krig, folkmord, revolutioner...)
CREATE TABLE conflicts (
  id          VARCHAR(50) PRIMARY KEY,   -- 'stora_nordiska_kriget'
  name        VARCHAR(200) NOT NULL,
  start_year  INT,
  end_year    INT,
  description TEXT,
  type        VARCHAR(50)                -- 'war' | 'genocide' | 'revolution' | 'occupation' | 'massacre' | 'campaign'
);

-- Länder inblandade i konflikt
CREATE TABLE conflict_parties (
  conflict_id  VARCHAR(50) REFERENCES conflicts(id),
  country_id   VARCHAR(10) REFERENCES countries(id),
  role         VARCHAR(50),              -- 'attacker' | 'defender' | 'ally'
  PRIMARY KEY (conflict_id, country_id)
);

-- Regioner (för historisk kontext utan moderna gränser)
CREATE TABLE regions (
  id                      VARCHAR(50) PRIMARY KEY,
  name                    VARCHAR(200),
  approx_modern_country_id VARCHAR(10) REFERENCES countries(id),
  active_from             INT,
  active_to               INT
);
```

---

## API-endpoints

```
GET  /api/countries              → lista alla moduler/länder
GET  /api/countries/:id          → ett land med defaultView
GET  /api/events?country=se      → alla events för ett land
GET  /api/events?country=se&era=stormakt  → filtrerat på era
GET  /api/events/:id             → ett event med persons
GET  /api/persons/:id            → en person med alla kopplade events
GET  /api/conflicts/:id          → en konflikt med alla events och parties
```

---

## Modulärt upplägg

```
Modul 1: Sverige      → seedad från sweden.json, klar
Modul 2: Japan        → ny seed-fil, samma schema, inga strukturändringar
Modul 3: Vikingatiden → egen modul (inte kopplad till ett modernt land)
Konfliktlager         → conflicts + conflict_parties kopplar ihop moduler
```

### Viktigt om vikingatiden
Vikingatiden är en **egen modul** (`country_id: 'viking'`) – inte kopplad till Sverige, Norge eller Danmark. Det beror på att nationsgränserna inte existerade ännu. Händelser taggas på platsen de *hände* (Lindisfarne i England) och texten bär den historiska kontexten. När konfliktlagret byggs kan händelser länkas samman tvärs över moduler via `conflict_id`.

### Geografisk approach (bestämt)
Moderna koordinater (lat/lng) används för alla händelser – även historiska. Texten bär kontexten via två fält:
```
modern_location:    "Poltava, Ukraina"
historical_context: "Det ryska tsarriket, 1709"
```

---

## Estetik (viktigt – följ detta noga)

Mörkt, historiskt, kartografiskt. Känslan ska vara en gammal atlas möter ett modernt gränssnitt.

### Färgpalett
```css
--bg-primary:    #0a0908;
--bg-secondary:  #12100c;
--bg-tertiary:   #1a1610;
--border:        #2e2618;
--border-subtle: #1e1a12;
--gold:          #c9a84c;
--gold-dim:      #7a6a4a;
--gold-dark:     #5a4a28;
--text-primary:  #e8dfc8;
--text-body:     #a09070;
--text-muted:    #4a3f2a;
--text-faint:    #3a3020;

--color-battle:  #c04040;
--color-event:   #7a9a4a;
--color-person:  #4a8aad;
```

### Kartfilter
```css
.leaflet-tile-pane {
  filter: brightness(0.45) sepia(0.3) hue-rotate(10deg) saturate(0.6);
}
```

---

## Komponentstruktur (React)

```
<App>
  <TopBar>
    – Logotyp "HISTORIA · BELLUM"
    – Era-pills (filterknappar per tidsepok)
    – Modulväljare (Sverige | Japan | + Modul)
  </TopBar>
  <FilterRow>
    – Typ-filter: Slag | Händelser | Nyckelpersoner
  </FilterRow>
  <MainLayout>
    <MapView />      ← react-leaflet
    <Sidebar>
      <EventDetail />
      <EmptyState />
    </Sidebar>
  </MainLayout>
  <Timeline />
</App>
```

### State
```js
activeEra        // 'all' | era-id
activeFilters    // { battles: bool, events: bool, persons: bool }
activeEventId    // null | event-id
activeModule     // 'se' | 'jp' | ...
```

---

## Seed-script

`/server/db/seed.js` ska:
1. Läsa `/data/sweden.json`
2. Inserta i rätt ordning: countries → eras → persons → events → event_persons
3. Vara idempotent (kör `ON CONFLICT DO NOTHING`)

---

## Visuell referens

Bifogade HTML-filer visar hur den färdiga prototypen ska se ut:
- `historia_bellum_v2.html` – rätt estetik, Leaflet-karta, fungerande filter och tidslinje
- `historia_bellum_prototype.html` – första iteration (ignorera kartan, titta på sidebar)

**Bygg React-versionen så att den matchar estetiken i v2-filen.**

---

## Routes – rörelseannotering

Händelser som involverar förflyttning har ett valfritt `route`-fält med en array av waypoints. De flesta händelser har det inte – det är förbehållet marscher, fälttåg och flykter där rörelsen i sig är berättelsen.

### JSON-struktur
```json
{
  "id": "se_e010",
  "name": "Tåget över Bält",
  "lat": 55.45,
  "lng": 10.5,
  "route": [
    { "lat": 55.60, "lng": 13.00, "label": "Malmö – armén samlas" },
    { "lat": 55.39, "lng": 10.38, "label": "Fyn – Lilla Bält korsas" },
    { "lat": 55.46, "lng": 11.56, "label": "Sprogø – mitt på Stora Bält" },
    { "lat": 55.64, "lng": 12.08, "label": "Roskilde – Danmark ger upp" }
  ],
  "route_description": "Marschen över isen – ett drag ingen danskt befäl ansåg möjligt"
}
```

`lat/lng` på eventet är alltid destinationen eller huvudplatsen. `route` är den animerade resan dit.

### Databastabell
```sql
CREATE TABLE event_waypoints (
  id          SERIAL PRIMARY KEY,
  event_id    VARCHAR(20) REFERENCES events(id),
  sort_order  INT NOT NULL,
  lat         DECIMAL(9,6) NOT NULL,
  lng         DECIMAL(9,6) NOT NULL,
  label       VARCHAR(200)
);
```

`route_description` lagras som en kolumn på `events`-tabellen:
```sql
ALTER TABLE events ADD COLUMN route_description TEXT;
```

### UI-beteende (viktigt)
- Markers visas som vanligt på kartan
- När användaren klickar ett event **med** route: kartan panorerar och zoomar för att rymma hela routen, sedan animeras en linje längs waypointsen med en riktningspil
- När användaren klickar ett event **utan** route: kartan panorerar till markören, ingen linje
- Använd Leaflet Polyline för linjen + `leaflet-polylinedecorator` för riktningspilen
- Animationen ska vara mjuk och relativt långsam – det är en berättelse, inte en loading-spinner

### Händelser med routes (10 st)
- `se_e006` Slag vid Breitenfeld – Gustav II Adolfs landstigning och marsch in i Tyskland
- `se_e009` Torstensonkriget – blixtkrig genom Jylland
- `se_e010` Tåget över Bält – den ikoniska ismarchen (6 waypoints)
- `se_e015` Slaget vid Narva – Karl XII:s marsch från Stockholm
- `se_e017` Slaget vid Poltava – den ödesdigra marschen in i Ukraina
- `se_e019` Karl XII:s sista resa – Poltava → Osmanska riket → Stralsund → Fredrikshald
- `se_e022` Hattarnas krig – offensiven in i Finland
- `se_e025` Slaget vid Svensksund – flottans rörelse österut
- `se_e027` Finska kriget – ryskt framryckte norrut genom Finland
- `se_e033` Karl Johan invaderar Danmark – invasion av Jylland

---

## Data

`/data/sweden.json` innehåller:
- 34 händelser, 1520–1814 (Stockholms blodbad → Freden i Kiel)
- 18 nyckelpersoner
- 7 eror
- Wikipedia-länk på varje händelse och person
- `notes`-fält på 22 händelser med kontroverser och djupare kontext
- `route`-fält på 10 händelser med waypoints för animerade rörelser på kartan

Används som seed-data för Postgres. Ska inte ändras – om ny data tillkommer skrivs en ny seed-fil eller hanteras via ett admin-gränssnitt senare.

---

## Prioritetsordning för implementation

1. Sätt upp Postgres-schema (`schema.sql`)
2. Skriv seed-script som läser `sweden.json` och populerar databasen
3. Bygg Express API med endpoints för events och persons
4. Sätt upp React + Vite med react-leaflet
5. Fetch events från API och rendera markers på kartan
6. Klick på marker → sidebar visar EventDetail
7. Era-filter och typ-filter (API-queries, inte client-side filtrering)
8. Tidslinje renderas och är klickbar
9. Modulväljare i TopBar
10. Konfliktlager – när flera moduler finns
