import { appPrisma } from './prisma';
import { sendSMS } from './twilio';

export async function processScheduledMessages() {
  try {
    console.log('[Scheduler] Querying for scheduled messages...');
    
    // Find all messages that are scheduled and due to be sent
    const scheduledMessages = await appPrisma.message.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: new Date(), // Messages scheduled for now or earlier
        },
      },
      include: {
        patientRef: true,
      },
    });

    console.log(`[Scheduler] Found ${scheduledMessages.length} messages to process`);
    
    if (scheduledMessages.length === 0) {
      return;
    }

    console.log('[Scheduler] Messages to process:', 
      scheduledMessages.map(m => ({
        id: m.id,
        scheduledFor: m.scheduledFor,
        patientId: m.patientId.toString()
      }))
    );

    // Process each message
    for (const message of scheduledMessages) {
      try {
        console.log(`[Scheduler] Processing message ${message.id} (scheduled for ${message.scheduledFor?.toISOString()})`);
        
        // Send the message
        const result = await sendSMS(message.toNumber, message.body);

        // Update message status based on result
        await appPrisma.message.update({
          where: { id: message.id },
          data: {
            status: result.success ? 'SENT' : 'FAILED',
            ...(result.success ? { twilioSid: result.messageId } : {}),
          },
        });

        console.log(`[Scheduler] Message ${message.id} ${result.success ? 'sent successfully' : 'failed to send'}`);

        // Create audit log
        await appPrisma.messageAudit.create({
          data: {
            messageId: message.id,
            action: result.success ? 'SEND_SCHEDULED' : 'SEND_SCHEDULED_FAILED',
            userId: 'system',
            ipAddress: 'scheduler',
            userAgent: 'scheduler',
          },
        });

      } catch (error) {
        console.error(`[Scheduler] Error processing message ${message.id}:`, error);
        
        // Mark message as failed
        await appPrisma.message.update({
          where: { id: message.id },
          data: { status: 'FAILED' },
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error in processScheduledMessages:', error);
    throw error; // Re-throw to be handled by the caller
  }
} 