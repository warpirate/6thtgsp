import React, { useState } from 'react'
import { Sun, Moon, Monitor, Bell, Layout, Globe } from 'lucide-react'

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    theme: 'system',
    notifications: {
      email: true,
      receiptApproved: true,
      receiptRejected: true,
      newAssignment: true,
    },
    display: {
      density: 'comfortable',
      itemsPerPage: 25,
      dateFormat: 'yyyy-MM-dd',
    },
  })

  const updateTheme = (theme: string) => {
    setSettings({ ...settings, theme })
  }

  const updateNotification = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    })
  }

  const updateDisplay = (key: string, value: any) => {
    setSettings({
      ...settings,
      display: { ...settings.display, [key]: value },
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Customize your application preferences</p>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Appearance</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Theme</label>
            <div className="flex gap-4 mt-2">
              {[{ id: 'light', icon: Sun }, { id: 'dark', icon: Moon }, { id: 'system', icon: Monitor }].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateTheme(theme.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    settings.theme === theme.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <theme.icon className="w-6 h-6" />
                  <span className="text-sm capitalize">{theme.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Display Density</label>
            <select
              value={settings.display.density}
              onChange={(e) => updateDisplay('density', e.target.value)}
              className="input"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Notifications</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Email notifications</span>
            <input
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => updateNotification('email', e.target.checked)}
              className="toggle"
            />
          </label>

          <div className="pl-6 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-muted-foreground">When my receipt is approved</span>
              <input
                type="checkbox"
                checked={settings.notifications.receiptApproved}
                onChange={(e) => updateNotification('receiptApproved', e.target.checked)}
                disabled={!settings.notifications.email}
                className="rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-muted-foreground">When my receipt is rejected</span>
              <input
                type="checkbox"
                checked={settings.notifications.receiptRejected}
                onChange={(e) => updateNotification('receiptRejected', e.target.checked)}
                disabled={!settings.notifications.email}
                className="rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-muted-foreground">New approval assignments</span>
              <input
                type="checkbox"
                checked={settings.notifications.newAssignment}
                onChange={(e) => updateNotification('newAssignment', e.target.checked)}
                disabled={!settings.notifications.email}
                className="rounded"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Data & Display */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Data & Display</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Items per page</label>
            <select
              value={settings.display.itemsPerPage}
              onChange={(e) => updateDisplay('itemsPerPage', Number(e.target.value))}
              className="input"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div>
            <label className="label">Date Format</label>
            <select
              value={settings.display.dateFormat}
              onChange={(e) => updateDisplay('dateFormat', e.target.value)}
              className="input"
            >
              <option value="yyyy-MM-dd">2024-10-04 (ISO)</option>
              <option value="MM/dd/yyyy">10/04/2024 (US)</option>
              <option value="dd/MM/yyyy">04/10/2024 (EU)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button className="btn btn-secondary">Reset to Defaults</button>
        <button className="btn btn-primary">Save Settings</button>
      </div>
    </div>
  )
}

export default SettingsPage
