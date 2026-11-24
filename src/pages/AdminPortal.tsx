import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  getAdminClients,
  getAdminEnquiries,
  getAdminDashboardSummary,
  getAdminClientsFromApi,
  getAdminEnquiriesFromApi,
} from "../lib/admin";
import { CreateDriver } from "../components/CreateDriver";
import { EditDriver } from "../components/EditDriver";
import { DriverOperations } from "../components/DriverOperations";
import { listDrivers } from "../lib/driverAdminApi";
import type { CabDriver } from "../lib/admin";
import { approveAdvertisement, getAllAdvertisements } from "../lib/portal";
import type { Advertisement } from "../lib/advertisements";
import { moneyFormat, numberFormat } from "../lib/campaign";
import { ViewAd } from "./ViewAd";
import { AdminCharts } from "../components/AdminCharts";
import { EnquiryFollowUp } from "../components/EnquiryFollowUp";
import { useClientResource } from "../lib/useClientResource";
import {
  UnfinishedRegistrations,
  ClientRegistrationFollowUp,
} from "../components/RegistrationFollowUps";
import { PaginatedList } from "../components/PaginatedList";

const sections = [
  ["dashboard", "Overview"],
  ["clients", "Clients"],
  ["unfinished-registrations", "Unfinished registrations"],
  ["enquiries", "Enquiries"],
  ["cabs", "Cabs & drivers"],
  ["approvals", "Ad approvals"],
] as const;

function adminLink(section: string, id?: string) {
  const params = new URLSearchParams({ section });
  if (id) params.set("id", id);
  return `admin.html?${params}`;
}

function loadData() {
  try {
    return {
      data: {
        clients: getAdminClients(),
        enquiries: getAdminEnquiries(),
        ads: getAllAdvertisements(),
      },
      error: "",
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Admin data could not be loaded.",
    };
  }
}

