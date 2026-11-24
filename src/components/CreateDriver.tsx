import { useState, type FormEvent } from "react";
import { generateDriverPassword, saveNewDriver } from "../lib/driverAdminApi";

export function generatePasswordForForm(form: HTMLFormElement | null) {
  if (!form) throw new Error("The driver form is unavailable.");
  const values = new FormData(form);
  return generateDriverPassword({
    name: String(values.get("driver") ?? ""),
    car: String(values.get("car") ?? ""),
    phone: String(values.get("phone") ?? ""),
  });
}

/**
 * One-time password panel shared by the create and edit driver forms. The
 * plaintext exists only in component state until it is saved; afterwards only
 * a hash is stored and the password can never be viewed again — only
 * regenerated.
 */
export function GeneratedPassword({
  password,
  onGenerate,
  label,
}: {
  password: string;
  onGenerate: (form: HTMLFormElement | null) => void;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  return (
    <div className="field">
      <label htmlFor={`${label}-generated-password`}>Driver password *</label>
      <input
        id={`${label}-generated-password`}
        type="text"
        value={password}
        placeholder="Use Generate password"
        readOnly
        autoComplete="off"
        aria-describedby={`${label}-password-hint`}
      />
      <div>
        <button
          className="button ghost small"
          type="button"
          onClick={(event) => {
            onGenerate(event.currentTarget.form);
            setCopied(false);
            setCopyError("");
          }}
        >
          {password ? "Regenerate" : "Generate password"}
        </button>
        {password && (
          <button
            className="button ghost small"
            type="button"
            onClick={() => {
              if (!navigator.clipboard) {
                setCopyError(
                  "Copy is unavailable. Select the password to copy it.",
                );
                return;
              }
              void navigator.clipboard.writeText(password).then(
                () => {
                  setCopied(true);
                  setCopyError("");
                },
                () =>
                  setCopyError(
                    "Could not copy. Select the password to copy it.",
                  ),
              );
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
      {copyError && (
        <p className="error" role="alert">
          {copyError}
        </p>
      )}
      <p className="fine" id={`${label}-password-hint`}>
        Uses parts of the name, vehicle number and phone number plus random
        characters. Share it with the driver now. It is saved as a one-way hash
        and cannot be viewed after saving — only regenerated.
      </p>
    </div>
  );
}

export function CreateDriver({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");

  function generate(form: HTMLFormElement | null) {
    try {
      setPassword(generatePasswordForForm(form));
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not generate a password.",
      );
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaved("");
    setBusy(true);
    try {
      const status = values.get("status");
      if (
        status !== "Available" &&
        status !== "Assigned" &&
        status !== "Maintenance"
      )
        throw new Error("Choose a valid driver availability.");
      if (!password)
        throw new Error("Generate a driver password before saving.");
      await saveNewDriver(
        {
          driver: String(values.get("driver") ?? ""),
          car: String(values.get("car") ?? ""),
          model: String(values.get("model") ?? ""),
          phone: String(values.get("phone") ?? ""),
          email: String(values.get("email") ?? ""),
          area: String(values.get("area") ?? ""),
          screenId: String(values.get("screenId") ?? ""),
          status,
        },
        password,
      );
      form.reset();
      setPassword("");
      setError("");
      setSaved(
        "Driver created and added to the directory. The password is now stored as a hash and cannot be viewed again.",
      );
      onCreated();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The driver could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="enquiry-follow-up admin-create-driver">
      <summary>Create driver</summary>
      <form aria-label="Create driver" onSubmit={submit}>
        <p className="fine">
          Saved to the Adrover directory. Add only contact details you are
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
            ["screenId", "Screen ID", "text", "SCR-0001"],
          ].map(([name, label, type, placeholder]) => (
            <div className="field" key={name}>
              <label htmlFor={`driver-${name}`}>{label} *</label>
              <input
                id={`driver-${name}`}
                name={name}
                type={type}
                placeholder={placeholder}
                onChange={() => {
                  if (password && ["driver", "car", "phone"].includes(name)) {
                    setPassword("");
                    setError(
                      "Driver details changed. Generate a new password.",
                    );
                  }
                }}
                required
                maxLength={
                  name === "email"
                    ? 254
                    : name === "phone"
                      ? 25
                      : name === "screenId"
                        ? 50
                        : 120
                }
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
          <GeneratedPassword
            password={password}
            onGenerate={generate}
            label="create"
          />
        </div>
        <button className="button yellow small" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save driver"}
        </button>
        <p className="error" role="alert">
          {error}
        </p>
        <p role="status">{saved}</p>
      </form>
    </details>
  );
}
