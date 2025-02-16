import { NextResponse } from "next/server";
import { appPrisma } from "@/lib/prisma";
import prisma from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    // Extract patientId from query params if it exists
    const { searchParams } = new URL(request.url);
    const specificPatientId = searchParams.get('patientId');

    // If requesting a specific patient
    if (specificPatientId) {
      const patientInfo = await prisma.patient.findFirst({
        where: {
          PatNum: BigInt(specificPatientId),
        },
        select: {
          PatNum: true,
          LName: true,
          FName: true,
          Birthdate: true,
          HmPhone: true,
          WkPhone: true,
          WirelessPhone: true,
          Email: true,
          PatStatus: true,
          Address: true,
          Gender: true
        },
      });

      if (!patientInfo) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }

      // Get or create patient reference
      let patientRef = await appPrisma.patientReference.findFirst({
        where: { patientId: BigInt(specificPatientId) },
      });

      if (!patientRef) {
        patientRef = await appPrisma.patientReference.create({
          data: {
            patientId: BigInt(specificPatientId),
            colorIndex: Math.floor(Math.random() * 8) + 1,
          },
        });
      }

      const patientName = `${patientInfo.FName} ${patientInfo.LName}`.trim();
      const age = patientInfo.Birthdate 
        ? Math.floor((new Date().getTime() - new Date(patientInfo.Birthdate).getTime()) / 31557600000)
        : 0;
      const phoneNumber = patientInfo.WirelessPhone || patientInfo.HmPhone || patientInfo.WkPhone || "";

      // Return thread info even if no messages exist yet
      return NextResponse.json(serializeBigInt([{
        patientId: specificPatientId,
        patientName,
        colorIndex: patientRef.colorIndex,
        lastMessage: {
          body: "",
          createdAt: new Date(),
          direction: "OUTBOUND",
        },
        patient: {
          ...patientInfo,
          PatNum: patientInfo.PatNum.toString(),
          age,
          phoneNumber,
          status: patientInfo.PatStatus === 1 ? "Active" : "Inactive",
        }
      }]));
    }

    // Get all unique patients who have messages
    const messageThreads = await appPrisma.message.findMany({
      distinct: ["patientId"],
      orderBy: {
        createdAt: "desc",
      },
      include: {
        patientRef: true,
      },
    });

    // If we have no messages yet, return empty array
    if (messageThreads.length === 0) {
      return NextResponse.json([]);
    }

    // Get the last message and patient info for each thread
    const threadsWithLastMessage = await Promise.all(
      messageThreads.map(async (thread) => {
        const [lastMessage, patientInfo] = await Promise.all([
          appPrisma.message.findFirst({
            where: {
              patientId: thread.patientId,
            },
            orderBy: {
              createdAt: "desc",
            },
          }),
          prisma.patient.findFirst({
            where: {
              PatNum: thread.patientId,
            },
            select: {
              PatNum: true,
              LName: true,
              FName: true,
              Birthdate: true,
              HmPhone: true,
              WkPhone: true,
              WirelessPhone: true,
              Email: true,
              PatStatus: true,
              Address: true,
              Gender: true
            },
          }),
        ]);

        if (!patientInfo) {
          return null;
        }

        const patientName = `${patientInfo.FName} ${patientInfo.LName}`.trim();
        const age = patientInfo.Birthdate 
          ? Math.floor((new Date().getTime() - new Date(patientInfo.Birthdate).getTime()) / 31557600000)
          : 0;
        const phoneNumber = patientInfo.WirelessPhone || patientInfo.HmPhone || patientInfo.WkPhone || "";

        return {
          patientId: thread.patientId.toString(),
          patientName,
          colorIndex: thread.patientRef.colorIndex,
          lastMessage: {
            body: lastMessage?.body || "",
            createdAt: lastMessage?.createdAt || new Date(),
            direction: lastMessage?.direction || "OUTBOUND",
          },
          patient: {
            ...patientInfo,
            PatNum: patientInfo.PatNum.toString(),
            age,
            phoneNumber,
            status: patientInfo.PatStatus === 1 ? "Active" : "Inactive",
          }
        };
      })
    );

    // Filter out null threads and return
    return NextResponse.json(serializeBigInt(threadsWithLastMessage.filter(Boolean)));
  } catch (error) {
    console.error("Error fetching message threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch message threads" },
      { status: 500 }
    );
  }
} 