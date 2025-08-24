"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save } from "lucide-react";

const SETTINGS_KEY = "cryptoPulseSettings";

const settingsSchema = z.object({
  defaultAnalysisMode: z.enum(["flash", "pro"], {
    required_error: "You need to select a default analysis mode.",
  }),
  enableNotifications: z.boolean().default(false).optional(),
  binanceApiKey: z.string().optional(),
  binanceApiSecret: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultValues: Partial<SettingsFormValues> = {
  defaultAnalysisMode: "flash",
  enableNotifications: true,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        form.reset(parsedSettings);
      } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
      }
    }
  }, [form]);

  function onSubmit(data: SettingsFormValues) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SettingsIcon className="w-8 h-8 text-primary"/>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Customize your CryptoPulse AI experience.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Analysis</CardTitle>
              <CardDescription>Configure default AI analysis settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="defaultAnalysisMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Default Analysis Mode</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="flash" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Quick (Gemini 2.5 Flash)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="pro" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Ultra (Gemini 2.5 Pro)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive alerts.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive notifications for completed analyses. (Feature coming soon)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Connect your Binance account. Keys are stored locally and never sent to our servers. (For future features)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                  control={form.control}
                  name="binanceApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Binance API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Your API Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="binanceApiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Binance API Secret</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Your API Secret" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
