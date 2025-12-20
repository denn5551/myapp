import React from 'react';

/**
 * Converts Markdown text to formatted React components
 * Handles headers, bold text, lists, and paragraphs
 */
export function formatAiMessage(text: string) {
  if (!text) return null;

  // Process the entire text to identify and group list items
  const lines = text.split(/\n/);
  const elements: React.ReactElement[] = [];
  let listItems: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line is a list item
    if (/^[\-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      listItems.push(line);
    } else {
      // If we were collecting list items and this is not one, process the list
      if (listItems.length > 0) {
        elements.push(processList(listItems, elements.length));
        listItems = [];
      }
      
      // Process non-list block (could be header, paragraph, etc.)
      if (line.trim() !== '') {
        const block = line.trim();
        elements.push(
          <div key={`block-${elements.length}`} className="mb-3 last:mb-0">
            {processBlock(block)}
          </div>
        );
      }
    }
    i++;
  }
  
  // Process any remaining list items
  if (listItems.length > 0) {
    elements.push(processList(listItems, elements.length));
  }

  return <>{elements}</>;
}

/**
 * Process a list of consecutive list items into a proper HTML list
 */
function processList(items: string[], keyIndex: number) {
  const isOrdered = items.some(item => /^\d+\.\s/.test(item));
  
  return (
    <div key={`list-${keyIndex}`} className="my-3">
      {isOrdered ? (
        <ol className="list-decimal list-inside space-y-2 ml-5 pl-1">
          {items.map((item, idx) => (
            <li key={`list-item-${keyIndex}-${idx}`} className="ml-2 text-base leading-relaxed">
              {processInlineFormatting(item.replace(/^\d+\.\s+/, '').trim())}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc list-inside space-y-2 ml-5 pl-1">
          {items.map((item, idx) => (
            <li key={`list-item-${keyIndex}-${idx}`} className="ml-2 text-base leading-relaxed">
              {processInlineFormatting(item.replace(/^[\-*]\s+/, '').trim())}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Process individual blocks to detect and format different elements
 */
function processBlock(block: string) {
  // Check if it's a header (starts with #)
  if (block.startsWith('#')) {
    return processHeader(block);
  }
  
  // Handle horizontal rules (---)
  if (block.match(/^\s*[-*_]{3,}\s*$/)) {
    return <hr className="my-6 border-gray-300" />;
  }

  // Process regular paragraph with inline formatting
  return processParagraph(block);
}

/**
 * Process headers (# ## ###)
 */
function processHeader(headerText: string) {
  // Count # symbols to determine header level
  const level = headerText.match(/^#+/)?.[0].length || 1;
  const content = headerText.replace(/^#+\s*/, '').trim();
  
  // Use consistent styling for all header levels with proper spacing
  return (
    <h3 className="font-bold text-lg mt-6 mb-3 text-gray-800 pt-2 border-b border-transparent">
      {processInlineFormatting(content)}
    </h3>
  );
}

/**
 * Process regular paragraph with inline formatting
 */
function processParagraph(paragraphText: string) {
  return (
    <p className="leading-relaxed mb-3 last:mb-0 text-base whitespace-pre-wrap">
      {processInlineFormatting(paragraphText)}
    </p>
  );
}

/**
 * Process inline formatting like **bold** and *italic*
 */
function processInlineFormatting(text: string) {
  // First, handle bold text (**text**)
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  let lastIndex = 0;
  const elements: (string | React.ReactElement)[] = [];
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    
    // Add bold element
    elements.push(
      <strong key={`bold-${match.index}`} className="font-semibold text-gray-800">
        {match[1]}
      </strong>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last match
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }
  
  // If no formatting was found, return the original text
  if (elements.length === 1 && typeof elements[0] === 'string') {
    return elements[0];
  }
  
  return elements;
}
