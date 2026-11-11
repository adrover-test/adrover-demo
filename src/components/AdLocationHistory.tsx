import { useState } from "react";
import type { Advertisement } from "../lib/advertisements";
import { getCabDrivers } from "../lib/admin";
import { AdRouteMap } from "./AdRouteMap";

type PlaybackRecord = {
  date: string;
  time: string;
  vehicle: string;
  location: string;
  area: string;
  seed: number;
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
      area,
      seed: dayNumber * 1000 + index + 1,
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
  const fleet = getCabDrivers().filter((cab) => cab.status !== "Maintenance");
  const records = getPlaybackRecords(advertisement, selectedDate, fleet);
  const historyDays = Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - index));
    return toDateKey(day);
  });
  const hourlyPlays = Array.from({ length: 12 }, (_, index) => ({
    hour: 8 + index,
    count: records.filter(
      (record) => Number(record.time.slice(0, 2)) === 8 + index,
    ).length,
  }));
  const maxHourly = Math.max(1, ...hourlyPlays.map((entry) => entry.count));
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
      <div className="admin-location-days" role="group" aria-label="Saved days">
        {historyDays.map((day) => (
          <button
            key={day}
            type="button"
            className={`admin-location-day${day === selectedDate ? " admin-location-day-active" : ""}`}
            aria-pressed={day === selectedDate}
            onClick={() => changeDate(day)}
          >
            {dateFromKey(day).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </button>
        ))}
      </div>
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
          <AdRouteMap
            cabs={records}
            selected={selectedRecord?.vehicle}
            onSelect={setSelectedVehicle}
          />
          <p className="admin-location-selected" aria-live="polite">
            Selected car: <strong>{selectedRecord?.vehicle}</strong>
            {" · "}
            {selectedRecord?.location}
            {" · Played at "}
            {selectedRecord?.time}
          </p>
          <div className="admin-location-hourly">
            <h3>Cab activity by hour</h3>
            <div className="admin-location-hourly-bars">
              {hourlyPlays.map((entry) => (
                <div key={entry.hour} className="admin-location-hourly-col">
                  <span
                    className="admin-location-hourly-bar"
                    style={{ height: `${(entry.count / maxHourly) * 100}%` }}
                    title={`${entry.count} cabs at ${entry.hour}:00`}
                  />
                  <small>{String(entry.hour).padStart(2, "0")}</small>
                </div>
              ))}
            </div>
          </div>
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
          No cabs are assigned yet. Locations appear here once the campaign is
          approved and scheduled.
        </p>
      )}
    </section>
  );
}
