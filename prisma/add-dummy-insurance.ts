import { PrismaClient } from '@prisma/client'

// This script solely exists to add dummy insurance data to the database for testing purposes

// Common insurance carriers with realistic formats
const INSURANCE_CARRIERS = [
  {
    name: "Aetna",
    idFormat: "W\\d{9}", // W followed by 9 digits
    memberIdPrefix: "AET"
  },
  {
    name: "Blue Cross Blue Shield",
    idFormat: "\\d{3}[A-Z]\\d{5}", // 3 digits, letter, 5 digits
    memberIdPrefix: "BCB"
  },
  {
    name: "Cigna",
    idFormat: "\\d{8}", // 8 digits
    memberIdPrefix: "CIG"
  },
  {
    name: "Delta Dental",
    idFormat: "\\d{12}", // 12 digits
    memberIdPrefix: "DLT"
  },
  {
    name: "MetLife",
    idFormat: "[A-Z]\\d{9}", // Letter followed by 9 digits
    memberIdPrefix: "MET"
  },
  {
    name: "United Healthcare",
    idFormat: "\\d{11}", // 11 digits
    memberIdPrefix: "UHC"
  }
]

function generatePayerId(): string {
  // Generate a payer ID that matches common formats (usually 5-10 digits)
  return Math.floor(10000 + Math.random() * 90000).toString()
}

function generateMemberId(prefix: string): string {
  // Generate a member ID with prefix and 8 random digits
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString()
  return `${prefix}${randomDigits}`
}

function generateFutureDate(): Date {
  // Generate a date between 6 months and 2 years in the future
  const today = new Date()
  const sixMonths = 180 * 24 * 60 * 60 * 1000
  const twoYears = 730 * 24 * 60 * 60 * 1000
  const randomTime = sixMonths + Math.random() * (twoYears - sixMonths)
  const futureDate = new Date(today.getTime() + randomTime)
  return futureDate
}

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        PatNum: true
      }
    })

    console.log(`Found ${patients.length} total patients`)

    for (const patient of patients) {
      // Randomly select an insurance carrier
      const carrier = INSURANCE_CARRIERS[Math.floor(Math.random() * INSURANCE_CARRIERS.length)]
      
      // Create carrier record
      const createdCarrier = await prisma.carrier.create({
        data: {
          CarrierName: carrier.name,
          Address: "123 Insurance Way",
          Address2: "Suite 100",
          City: "Insurance City",
          State: "IC",
          Zip: "12345",
          Phone: "800-555-1234",
          ElectID: generatePayerId(),
          NoSendElect: false,
          IsCDA: 0,
          CanadianNetworkNum: BigInt(0),
          IsHidden: 0,
          CanadianEncryptionMethod: 0,
          CanadianSupportedTypes: 0,
          SecUserNumEntry: BigInt(1),
          SecDateEntry: new Date(),
          SecDateTEdit: new Date(),
          TIN: "",
          CarrierGroupName: BigInt(0),
          ApptTextBackColor: 0,
          IsCoinsuranceInverted: 0,
          TrustedEtransFlags: 0,
          CobInsPaidBehaviorOverride: 0,
          EraAutomationOverride: 0,
          OrthoInsPayConsolidate: 0
        }
      })

      // Create insurance plan
      const planEffectiveDate = generateFutureDate()
      const subscriberId = generateMemberId(carrier.memberIdPrefix)
      
      const createdPlan = await prisma.insplan.create({
        data: {
          CarrierNum: createdCarrier.CarrierNum,
          EmployerNum: BigInt(0),
          GroupName: "Standard Plan",
          GroupNum: "GRP" + Math.floor(1000 + Math.random() * 9000).toString(),
          FeeSched: BigInt(1),
          ClaimFormNum: BigInt(1),
          UseAltCode: false,
          ClaimsUseUCR: false,
          IsMedical: 0,
          DentaideCardSequence: 0,
          ShowBaseUnits: false,
          CodeSubstNone: false,
          IsHidden: 0,
          MonthRenew: 0,
          FilingCode: BigInt(0),
          FilingCodeSubtype: BigInt(0),
          CanadianPlanFlag: "",
          CanadianDiagnosticCode: "",
          CanadianInstitutionCode: "",
          RxBIN: "",
          CobRule: 0,
          SopCode: "",
          SecUserNumEntry: BigInt(1),
          SecDateEntry: new Date(),
          SecDateTEdit: new Date(),
          HideFromVerifyList: 0,
          OrthoType: 0,
          OrthoAutoProcFreq: 0,
          OrthoAutoProcCodeNumOverride: BigInt(0),
          OrthoAutoFeeBilled: 0,
          OrthoAutoClaimDaysWait: 0,
          BillingType: BigInt(0),
          HasPpoSubstWriteoffs: 0,
          ExclusionFeeRule: 0,
          ManualFeeSchedNum: BigInt(0),
          IsBlueBookEnabled: 1,
          InsPlansZeroWriteOffsOnAnnualMaxOverride: 0,
          InsPlansZeroWriteOffsOnFreqOrAgingOverride: 0,
          PerVisitPatAmount: 0,
          PerVisitInsAmount: 0,
          PlanNote: "",
          CopayFeeSched: BigInt(0),
          AllowedFeeSched: BigInt(0)
        }
      })

      // Create insurance subscriber
      const createdSub = await prisma.inssub.create({
        data: {
          PlanNum: createdPlan.PlanNum,
          Subscriber: patient.PatNum,
          DateEffective: planEffectiveDate,
          DateTerm: new Date('9999-12-31'),
          ReleaseInfo: 0,
          AssignBen: 0,
          SubscriberID: subscriberId,
          BenefitNotes: "",
          SubscNote: "",
          SecUserNumEntry: BigInt(1),
          SecDateEntry: new Date(),
          SecDateTEdit: new Date()
        }
      })

      // Create patient plan
      await prisma.patplan.create({
        data: {
          PatNum: patient.PatNum,
          InsSubNum: createdSub.InsSubNum,
          PatID: subscriberId,
          Ordinal: 1,
          IsPending: 0,
          Relationship: 0,
          OrthoAutoFeeBilledOverride: -1,
          OrthoAutoNextClaimDate: new Date('9999-12-31'),
          SecDateTEntry: new Date(),
          SecDateTEdit: new Date()
        }
      })
    }

    console.log('Successfully created insurance information for all patients')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 