function ApprovalForm({
  ad,
  onApproved,
}: {
  ad: Advertisement;
  onApproved: () => void;
}) {
  const [plays, setPlays] = useState(String(ad.target));
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) {
      setError("Confirm that you have reviewed the campaign before approval.");
      return;
    }
    try {
      approveAdvertisement(ad.id, plays, amount);
      onApproved();
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : "The approval could not be saved.",
      );
    }
  }

  return (
    <section
      className="dashboard-panel admin-approval-panel"
      aria-labelledby="approval-heading"
    >
      <div className="dashboard-panel-heading">
        <div>
          <h2 id="approval-heading">Review & approve</h2>
          <p>Set the agreed delivery target and total campaign amount.</p>
        </div>
        <span className="campaign-status campaign-status-pending-approval">
          Pending approval
        </span>
      </div>
      <p className="fine">{ad.note}</p>
      <form onSubmit={submit}>
        <div className="fields">
          <div className="field">
            <label htmlFor="approval-plays">Assigned plays *</label>
            <input
              id="approval-plays"
              type="number"
              min="1"
              step="1"
              required
              value={plays}
              onChange={(event) => setPlays(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="approval-amount">
              Total campaign amount (INR) *
            </label>
            <input
              id="approval-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="For example, 12500.00"
            />
          </div>
        </div>
        <label className="admin-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            required
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>
            I have reviewed the overview. This records approval only; no payment
            is collected and no campaign goes live.
          </span>
        </label>
        <p className="error" role="alert">
          {error}
        </p>
        <button className="button yellow small" type="submit">
          Approve ad
        </button>
      </form>
    </section>
  );
}

export function AdminPortal() {
  const [result, setResult] = useState(loadData);
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") ?? "dashboard";
  const id = params.get("id");
  const loadDashboardSummary = useCallback(
    () =>
      section === "dashboard"
        ? getAdminDashboardSummary()
        : Promise.resolve(null),
    [section],
  );
  const loadApiClients = useCallback(
    () =>
      section === "clients" || section === "client"
        ? getAdminClientsFromApi()
        : Promise.resolve(null),
    [section],
  );
  const {
    data: dashboardSummary,
    error: dashboardSummaryError,
    refresh: refreshDashboardSummary,
  } = useClientResource(loadDashboardSummary);
  const {
    data: apiClients,
    loading: clientsLoading,
    error: clientsError,
    refresh: refreshClients,
  } = useClientResource(loadApiClients);
  const loadApiEnquiries = useCallback(
    () =>
      section === "enquiries"
        ? getAdminEnquiriesFromApi()
        : Promise.resolve(null),
    [section],
  );
  const {
    data: apiEnquiries,
    loading: enquiriesLoading,
    error: enquiriesError,
    refresh: refreshEnquiries,
  } = useClientResource(loadApiEnquiries);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [liveCabs, setLiveCabs] = useState<CabDriver[] | null>(null);
  const [cabsError, setCabsError] = useState("");
  const [enquiryFilter, setEnquiryFilter] = useState<
    "All" | "Awaiting reply" | "Replied"
  >("All");
  const activeSection =
    section === "client"
      ? "clients"
      : section === "cab"
        ? "cabs"
        : section === "ad"
          ? "approvals"
          : section;
  const { data, error } = result;
  function refreshCabs() {
    if (section !== "cab" && section !== "cabs") return;
    listDrivers().then(
      (drivers) => {
        setLiveCabs(drivers);
        setCabsError("");
      },
      (loadError) => {
        setLiveCabs(null);
        setCabsError(
          loadError instanceof Error
            ? loadError.message
            : "The driver directory could not be loaded.",
        );
      },
    );
  }
  useEffect(refreshCabs, []);
  const cabs = liveCabs ?? [];
  const query = search.trim().toLowerCase();
  const matches = (...values: string[]) =>
    values.join(" ").toLowerCase().includes(query);
  const enquiries = apiEnquiries ?? [];
  const enquiryReplyStatus = (entry: (typeof enquiries)[number]) =>
    entry.update?.status ?? entry.replyStatus ?? "Awaiting reply";
  const enquiryCounts = {
    All: enquiries.length,
    "Awaiting reply": enquiries.filter(
      (entry) => enquiryReplyStatus(entry) === "Awaiting reply",
    ).length,
    Replied: enquiries.filter(
      (entry) => enquiryReplyStatus(entry) === "Replied",
    ).length,
  };
  const filteredEnquiries = enquiries
    .filter(
      (entry) =>
        (enquiryFilter === "All" ||
          enquiryReplyStatus(entry) === enquiryFilter) &&
        matches(entry.name, entry.business, entry.email, entry.message),
    )
    .sort(
      (left, right) =>
        Number(enquiryReplyStatus(left) === "Replied") -
        Number(enquiryReplyStatus(right) === "Replied"),
    );
  const clients = apiClients ?? [];
  const filteredClients = clients.filter((entry) =>
    matches(entry.name, entry.email, entry.contact),
  );
  const filteredCabs = cabs.filter((cab) =>
    matches(cab.driver, cab.car, cab.phone, cab.email, cab.area, cab.screenId),
  );
  const ad = data?.ads.find((entry) => entry.id === id);
  const client = clients.find((entry) => entry.id === id);
  const cab = cabs.find((entry) => entry.id === id);
  const pending =
    data?.ads.filter((entry) => entry.status === "Pending approval") ?? [];
  const title =
    section === "client"
      ? (client?.name ?? "Client not found")
      : section === "cab"
        ? (cab?.driver ?? "Cab driver not found")
        : (sections.find(([key]) => key === section)?.[1] ?? "Page not found");

  function adTable(
    ads: Advertisement[],
    emptyMessage = "No advertisements match this view.",
    initialPageSize = 10,
  ) {
    return (
      <PaginatedList
        rows={ads}
        label="Advertisements"
        filterKey={`${section}:${id ?? ""}:${query}`}
        initialPageSize={initialPageSize}
      >
        {(pageAds) => (
          <div className="dashboard-table-scroll">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th scope="col">Advertisement</th>
                  <th scope="col">Client / brand</th>
                  <th scope="col">Status</th>
                  <th scope="col">Play target</th>
                  <th scope="col">Total amount</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {pageAds.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row">
                      <strong>{entry.name}</strong>
                      <span>{entry.area}</span>
                    </th>
                    <td>{entry.brand}</td>
                    <td>
                      <span
                        className={`campaign-status campaign-status-${entry.status.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td>{numberFormat.format(entry.target)}</td>
                    <td>
                      {entry.approval
                        ? moneyFormat.format(entry.approval.amount)
                        : "Not assigned"}
                    </td>
                    <td>
                      <a
                        className="button ghost small"
                        aria-label={`View ad ${entry.name}`}
                        href={adminLink("ad", entry.id)}
                      >
                        View details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ads.length === 0 && <p className="admin-empty">{emptyMessage}</p>}
          </div>
        )}
      </PaginatedList>
    );
  }

  return (
    <section className="wrap dashboard-page admin-page">
      <aside className="dashboard-sidebar" aria-label="Website admin">
        <span className="dashboard-sidebar-label">WEBSITE ADMIN</span>
        <nav className="dashboard-nav" aria-label="Admin navigation">
          {sections.map(([key, label]) => (
            <a
              key={key}
              href={adminLink(key)}
              className={
                key === activeSection ? "dashboard-nav-active" : undefined
              }
              aria-current={key === activeSection ? "page" : undefined}
            >
              {label}
              {key === "approvals" && data && (
                <span className="admin-nav-count">{pending.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="admin-sidebar-note">
          <strong>Operations workspace</strong>
          <p>Clients, fleet and campaign approvals in one place.</p>
        </div>
      </aside>
      <div className="dashboard-content">
        {section !== "ad" && (
          <header className="dashboard-heading">
            <div>
              <span className="eyebrow">ADROVER OPERATIONS</span>
              <h1>{title}</h1>
              <p>
                Manage your client journey, campaign reviews and fleet
                information.
              </p>
            </div>
          </header>
        )}
        {status && (
          <p className="admin-success" role="status">
            {status}
          </p>
        )}
        {error && (
          <div className="dashboard-panel">
            <h1>Unable to load admin data</h1>
            <p className="error" role="alert">
              {error}
            </p>
            <button
              className="button ghost small"
              onClick={() => {
                setResult(loadData());
                refreshDashboardSummary();
              }}
            >
              Retry loading
            </button>
          </div>
        )}
        {data && (
          <>
            {section === "dashboard" && (
              <>
                <section className="dashboard-stats" aria-label="Admin summary">
                  {[
                    [
                      "Clients present",
                      dashboardSummary
                        ? numberFormat.format(dashboardSummary.clientsPresent)
                        : "—",
                      "clients",
                      "View clients",
                    ],
                    [
                      "Enquiries",
                      dashboardSummary
                        ? numberFormat.format(dashboardSummary.enquiries)
                        : "—",
                      "enquiries",
                      "View enquiries",
                    ],
                    [
                      "Cabs in directory",
                      dashboardSummary
                        ? numberFormat.format(dashboardSummary.cabsInDirectory)
                        : "—",
                      "cabs",
                      "View cabs",
                    ],
                    [
                      "Ads awaiting approval",
                      dashboardSummary
                        ? numberFormat.format(
                            dashboardSummary.adsAwaitingApproval,
                          )
                        : "—",
                      "approvals",
                      "Review ads",
                    ],
                  ].map(([label, count, destination, link]) => (
                    <article className="dashboard-stat" key={label}>
                      <span className="dashboard-stat-label">{label}</span>
                      <strong>{count}</strong>
                      <a
                        className="dashboard-profile-link"
                        href={adminLink(String(destination))}
                      >
                        {link} &rarr;
                      </a>
                    </article>
                  ))}
                </section>
                <section
                  className="admin-totals"
                  aria-label="Advertisement and revenue totals"
                >
                  <article className="dashboard-stat">
                    <span className="dashboard-stat-label">Total ads</span>
                    <strong>
                      {dashboardSummary
                        ? numberFormat.format(dashboardSummary.totalAds)
                        : "—"}
                    </strong>
                    <span className="dashboard-stat-foot">
                      All clients and campaign statuses
                    </span>
                  </article>
                  <article className="dashboard-stat">
                    <span className="dashboard-stat-label">Total ad plays</span>
                    <strong>
                      {dashboardSummary
                        ? numberFormat.format(dashboardSummary.totalAdPlays)
                        : "—"}
                    </strong>
                    <span className="dashboard-stat-foot">
                      Delivered plays across all advertisements
                    </span>
                  </article>
                  <article className="dashboard-stat">
                    <span className="dashboard-stat-label">
                      Total revenue till date
                    </span>
                    <strong>
                      {dashboardSummary
                        ? moneyFormat.format(
                            dashboardSummary.totalRevenueTillDate,
                          )
                        : "—"}
                    </strong>
                    <span className="dashboard-stat-foot">
                      Collected campaign payments minus refunds
                    </span>
                  </article>
                </section>
                {dashboardSummaryError && (
                  <p className="error" role="alert">
                    {dashboardSummaryError}{" "}
                    <button
                      className="button ghost small"
                      onClick={refreshDashboardSummary}
                    >
                      Retry summary
                    </button>
                  </p>
                )}
                <section className="dashboard-panel admin-section">
                  <AdminCharts />
                </section>
                <section className="dashboard-panel admin-section">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Ready for review</h2>
                      <p>
                        Open each campaign before assigning plays and the total
                        amount.
                      </p>
                    </div>
                    <a href={adminLink("approvals")} className="text-link">
                      All approvals
                    </a>
                  </div>
                  {adTable(pending, "No advertisements match this view.", 5)}
                </section>
                <section className="dashboard-panel admin-section">
                  <h2>From enquiry to campaign</h2>
                  <ol className="admin-workflow">
                    <li>Review client requirements</li>
                    <li>Check campaign overview</li>
                    <li>Assign plays & amount</li>
                    <li>Approve for payment / scheduling</li>
                  </ol>
                </section>
              </>
            )}
            {["clients", "enquiries", "cabs", "approvals"].includes(
              section,
            ) && (
              <div className="field admin-search">
                <label htmlFor="admin-search">
                  Search {title.toLowerCase()}
                </label>
                <input
                  id="admin-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, brand or contact"
                />
              </div>
            )}
            {section === "clients" && (
              <section className="dashboard-panel" aria-label="Clients">
                {clientsLoading && (
                  <p role="status">Loading clients from the backend...</p>
                )}
                {clientsError && (
                  <p className="error" role="alert">
                    {clientsError}{" "}
                    <button
                      className="button ghost small"
                      onClick={refreshClients}
                    >
                      Retry clients
                    </button>
                  </p>
                )}
                <PaginatedList
                  rows={filteredClients}
                  label="Clients"
                  filterKey={query}
                >
                  {(pageClients) => (
                    <div className="dashboard-table-scroll">
                      <table className="dashboard-table admin-table admin-clients-table">
                        <thead>
                          <tr>
                            {[
                              "Client / business",
                              "Contact name",
                              "Email",
                              "Phone",
                              "Advertisements",
                              "Details",
                            ].map((label) => (
                              <th scope="col" key={label}>
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageClients.map((entry) => (
                            <tr key={entry.id}>
                              <th scope="row">
                                <strong>{entry.name}</strong>
                                <span>{entry.area}</span>
                              </th>
                              <td>{entry.contact}</td>
                              <td>{entry.email}</td>
                              <td>{entry.phone}</td>
                              <td>
                                {numberFormat.format(
                                  entry.reportedAdsCount ?? entry.ads.length,
                                )}
                              </td>
                              <td>
                                <a
                                  className="button ghost small"
                                  href={adminLink("client", entry.id)}
                                >
                                  View client
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </PaginatedList>
                {!clientsLoading &&
                  !clientsError &&
                  !clients.some((entry) =>
                    matches(entry.name, entry.email, entry.contact),
                  ) && (
                    <p className="admin-empty">No clients match your search.</p>
                  )}
              </section>
            )}
            {section === "client" &&
              (client ? (
                <>
                  <a className="text-link" href={adminLink("clients")}>
                    &larr; All clients
                  </a>
                  <section
                    className="dashboard-panel admin-section"
                    aria-labelledby="client-profile-heading"
                  >
                    <div className="dashboard-panel-heading">
                      <div>
                        <h2 id="client-profile-heading">Advertiser profile</h2>
                        <p>
                          {client.profileSaved
                            ? "Business and contact details from the advertiser's saved profile."
                            : "No saved advertiser profile. Available client information is shown below."}
                        </p>
                      </div>
                    </div>
                    <dl className="view-ad-meta">
                      {[
                        ["Account name", client.contact],
                        ["Business name", client.name],
                        ["Business email", client.email],
                        ["Phone number", client.phone],
                        ["Primary service area", client.area],
                        ["Advertiser type", client.advertiserType],
                        ["Sign-in email", client.signInEmail],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                  <section className="dashboard-panel admin-section">
                    <h2>Client advertisements</h2>
                    {adTable(
                      client.ads,
                      (client.reportedAdsCount ?? client.ads.length) > 0
                        ? `The API reports ${numberFormat.format(client.reportedAdsCount ?? 0)} advertisements, but does not include their details here.`
                        : "No advertisements are associated with this client.",
                    )}
                  </section>
                  <section className="dashboard-panel admin-section">
                    <ClientRegistrationFollowUp
                      clientId={client.id}
                      email={client.email}
                      phone={client.phone}
                    />
                  </section>
                </>
              ) : clientsLoading ? (
                <p role="status">Loading client details...</p>
              ) : clientsError ? (
                <p className="error" role="alert">
                  {clientsError}
                </p>
              ) : (
                <p className="error" role="alert">
                  Select a client from the clients list.
                </p>
              ))}
            {section === "unfinished-registrations" && (
              <UnfinishedRegistrations />
            )}
            {section === "enquiries" && (
              <section
                className="dashboard-panel admin-enquiries"
                aria-label="Enquiry list"
              >
                {enquiriesLoading && (
                  <p role="status">Loading enquiries from the backend...</p>
                )}
                {enquiriesError && (
                  <p className="error" role="alert">
                    {enquiriesError}{" "}
                    <button
                      className="button ghost small"
                      onClick={refreshEnquiries}
                    >
                      Retry enquiries
                    </button>
                  </p>
                )}
                <div
                  className="enquiry-summary"
                  role="group"
                  aria-label="Filter enquiries by reply status"
                >
                  {(["All", "Awaiting reply", "Replied"] as const).map(
                    (filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={`enquiry-summary-button ${filter === "Replied" ? "enquiry-summary-replied" : filter === "Awaiting reply" ? "enquiry-summary-awaiting" : ""}`}
                        aria-pressed={enquiryFilter === filter}
                        onClick={() => setEnquiryFilter(filter)}
                      >
                        <span>
                          {filter === "All" ? "Total enquiries" : filter}
                        </span>
                        <strong>
                          {numberFormat.format(enquiryCounts[filter])}
                        </strong>
                      </button>
                    ),
                  )}
                </div>
                <p className="fine">
                  Counts include all enquiries, independent of search. Select a
                  count to filter the list.
                </p>
                <p role="status" className="fine">
                  Showing {numberFormat.format(filteredEnquiries.length)} of{" "}
                  {numberFormat.format(enquiryCounts.All)} enquiries
                  {enquiryFilter !== "All" ? ` · ${enquiryFilter}` : ""}
                  {query ? ` · Search: ${search.trim()}` : ""}
                </p>
                {(enquiryFilter !== "All" || query) && (
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => {
                      setEnquiryFilter("All");
                      setSearch("");
                    }}
                  >
                    Clear enquiry filters
                  </button>
                )}
                <p className="fine">
                  Internal statuses and notes are shared only within this
                  browser. Marking Replied does not send an email.
                </p>
                <PaginatedList
                  rows={filteredEnquiries}
                  label="Enquiries"
                  filterKey={`${query}:${enquiryFilter}`}
                >
                  {(pageEnquiries) => (
                    <div className="dashboard-table-scroll">
                      <table className="dashboard-table admin-table">
                        <thead>
                          <tr>
                            {[
                              "Business / name",
                              "Received",
                              "Email",
                              "Phone",
                              "Objective",
                              "Requirements",
                              "Reply status",
                              "Internal notes",
                            ].map((label) => (
                              <th scope="col" key={label}>
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageEnquiries.map((entry) => (
                            <tr key={entry.id}>
                              <th scope="row">
                                <strong>{entry.business}</strong>
                                <span>{entry.name}</span>
                              </th>
                              <td>
                                {new Date(entry.createdAt).toLocaleDateString(
                                  "en-IN",
                                )}
                              </td>
                              <td>{entry.email}</td>
                              <td>{entry.phone || "Not provided"}</td>
                              <td>{entry.goal}</td>
                              <td className="admin-enquiry-message">
                                {entry.message ||
                                  "No additional requirements provided."}
                              </td>
                              <td>
                                <span
                                  className={`enquiry-reply-status ${(entry.update?.status ?? entry.replyStatus) === "Replied" ? "enquiry-replied" : "enquiry-awaiting"}`}
                                >
                                  {entry.update?.status ??
                                    entry.replyStatus ??
                                    "Awaiting reply"}
                                </span>
                              </td>
                              <td>
                                <EnquiryFollowUp
                                  id={entry.id}
                                  business={entry.business}
                                  update={entry.update}
                                  replyStatus={entry.replyStatus}
                                  onSaved={() => {
                                    setResult(loadData());
                                    refreshEnquiries();
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </PaginatedList>
                {!enquiriesLoading &&
                  !enquiriesError &&
                  filteredEnquiries.length === 0 && (
                    <p className="admin-empty">
                      {enquiryCounts.All === 0
                        ? "No enquiries yet."
                        : enquiryFilter === "All"
                          ? "No enquiries match your search."
                          : "No enquiries match the selected reply status and search."}
                    </p>
                  )}
              </section>
            )}
            {section === "cabs" && (
              <section className="dashboard-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <h2>Cab & driver directory</h2>
                    <p>
                      Driver and vehicle records from the directory. This is not
                      live fleet telemetry.
                    </p>
                  </div>
                </div>
                <CreateDriver
                  onCreated={() => {
                    setSearch("");
                    setResult(loadData());
                    refreshCabs();
                  }}
                />
                {cabsError && (
                  <p className="error" role="alert">
                    {cabsError}
                  </p>
                )}
                <PaginatedList
                  rows={filteredCabs}
                  label="Cabs and drivers"
                  filterKey={query}
                >
                  {(pageCabs) => (
                    <div className="dashboard-table-scroll">
                      <table className="dashboard-table admin-table">
                        <thead>
                          <tr>
                            {[
                              "Driver / cab ID",
                              "Car number / model",
                              "Contact details",
                              "Service area",
                              "Screen ID",
                              "Availability",
                              "Details",
                            ].map((label) => (
                              <th key={label} scope="col">
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageCabs.map((cab) => (
                            <tr key={cab.id}>
                              <th scope="row">
                                <strong>{cab.driver}</strong>
                                <span>{cab.id}</span>
                              </th>
                              <td>
                                <strong>{cab.car}</strong>
                                <br />
                                {cab.model}
                              </td>
                              <td>
                                {cab.phone}
                                <br />
                                {cab.email}
                              </td>
                              <td>{cab.area}</td>
                              <td>{cab.screenId || "Not assigned"}</td>
                              <td>{cab.status}</td>
                              <td>
                                <a
                                  className="button ghost small"
                                  href={adminLink("cab", cab.id)}
                                  aria-label={`View details for ${cab.driver}`}
                                >
                                  View details
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {liveCabs &&
                        !cabs.some((cab) =>
                          matches(
                            cab.driver,
                            cab.car,
                            cab.phone,
                            cab.email,
                            cab.area,
                            cab.screenId,
                          ),
                        ) && (
                          <p className="admin-empty">
                            No cabs match your search.
                          </p>
                        )}
                    </div>
                  )}
                </PaginatedList>
              </section>
            )}
            {section === "cab" && (
              <>
                <a className="text-link" href={adminLink("cabs")}>
                  &larr; All cabs & drivers
                </a>
                {cab ? (
                  <section
                    className="dashboard-panel admin-section"
                    aria-label="Cab driver details"
                  >
                    <div className="dashboard-panel-heading">
                      <div>
                        <h2>Driver & vehicle details</h2>
                        <p>Driver and vehicle details from the directory.</p>
                      </div>
                      <span className="dashboard-panel-tag">{cab.status}</span>
                    </div>
                    <dl className="view-ad-meta">
                      {[
                        ["Driver name", cab.driver],
                        ["Cab ID", cab.id],
                        ["Car number", cab.car],
                        ["Vehicle model", cab.model],
                        ["Phone number", cab.phone],
                        ["Email address", cab.email],
                        ["Service area", cab.area],
                        ["Screen ID", cab.screenId || "Not assigned"],
                        ["Availability", cab.status],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <EditDriver
                      key={cab.id + cab.screenId + cab.status}
                      driver={cab}
                      onSaved={() => {
                        setResult(loadData());
                        refreshCabs();
                      }}
                    />
                    <DriverOperations key={cab.id} driverId={cab.id} />
                  </section>
                ) : cabsError ? (
                  <p className="error" role="alert">
                    {cabsError}
                  </p>
                ) : !liveCabs ? (
                  <p role="status">Loading driver details...</p>
                ) : (
                  <p className="error" role="alert">
                    This cab driver was not found. Select a record from the cab
                    directory.
                  </p>
                )}
              </>
            )}
            {section === "approvals" && (
              <section className="dashboard-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <h2>Approval queue</h2>
                    <p>
                      {pending.length} pending &middot; Approval does not start
                      delivery or collect payment.
                    </p>
                  </div>
                </div>
                {adTable(
                  data.ads.filter(
                    (entry) =>
                      (entry.status === "Pending approval" ||
                        entry.status === "Approved") &&
                      matches(entry.name, entry.brand, entry.status),
                  ),
                )}
              </section>
            )}
            {section === "ad" &&
              (ad ? (
                <>
                  <a
                    href={adminLink(
                      "client",
                      clients.find((entry) =>
                        entry.ads.some((item) => item.id === ad.id),
                      )?.id,
                    )}
                    className="text-link"
                  >
                    &larr; Client details
                  </a>
                  <ViewAd admin advertisement={ad} />
                  {ad.status === "Pending approval" && (
                    <ApprovalForm
                      key={ad.id}
                      ad={ad}
                      onApproved={() => {
                        setResult(loadData());
                        setStatus(
                          "Ad approved. Awaiting payment/scheduling; no charges collected.",
                        );
                      }}
                    />
                  )}
                </>
              ) : (
                <section className="dashboard-panel">
                  <h1>Advertisement not found</h1>
                  <a href={adminLink("approvals")}>Back to approvals</a>
                </section>
              ))}
            {![
              "dashboard",
              "clients",
              "client",
              "enquiries",
              "cabs",
              "cab",
              "approvals",
              "ad",
            ].includes(section) && (
              <a className="button ghost small" href="admin.html">
                Return to admin overview
              </a>
            )}
          </>
        )}
      </div>
    </section>
  );
}
