import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, Filter, Network, Eye } from 'lucide-react';
import { MaterialityTopic } from '@/shared/schema';

interface MaterialityMatrixProps {
  topics: MaterialityTopic[];
}

export default function MaterialityMatrix({ topics }: MaterialityMatrixProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLabels, setShowLabels] = useState(true);

  const scoredTopics = topics.filter(t => 
    t.financialImpactScore !== null && 
    t.impactOnStakeholders !== null && 
    t.materialityIndex !== null
  );

  const filteredTopics = scoredTopics.filter(topic => 
    filterCategory === 'all' || topic.category === filterCategory
  );

  const getStakeholderConcernSize = (level: string) => {
    switch (level) {
      case 'high': return 16;
      case 'medium': return 12;
      case 'low': return 8;
      default: return 10;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return '#10b981'; // green
      case 'social': return '#3b82f6'; // blue
      case 'governance': return '#8b5cf6'; // purple
      default: return '#6b7280'; // gray
    }
  };

  const getMaterialityColor = (index: number) => {
    if (index >= 4.0) return '#ef4444'; // red
    if (index >= 3.0) return '#f97316'; // orange
    if (index >= 2.0) return '#eab308'; // yellow
    return '#6b7280'; // gray
  };

  // Calculate matrix dimensions
  const matrixSize = 400;
  const padding = 40;
  const chartSize = matrixSize - padding * 2;

  const getPosition = (financial: number, impact: number) => {
    const x = (financial / 5) * chartSize + padding;
    const y = chartSize - (impact / 5) * chartSize + padding;
    return { x, y };
  };

  const materialTopics = filteredTopics.filter(t => parseFloat(t.materialityIndex!) >= 3.0);
  const highlyMaterialTopics = filteredTopics.filter(t => parseFloat(t.materialityIndex!) >= 4.0);

  if (scoredTopics.length === 0) {
    return (
      <div className="text-center py-8">
        <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Scored Topics</h3>
        <p className="text-muted-foreground">
          Please complete the Impact Scoring step to view the materiality matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showLabels ? 'Hide' : 'Show'} Labels
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Double Materiality Matrix
          </CardTitle>
          <CardDescription>
            Topics are plotted based on their financial materiality (x-axis) and impact materiality (y-axis).
            Bubble size represents stakeholder concern level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Matrix Chart */}
            <div className="flex-1">
              <div className="relative">
                <svg width={matrixSize} height={matrixSize} className="border rounded-lg bg-white">
                  {/* Grid lines */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <g key={i}>
                      {/* Vertical lines */}
                      <line
                        x1={(i / 5) * chartSize + padding}
                        y1={padding}
                        x2={(i / 5) * chartSize + padding}
                        y2={matrixSize - padding}
                        stroke="#e5e7eb"
                        strokeWidth={1}
                      />
                      {/* Horizontal lines */}
                      <line
                        x1={padding}
                        y1={(i / 5) * chartSize + padding}
                        x2={matrixSize - padding}
                        y2={(i / 5) * chartSize + padding}
                        stroke="#e5e7eb"
                        strokeWidth={1}
                      />
                    </g>
                  ))}
                  
                  {/* Threshold lines */}
                  <line
                    x1={(3 / 5) * chartSize + padding}
                    y1={padding}
                    x2={(3 / 5) * chartSize + padding}
                    y2={matrixSize - padding}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                  <line
                    x1={padding}
                    y1={chartSize - (3 / 5) * chartSize + padding}
                    x2={matrixSize - padding}
                    y2={chartSize - (3 / 5) * chartSize + padding}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                  
                  {/* Axis labels */}
                  <text
                    x={matrixSize / 2}
                    y={matrixSize - 10}
                    textAnchor="middle"
                    className="text-sm font-medium"
                    fill="#374151"
                  >
                    Financial Materiality
                  </text>
                  <text
                    x={15}
                    y={matrixSize / 2}
                    textAnchor="middle"
                    className="text-sm font-medium"
                    fill="#374151"
                    transform={`rotate(-90, 15, ${matrixSize / 2})`}
                  >
                    Impact Materiality
                  </text>
                  
                  {/* Scale labels */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <g key={i}>
                      <text
                        x={(i / 5) * chartSize + padding}
                        y={matrixSize - 20}
                        textAnchor="middle"
                        className="text-xs"
                        fill="#6b7280"
                      >
                        {i}
                      </text>
                      <text
                        x={25}
                        y={chartSize - (i / 5) * chartSize + padding + 4}
                        textAnchor="middle"
                        className="text-xs"
                        fill="#6b7280"
                      >
                        {i}
                      </text>
                    </g>
                  ))}
                  
                  {/* Data points */}
                  {filteredTopics.map((topic) => {
                    const position = getPosition(topic.financialImpactScore!, topic.impactOnStakeholders!);
                    const size = getStakeholderConcernSize(topic.stakeholderConcernLevel!);
                    const color = getCategoryColor(topic.category!);
                    const materialityIndex = parseFloat(topic.materialityIndex!);
                    
                    return (
                      <g key={topic.id}>
                        <circle
                          cx={position.x}
                          cy={position.y}
                          r={size}
                          fill={color}
                          opacity={0.7}
                          stroke={getMaterialityColor(materialityIndex)}
                          strokeWidth={materialityIndex >= 3.0 ? 3 : 1}
                        />
                        {showLabels && (
                          <text
                            x={position.x}
                            y={position.y - size - 5}
                            textAnchor="middle"
                            className="text-xs font-medium"
                            fill="#374151"
                          >
                            {topic.topic.length > 15 ? topic.topic.substring(0, 15) + '...' : topic.topic}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            {/* Legend */}
            <div className="lg:w-64 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Categories</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm">Environmental</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Social</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Governance</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Bubble Size</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <span className="text-sm">Low Concern</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm">Medium Concern</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-sm">High Concern</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Materiality Level</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-400 border border-gray-400"></div>
                    <span className="text-sm">Not Material</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-400 border-2 border-orange-600"></div>
                    <span className="text-sm">Material</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-400 border-2 border-red-600"></div>
                    <span className="text-sm">Highly Material</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Matrix Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredTopics.length}</div>
              <div className="text-sm text-muted-foreground">Total Topics Plotted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{materialTopics.length}</div>
              <div className="text-sm text-muted-foreground">Material Topics (≥3.0)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{highlyMaterialTopics.length}</div>
              <div className="text-sm text-muted-foreground">Highly Material Topics (≥4.0)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}