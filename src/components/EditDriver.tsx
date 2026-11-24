import { useState, type FormEvent } from "react";
import type { CabDriver } from "../lib/admin";
import { GeneratedPassword, generatePasswordForForm } from "./CreateDriver";
import { saveDriverUpdate } from "../lib/driverAdminApi";

/**
 * Edit form for an existing driver. All details, including the screen ID, can
 * be changed. The stored password can never be viewed; it can only be
 * regenerated here, and the new one is visible once until it is saved.
 */
export function EditDriver({
  driver,
  onSaved,
}: {
  driver: CabDriver;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [needsPasswordRegeneration, setNeedsPasswordRegeneration] =
    useState(false);

  function generate(form: HTMLFormElement | null) {
    try {
      setNewPassword(generatePasswordForForm(form));
      setNeedsPasswordRegeneration(false);
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
    const values = new FormData(event.currentTarget);
    setSaved("");
    setBusy(true);
    try {
      if (needsPasswordRegeneration)
        throw new Error(
          "Driver details changed. Generate a new password before saving.",
        );
      const status = values.get("status");
      if (
        status !== "Available" &&
        status !== "Assigned" &&
        status !== "Maintenance"
      )
        throw new Error("Choose a valid driver availability.");
      await saveDriverUpdate(
        driver.id,
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
        newPassword || undefined,
      );
      setNewPassword("");
      setNeedsPasswordRegeneration(false);
      setError("");
      setSaved(
        newPassword
          ? "Driver updated. The regenerated password is now stored as a hash and cannot be viewed again."
          : "Driver details updated.",
      );
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The driver could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="enquiry-follow-up admin-create-driver">
      <summary>Edit driver</summary>
      <form aria-label="Edit driver" onSubmit={submit}>
        <p className="fine">
          Update driver, vehicle and screen details. Passwords are stored as
          hashes; regenerate one below if the driver needs a new password.
        </p>
        <div className="fields">
          {(
            [
              ["driver", "Driver name", "text", driver.driver],
              ["car", "Vehicle number", "text", driver.car],
              ["model", "Vehicle model", "text", driver.model],
              ["phone", "Driver phone", "tel", driver.phone],
              ["email", "Driver email", "email", driver.email],
              ["area", "Service area", "text", driver.area],
              ["screenId", "Screen ID", "text", driver.screenId],
            ] as const
          ).map(([name, label, type, value]) => (
            <div className="field" key={name}>
              <label htmlFor={`edit-driver-${name}`}>{label} *</label>
              <input
                id={`edit-driver-${name}`}
                name={name}
                type={type}
                defaultValue={value}
                onChange={() => {
                  if (
                    newPassword &&
                    ["driver", "car", "phone"].includes(name)
                  ) {
                    setNewPassword("");
                    setNeedsPasswordRegeneration(true);
                    setError(
                      "Driver details changed. Generate a new password.",
                    );
                  }
                }}
                placeholder={name === "screenId" ? "SCR-0001" : undefined}
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
            <label htmlFor="edit-driver-status">Availability *</label>
            <select
              id="edit-driver-status"
              name="status"
              defaultValue={driver.status}
              required
            >
              <option>Available</option>
              <option>Assigned</option>
              <option>Maintenance</option>
            </select>
          </div>
          {newPassword ? (
            <GeneratedPassword
              password={newPassword}
              onGenerate={generate}
              label="edit"
            />
          ) : (
            <div className="field">
              <span>Driver password</span>
              <button
                id="edit-regenerate-password"
                className="button ghost small"
                type="button"
                onClick={(event) => generate(event.currentTarget.form)}
              >
                Regenerate password
              </button>
              <p className="fine">
                The current password cannot be viewed. Regenerating replaces it
                when you save.
              </p>
            </div>
          )}
        </div>
        <button className="button yellow small" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <p className="error" role="alert">
          {error}
        </p>
        <p role="status">{saved}</p>
      </form>
    </details>
  );
}
