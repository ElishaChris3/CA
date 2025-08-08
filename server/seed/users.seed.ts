// server/seed/users.seed.ts
import { db } from '../db'
import { users, organizations, consultantProfiles } from '../../shared/schema'
import { eq } from 'drizzle-orm'
import { hashSync } from 'bcrypt'

interface DemoUser {
    id: string
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'organization' | 'consultant'
}

const demoUsers: DemoUser[] = [
    {
        id: 'org-demo',
        email: 'demo.org@carbonaegis.com',
        password: 'demo123',
        firstName: 'Demo',
        lastName: 'Organization',
        role: 'organization',
    },
    {
        id: 'consult-demo',
        email: 'demo.consultant@carbonaegis.com',
        password: 'demo123',
        firstName: 'Demo',
        lastName: 'Consultant',
        role: 'consultant',
    },
]

export async function seedUsers() {
    console.log('👥 Seeding demo users…')

    for (const user of demoUsers) {
        // 1️⃣ Skip if already exists
        const exists = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))

        if (exists.length) {
            console.log(`⚠️  User ${user.email} already exists — skipping.`)
            continue
        }

        // 2️⃣ Insert the user
        await db.insert(users).values({
            id: user.id,
            email: user.email,
            password: hashSync(user.password, 10),
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            onboardingCompleted: false,
        })
        console.log(`✅ Inserted user ${user.email}`)

        // 3️⃣ If this is an organization user → insert organization row
        if (user.role === 'organization') {
            const orgExists = await db
                .select()
                .from(organizations)
                .where(eq(organizations.ownerId, user.id))

            if (!orgExists.length) {
                await db.insert(organizations).values({
                    name: 'Demo Orgnization',
                    industry: 'agriculture',
                    businessType: 'partnership',
                    country: 'london',
                    employeeCount: 25,
                    annualRevenue: 'small',
                    reportingYear: 2025,
                    ownerId: user.id,
                })
                console.log(`🏢 Inserted organization for ${user.email}`)
                await db
                    .update(users)
                    .set({ onboardingCompleted: true })
                    .where(eq(users.id, user.id))
                console.log(`✔️  onboardingCompleted set for ${user.email}`)
            } else {
                console.log(`⚠️  Organization for ${user.email} exists — skipping.`)
            }
        }

        // 4️⃣ If this is a consultant user → insert consultant profile row
        if (user.role === 'consultant') {
            const profExists = await db
                .select()
                .from(consultantProfiles)
                .where(eq(consultantProfiles.userId, user.id))

            if (!profExists.length) {
                await db.insert(consultantProfiles).values({
                    userId: user.id,
                    fullName: `${user.firstName} ${user.lastName}`,
                    phoneNumber: '+1 (601) 362-9552',
                    primaryLocation: 'london',
                    websiteLinkedIn: 'www.demo.com',
                    typicalClientSize: 'large',
                    esgFrameworks: ['CSRD', 'ESRS', 'TCFD', 'GHG Protocol'],
                    targetIndustries: ['Manufacturing', 'Agriculture', 'Energy & Utilities'],
                    geographicCoverage: ['Europe', 'Latin America'],
                    esgSoftwarePlatforms: ['Persefoni', 'Bloomberg ESG'],
                    dataAnalysisTools: ['Tableau', 'SAS'],
                    serviceOfferings: ['Stakeholder Engagement', 'Regulatory Compliance'],
                })
                console.log(`👤 Inserted consultant profile for ${user.email}`)
                await db
                    .update(users)
                    .set({ onboardingCompleted: true })
                    .where(eq(users.id, user.id))
                console.log(`✔️  onboardingCompleted set for ${user.email}`)
            } else {
                console.log(`⚠️  Consultant profile for ${user.email} exists — skipping.`)
            }
        }
    }
}

