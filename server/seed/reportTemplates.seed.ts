// server/seed/reportTemplates.seed.ts
import { reportTemplates } from '@shared/schema'
import { db } from 'server/db'
import { eq } from 'drizzle-orm'

export async function seedReportTemplates() {
    console.log('📄 Seeding report_templates…')

    // Check if the ESRS template already exists
    const existing = await db
        .select()
        .from(reportTemplates)
        .where(eq(reportTemplates.framework, 'European Sustainability Reporting Standards'))
    if (existing.length) {
        console.log('⚠️  report_templates: ESRS template already exists, skipping.')
        return
    }

    // Insert the ESRS Complete Report template
    await db.insert(reportTemplates).values({
        name: 'ESRS Complete Report',
        framework: 'European Sustainability Reporting Standards',
        type: 'esrs',
        status: 'available',
        description: 'Complete ESRS report template covering all mandatory disclosures',
        sections: [
            { id: 'toc', order: 0, title: 'Table of Contents', content: '' },
            { id: 'general_info', order: 1, title: 'General Information', content: '' },
            { id: 'governance_strategy', order: 2, title: 'Governance, Strategy & Business Model', content: '' },
            { id: 'materiality', order: 3, title: 'Materiality Assessment', content: '' },
            { id: 'impacts_risks_opportunities', order: 4, title: 'Impacts, Risks, and Opportunities', content: '' },
            { id: 'policies_actions_targets', order: 5, title: 'Policies, Actions, Targets & KPIs', content: '' },
            { id: 'eu_taxonomy', order: 6, title: 'EU Taxonomy Alignment', content: '' },
            { id: 'appendix', order: 7, title: 'Appendix', content: '' },
        ],
    })

    console.log('✅ report_templates: ESRS seed inserted.')
}
