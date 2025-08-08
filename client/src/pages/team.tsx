
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, LinkedIn, Award, BookOpen, Users } from 'lucide-react';

export default function Team() {
  const teamMembers = [
    {
      id: 1,
      name: "Madapathi Rajashekar",
      role: "Founder & CEO",
      status: "Exist Funded",
      avatar: "/api/placeholder/150/150",
      education: "MBA in General Management, SRH University",
      background: "System Administrator with IT expertise",
      expertise: [
        "Business Strategy",
        "Product Development",
        "Carbon Accounting",
        "ESG Compliance",
        "Stakeholder Management"
      ],
      bio: "Madapathi Rajashekar is the founder of Carbon Aegis, bringing both business acumen and technical expertise to address the ESG compliance challenges facing European SMEs. During his studies at SRH University, he conducted research on carbon accounting, specifically calculating Scope 1 and 2 emissions for Haberling, a logistics company. This practical experience revealed the significant gap in the market for accessible ESG compliance tools tailored to SMEs facing new regulatory requirements.",
      responsibilities: [
        "Overall business strategy",
        "Product development coordination", 
        "Stakeholder management",
        "Technical leadership"
      ]
    },
    {
      id: 2,
      name: "Ayesha Naeem",
      role: "ESG & GHG Accounting Expert",
      status: "Consultant",
      avatar: "/api/placeholder/150/150",
      background: "ESG and GHG Accounting Specialist",
      expertise: [
        "Carbon Footprint Accounting",
        "Sustainability Analytics",
        "ESG Rating Frameworks",
        "GHG Protocol",
        "ISO Standards (14067, 14083)",
        "PAS 2050, PAS 2060",
        "ESRS Compliance"
      ],
      bio: "Ayesha Naeem is an experienced ESG and GHG Accounting Expert with a strong background in carbon footprint accounting, sustainability analytics, and the design of ESG rating frameworks. She specializes in quantifying product carbon footprints (PCF), developing GHG accounting systems, and leveraging data insights to support organizations on their net-zero journey.",
      responsibilities: [
        "ESG compliance framework implementation",
        "Carbon accounting system development",
        "AI-driven insights for GHG emissions reduction",
        "Scalable reporting solutions",
        "Data-driven decision-making strategies"
      ],
      industries: [
        "Fashion Supply Chain",
        "Manufacturing"
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground">
              Meet the experts behind Carbon Aegis
            </p>
          </div>
        </div>

        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-[var(--ca-green-normal)]" />
                <div>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-[var(--ca-green-normal)]" />
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-muted-foreground">Exist Funded</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-[var(--ca-green-normal)]" />
                <div>
                  <p className="text-2xl font-bold">10+</p>
                  <p className="text-xs text-muted-foreground">Years Combined Experience</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-[var(--ca-green-normal)]/10 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-[var(--ca-green-normal)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{member.name}</CardTitle>
                      <Badge 
                        variant={member.status === 'Exist Funded' ? 'default' : 'secondary'}
                        className={member.status === 'Exist Funded' ? 'bg-[var(--ca-green-normal)] hover:bg-[var(--ca-green-normal)]/80' : ''}
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <p className="text-[var(--ca-green-normal)] font-medium">{member.role}</p>
                    {member.education && (
                      <p className="text-sm text-muted-foreground mt-1">{member.education}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Bio */}
                <div>
                  <h4 className="font-semibold mb-2">Background</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                </div>

                {/* Expertise */}
                <div>
                  <h4 className="font-semibold mb-2">Expertise</h4>
                  <div className="flex flex-wrap gap-1">
                    {member.expertise.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Responsibilities */}
                <div>
                  <h4 className="font-semibold mb-2">Key Responsibilities</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {member.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-[var(--ca-green-normal)] mt-1">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Industries (for consultants) */}
                {member.industries && (
                  <div>
                    <h4 className="font-semibold mb-2">Industry Experience</h4>
                    <div className="flex flex-wrap gap-1">
                      {member.industries.map((industry, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission Statement */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              At Carbon Aegis, our team combines deep technical expertise with practical business experience to bridge the gap between complex ESG regulations and the real-world needs of European SMEs. We're committed to making sustainability compliance accessible, efficient, and actionable for organizations of all sizes.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
