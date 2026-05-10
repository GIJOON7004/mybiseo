/**
 * routes/notification.ts — 관리자 알림 라우터
 */
import { adminProcedure, router } from "../_core/trpc";
import {
  getAdminNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../db";
import { getNotificationChannelStatus } from "../notifier";
import { z } from "zod";

export const notificationRouter = router({
  channels: adminProcedure.query(() => {
    return getNotificationChannelStatus();
  }),
  list: adminProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getAdminNotifications(input?.limit ?? 50);
    }),
  unreadCount: adminProcedure.query(async () => {
    return getUnreadNotificationCount();
  }),
  markRead: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.id);
      return { ok: true };
    }),
  markAllRead: adminProcedure.mutation(async () => {
    await markAllNotificationsRead();
    return { ok: true };
  }),
});
