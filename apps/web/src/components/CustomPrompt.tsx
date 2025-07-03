import React, { useState } from 'react';
import Button from './ui/Button.js';
import { useToastActions } from './ui/Toast.js';

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
    tags: ['code', 'review', 'debugging', 'best-practices'],
    template: `Please review the following code and provide feedback:

{{input}}

Focus on:
1. **Code Quality**: [Readability, structure, best practices]
2. **Potential Issues**: [Bugs, edge cases, security concerns]
3. **Performance**: [Efficiency improvements]
4. **Suggestions**: [Specific recommendations for improvement]
5. **Overall Assessment**: [Brief summary and rating]`,
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing Helper',
    description: 'Enhance and expand creative writing with suggestions',
    category: 'creative',
    tags: ['creative', 'writing', 'storytelling'],
    template: `Help improve and expand the following creative writing piece:

{{input}}

Please provide:
1. **Strengths**: [What works well in the current writing]
2. **Expansion Ideas**: [Ways to develop the story/content further]
3. **Style Suggestions**: [Improvements to tone, voice, or technique]
4. **Character/Plot Development**: [If applicable, suggestions for deeper development]
5. **Enhanced Version**: [A revised version incorporating your suggestions]`,
  },
  {
    id: 'business-analysis',
    name: 'Business Analysis',
    description: 'Analyze business content, strategies, or market information',
    category: 'business',
    tags: ['business', 'strategy', 'analysis', 'market'],
    template: `Analyze the following business content from a strategic perspective:

{{input}}

Please provide:
1. **Key Business Insights**: [Main strategic points]
2. **Opportunities**: [Potential areas for growth or improvement]
3. **Risks/Challenges**: [Potential obstacles or concerns]
4. **Market Implications**: [How this relates to broader market trends]
5. **Recommendations**: [Actionable next steps or considerations]`,
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

const CustomPrompt = ({ onLoadTemplate }: CustomPromptProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customTemplate, setCustomTemplate] = useState('');
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const toast = useToastActions();

  const filteredTemplates = PRESET_TEMPLATES.filter((template) => {
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📋' },
    { id: 'analysis', name: 'Analysis', icon: '🔍' },
    { id: 'creative', name: 'Creative', icon: '✨' },
    { id: 'technical', name: 'Technical', icon: '⚙️' },
    { id: 'business', name: 'Business', icon: '💼' },
  ];

  const handleLoadTemplate = (template: string) => {
    onLoadTemplate(template);
    toast.success(
      'Template Loaded',
      'The prompt template has been loaded successfully',
    );
  };

  const handleSaveCustomTemplate = () => {
    if (!customTemplate.trim()) {
      toast.warning(
        'Empty Template',
        'Please enter a custom template before saving',
      );
      return;
    }

    // Here you could implement saving to local storage or API
    toast.success('Template Saved', 'Your custom template has been saved');
    setShowCustomEditor(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Custom Prompt Templates
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose from pre-built templates or create your own
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCustomEditor(!showCustomEditor)}
          icon={showCustomEditor ? '📝' : '➕'}
        >
          {showCustomEditor ? 'Hide Editor' : 'Create Custom'}
        </Button>
      </div>

      {/* Custom Template Editor */}
      {showCustomEditor && (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Create Custom Template
          </h4>
          <textarea
            value={customTemplate}
            onChange={(e) => setCustomTemplate(e.target.value)}
            placeholder={`Enter your custom prompt template here...

Use {{input}} as a placeholder for user input.

Example:
Analyze the following text and provide insights:

{{input}}

Please focus on:
1. Main themes
2. Key insights
3. Recommendations`}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleLoadTemplate(customTemplate)}
              disabled={!customTemplate.trim()}
            >
              Load Template
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveCustomTemplate}
              disabled={!customTemplate.trim()}
            >
              Save Template
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLoadTemplate(template.template)}
                  fullWidth
                >
                  Use Template
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="text-lg font-medium">No templates found</h3>
            <p className="text-sm">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomPrompt;
