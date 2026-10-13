import { z } from "zod";

export const CreateDeviceSchema = z.object({
  deviceName: z.string().min(1, "deviceName is required").max(100),
  platform: z.enum(["android", "ios", "other"]).default("android"),
});

export const DeleteDeviceSchema = z.object({
  id: z.string().uuid("Device id must be a valid UUID"),
});

export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;
export type DeleteDeviceInput = z.infer<typeof DeleteDeviceSchema>;
