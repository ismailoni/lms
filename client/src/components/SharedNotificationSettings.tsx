"use client";

import {
  NotificationSettingsFormData,
  notificationSettingsSchema,
} from "@/lib/schemas";
import { useUpdateUserMutation } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Palette, Bell } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
const SharedNotificationSettings = ({
  title = "Notification Settings",
  subtitle = "Manage your notification settings",
}: SharedNotificationSettingsProps) => {
  const { user } = useUser();
  const [updateUser] = useUpdateUserMutation();
  const { theme } = useTheme();

  const currentSettings =
    (user?.publicMetadata as { settings?: UserSettings })?.settings || {};
  const methods = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      courseNotifications: currentSettings.courseNotifications || false,
      emailAlerts: currentSettings.emailAlerts || false,
      smsAlerts: currentSettings.smsAlerts || false,
      notificationFrequency: currentSettings.notificationFrequency || "daily",
    },
  });

  const onSubmit = async (data: NotificationSettingsFormData) => {
    if (!user) return;

    const updatedUser = {
      userId: user.id,
      publicMetadata: {
        ...user.publicMetadata,
        settings: {
          ...currentSettings,
          ...data,
        },
      },
    };

    try {
      await updateUser(updatedUser);
    } catch (error) {
      console.error("failed to update user settings: ", error);
    }
  };

  if (!user) return <div>Please Sign-in to manage your settings.</div>;

  return (
    <div className="settings-container space-y-8">
      <Header title={title} subtitle={subtitle} />
      
      {/* Theme Settings Card */}
      <Card className="bg-customgreys-secondarybg border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Palette className="w-5 h-5 text-blue-400" />
            Appearance Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Customize how the interface looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-customgreys-primarybg/50 border border-gray-700/50">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-200">Theme Mode</h4>
              <p className="text-sm text-gray-400">
                Choose between light and dark appearance
              </p>
            </div>
            <ThemeToggle variant="switch" showLabel={false} />
          </div>
          
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-200 mb-1">
                  Theme Preferences
                </h4>
                <p className="text-sm text-blue-300/80">
                  Your theme preference is automatically saved and synced across all your devices.
                  Current theme: <span className="font-medium capitalize">{theme}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings Card */}
      <Card className="bg-customgreys-secondarybg border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Bell className="w-5 h-5 text-green-400" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-gray-400">
            Control how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="notification-settings__form"
            >
              <div className="notification-settings__fields">
                <CustomFormField 
                 name="courseNotifications" 
                 label="Course Notifications"
                 type="switch"
                />
                <CustomFormField 
                 name="emailAlerts" 
                 label="Email Alerts"
                 type="switch"
                />
                <CustomFormField 
                 name="smsAlerts" 
                 label="SMS Alerts"
                 type="switch"
                />
                <CustomFormField 
                 name="notificationFrequency" 
                 label="Notification Frequency"
                 type="select"
                 options={[
                    { value: 'immediate', label: 'Immediate'},
                    { value: 'daily', label: 'Daily'},
                    { value: 'weekly', label: 'Weekly'},
                 ]}
                />
              </div>

              <Button type="submit" className="notification-settings__submit">
                Update Settings
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedNotificationSettings;
