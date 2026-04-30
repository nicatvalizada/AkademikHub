import {
  DEFAULT_USER_PROFILE_COLOR,
  type IUser,
} from "@akademik/shared";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import * as usersApi from "@/api/users";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

const colorOptions = ["#3b82f6", "#059669", "#dc2626", "#d97706", "#0f766e", "#334155"];

type Props = {
  open: boolean;
  user: IUser;
  onClose: () => void;
};

export function ProfileSettingsModal({ open, user, onClose }: Props) {
  const setUser = useAuthStore((state) => state.setUser);
  const notify = useNotificationStore((state) => state.notify);
  const [name, setName] = useState(user.name);
  const [profileColor, setProfileColor] = useState(user.profileColor ?? DEFAULT_USER_PROFILE_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(user.name);
    setProfileColor(user.profileColor ?? DEFAULT_USER_PROFILE_COLOR);
    setError(null);
  }, [open, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await usersApi.updateMyProfile({
        name: name.trim(),
        profileColor,
      });
      setUser(updated);
      notify("Profil ayarları yadda saxlanıldı.");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Profil yadda saxlanılmadı.";
      setError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Profil ayarları" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Input label="Ad" value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="field">
          <span className="field__label">Profil rəngi</span>
          <span className="profile-color-input">
            <input
              className="book-color-input__picker"
              type="color"
              value={profileColor}
              onChange={(e) => setProfileColor(e.target.value)}
              aria-label="Profil rəngi"
            />
            <input className="field__input" value={profileColor} readOnly aria-label="Profil rəng kodu" />
          </span>
        </label>
        <div className="profile-color-presets" aria-label="Profil rəngləri">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              className={`book-color-preset${profileColor === color ? " book-color-preset--active" : ""}`}
              style={{ background: color }}
              onClick={() => setProfileColor(color)}
              aria-label={`${color} profil rəngini seç`}
            />
          ))}
        </div>
        {error ? <p className="field__error">{error}</p> : null}
        <div className="page-actions">
          <Button type="submit" loading={saving}>
            Saxla
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Ləğv et
          </Button>
        </div>
      </form>
    </Modal>
  );
}
