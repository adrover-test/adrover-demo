import { useState, type FormEvent } from "react";
import {
  getCabDrivers,
  getAdminClients,
  getAdminEnquiries,
} from "../lib/admin";
import { CreateDriver } from "../components/CreateDriver";
import { approveAdvertisement, getAllAdvertisements } from "../lib/portal";
import type { Advertisement } from "../lib/advertisements";
import { moneyFormat, numberFormat } from "../lib/campaign";
import { ViewAd } from "./ViewAd";
import { getCollectedCampaignRevenue } from "../lib/billing";
import { AdminCharts } from "../components/AdminCharts";
import { EnquiryFollowUp } from "../components/EnquiryFollowUp";

const sections = [
  ["dashboard", "Overview"],
  ["clients", "Clients"],
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
        cabs: getCabDrivers(),
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [enquiryFilter, setEnquiryFilter] = useState<
    "All" | "Awaiting reply" | "Replied"
  >("All");
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") ?? "dashboard";
  const id = params.get("id");
  const activeSection =
    section === "client"
      ? "clients"
      : section === "cab"
        ? "cabs"
        : section === "ad"
          ? "approvals"
          : section;
  const { data, error } = result;
  const query = search.trim().toLowerCase();
  const matches = (...values: string[]) =>
    values.join(" ").toLowerCase().includes(query);
  const enquiryCounts = {
    All: data?.enquiries.length ?? 0,
    "Awaiting reply":
      data?.enquiries.filter((entry) => entry.update?.status !== "Replied")
        .length ?? 0,
    Replied:
      data?.enquiries.filter((entry) => entry.update?.status === "Replied")
        .length ?? 0,
  };
  const filteredEnquiries =
    data?.enquiries.filter(
      (entry) =>
        (enquiryFilter === "All" ||
          (entry.update?.status ?? "Awaiting reply") === enquiryFilter) &&
        matches(entry.name, entry.business, entry.email, entry.message),
    ) ?? [];
  const ad = data?.ads.find((entry) => entry.id === id);
  const client = data?.clients.find((entry) => entry.id === id);
  const cab = data?.cabs.find((entry) => entry.id === id);
  const pending =
    data?.ads.filter((entry) => entry.status === "Pending approval") ?? [];
  const title =
    section === "client"
      ? (client?.name ?? "Client not found")
      : section === "cab"
        ? (cab?.driver ?? "Cab driver not found")
        : (sections.find(([key]) => key === section)?.[1] ?? "Page not found");

  function adTable(ads: Advertisement[]) {
    return (
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
            {ads.map((entry) => (
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
        {ads.length === 0 && (
          <p className="admin-empty">No advertisements match this view.</p>
        )}
      </div>
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
              onClick={() => setResult(loadData())}
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
                      data.clients.length,
                      "clients",
                      "View clients",
                    ],
                    [
                      "Enquiries",
                      data.enquiries.length,
                      "enquiries",
                      "View enquiries",
                    ],
                    [
                      "Cabs in directory",
                      data.cabs.length,
                      "cabs",
                      "View cabs",
                    ],
                    [
                      "Ads awaiting approval",
                      pending.length,
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
                    <strong>{numberFormat.format(data.ads.length)}</strong>
                    <span className="dashboard-stat-foot">
                      All clients and campaign statuses
                    </span>
                  </article>
                  <article className="dashboard-stat">
                    <span className="dashboard-stat-label">Total ad plays</span>
                    <strong>
                      {numberFormat.format(
                        data.ads.reduce(
                          (total, advertisement) => total + advertisement.plays,
                          0,
                        ),
                      )}
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
                      {moneyFormat.format(getCollectedCampaignRevenue())}
                    </strong>
                    <span className="dashboard-stat-foot">
                      Collected campaign payments minus refunds
                    </span>
                  </article>
                </section>
                <p className="fine">
                  Revenue excludes wallet top-ups, pending payments and unpaid
                  approvals. Illustrative billing records only, not live
                  revenue.
                </p>
                <section className="dashboard-panel admin-section">
                  <AdminCharts ads={data.ads} />
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
                  {adTable(pending.slice(0, 5))}
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
                      {data.clients
                        .filter((entry) =>
                          matches(entry.name, entry.email, entry.contact),
                        )
                        .map((entry) => (
                          <tr key={entry.id}>
                            <th scope="row">
                              <strong>{entry.name}</strong>
                              <span>{entry.area}</span>
                            </th>
                            <td>{entry.contact}</td>
                            <td>{entry.email}</td>
                            <td>{entry.phone}</td>
                            <td>{entry.ads.length}</td>
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
                {!data.clients.some((entry) =>
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
                    {adTable(client.ads)}
                  </section>
                </>
              ) : (
                <p className="error" role="alert">
                  Select a client from the clients list.
                </p>
              ))}
            {section === "enquiries" && (
              <section
                className="dashboard-panel admin-enquiries"
                aria-label="Enquiry list"
              >
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
                      {filteredEnquiries.map((entry) => (
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
                              className={`enquiry-reply-status ${entry.update?.status === "Replied" ? "enquiry-replied" : "enquiry-awaiting"}`}
                            >
                              {entry.update?.status ?? "Awaiting reply"}
                            </span>
                          </td>
                          <td>
                            <EnquiryFollowUp
                              id={entry.id}
                              business={entry.business}
                              update={entry.update}
                              onSaved={() => setResult(loadData())}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredEnquiries.length === 0 && (
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
                      Includes fictional sample drivers and locally created
                      records. This directory is not live fleet telemetry.
                    </p>
                  </div>
                </div>
                <CreateDriver
                  onCreated={() => {
                    setSearch("");
                    setResult(loadData());
                  }}
                />
                <div className="dashboard-table-scroll">
                  <table className="dashboard-table admin-table">
                    <thead>
                      <tr>
                        {[
                          "Driver / cab ID",
                          "Car number / model",
                          "Contact details",
                          "Service area",
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
                      {data.cabs
                        .filter((cab) =>
                          matches(
                            cab.driver,
                            cab.car,
                            cab.phone,
                            cab.email,
                            cab.area,
                          ),
                        )
                        .map((cab) => (
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
                  {!data.cabs.some((cab) =>
                    matches(
                      cab.driver,
                      cab.car,
                      cab.phone,
                      cab.email,
                      cab.area,
                    ),
                  ) && (
                    <p className="admin-empty">No cabs match your search.</p>
                  )}
                </div>
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
                        <p>
                          Fictional demo record. Contact numbers and car
                          identifiers are placeholders.
                        </p>
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
                        ["Availability", cab.status],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
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
                      data.clients.find((entry) =>
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
