import { PrismaClient } from '@prisma/client'
import { PrismaClient as AppPrismaClient } from './generated/app-client'

const SAMPLE_MESSAGES = [
  "Hi, I need to reschedule my appointment.",
  "What time is my appointment tomorrow?",
  "Can you confirm my insurance coverage?",
  "I'm running about 10 minutes late.",
  "Do I need to bring anything specific for my appointment?",
  "Is there parking available?",
  "How long will the procedure take?",
  "What are your office hours?",
  "Do you accept my insurance?",
  "Can I get a copy of my treatment plan?",
  "I'm experiencing some sensitivity after the procedure.",
  "When should I schedule my next cleaning?",
  "What are your COVID-19 protocols?",
  "Can I get an estimate for the procedure?",
  "Do you offer payment plans?",
];

const SAMPLE_RESPONSES = [
  "Of course! Let me help you with that.",
  "Your appointment is scheduled for 2:30 PM tomorrow.",
  "Yes, we accept your insurance. I'll verify the coverage.",
  "No problem, we'll make a note of that.",
  "Just bring your ID and insurance card.",
  "Yes, we have free parking in front of the building.",
  "The procedure typically takes about 45 minutes.",
  "We're open Monday-Friday, 9 AM to 5 PM.",
  "Yes, we accept most major insurance plans.",
  "I'll send that right over to you.",
  "That's normal, but let us know if it persists.",
  "We recommend scheduling in 6 months.",
  "We follow all CDC guidelines and sanitize between patients.",
  "I'll have the front desk prepare an estimate.",
  "Yes, we offer several financing options.",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function generateRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Starting dummy message generation...');
  const prisma = new PrismaClient();
  const appPrisma = new AppPrismaClient();
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        PatNum: true,
        FName: true,
        LName: true,
      },
    });

    console.log(`Found ${patients.length} total patients`);

    // Select 5% of patients randomly for messages
    const numPatientsToUpdate = Math.floor(patients.length * 0.05);
    const shuffledPatients = patients
      .sort(() => Math.random() - 0.5)
      .slice(0, numPatientsToUpdate);

    console.log(`Creating messages for ${shuffledPatients.length} patients`);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    for (const patient of shuffledPatients) {
      // Create or get patient reference
      const patientRef = await appPrisma.patientReference.upsert({
        where: { patientId: patient.PatNum },
        create: {
          patientId: patient.PatNum,
          colorIndex: Math.floor(Math.random() * 8) + 1,
        },
        update: {},
      });

      // Generate 1-50 messages for each patient
      const numMessages = Math.floor(Math.random() * 50) + 1;
      
      for (let i = 0; i < numMessages; i++) {
        const isInbound = Math.random() > 0.5;
        const messageDate = generateRandomDate(threeMonthsAgo, new Date());
        
        const message = await appPrisma.message.create({
          data: {
            direction: isInbound ? "INBOUND" : "OUTBOUND",
            status: "DELIVERED",
            fromNumber: isInbound ? "+1234567890" : process.env.TWILIO_PHONE_NUMBER || "+18669659567",
            toNumber: isInbound ? process.env.TWILIO_PHONE_NUMBER || "+18669659567" : "+1234567890",
            body: getRandomMessage(isInbound ? SAMPLE_MESSAGES : SAMPLE_RESPONSES),
            twilioSid: `TEST_${Math.random().toString(36).substring(7)}`,
            patientId: patient.PatNum,
            patientRefId: patientRef.id,
            isEncrypted: true,
            metadata: {},
            createdAt: messageDate,
            updatedAt: messageDate,
          },
        });

        // Create audit log
        await appPrisma.messageAudit.create({
          data: {
            messageId: message.id,
            action: isInbound ? "RECEIVED" : "SENT",
            userId: "development",
            timestamp: messageDate,
            ipAddress: "127.0.0.1",
            userAgent: "Seed Script",
          },
        });

        if (i % 10 === 0) {
          console.log(`Created ${i + 1}/${numMessages} messages`);
        }
      }
      console.log(`Completed message generation for patient`);
    }

    console.log('Successfully created dummy messages');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await appPrisma.$disconnect();
  }
}

// Run the script
console.log('Running add-dummy-messages script...');
main()
  .catch((e) => {
    console.error('Fatal error in add-dummy-messages:', e);
    process.exit(1);
  }); 