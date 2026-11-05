import { useState, type FormEvent } from "react";
import { createCabDriver } from "../lib/admin";

export function CreateDriver({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaved("");
    try {
      const status = values.get("status");
      if (
        status !== "Available" &&
        status !== "Assigned" &&
        status !== "Maintenance"
      )
        throw new Error("Choose a valid driver availability.");
      createCabDriver({
        driver: String(values.get("driver") ?? ""),
        car: String(values.get("car") ?? ""),
        model: String(values.get("model") ?? ""),
        phone: String(values.get("phone") ?? ""),
        email: String(values.get("email") ?? ""),
        area: String(values.get("area") ?? ""),
        status,
      });
      form.reset();
      setError("");
      setSaved("Driver created and added to the directory.");
      onCreated();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The driver could not be saved.",
      );
    }
  }
  return (
    <details className="enquiry-follow-up admin-create-driver">
      <summary>Create driver</summary>
      <form aria-label="Create driver" onSubmit={submit}>
        <p className="fine">
          Saved in this browser only. Add only contact details you are
          authorised to store.
        </p>
        <div className="fields">
          {[
            ["driver", "Driver name", "text", "Enter driver name"],
            ["car", "Vehicle number", "text", "TS09AB1234"],
            ["model", "Vehicle model", "text", "Enter vehicle model"],
            ["phone", "Driver phone", "tel", "+91 98765 43210"],
            ["email", "Driver email", "email", "driver@example.com"],
            ["area", "Service area", "text", "Enter service area"],
          ].map(([name, label, type, placeholder]) => (
            <div className="field" key={name}>
              <label htmlFor={`driver-${name}`}>{label} *</label>
              <input
                id={`driver-${name}`}
                name={name}
                type={type}
                placeholder={placeholder}
                required
                maxLength={name === "email" ? 254 : name === "phone" ? 25 : 120}
              />
            </div>
          ))}
          <div className="field">
            <label htmlFor="driver-status">Availability *</label>
            <select
              id="driver-status"
              name="status"
              defaultValue="Available"
              required
            >
              <option>Available</option>
              <option>Assigned</option>
              <option>Maintenance</option>
            </select>
          </div>
        </div>
        <button className="button yellow small" type="submit">
          Save driver
        </button>
        <p className="error" role="alert">
          {error}
        </p>
        <p role="status">{saved}</p>
      </form>
    </details>
  );
}
