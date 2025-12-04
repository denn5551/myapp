# AI Message Formatting

## Overview
The `formatAiMessage` function converts raw Markdown text from AI responses into properly formatted React components for display in the chat interface.

## Features
- **Headers**: Converts `#`, `##`, `###` to styled heading elements
- **Bold text**: Converts `**text**` to `<strong>` elements
- **Lists**: Converts both unordered (`- item`) and ordered (`1. item`) lists to proper HTML lists
- **Horizontal rules**: Converts `---` to `<hr>` elements
- **Paragraphs**: Properly formatted text blocks with appropriate spacing

## Styling
- Headers: Bold, larger font size, with top and bottom margins
- Lists: Properly indented with spacing between items
- Paragraphs: Normal text with appropriate line height and margins
- Bold text: Styled with `font-semibold` class

## Usage
```typescript
import { formatAiMessage } from "@/utils/formatAiMessage";

// In your component:
{formatAiMessage(aiResponseText)}
```

## Example
Input:
```
# Introduction

This is **bold text** in a paragraph.

- First item
- Second item

1. Ordered item one
2. Ordered item two
```

Output: Formatted React elements that display as clean, readable text without visible Markdown symbols.