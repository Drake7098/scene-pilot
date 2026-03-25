"use client"

import { useState } from "react"
import { User, Mail, Key, Bell, Shield, Trash2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AccountPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false,
    updates: true,
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Profile */}
        <div className="rounded-lg border border-border/60 bg-card/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Profile</h2>
          </div>

          <div className="mb-6 flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl font-semibold">
              JD
            </div>
            <div>
              <Button variant="outline" size="sm">
                Upload Photo
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName" className="mb-2 block text-sm">
                First Name
              </Label>
              <Input id="firstName" defaultValue="John" className="bg-input" />
            </div>
            <div>
              <Label htmlFor="lastName" className="mb-2 block text-sm">
                Last Name
              </Label>
              <Input id="lastName" defaultValue="Doe" className="bg-input" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="username" className="mb-2 block text-sm">
                Username
              </Label>
              <Input id="username" defaultValue="johndoe" className="bg-input" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>

        {/* Email */}
        <div className="rounded-lg border border-border/60 bg-card/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Email</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2 block text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue="john.doe@example.com"
                className="bg-input"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button>Update Email</Button>
          </div>
        </div>

        {/* Password */}
        <div className="rounded-lg border border-border/60 bg-card/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Password</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword" className="mb-2 block text-sm">
                Current Password
              </Label>
              <Input id="currentPassword" type="password" className="bg-input" />
            </div>
            <div>
              <Label htmlFor="newPassword" className="mb-2 block text-sm">
                New Password
              </Label>
              <Input id="newPassword" type="password" className="bg-input" />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="mb-2 block text-sm">
                Confirm New Password
              </Label>
              <Input id="confirmPassword" type="password" className="bg-input" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button>Change Password</Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-border/60 bg-card/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-input/30 p-4">
              <div>
                <div className="text-sm font-medium">Email Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Receive emails about your generation results
                </div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, email: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-input/30 p-4">
              <div>
                <div className="text-sm font-medium">Product Updates</div>
                <div className="text-xs text-muted-foreground">
                  Get notified about new features and improvements
                </div>
              </div>
              <Switch
                checked={notifications.updates}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, updates: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-input/30 p-4">
              <div>
                <div className="text-sm font-medium">Marketing Emails</div>
                <div className="text-xs text-muted-foreground">
                  Receive tips, tutorials, and promotional content
                </div>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-lg border border-border/60 bg-card/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Preferences</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-2 block text-sm">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block text-sm">Timezone</Label>
              <Select defaultValue="pst">
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                  <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                  <SelectItem value="cst">Central Time (CT)</SelectItem>
                  <SelectItem value="est">Eastern Time (ET)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-lg border border-border/60 bg-card/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Security</h2>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-input/30 p-4">
            <div>
              <div className="text-sm font-medium">Two-Factor Authentication</div>
              <div className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-medium text-destructive">Danger Zone</h2>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          <Button variant="destructive">Delete Account</Button>
        </div>
      </div>
    </div>
  )
}
