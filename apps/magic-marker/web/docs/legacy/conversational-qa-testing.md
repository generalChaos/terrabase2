# Conversational Q&A Testing Guide

## Overview

The Conversational Q&A Testing feature provides a specialized interface for testing conversational AI prompts that engage in multi-turn conversations with users. This guide explains how to use the testing interface and what to expect from the conversational flow.

## What is Conversational Q&A Testing?

Conversational Q&A testing allows you to:
- **Test conversational prompts** that ask multiple questions in sequence
- **Simulate real user interactions** by answering questions step-by-step
- **Validate conversation flow** and ensure the AI asks relevant follow-up questions
- **Monitor conversation completion** and summary generation
- **Debug conversation logic** and identify issues with the AI's decision-making

## How to Access

1. **Navigate to the Admin Panel**: Go to `/admin/prompt-tester`
2. **Select a Conversational Prompt**: Choose `conversational_question` from the prompt dropdown
3. **Start Testing**: Click "Run Test" to begin the conversation

## Testing Interface Features

### 1. Step-by-Step Instructions
When you first start testing, you'll see clear instructions:
- Click "Run Test" to start the conversation with the AI
- Answer each question by clicking on one of the provided options
- Click "Next Question" to generate follow-up questions based on your answers
- Watch the conversation evolve as the AI learns about your preferences
- See the summary when the AI decides the conversation is complete

### 2. Visual Progress Tracking
- **Progress Bar**: Shows how many questions you've answered out of total questions
- **Question Status**: Each question shows its status (Pending, Current, Answered)
- **Current Question Highlighting**: The current question is highlighted in blue
- **Answered Questions**: Completed questions are highlighted in green

### 3. Interactive Question Answering
- **Multiple Choice Options**: Click on any option to select your answer
- **Visual Feedback**: Selected answers are highlighted with a green checkmark
- **Disabled State**: Once answered, questions become read-only
- **Answer Persistence**: Your answers are saved and displayed throughout the conversation

### 4. Conversation Management
- **Next Question Button**: Generate follow-up questions based on your answers
- **Reset Button**: Start a new conversation from the beginning
- **Conversation Summary**: View the AI's summary when the conversation completes

### 5. Statistics Dashboard
- **Questions Count**: Total number of questions asked
- **Answered Count**: Number of questions you've answered
- **Completion Status**: Whether the conversation is complete or ongoing

## Testing Workflow

### Step 1: Start the Conversation
1. Select `conversational_question` from the prompt dropdown
2. Click "Run Test" to initiate the conversation
3. The AI will generate the first question based on your initial prompt

### Step 2: Answer Questions
1. Read the question carefully
2. Click on one of the provided multiple-choice options
3. The question will be marked as "Answered" and highlighted in green
4. The progress bar will update to show your progress

### Step 3: Generate Follow-up Questions
1. Click "Next Question" to generate the next question based on your answers
2. The AI will analyze your previous answers and ask a relevant follow-up question
3. Continue answering questions until the AI decides the conversation is complete

### Step 4: Review the Summary
1. When the AI determines it has enough information, it will mark the conversation as complete
2. You'll see a summary of what the AI learned about your preferences
3. The conversation statistics will show the final counts

### Step 5: Reset and Test Again
1. Click "Reset" to start a new conversation
2. Try different answers to see how the AI adapts its questions
3. Test various scenarios to ensure robust conversation handling

## What to Test

### 1. Conversation Flow
- **Question Relevance**: Are follow-up questions relevant to previous answers?
- **Conversation Logic**: Does the AI ask logical next questions?
- **Completion Detection**: Does the AI correctly determine when to stop asking questions?

### 2. Answer Handling
- **Answer Processing**: Are your answers correctly processed and remembered?
- **Context Awareness**: Does the AI maintain context throughout the conversation?
- **Answer Validation**: Are answers properly validated and stored?

### 3. Error Handling
- **Invalid Responses**: What happens if the AI generates invalid questions?
- **Network Issues**: How does the system handle API failures?
- **Timeout Scenarios**: What happens if the AI takes too long to respond?

### 4. User Experience
- **Interface Responsiveness**: Is the UI responsive and easy to use?
- **Visual Feedback**: Are status changes clearly communicated?
- **Progress Tracking**: Can you easily see your progress through the conversation?

## Expected Behavior

### Normal Flow
1. **Initial Question**: AI asks a relevant opening question
2. **Follow-up Questions**: AI asks 3-5 follow-up questions based on your answers
3. **Context Awareness**: Each question builds on previous answers
4. **Completion**: AI determines when it has enough information
5. **Summary**: AI provides a summary of what it learned

### Conversation Completion
The AI should complete the conversation when:
- It has gathered sufficient information about your preferences
- It has asked enough questions to understand your artistic style
- It can generate a meaningful summary of your preferences

### Error Scenarios
- **API Failures**: Should show clear error messages
- **Invalid Responses**: Should handle malformed AI responses gracefully
- **Network Issues**: Should provide retry options and clear feedback

## Troubleshooting

### Common Issues

**Conversation Not Starting:**
- Check that the prompt is active in the database
- Verify the API is responding correctly
- Check browser console for JavaScript errors

**Questions Not Generating:**
- Ensure you've answered the current question
- Check that the AI is returning valid question data
- Verify the conversation context is being passed correctly

**UI Not Updating:**
- Refresh the page and try again
- Check browser console for errors
- Verify all required data is being returned from the API

**Conversation Not Completing:**
- The AI may need more information - try answering more questions
- Check if there's a maximum question limit
- Verify the AI is correctly determining completion

### Debug Information
- **Browser Console**: Check for JavaScript errors and API responses
- **Network Tab**: Monitor API calls and responses
- **Test Results**: View the raw API response in the test results section

## Best Practices

### 1. Test Different Scenarios
- Try various answer combinations
- Test with different initial prompts
- Verify the AI adapts to different user preferences

### 2. Monitor Performance
- Check response times for each question
- Monitor token usage and API costs
- Verify the conversation completes in reasonable time

### 3. Validate Output Quality
- Ensure questions are relevant and well-formed
- Check that the summary accurately reflects your answers
- Verify the AI maintains context throughout the conversation

### 4. Test Edge Cases
- Try answering questions in different orders
- Test with minimal answers
- Verify behavior with maximum question limits

## Integration with Main Application

The conversational Q&A testing interface uses the same underlying systems as the main application:

- **PromptExecutor**: Executes the conversational prompts
- **OpenAI Service**: Handles AI API calls
- **Database**: Stores conversation data and analytics
- **Schema Validation**: Ensures proper input/output formatting

This ensures that what you test in the admin interface behaves exactly the same way in the main application.

## Conclusion

The Conversational Q&A Testing feature provides a comprehensive way to test and validate conversational AI prompts. By following this guide, you can ensure your conversational prompts work correctly and provide a good user experience.

For more information about prompt creation and management, see the [Prompt Creation Guide](prompt-creation-guide.md).
