import React, { useState, useMemo } from 'react';
import Button from '../../ui/Button.js';
import { useToastActions } from '../../ui/Toast.js';

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  template: string;
  category: 'analysis' | 'creative' | 'technical' | 'business';
  tags: string[];
}

const PRESET_TEMPLATES: TemplatePreset[] = [
  {
    id: 'summarization',
    name: 'Text Summarization',
    description: 'Summarize any text content with key points and insights',
    category: 'analysis',
    tags: ['summary', 'analysis', 'key-points'],
    template: `Please provide a comprehensive summary of the following text:

{{input}}

Format your response as:
1. **Main Topic**: [Brief description]
2. **Key Points**: [3-5 bullet points]
3. **Important Details**: [Any crucial information]
4. **Conclusion**: [Overall takeaway]`,
  },
  {
    id: 'sentiment-analysis',
    name: 'Sentiment Analysis',
    description: 'Analyze the emotional tone and sentiment of text',
    category: 'analysis',
    tags: ['sentiment', 'emotion', 'tone'],
    template: `Analyze the sentiment and emotional tone of the following text:

{{input}}

Please provide:
1. **Overall Sentiment**: [Positive/Negative/Neutral with confidence score]
2. **Emotional Tone**: [Describe the emotional undertones]
3. **Key Phrases**: [Words/phrases that indicate sentiment]
4. **Context Analysis**: [What might be driving this sentiment]`,
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Review code for best practices, bugs, and improvements',
    category: 'technical',
    tags: ['code', 'review', 'bugs', 'optimization'],
    template: `Please review the following code for best practices, potential bugs, and improvements:

{{input}}

Provide feedback on:
1. **Code Quality**: [Overall assessment]
2. **Potential Issues**: [Bugs, security concerns, performance issues]
3. **Best Practices**: [Suggestions for improvement]
4. **Optimization**: [Performance and readability improvements]`,
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing',
    description: 'Generate creative content based on prompts',
    category: 'creative',
    tags: ['creative', 'writing', 'story', 'content'],
    template: `Based on the following prompt, create engaging creative content:

{{input}}

Please ensure your response:
1. **Captures the essence** of the prompt
2. **Uses vivid imagery** and descriptive language
3. **Maintains consistent tone** throughout
4. **Engages the reader** with compelling narrative`,
  },
  {
    id: 'business-analysis',
    name: 'Business Analysis',
    description: 'Analyze business scenarios and provide strategic insights',
    category: 'business',
    tags: ['business', 'strategy', 'analysis', 'insights'],
    template: `Analyze the following business scenario and provide strategic insights:

{{input}}

Please address:
1. **Current Situation**: [Key facts and context]
2. **Opportunities**: [Potential areas for growth]
3. **Challenges**: [Risks and obstacles]
4. **Recommendations**: [Strategic next steps]`,
  },
  {
    id: 'data-extraction',
    name: 'Data Extraction',
    description: 'Extract and structure data from unstructured text',
    category: 'technical',
    tags: ['data', 'extraction', 'structured', 'json'],
    template: `Extract and structure the key information from the following text into a JSON format:

{{input}}

Please identify and extract:
- Key entities (people, places, organizations, dates)
- Important facts and figures
- Main topics and themes
- Any structured data that can be identified

Format the output as clean, well-structured JSON with appropriate field names.`,
  },
];

interface CustomPromptProps {
  onLoadTemplate: (template: string) => void;
}

const CustomPrompt: React.FC<CustomPromptProps> = ({ onLoadTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customTemplate, setCustomTemplate] = useState('');
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const { success: showToast, error: showError } = useToastActions();

  const categories = [
    { id: 'all', name: 'All', icon: '📋' },
    { id: 'analysis', name: 'Analysis', icon: '📊' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'technical', name: 'Technical', icon: '⚙️' },
    { id: 'business', name: 'Business', icon: '💼' },
  ];

  const filteredTemplates = useMemo(() => {
    return PRESET_TEMPLATES.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      const matchesCategory =
        selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleLoadTemplate = async (template: string) => {
    setLoadingTemplate(template);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Brief loading simulation
      onLoadTemplate(template);
      showToast('Template loaded successfully!');
    } catch (_error) {
      showError('Failed to load template');
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleSaveCustomTemplate = () => {
    // In a real app, this would save to localStorage or backend
    showToast('Custom template saved!');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border flex-shrink-0 border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground text-sm font-semibold">
            Prompt Templates
          </h3>
          <button
            onClick={() => setShowCustomEditor(!showCustomEditor)}
            className={`focus-visible:ring-primary rounded-md px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 ${
              showCustomEditor
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {showCustomEditor ? 'Browse' : 'Custom'}
          </button>
        </div>

        {/* Search */}
        <div className="space-y-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="text-muted-foreground h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-border bg-background text-foreground placeholder-muted-foreground focus:ring-primary w-full rounded-md border py-2 pr-3 pl-10 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`focus-visible:ring-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {showCustomEditor ? (
          /* Custom Template Editor */
          <div className="space-y-4">
            <div>
              <label className="text-muted-foreground mb-2 block text-xs font-medium tracking-wide uppercase">
                Custom Template
              </label>
              <textarea
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                placeholder="Write your custom prompt template here...&#10;&#10;Use {{input}} as a placeholder for user input.&#10;&#10;Example:&#10;Analyze the following text:&#10;&#10;{{input}}&#10;&#10;Please provide:&#10;1. Main themes&#10;2. Key insights&#10;3. Recommendations"
                rows={12}
                className="border-border bg-background text-foreground placeholder-muted-foreground focus:ring-primary w-full resize-none rounded-md border px-3 py-3 font-mono text-sm focus:border-transparent focus:ring-2 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleLoadTemplate(customTemplate)}
                disabled={
                  !customTemplate.trim() || loadingTemplate === customTemplate
                }
                className="flex-1"
              >
                {loadingTemplate === customTemplate ? (
                  <div className="flex items-center space-x-2">
                    <div className="border-primary-foreground/30 border-t-primary-foreground h-3 w-3 animate-spin rounded-full border" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load Template'
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveCustomTemplate}
                disabled={!customTemplate.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          /* Template Gallery */
          <div className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <div className="py-12 text-center">
                <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <svg
                    className="text-muted-foreground h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-foreground mb-1 text-sm font-medium">
                  No templates found
                </h3>
                <p className="text-muted-foreground text-xs">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group border-border bg-card hover:border-border/80 rounded-lg border p-4 transition-all hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-foreground truncate text-sm font-medium">
                            {template.name}
                          </h4>
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                            {template.description}
                          </p>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
                            <span className="text-sm">
                              {categories.find(
                                (c) => c.id === template.category,
                              )?.icon || '📋'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="bg-muted text-muted-foreground inline-block rounded px-2 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="text-muted-foreground inline-block px-2 py-0.5 text-xs">
                            +{template.tags.length - 3} more
                          </span>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleLoadTemplate(template.template)}
                        disabled={loadingTemplate === template.template}
                        className="w-full group-hover:shadow-sm"
                      >
                        {loadingTemplate === template.template ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="border-primary-foreground/30 border-t-primary-foreground h-3 w-3 animate-spin rounded-full border" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                            <span>Use Template</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomPrompt;
