import { useEffect, useMemo, useState } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  type Advertisement,
  type AdvertisementStatus,
} from "../lib/advertisements";
import { getAdvertiserAdvertisements } from "../lib/portal";

const filters = [
  "All ads",
  "Active" satisfies AdvertisementStatus,
  "Pending approval" satisfies AdvertisementStatus,
  "Approved" satisfies AdvertisementStatus,
  "Completed" satisfies AdvertisementStatus,
] as const;

type StatusFilter = (typeof filters)[number];
type SortOrder = "recent" | "plays" | "name";

const numberFormat = new Intl.NumberFormat("en-IN");

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function Advertisements() {
  const [filter, setFilter] = useState<StatusFilter>("All ads");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [savedAds, setSavedAds] = useState<Advertisement[]>([]);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      setSavedAds(getAdvertiserAdvertisements());
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Saved demo campaigns could not be loaded.",
      );
    }
  }, []);

  const allAds = savedAds;

  const filteredAds = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return allAds
      .filter(
        (ad) =>
          (filter === "All ads" || ad.status === filter) &&
          (!query ||
            `${ad.name} ${ad.brand} ${ad.area}`
              .toLocaleLowerCase()
              .includes(query)),
      )
      .sort((left, right) => {
        if (sortOrder === "plays") return right.plays - left.plays;
        if (sortOrder === "name") return left.name.localeCompare(right.name);
        return right.submitted.localeCompare(left.submitted);
      });
  }, [allAds, filter, search, sortOrder]);

  const counts = {
    "All ads": allAds.length,
    Active: allAds.filter((ad) => ad.status === "Active").length,
    "Pending approval": allAds.filter((ad) => ad.status === "Pending approval")
      .length,
    Completed: allAds.filter((ad) => ad.status === "Completed").length,
    Approved: allAds.filter((ad) => ad.status === "Approved").length,
  };

  return (
    <section className="wrap dashboard-page advertisements-page">
      <PortalSidebar
        activeSection="advertisements"
        currentPage="advertisements"
      />
      <div className="dashboard-content">
        <header className="dashboard-heading">
          <div>
            <span className="eyebrow">ADVERTISER PORTAL</span>
            <h1>My advertisements</h1>
            <p>Keep track of campaign status and delivery at a glance.</p>
          </div>
          <div className="dashboard-heading-actions">
            <a className="button yellow small" href="create-ad.html">
              Create new ad
            </a>
          </div>
        </header>

      
        {storageError && (
          <p className="error" role="alert">
            {storageError}
          </p>
        )}

        <section
          aria-label="Advertisement summary"
          className="dashboard-stats ad-list-summary"
        >
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon ads" aria-hidden="true">
              AD
            </span>
            <span className="dashboard-stat-label">Total advertisements</span>
            <strong>{allAds.length} campaigns</strong>
            <span className="dashboard-stat-foot">
              {counts.Active} active · {counts["Pending approval"]} pending
            </span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon plays" aria-hidden="true">
              ↗
            </span>
            <span className="dashboard-stat-label">Plays delivered</span>
            <strong>148,250</strong>
            <span className="dashboard-stat-foot">
              Across active and completed campaigns
            </span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon cabs" aria-hidden="true">
              CAB
            </span>
            <span className="dashboard-stat-label">Active cab coverage</span>
            <strong>342 cabs</strong>
            <span className="dashboard-stat-foot">Hyderabad routes</span>
          </article>
        </section>

        <section
          aria-label="Filter advertisements"
          className="ad-list-controls"
        >
          <div
            className="ad-list-filters"
            role="group"
            aria-label="Status filter"
          >
            {filters.map((status) => (
              <button
                aria-pressed={filter === status}
                className={
                  filter === status ? "ad-filter ad-filter-active" : "ad-filter"
                }
                key={status}
                onClick={() => setFilter(status)}
                type="button"
              >
                {status}
                <span>{counts[status]}</span>
              </button>
            ))}
          </div>
          <div className="ad-list-tools">
            <label className="ad-list-search">
              <span aria-hidden="true">⌕</span>
              <span className="visually-hidden">Search advertisements</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaigns or brands"
                type="search"
                value={search}
              />
            </label>
            <label className="ad-list-sort">
              <span className="visually-hidden">Sort advertisements</span>
              <select
                onChange={(event) =>
                  setSortOrder(event.target.value as SortOrder)
                }
                value={sortOrder}
              >
                <option value="recent">Recently created</option>
                <option value="plays">Most plays</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
          </div>
        </section>

        <section
          aria-label={`${filteredAds.length} advertisements`}
          className="ad-list"
        >
          {filteredAds.map((ad, index) => {
            const progress = Math.round((ad.plays / ad.target) * 100);
            return (
              <article
                className="ad-list-card"
                key={ad.id}
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <div className={`ad-list-art ad-list-art-${index % 6}`}>
                  <span aria-hidden="true">{ad.initials}</span>
                  <span className="visually-hidden">
                    Artwork concept for {ad.brand}
                  </span>
                </div>

                <div className="ad-list-campaign">
                  <div className="ad-list-title-row">
                    <h2>{ad.name}</h2>
                    <span
                      className={`campaign-status campaign-status-${ad.status
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {ad.status}
                    </span>
                  </div>
                  <p>{ad.brand}</p>
                  <span className="ad-list-area">{ad.area}</span>
                  <span className="ad-list-date">
                    Submitted {formatDate(ad.submitted)}
                  </span>
                </div>

                <div className="ad-list-delivery">
                  <div className="ad-list-delivery-heading">
                    <span>Plays delivered</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div
                    aria-label={`${progress}% of play target delivered`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={progress}
                    className="ad-list-progress"
                    role="progressbar"
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <strong className="ad-list-play-count">
                    {numberFormat.format(ad.plays)}
                    <span>
                      {" "}
                      / {numberFormat.format(ad.target)} target plays
                    </span>
                  </strong>
                  <span className="ad-list-play-caption">
                    {ad.status === "Completed"
                      ? "Final delivery"
                      : ad.status === "Pending approval"
                        ? "Starts after review"
                        : ad.status === "Approved"
                          ? "Awaiting payment/scheduling"
                          : "Delivery progress"}
                  </span>
                </div>

                <div className="ad-list-run-state">
                  <span className="ad-list-run-label">
                    {ad.status === "Pending approval"
                      ? "Review status"
                      : ad.status === "Completed"
                        ? "Campaign status"
                        : "Campaign period"}
                  </span>
                  <strong>
                    {ad.status === "Pending approval"
                      ? "In review"
                      : ad.status === "Completed"
                        ? "Completed"
                        : ad.status === "Approved"
                          ? "Approved"
                          : "Active"}
                  </strong>
                  <span>
                    {ad.status === "Active"
                      ? ad.dates
                      : ad.status === "Pending approval" ||
                          ad.status === "Approved"
                        ? "Start date to be confirmed"
                        : ad.dates}
                  </span>
                  <span className="ad-list-run-detail">
                    {ad.status === "Active"
                      ? `${ad.cabs} cabs · ${ad.fleet}`
                      : ad.status === "Pending approval" ||
                          ad.status === "Approved"
                        ? `${ad.cabs} cabs requested · not confirmed`
                        : `${ad.cabs} active cabs`}
                  </span>
                </div>

                <a
                  className="ad-list-view"
                  href={`view-ad.html?id=${encodeURIComponent(ad.id)}`}
                >
                  View details
                </a>
              </article>
            );
          })}
          {filteredAds.length === 0 && (
            <div className="ad-list-empty">
              <h2>No matching advertisements</h2>
              <p>Try a different search or status filter.</p>
              <button
                className="text-link"
                onClick={() => {
                  setFilter("All ads");
                  setSearch("");
                }}
                type="button"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
        <div className="ad-list-footer">
          Showing {filteredAds.length} of {allAds.length} advertisements
          <a href="create-ad.html">Plan a new campaign →</a>
        </div>
      </div>
    </section>
  );
}
