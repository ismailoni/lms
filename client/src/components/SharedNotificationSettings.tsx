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
import { Bell } from "lucide-react";
const SharedNotificationSettings = ({
  title = "Notification Settings",
  subtitle = "Manage your notification settings",
}: SharedNotificationSettingsProps) => {
  const { user } = useUser();
  const [updateUser] = useUpdateUserMutation();

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
