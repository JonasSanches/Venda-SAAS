import { Injectable } from "@nestjs/common";
import { prisma } from "@varejo/database";
import webpush from "web-push";

type PushMessage = { title: string; body: string; url?: string; tag?: string };

@Injectable()
export class PushNotificationsService {
  private configured() {
    const publicKey = process.env.PUSH_VAPID_PUBLIC_KEY;
    const privateKey = process.env.PUSH_VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return false;
    webpush.setVapidDetails(process.env.PUSH_VAPID_SUBJECT ?? "mailto:suporte@vendamais-app.com", publicKey, privateKey);
    return true;
  }

  publicKey() {
    return { enabled: this.configured(), publicKey: process.env.PUSH_VAPID_PUBLIC_KEY ?? null };
  }

  async subscribe(userId: string, input: { endpoint: string; p256dh: string; auth: string }) {
    if (!this.configured()) return { enabled: false };
    await prisma.pushSubscription.upsert({ where: { endpoint: input.endpoint }, update: { userId, p256dh: input.p256dh, auth: input.auth }, create: { userId, endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth } });
    return { enabled: true };
  }

  async sendToUsers(userIds: string[], message: PushMessage) {
    if (!userIds.length || !this.configured()) return;
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
    await Promise.all(subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(message), { TTL: 120 });
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
      }
    }));
  }
}
