import { useState } from "react";
import type { Advertisement } from "../lib/advertisements";
import { getCabDrivers } from "../lib/admin";

type PlaybackRecord = {
  date: string;
  time: string;
  vehicle: string;
  location: string;
  x: number;
  y: number;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function getDayNumber(date: Date) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

function getPlaybackRecords(
  advertisement: Advertisement,
  selectedDate: string,
  fleet: ReturnType<typeof getCabDrivers>,
): PlaybackRecord[] {
  const dayNumber = getDayNumber(dateFromKey(selectedDate));
  const areas = advertisement.area
    .split(/\s*&\s*/)
    .map((area) => area.trim())
    .filter(Boolean);
  const routeAreas = areas.length ? areas : ["Hyderabad"];
  const cabCount = Math.min(Math.max(Math.floor(advertisement.cabs), 0), 500);
  const cabsPerArea = Math.ceil(cabCount / routeAreas.length);
  const columns = Math.ceil(Math.sqrt(cabsPerArea));
  const rows = Math.ceil(cabsPerArea / columns);
  const areaWidth = Math.min(28, 80 / routeAreas.length);

  return Array.from({ length: cabCount }, (_, index) => {
    const areaIndex = (index + dayNumber) % routeAreas.length;
    const area = routeAreas[areaIndex];
    const positionInArea =
      (Math.floor(index / routeAreas.length) + dayNumber) % cabsPerArea;
    const areaSpacing = 80 / routeAreas.length;
    const areaLeft =
      10 + areaIndex * areaSpacing + (areaSpacing - areaWidth) / 2;
    const x = areaLeft + ((positionInArea % columns) / columns) * areaWidth;
    const y = 20 + (Math.floor(positionInArea / columns) / rows) * 60;
    const minutes = 8 * 60 + ((index * 47 + dayNumber * 11) % (11 * 60));
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");

    return {
      date: selectedDate,
      time: `${hour}:${minute}`,
      vehicle:
        fleet[index]?.car ?? `DEMO-CAB-${String(index + 1).padStart(3, "0")}`,
      location: `${area} · Route segment ${((index + dayNumber) % 4) + 1}`,
      x,
      y,
    };
  });
}

export function AdLocationHistory({
  advertisement,
}: {
  advertisement: Advertisement;
}) {
  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const previousDate = new Date();
  previousDate.setDate(previousDate.getDate() - 13);
  const minDate = toDateKey(previousDate);
  const areas = advertisement.area
    .split(/\s*&\s*/)
    .map((area) => area.trim())
    .filter(Boolean);
  const routeAreas = areas.length ? areas : ["Hyderabad"];
  const fleet = getCabDrivers().filter((cab) => cab.status !== "Maintenance");
  const records = getPlaybackRecords(advertisement, selectedDate, fleet);
  const selectedRecord =
    records.find((record) => record.vehicle === selectedVehicle) ?? records[0];

  function changeDate(value: string) {
    if (!value) return;
    setSelectedDate(value);
    setSelectedVehicle("");
  }

  return (
    <section
      className="dashboard-panel admin-ad-location-history"
      aria-labelledby="ad-location-heading"
    >
      <div className="dashboard-panel-heading">
        <div>
          <h2 id="ad-location-heading">Car playback locations</h2>
          <p>
            Map of the campaign cabs that played this ad on the selected date.
          </p>
        </div>
        <label className="admin-location-date" htmlFor="ad-location-date">
          Filter by date
          <input
            id="ad-location-date"
            type="date"
            min={minDate}
            max={todayKey}
            value={selectedDate}
            onChange={(event) => changeDate(event.target.value)}
          />
        </label>
      </div>
      <p className="admin-location-note" role="note">
        Simulated route locations are calculated from the campaign cab count and
        target areas. They are not live GPS or verified playback telemetry.
      </p>
      <p className="admin-location-count" role="status" aria-live="polite">
        {records.length} campaign cabs ·{" "}
        {dateFromKey(selectedDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
      {records.length > 0 ? (
        <>
          <div
            className="admin-location-map"
            role="group"
            aria-label={`Schematic playback map for ${selectedDate}`}
          >
            <svg
              className="admin-location-map-art"
              viewBox="0 0 1000 500"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M-20 390 C140 320 180 360 310 270 S520 180 650 250 840 330 1020 140" />
              <path d="M80 520 C190 390 260 360 340 260 S500 100 650 -20" />
              <path d="M230 -20 C280 110 390 170 470 250 S650 400 850 520" />
              <path d="M-20 170 C170 230 280 210 430 140 S730 80 1020 240" />
              <path d="M600 520 C620 410 720 340 790 250 S850 110 930 -20" />
            </svg>
            {routeAreas.map((area, index) => (
              <span
                key={`${area}-${index}`}
                className="admin-location-map-label"
                style={{
                  left: `${10 + index * (80 / routeAreas.length)}%`,
                }}
              >
                {area}
              </span>
            ))}
            {records.map((record) => (
              <button
                key={record.vehicle}
                className={`admin-location-marker${record.vehicle === selectedRecord?.vehicle ? " admin-location-marker-selected" : ""}`}
                style={{ left: `${record.x}%`, top: `${record.y}%` }}
                data-vehicle={record.vehicle}
                data-x={record.x}
                data-y={record.y}
                aria-label={`${record.vehicle}: ${record.location}, played at ${record.time}`}
                aria-pressed={record.vehicle === selectedRecord?.vehicle}
                title={`${record.vehicle} · ${record.location} · ${record.time}`}
                onClick={() => setSelectedVehicle(record.vehicle)}
                type="button"
              >
                <span aria-hidden="true" />
              </button>
            ))}
            <span className="admin-location-map-caption">
              {records.length} car markers · schematic route map
            </span>
          </div>
          <p className="admin-location-selected" aria-live="polite">
            Selected car: <strong>{selectedRecord?.vehicle}</strong>
            {" · "}
            {selectedRecord?.location}
            {" · Played at "}
            {selectedRecord?.time}
          </p>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table admin-location-table">
              <thead>
                <tr>
                  <th scope="col">Car</th>
                  <th scope="col">Location</th>
                  <th scope="col">Screen</th>
                  <th scope="col">Play time</th>
                </tr>
              </thead>
              <tbody id="ad-location-records">
                {records.map((record) => (
                  <tr
                    key={record.vehicle}
                    className={
                      record.vehicle === selectedRecord?.vehicle
                        ? "admin-location-row-selected"
                        : undefined
                    }
                  >
                    <td>{record.vehicle}</td>
                    <td>{record.location}</td>
                    <td>In-car display</td>
                    <td>{record.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="admin-location-empty">
          No campaign cabs are assigned to show on the map.
        </p>
      )}
    </section>
  );
}
